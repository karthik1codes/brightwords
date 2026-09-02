import React, { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { speak } from '../utils/voice'
import { playClick, playSuccess } from '../utils/sound'
import '../styles/Login.css'

const GOOGLE_CLIENT_ID =
  '369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com'

const getGoogleButtonWidth = (container) => {
  const parentWidth = container?.parentElement?.clientWidth ?? 320
  return Math.min(Math.max(parentWidth, 280), 400)
}

const Login = () => {
  const navigate = useNavigate()
  const { isLoading, login } = useAuth()
  const googleBtnRef = useRef(null)
  const buttonRenderedRef = useRef(false)
  const lastButtonWidthRef = useRef(0)

  const handleGoogleCredential = useCallback(
    async (response) => {
      try {
        if (!response?.credential) {
          if (response?.error) {
            speak('Sign in canceled.')
          }
          return
        }

        playClick()
        playSuccess()
        speak('Signing in with Google.')
        await login(response, navigate)
      } catch (error) {
        console.error('Error during sign-in:', error)
        speak('Error signing in. Please try again.')
      }
    },
    [login, navigate]
  )

  const renderGoogleButton = useCallback(() => {
    const container = googleBtnRef.current
    if (!container || !window.google?.accounts?.id) return

    const width = getGoogleButtonWidth(container)
    if (width === lastButtonWidthRef.current && container.hasChildNodes()) return

    lastButtonWidthRef.current = width
    container.innerHTML = ''

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width,
    })
  }, [handleGoogleCredential])

  useEffect(() => {
    speak('Welcome to the Login page.')
  }, [])

  useEffect(() => {
    if (isLoading) return

    const mountButton = () => {
      if (buttonRenderedRef.current) return
      if (!window.google?.accounts?.id || !googleBtnRef.current) return

      buttonRenderedRef.current = true
      renderGoogleButton()

      const container = googleBtnRef.current
      container?.addEventListener(
        'focus',
        () => speak('Sign in with Google button'),
        true
      )
    }

    if (window.google?.accounts?.id) {
      mountButton()
      return undefined
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        mountButton()
      }
    }, 150)

    return () => clearInterval(interval)
  }, [isLoading, renderGoogleButton])

  useEffect(() => {
    const container = googleBtnRef.current
    if (!container || !buttonRenderedRef.current) return undefined

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => renderGoogleButton())
    })
    observer.observe(container.parentElement ?? container)

    return () => observer.disconnect()
  }, [isLoading, renderGoogleButton])

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
            <div
              ref={googleBtnRef}
              id="googleBtn"
              aria-live="polite"
              aria-label="Sign in with Google"
            />
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
