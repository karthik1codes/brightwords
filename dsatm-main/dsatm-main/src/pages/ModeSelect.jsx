import React from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import '../styles/Login.css'

const ModeSelect = () => {
  const navigate = useNavigate()

  const handleParentMode = () => {
    playClick()
    speak('Parent Mode. Opening progress summary.')
    navigate('/progress-summary', { replace: true })
  }

  const handleUseMode = () => {
    playClick()
    speak('User Mode. Going to home.')
    navigate('/home', { replace: true })
  }

  return (
    <div className="login-page" role="main">
      <div className="login-bg-decoration" aria-hidden="true">
        <div className="login-cloud login-cloud1"></div>
        <div className="login-cloud login-cloud2"></div>
        <div className="login-shape login-shape-circle"></div>
        <div className="login-shape login-shape-triangle"></div>
      </div>

      <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="modeSelectTitle">
        <div className="login-card">
          <div className="login-logo" aria-hidden="true">
            <img src="/logo.png" alt="BrightWords" className="login-logo-img" />
          </div>
          <h1 id="modeSelectTitle" className="login-title">
            Welcome to <span className="login-brand">BrightWords</span>
          </h1>
          <p className="login-subtitle">
            How would you like to use BrightWords today?
          </p>

          <div className="mode-select-buttons">
            <button
              type="button"
              className="mode-btn mode-btn-parent"
              onClick={handleParentMode}
              onFocus={() => speak('Parent Mode button')}
              aria-label="Parent Mode — view progress summary"
            >
              <span className="mode-btn-icon" aria-hidden="true">👨‍👩‍👧</span>
              Parent Mode
            </button>
            <button
              type="button"
              className="mode-btn mode-btn-use"
              onClick={handleUseMode}
              onFocus={() => speak('User Mode button')}
              aria-label="User Mode — go to home"
            >
              <span className="mode-btn-icon" aria-hidden="true">✨</span>
              User Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModeSelect
