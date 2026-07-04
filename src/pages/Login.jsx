import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { speak } from '../utils/voice'
import { playClick, playSuccess } from '../utils/sound'
import '../styles/Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { currentUser, isLoading, initializeGoogleAuth, login } = useAuth()
  const [buttonContainerReady, setButtonContainerReady] = useState(false)

  useEffect(() => {
    // Wait for Google script to load
    const checkGoogleScript = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogleScript)
        initializeGoogleAuth()
        setButtonContainerReady(true)
      }
    }, 150)

    // Load Google script if not present
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.accounts?.id) {
          initializeGoogleAuth()
          setButtonContainerReady(true)
        }
      }
      document.head.appendChild(script)
    }

    return () => clearInterval(checkGoogleScript)
  }, [initializeGoogleAuth])

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Login page.')
  }, [])

  useEffect(() => {
    if (buttonContainerReady && window.google?.accounts?.id) {
      const buttonContainer = document.getElementById('googleBtn')
      if (buttonContainer && !buttonContainer.hasChildNodes()) {
        window.google.accounts.id.initialize({
          client_id: '369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com',
          callback: (response) => {
            try {
              if (!response) {
                console.error('No response from Google Sign-In')
                return
              }

              if (!response.credential) {
                console.error('No credential in response:', response)
                if (response.error) {
                  console.log('Sign-in cancelled or error:', response.error)
                  speak('Sign in canceled.')
                  return
                }
                return
              }

              playClick()
              playSuccess()
              speak('Signing in with Google.')
              login(response, navigate)
            } catch (error) {
              console.error('Error during sign-in:', error)
              speak('Error signing in. Please try again.')
            }
          },
          cancel_on_tap_outside: true,
        })

        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'filled_blue',
          size: 'large',
          width: '100%',
          shape: 'pill',
        })

        if (buttonContainer) {
          buttonContainer.addEventListener('focus', () => {
            speak('Sign in with Google button')
          }, true)
        }

        if (!currentUser) {
          window.google.accounts.id.prompt()
        }
      }
    }
  }, [buttonContainerReady, currentUser, login, navigate])

  if (isLoading) {
    return (
      <div className="login-page" role="main">
        <div className="login-bg-decoration" aria-hidden="true">
          <div className="login-cloud login-cloud1"></div>
          <div className="login-cloud login-cloud2"></div>
          <div className="login-shape login-shape-circle"></div>
          <div className="login-shape login-shape-triangle"></div>
        </div>
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-loading-spinner" aria-label="Loading"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page" role="main">
      <div className="login-bg-decoration" aria-hidden="true">
        <div className="login-cloud login-cloud1"></div>
        <div className="login-cloud login-cloud2"></div>
        <div className="login-shape login-shape-circle"></div>
        <div className="login-shape login-shape-triangle"></div>
      </div>

      <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
        <div className="login-card">
          <div className="login-logo" aria-hidden="true">
            <img src="/logo.png" alt="BrightWords" className="login-logo-img" />
          </div>
          <h1 id="loginTitle" className="login-title">
            Welcome to <span className="login-brand">BrightWords</span>
          </h1>
          <p className="login-subtitle">
            Sign in to unlock your personalized learning journey.
          </p>
          <div className="google-btn-wrapper">
            <div id="googleBtn" aria-live="polite" aria-label="Sign in with Google"></div>
          </div>
          <p className="login-hint">
            Need a different account? Use the account switcher in the Google dialog.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
