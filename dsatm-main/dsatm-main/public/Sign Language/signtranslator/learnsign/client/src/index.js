import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Check for speech recognition support
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  console.log('Speech recognition is supported in this browser');
} else {
  console.warn('Speech recognition is not supported in this browser. Some features may not work.');
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
