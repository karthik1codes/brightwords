import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAccessibility } from '../context/AccessibilityContext'
import { useAuth } from '../context/AuthContext'
import { useAnnouncement } from '../hooks/useAnnouncement'
import { speak } from '../utils/voice'
import { playClick, playToggle } from '../utils/sound'
import '../styles/Navigation.css'

const Navigation = ({ onStartLearning, onOpenSettings, onOpenParents }) => {
  const { accessibilityMode, toggleAccessibilityMode } = useAccessibility()
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const announce = useAnnouncement()
  const [showSignOut, setShowSignOut] = useState(false)

  const handleAccessibilityToggle = () => {
    playClick()
    playToggle()
    speak(`Clicking Accessibility Mode. ${!accessibilityMode ? 'Enabling' : 'Disabling'} accessibility mode.`)
    toggleAccessibilityMode()
    announce(`Accessibility mode ${!accessibilityMode ? 'enabled' : 'disabled'}`)
  }

  const handleSignOut = () => {
    playClick()
    speak('Clicking Sign out. Signing out of your account.')
    signOut(navigate)
    announce('Signed out successfully')
  }

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  return (
    <header className="site-header" role="banner">
      <nav className="nav-header" role="navigation" aria-label="Primary navigation">
        <Link 
          to="/home" 
          className="logo" 
          aria-label="BrightWords home"
          onClick={() => {
            playClick()
            speak('Clicking BrightWords logo. Navigating to home page.')
          }}
          onFocus={() => speak('BrightWords logo')}
        >
          <div className="logo-icon" aria-hidden="true">✨</div>
          <span>BrightWords</span>
        </Link>

        <div className="nav-menu" role="menubar" aria-label="Primary menu">
          <Link
            to="/funactivities"
            className="nav-item"
            role="menuitem"
            title="Interactive practice modules"
            onClick={() => {
              playClick()
              speak('Clicking Learn. Navigating to Learn page.')
            }}
            onFocus={() => speak('Learn navigation link')}
          >
            Learn
          </Link>
          <Link
            to={location.pathname === '/home' ? '#progress' : '/home#progress'}
            className="nav-item"
            role="menuitem"
            onClick={(e) => {
              playClick()
              speak('Clicking Progress. Navigating to Progress section.')
              // Smooth scroll when already on home
              if (location.pathname === '/home') {
                e.preventDefault()
                const progressSection = document.getElementById('progress')
                if (progressSection) {
                  progressSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }
            }}
            onFocus={() => speak('Progress navigation link')}
          >
            Progress
          </Link>
          <Link
            to="/signlanguage"
            className="nav-item"
            role="menuitem"
            title="Sign Language Learning"
            onClick={() => {
              playClick()
              speak('Clicking Sign Language. Navigating to Sign Language page.')
            }}
            onFocus={() => speak('Sign Language navigation link')}
          >
            Sign Language
          </Link>
          <a
            href="#communities"
            className="nav-item"
            role="menuitem"
            onClick={(e) => {
              e.preventDefault()
              playClick()
              speak('Clicking Communities. Opening parents community.')
              if (onOpenParents) onOpenParents()
            }}
            onFocus={() => speak('Communities navigation link')}
          >
            Communities
          </a>
          <Link 
            to="/feedback" 
            className="nav-item" 
            role="menuitem"
            onClick={() => {
              playClick()
              speak('Clicking Feedback. Navigating to Feedback page.')
            }}
            onFocus={() => speak('Feedback navigation link')}
          >
            Feedback
          </Link>
          <Link
            to="/superpower"
            className="nav-item superpower-link-bypass"
            role="menuitem"
            title="SuperPower - AWS AugmentAbility features"
            onClick={() => {
              playClick()
              speak('Clicking SuperPower. Navigating to SuperPower page.')
            }}
            onFocus={() => speak('SuperPower navigation link')}
          >
            SuperPower
          </Link>
        </div>

        <div className="user-section" aria-label="User quick actions">
          <div className="streak-badge" aria-label="Current streak">
            🔥 <span id="streakCount">0</span> Day Streak!
          </div>
          <div className="accessibility-controls">
            <button
              type="button"
              className="accessibility-toggle"
              aria-pressed={accessibilityMode}
              aria-label={accessibilityMode ? 'Turn accessibility mode off' : 'Turn accessibility mode on'}
              onClick={handleAccessibilityToggle}
              onKeyDown={(e) => handleKeyDown(e, handleAccessibilityToggle)}
              onFocus={() => speak('Accessibility Mode toggle button')}
            >
              {accessibilityMode ? 'Accessibility Mode On' : '♿ Accessibility Mode'}
            </button>
          </div>
          <div
            className="avatar"
            role="button"
            tabIndex={0}
            aria-label="Open settings"
            onClick={() => {
              playClick()
              speak('Clicking user avatar. Opening settings.')
              if (onOpenSettings) onOpenSettings()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                speak('Clicking user avatar. Opening settings.')
                if (onOpenSettings) onOpenSettings()
              }
            }}
            onFocus={() => speak('User settings button')}
          >
            👤
          </div>
          <div className="user-auth">
            {currentUser && (
              <span className="user-greeting" aria-live="polite">
                {currentUser.name || currentUser.given_name || 'User'}
              </span>
            )}
          </div>
        </div>
      </nav>
      <p id="accessibilityHint" className="sr-only">
        Switch to a high-contrast, dyslexia-friendly view.
      </p>
    </header>
  )
}

export default Navigation


