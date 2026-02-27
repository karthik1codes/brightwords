import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import '../styles/SignLanguage.css'

// Sign Language app lives under public/Sign Language - served at /Sign%20Language/...
const SIGN_LANGUAGE_APP_BASE = '/Sign%20Language/signtranslator/learnsign/client'
const SIGN_LANGUAGE_APP_URL = `${SIGN_LANGUAGE_APP_BASE}/build/index.html#/sign-kit/convert`

const SignLanguage = () => {
  useEffect(() => {
    speak('Sign Language learning.')
  }, [])

  // Full-viewport embed only: no BrightWords dashboard/nav here to avoid loop.
  // Single back link + iframe so user stays inside Sign Language app experience.
  return (
    <div className="sign-language-page sign-language-standalone" role="main">
      <div className="sign-language-back-bar">
        <Link
          to="/home"
          className="back-button"
          aria-label="Back to BrightWords home"
          onClick={() => {
            playClick()
            speak('Back to BrightWords home.')
          }}
          onFocus={() => speak('Back to BrightWords button')}
        >
          ← Back to BrightWords
        </Link>
      </div>
      <div className="sign-language-container">
        <iframe
          id="signLanguageFrame"
          className="sign-language-iframe"
          src={SIGN_LANGUAGE_APP_URL}
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
