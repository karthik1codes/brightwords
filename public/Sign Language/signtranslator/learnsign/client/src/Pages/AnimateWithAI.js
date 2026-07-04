import '../App.css'
import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import xbot from '../Models/xbot/xbot.glb';
import ybot from '../Models/ybot/ybot.glb';
import xbotPic from '../Models/xbot/xbot.png';
import ybotPic from '../Models/ybot/ybot.png';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';
import { signLanguageFetch, getAiApiBase } from '../utils/signLanguageApi';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function AnimateWithAI() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);
  const [aiMessage, setAiMessage] = useState("");
  const [glosses, setGlosses] = useState([]);
  const [loadingNormalize, setLoadingNormalize] = useState(false);
  const [loadingGloss, setLoadingGloss] = useState(false);
  const [loadingAnimateAi, setLoadingAnimateAi] = useState(false);

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  let textFromInput = React.createRef();

  useEffect(() => {
    ref.flag = false;
    ref.pending = false;
    ref.animations = [];
    ref.characters = [];
    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xdddddd);
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);
    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
    ref.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth * 0.57 / (window.innerHeight - 70),
      0.1,
      1000
    );
    ref.renderer.setSize(window.innerWidth * 0.57, window.innerHeight - 70);
    const canvasEl = document.getElementById("canvas-animate");
    if (canvasEl) {
      canvasEl.innerHTML = "";
      canvasEl.appendChild(ref.renderer.domElement);
    }
    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;
    let loader = new GLTFLoader();
    loader.load(
      bot,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.type === 'SkinnedMesh') child.frustumCulled = false;
        });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
      },
      (xhr) => { console.log(xhr); }
    );
  }, [ref, bot]);

  ref.animate = () => {
    if (ref.animations.length === 0) {
      ref.pending = false;
      return;
    }
    requestAnimationFrame(ref.animate);
    if (ref.animations[0].length) {
      if (!ref.flag) {
        if (ref.animations[0][0] === 'add-text') {
          setText(text + ref.animations[0][1]);
          ref.animations.shift();
        } else {
          for (let i = 0; i < ref.animations[0].length;) {
            let [boneName, action, axis, limit, sign] = ref.animations[0][i];
            if (sign === "+" && ref.avatar.getObjectByName(boneName)[action][axis] < limit) {
              ref.avatar.getObjectByName(boneName)[action][axis] += speed;
              ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(ref.avatar.getObjectByName(boneName)[action][axis], limit);
              i++;
            } else if (sign === "-" && ref.avatar.getObjectByName(boneName)[action][axis] > limit) {
              ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
              ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(ref.avatar.getObjectByName(boneName)[action][axis], limit);
              i++;
            } else {
              ref.animations[0].splice(i, 1);
            }
          }
        }
      }
    } else {
      ref.flag = true;
      setTimeout(() => { ref.flag = false; }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  };

  const sign = (inputValue) => {
    var str = inputValue.toUpperCase();
    var strWords = str.split(' ');
    setText('');
    for (let word of strWords) {
      if (words[word]) {
        ref.animations.push(['add-text', word + ' ']);
        words[word](ref);
      } else {
        for (const [index, ch] of word.split('').entries()) {
          if (index === word.length - 1) ref.animations.push(['add-text', ch + ' ']);
          else ref.animations.push(['add-text', ch]);
          alphabets[ch](ref);
        }
      }
    }
  };

  const base = getAiApiBase();
  const handleNormalize = async () => {
    const raw = (textFromInput.current?.value || '').trim();
    if (!raw) return;
    setLoadingNormalize(true);
    setAiMessage('');
    try {
      const data = await signLanguageFetch(`${base}/api/sign-language/normalize`, {
        method: 'POST',
        body: JSON.stringify({ text: raw }),
      });
      if (data.normalizedText && textFromInput.current) textFromInput.current.value = data.normalizedText;
      setAiMessage(data.message || 'Text normalized.');
    } catch (err) {
      setAiMessage('Error: ' + (err.message || 'Could not normalize'));
    } finally {
      setLoadingNormalize(false);
    }
  };

  const handleGloss = async () => {
    const raw = (textFromInput.current?.value || '').trim();
    if (!raw) return;
    setLoadingGloss(true);
    setGlosses([]);
    try {
      const data = await signLanguageFetch(`${base}/api/sign-language/gloss`, {
        method: 'POST',
        body: JSON.stringify({ text: raw }),
      });
      setGlosses(Array.isArray(data.glosses) ? data.glosses : []);
    } catch (err) {
      setGlosses([]);
      setAiMessage('Gloss error: ' + (err.message || 'Could not get glosses'));
    } finally {
      setLoadingGloss(false);
    }
  };

  const handleAnimateWithAi = async () => {
    const raw = (textFromInput.current?.value || '').trim();
    if (!raw) {
      setAiMessage('Enter some text first.');
      return;
    }
    setLoadingAnimateAi(true);
    setAiMessage('');
    setGlosses([]);
    try {
      const data = await signLanguageFetch(`${base}/api/sign-language/gloss`, {
        method: 'POST',
        body: JSON.stringify({ text: raw }),
      });
      const glossList = Array.isArray(data.glosses) ? data.glosses : [];
      setGlosses(glossList);
      if (glossList.length === 0) {
        setAiMessage('AI could not generate a sign sequence. Try different text.');
        return;
      }
      setAiMessage('Animating from AI-generated sign sequence.');
      sign(glossList.join(' '));
    } catch (err) {
      setAiMessage('AI sign error: ' + (err.message || 'Could not generate signs'));
    } finally {
      setLoadingAnimateAi(false);
    }
  };

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='col-md-3'>
          <label className='label-style'>Processed Text</label>
          <textarea rows={3} value={text} className='w-100 input-style' readOnly />
          <label className='label-style'>Text Input</label>
          <textarea rows={3} ref={textFromInput} placeholder='Text input ...' className='w-100 input-style' />
          <div className="d-flex gap-2 mt-2 flex-wrap">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleNormalize} disabled={loadingNormalize}>
              {loadingNormalize ? '...' : 'Normalize with AI'}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleGloss} disabled={loadingGloss}>
              {loadingGloss ? '...' : 'Show glosses'}
            </button>
          </div>
          <button type="button" className="btn btn-success w-100 btn-style btn-start mt-2" onClick={handleAnimateWithAi} disabled={loadingAnimateAi} title="Generate sign sequence with AI and animate">
            {loadingAnimateAi ? '...' : 'Animate with AI'}
          </button>
          {aiMessage && <p className="small text-info mt-2 mb-0">{aiMessage}</p>}
          {glosses.length > 0 && <p className="small mt-2 mb-0"><strong>Glosses:</strong> {glosses.join(' → ')}</p>}
        </div>
        <div className='col-md-7'>
          <div id='canvas-animate'/>
        </div>
        <div className='col-md-2'>
          <p className='bot-label'>Select Avatar</p>
          <img src={xbotPic} className='bot-image col-md-11' onClick={() => setBot(xbot)} alt='Avatar 1: XBOT'/>
          <img src={ybotPic} className='bot-image col-md-11' onClick={() => setBot(ybot)} alt='Avatar 2: YBOT'/>
          <p className='label-style'>Animation Speed: {Math.round(speed * 100) / 100}</p>
          <Slider axis="x" xmin={0.05} xmax={0.50} xstep={0.01} x={speed} onChange={({ x }) => setSpeed(x)} className='w-100' />
          <p className='label-style'>Pause time: {pause} ms</p>
          <Slider axis="x" xmin={0} xmax={2000} xstep={100} x={pause} onChange={({ x }) => setPause(x)} className='w-100' />
        </div>
      </div>
    </div>
  );
}

export default AnimateWithAI;
