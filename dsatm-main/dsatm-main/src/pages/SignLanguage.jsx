import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import '../styles/SignLanguage.css'

const SignLanguage = () => {
  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Sign Language page.')
  }, [])

  return (
    <div className="sign-language-page" role="main">
      <div className="sign-language-header">
        <div className="sign-language-title">
          <span style={{ fontSize: '32px' }} aria-hidden="true">
            🤟
          </span>
          <h1>Sign Language Learning</h1>
        </div>
        <Link
          to="/home"
          className="back-button"
          aria-label="Back to home page"
          onClick={() => {
            playClick()
            speak('Clicking Back to Home. Navigating to home page.')
          }}
          onFocus={() => speak('Back to Home button')}
        >
          ← Back to Home
        </Link>
      </div>

      <div className="sign-language-container">
        <iframe
          id="signLanguageFrame"
          className="sign-language-iframe"
          src="/Sign%20Language/signtranslator/learnsign/client/build/index.html#/sign-kit/convert"
          title="Sign Language Learning App"
          allow="camera; microphone; autoplay"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
          aria-label="Sign language learning interface"
        />
      </div>
    </div>
  )
}

export default SignLanguage
