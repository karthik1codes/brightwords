import '../App.css'
import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import { Modal } from 'react-bootstrap';
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

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function Convert() {
  const [text, setText] = useState("");
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);
  const [audioInput, setAudioInput] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [glosses, setGlosses] = useState([]);
  const [loadingNormalize, setLoadingNormalize] = useState(false);
  const [loadingGloss, setLoadingGloss] = useState(false);
  const [loadingAnimateAi, setLoadingAnimateAi] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoError, setVideoError] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

  const componentRef = useRef({});
  const { current: ref } = componentRef;

  let textFromInput = React.createRef();

  const {
    transcript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    setAudioInput(transcript);
  }, [transcript]);

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
    )
    ref.renderer.setSize(window.innerWidth * 0.57, window.innerHeight - 70);

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
      if (ref.onAnimationComplete) {
        const fn = ref.onAnimationComplete;
        ref.onAnimationComplete = null;
        fn();
      }
      return ;
    }
    requestAnimationFrame(ref.animate);
    if(ref.animations[0].length){
        if(!ref.flag) {
          if(ref.animations[0][0]==='add-text'){
            setText(text + ref.animations[0][1]);
            ref.animations.shift();
          }
          else{
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
          if (index === word.length - 1)
            ref.animations.push(['add-text', ch + ' ']);
          else
            ref.animations.push(['add-text', ch]);
          alphabets[ch](ref);
        }
      }
    }
  };

  const startListening = () =>{
    SpeechRecognition.startListening({continuous: true});
  }

  const stopListening = () =>{
    SpeechRecognition.stopListening();
  }

  const base = getAiApiBase();
  const handleNormalize = async () => {
    const raw = (textFromInput.current?.value || audioInput || '').trim();
    if (!raw) return;
    setLoadingNormalize(true);
    setAiMessage('');
    try {
      const data = await signLanguageFetch(`${base}/api/sign-language/normalize`, {
        method: 'POST',
        body: JSON.stringify({ text: raw }),
      });
      if (data.normalizedText && textFromInput.current) textFromInput.current.value = data.normalizedText;
      setAiMessage(data.message || 'Text normalized. You can run the animation with the updated text.');
    } catch (err) {
      setAiMessage('Error: ' + (err.message || 'Could not normalize'));
    } finally {
      setLoadingNormalize(false);
    }
  };
  const handleGloss = async () => {
    const raw = (textFromInput.current?.value || audioInput || '').trim();
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

  /** Generate sign sequence using AI (glosses) and run the 3D avatar animation. */
  const handleAnimateWithAi = async () => {
    const raw = (textFromInput.current?.value || audioInput || '').trim();
    if (!raw) {
      setAiMessage('Enter or speak some text first.');
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
      const glossString = glossList.join(' ');
      setAiMessage('Animating from AI-generated sign sequence.');
      sign(glossString);
    } catch (err) {
      setAiMessage('AI sign error: ' + (err.message || 'Could not generate signs'));
    } finally {
      setLoadingAnimateAi(false);
    }
  };

  /** Generate gloss with AI, run 3D avatar with that gloss, record the canvas into a video, show in modal. */
  const handleGenerateVideo = async () => {
    const raw = (textFromInput.current?.value || audioInput || '').trim();
    if (!raw) {
      setVideoError('Enter or speak some text first.');
      setShowVideoModal(true);
      return;
    }
    setLoadingVideo(true);
    setVideoError('');
    setVideoUrl(null);
    setShowVideoModal(true);
    const base = getAiApiBase();
    try {
      const data = await signLanguageFetch(`${base}/api/sign-language/gloss`, {
        method: 'POST',
        body: JSON.stringify({ text: raw }),
      });
      const glossList = Array.isArray(data.glosses) ? data.glosses : [];
      if (glossList.length === 0) {
        setVideoError('AI could not generate a sign sequence. Try different text.');
        setLoadingVideo(false);
        return;
      }
      if (!ref.renderer || !ref.avatar) {
        setVideoError('Avatar not ready. Wait for the 3D avatar to load and try again.');
        setLoadingVideo(false);
        return;
      }
      const canvas = ref.renderer.domElement;
      if (!canvas.captureStream) {
        setVideoError('Recording not supported in this browser. Try Chrome or Firefox.');
        setLoadingVideo(false);
        return;
      }
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : '';
      const recorderOpts = mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : { videoBitsPerSecond: 2500000 };
      const mediaRecorder = new MediaRecorder(stream, recorderOpts);
      const chunks = [];
      ref.recordingFailed = false;
      mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        setLoadingVideo(false);
        if (!ref.recordingFailed) {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
          setVideoUrl(URL.createObjectURL(blob));
        }
      };
      ref.onAnimationComplete = () => {
        setTimeout(() => {
          try {
            if (mediaRecorder.state === 'recording') mediaRecorder.stop();
          } catch (_) {}
        }, 300);
      };
      mediaRecorder.start(100);
      const glossString = glossList.join(' ');
      try {
        sign(glossString);
      } catch (signErr) {
        ref.onAnimationComplete = null;
        ref.recordingFailed = true;
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        setVideoError(signErr.message || 'Animation error. Some signs may not be available.');
      }
    } catch (err) {
      setVideoError(err.message || 'Failed to generate signing video');
      setLoadingVideo(false);
    }
  };

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='col-md-3'>
          <label className='label-style'>
            Processed Text
          </label>
          <textarea rows={3} value={text} className='w-100 input-style' readOnly />
          <label className='label-style'>
            Speech Recognition: {listening ? 'on' : 'off'}
          </label>
          <div className='space-between'>
            <button className="btn btn-primary btn-style w-33" onClick={startListening}>
              Mic On <i className="fa fa-microphone"/>
            </button>
            <button className="btn btn-primary btn-style w-33" onClick={stopListening}>
              Mic Off <i className="fa fa-microphone-slash"/>
            </button>
            <button className="btn btn-primary btn-style w-33" onClick={resetTranscript}>
              Clear
            </button>
          </div>
          <textarea rows={3} value={audioInput} placeholder='Speech input ...' className='w-100 input-style' readOnly />
          <button onClick={() => { sign(audioInput); }} className='btn btn-primary w-100 btn-style btn-start'>
            Start Animations
          </button>
          <label className='label-style'>
            Text Input
          </label>
          <textarea rows={3} ref={textFromInput} placeholder='Text input ...' className='w-100 input-style' />
          <div className="d-flex gap-2 mt-2 flex-wrap">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleNormalize} disabled={loadingNormalize}>
              {loadingNormalize ? '...' : 'Normalize with AI'}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleGloss} disabled={loadingGloss}>
              {loadingGloss ? '...' : 'Show glosses'}
            </button>
            <button type="button" className="btn btn-success btn-sm" onClick={handleAnimateWithAi} disabled={loadingAnimateAi} title="Generate sign sequence with AI and animate">
              {loadingAnimateAi ? '...' : 'Animate with AI'}
            </button>
            <button type="button" className="btn btn-info btn-sm" onClick={handleGenerateVideo} disabled={loadingVideo} title="Generate ISL signing video (Indian Sign Language)">
              {loadingVideo ? '...' : 'AI signing video'}
            </button>
          </div>
          {aiMessage && <p className="small text-info mt-2 mb-0">{aiMessage}</p>}
          {glosses.length > 0 && <p className="small mt-2 mb-0"><strong>Glosses:</strong> {glosses.join(' → ')}</p>}
          <button onClick={() => { sign(textFromInput.current?.value || ''); }} className='btn btn-primary w-100 btn-style btn-start mt-2'>
            Start Animations
          </button>
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

      <Modal show={showVideoModal} onHide={() => setShowVideoModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>AI signing video</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingVideo && <p className="text-muted">Generating signing video… This may take a minute.</p>}
          {videoError && !loadingVideo && <p className="text-danger">{videoError}</p>}
          {videoUrl && !loadingVideo && (
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="w-100"
              style={{ maxHeight: '70vh' }}
              title="AI-generated sign language video"
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Convert;