import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useAnnouncement } from '../hooks/useAnnouncement'
import { speak } from '../utils/voice'
import { playClick, playModalOpen, playModalClose } from '../utils/sound'
import '../styles/SignLanguage.css'

const SignLanguage = () => {
  const navigate = useNavigate()
  const announce = useAnnouncement()
  const [hasSubscription, setHasSubscription] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const modalRef = React.useRef(null)

  useFocusTrap(showModal, modalRef)

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Sign Language page.')
  }, [])

  useEffect(() => {
    checkSubscriptionStatus()
    // Play modal open sound when modal appears
    if (showModal) {
      playModalOpen()
    }
  }, [showModal])

  const checkSubscriptionStatus = () => {
    try {
      const stored = localStorage.getItem('sign_language_subscription')
      if (!stored) {
        setHasSubscription(false)
        setShowModal(true)
        return
      }

      const subscription = JSON.parse(stored)
      if (!subscription || subscription.status !== 'active') {
        setHasSubscription(false)
        setShowModal(true)
        return
      }

      // Check if subscription has expired
      const endDate = new Date(subscription.endDate)
      const now = new Date()

      if (endDate <= now) {
        localStorage.removeItem('sign_language_subscription')
        setHasSubscription(false)
        setShowModal(true)
        return
      }

      setHasSubscription(true)
      setShowModal(false)
    } catch (error) {
      console.error('Error checking subscription:', error)
      setHasSubscription(false)
      setShowModal(true)
    }
  }

  const handleGoToSubscription = () => {
    playClick()
    speak('Clicking Subscribe Now. Navigating to Subscription page.')
    navigate('/subscription')
  }

  const handleGoToHome = () => {
    playClick()
    speak('Clicking Back to Home. Navigating to home page.')
    navigate('/home')
  }

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
        {hasSubscription ? (
          <iframe
            id="signLanguageFrame"
            className="sign-language-iframe"
            src="/signtranslator/learnsign/client/build/index.html#/sign-kit/convert"
            title="Sign Language Learning App"
            allow="camera; microphone; autoplay"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            aria-label="Sign language learning interface"
          />
        ) : (
          <div className="sign-language-placeholder">
            <div className="integration-note">
              <h3>Sign Language Learning Feature</h3>
              <p>
                This feature requires an active subscription. Please subscribe to access unlimited sign language conversions, 3D avatar animations, and more!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Required Modal */}
      {showModal && (
        <div
          className="subscription-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscriptionModalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playModalClose()
              speak('Subscription modal closed.')
              setShowModal(false)
            }
          }}
        >
          <div className="subscription-modal" ref={modalRef}>
            <div className="emoji" aria-hidden="true">
              🔒
            </div>
            <h2 id="subscriptionModalTitle">Subscription Required</h2>
            <p>
              You need an active subscription to access the Sign Language Learning feature. Subscribe now to unlock unlimited sign language conversions, 3D avatar animations, and more!
            </p>
            <div className="modal-buttons">
              <button
                className="modal-button primary"
                onClick={handleGoToSubscription}
                onFocus={() => speak('View Plans and Subscribe button')}
                aria-label="View subscription plans and subscribe"
              >
                View Plans & Subscribe
              </button>
              <button
                className="modal-button secondary"
                onClick={handleGoToHome}
                onFocus={() => speak('Back to Home button')}
                aria-label="Go back to home page"
              >
                Back to Home
              </button>
            </div>
            <button
              className="modal-close"
              onClick={() => {
                playClick()
                playModalClose()
                speak('Closing subscription modal.')
                setShowModal(false)
              }}
              onFocus={() => speak('Close modal button')}
              aria-label="Close subscription modal"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignLanguage


