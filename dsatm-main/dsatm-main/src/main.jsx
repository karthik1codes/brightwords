import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initSpeechUnlock } from './utils/voice'
import './index.css'
import './styles/Legacy.css'
import './styles/AccessibilityLegacy.css'

// Unlock speech synthesis on first user gesture (required by Chrome and others)
initSpeechUnlock()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

