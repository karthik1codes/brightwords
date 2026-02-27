import '../App.css'
import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import { Modal, Button } from 'react-bootstrap';
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

function LearnSign() {
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);
  const [explainModal, setExplainModal] = useState({ show: false, loading: false, value: '', type: 'letter', explanation: '', error: '' });

  const componentRef = useRef({});
  const { current: ref } = componentRef;

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

    ref.camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth*0.57 / (window.innerHeight - 70),
        0.1,
        1000
    )

    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
    ref.renderer.setSize(window.innerWidth * 0.57, (window.innerHeight - 70));
    document.getElementById("canvas").innerHTML = "";
    document.getElementById("canvas").appendChild(ref.renderer.domElement);

    ref.camera.position.z = 1.6;
    ref.camera.position.y = 1.4;

    let loader = new GLTFLoader();
    loader.load(
      bot,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if ( child.type === 'SkinnedMesh' ) {
            child.frustumCulled = false;
          }
    });
        ref.avatar = gltf.scene;
        ref.scene.add(ref.avatar);
        defaultPose(ref);
      },
      (xhr) => {
        console.log(xhr);
      }
    );

  }, [ref, bot]);

  ref.animate = () => {
    if(ref.animations.length === 0){
        ref.pending = false;
      return ;
    }
    requestAnimationFrame(ref.animate);
    if(ref.animations[0].length){
        if(!ref.flag) {
          for(let i=0;i<ref.animations[0].length;){
            let [boneName, action, axis, limit, sign] = ref.animations[0][i]
            if(sign === "+" && ref.avatar.getObjectByName(boneName)[action][axis] < limit){
                ref.avatar.getObjectByName(boneName)[action][axis] += speed;
                ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                i++;
            }
            else if(sign === "-" && ref.avatar.getObjectByName(boneName)[action][axis] > limit){
                ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
                ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                i++;
            }
            else{
                ref.animations[0].splice(i, 1);
            }
          }
        }
    }
    else {
      ref.flag = true;
      setTimeout(() => {
        ref.flag = false
      }, pause);
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  }

  const fetchExplain = async (type, value) => {
    setExplainModal({ show: true, loading: true, value, type, explanation: '', error: '' });
    const base = getAiApiBase();
    try {
      const data = await signLanguageFetch(`${base}/api/sign-language/explain`, {
        method: 'POST',
        body: JSON.stringify({ type, value }),
      });
      setExplainModal(prev => ({ ...prev, loading: false, explanation: data.explanation || '', error: '' }));
    } catch (err) {
      setExplainModal(prev => ({ ...prev, loading: false, explanation: '', error: err.message || 'Failed to load explanation' }));
    }
  };

  let alphaButtons = [];
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(i + 65);
    alphaButtons.push(
        <div className='col-md-3' key={'alpha-' + letter}>
            <button className='signs w-100' onClick={()=>{
              if(ref.animations.length === 0){
                alphabets[letter](ref);
              }
            }}>
                {letter}
            </button>
            <button type="button" className="btn btn-link btn-sm p-0 mt-1" onClick={() => fetchExplain('letter', letter)} aria-label={`Explain sign for ${letter}`}>
              Explain
            </button>
        </div>
    );
  }

  let wordButtons = [];
  for (let i = 0; i < words.wordList.length; i++) {
    const w = words.wordList[i];
    wordButtons.push(
        <div className='col-md-4' key={'word-' + w}>
            <button className='signs w-100' onClick={()=>{
              if(ref.animations.length === 0){
                words[w](ref);
              }
            }}>
                {w}
            </button>
            <button type="button" className="btn btn-link btn-sm p-0 mt-1" onClick={() => fetchExplain('word', w)} aria-label={`Explain sign for ${w}`}>
              Explain
            </button>
        </div>
    );
  }

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='col-md-3'>
            <h1 className='heading'>
              Alphabets
            </h1>
            <div className='row'>
                {
                    alphaButtons
                }
            </div>
            <h1 className='heading'>
              Words
            </h1>
            <div className='row'>
                {
                    wordButtons
                }
            </div>
        </div>
        <div className='col-md-7'>
          <div id='canvas'/>
        </div>
        <div className='col-md-2'>
          <p className='bot-label'>
            Select Avatar
          </p>
          <img src={xbotPic} className='bot-image col-md-11' onClick={()=>{setBot(xbot)}} alt='Avatar 1: XBOT'/>
          <img src={ybotPic} className='bot-image col-md-11' onClick={()=>{setBot(ybot)}} alt='Avatar 2: YBOT'/>
          <p className='label-style'>
            Animation Speed: {Math.round(speed*100)/100}
          </p>
          <Slider
            axis="x"
            xmin={0.05}
            xmax={0.50}
            xstep={0.01}
            x={speed}
            onChange={({ x }) => setSpeed(x)}
            className='w-100'
          />
          <p className='label-style'>
            Pause time: {pause} ms
          </p>
          <Slider
            axis="x"
            xmin={0}
            xmax={2000}
            xstep={100}
            x={pause}
            onChange={({ x }) => setPause(x)}
            className='w-100'
          />
        </div>
      </div>

      <Modal show={explainModal.show} onHide={() => setExplainModal(prev => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton>
          <Modal.Title>Explain sign: {explainModal.value}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {explainModal.loading && <p className="text-muted">Asking AI...</p>}
          {explainModal.error && <p className="text-danger">{explainModal.error}</p>}
          {!explainModal.loading && explainModal.explanation && <p className="mb-0">{explainModal.explanation}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setExplainModal(prev => ({ ...prev, show: false }))}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default LearnSign;
