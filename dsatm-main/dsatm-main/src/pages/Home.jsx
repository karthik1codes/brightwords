import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import SkipLink from '../components/SkipLink'
import { useAccessibility } from '../context/AccessibilityContext'
import { useAuth } from '../context/AuthContext'
import { useAnnouncement } from '../hooks/useAnnouncement'
import { speak } from '../utils/voice'
import { playClick, playSuccess, playToggle, playModalOpen, playModalClose, setSoundEnabled, isSoundEnabled } from '../utils/sound'
import '../styles/Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { accessibilityMode, voiceEnabled, toggleVoice } = useAccessibility()
  const { currentUser, signOut } = useAuth()
  const announce = useAnnouncement()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [stats, setStats] = useState({
    totalPoints: 0,
    lessonsComplete: 0,
    achievements: 0,
    timeSpent: 0,
    streak: 0,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  const galleryRef = useRef(null)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showParentsModal, setShowParentsModal] = useState(false)
  const [settingsState, setSettingsState] = useState({
    tts: true,
    hints: true,
    sound: isSoundEnabled(),
  })

  // Sync sound state with localStorage on mount
  useEffect(() => {
    setSettingsState(prev => ({
      ...prev,
      sound: isSoundEnabled()
    }))
  }, [])

  const supportProfiles = {
    general: {
      message: 'General support mode active. Select another profile if needed.',
      announcement: 'General learner mode enabled.',
    },
    blind: {
      message: 'Blind / low vision mode enabled with richer speech feedback.',
      announcement: 'Blind support enabled. Speech guidance and audio cues boosted.',
    },
    deaf: {
      message: 'Deaf / hard of hearing mode enabled. Visual cues prioritized.',
      announcement: 'Deaf support enabled. Sound effects muted; visual guidance boosted.',
    },
    neurodiverse: {
      message: 'Games mode enabled. Have fun while learning!',
      announcement: 'Games mode enabled. Challenge yourself and have fun!',
    },
  }

  const carouselItems = [
    {
      badge: 'Dyslexia Boost',
      image: '/assets/dyslexia.svg',
      alt: 'Animated dyslexia-friendly book',
      caption: 'Color overlays keep letters steady and highlight syllables—making reading smoother, clearer, and more confident.',
    },
    {
      badge: 'Deaf & HoH',
      image: '/assets/hearing.svg',
      alt: 'Animated ear with visual sound waves',
      caption: 'Animated visuals and gesture prompts help silent learners absorb concepts effortlessly without sound reliance.',
    },
    {
      badge: 'Blind Explorer',
      image: '/assets/vision-panel.svg',
      alt: 'Child with visual impairment learning on a tablet',
      caption: 'Audio labels, tactile-friendly keyboards, and high-contrast lessons guide low-vision learners screen by screen.',
    },
    {
      badge: 'Dysgraphia Play',
      image: '/assets/dysgraphia.svg',
      alt: 'Animated pencil tracing letters',
      caption: 'Guided tracing paths gently teach handwriting flow, spacing, and motor control through playful interactive cues.',
    },
    {
      badge: 'Neurodiverse Calm',
      image: '/assets/neurodiverse.svg',
      alt: 'Animated puzzle pieces for neurodiverse focus',
      caption: 'Soothing patterns and rhythmic motion help reduce sensory overload and keep learning stress-free.',
    },
  ]

  // Fetch stats from backend (no localStorage)
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.email) return
      try {
        const res = await fetch(`http://localhost:3000/api/stats/${encodeURIComponent(currentUser.email)}?name=${encodeURIComponent(currentUser.name || currentUser.given_name || '')}`)
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats({
          totalPoints: data.total_points || 0,
          lessonsComplete: data.lessons_complete || 0,
          achievements: data.achievements || 0,
          timeSpent: data.time_spent || 0,
          streak: data.streak || 0,
        })
      } catch (error) {
        console.warn('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [currentUser])

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Home page.')
  }, [])

  // Carousel auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % carouselItems.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSupportCategory = (category) => {
    playClick()
    setSelectedCategory(category)
    const profile = supportProfiles[category]
    const categoryName = category === 'general' ? 'General Learner' : 
                         category === 'blind' ? 'Blind / Low Vision' :
                         category === 'deaf' ? 'Deaf / Hard of Hearing' : 'Games'
    speak(`Selecting ${categoryName} support profile. ${profile?.announcement || ''}`)
    if (profile) {
      announce(profile.announcement)
    }
  }

  const handleStartLearning = () => {
    playClick()
    speak('Clicking Start Learning. Loading your activities.')
    const supportSection = document.getElementById('support')
    if (supportSection) {
      supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleStartPhonics = () => {
    playClick()
    speak('Clicking Phonics Fun. Opening Phonics Fun activity.')
    announce('Opening Phonics Fun activity')
    navigate('/funactivities')
  }

  const handleWatchDemo = () => {
    playClick()
    playModalOpen()
    speak('Clicking Watch Demo. Navigating to demo video.')
    setShowDemoModal(true)
    // Announce modal opening after state update
    setTimeout(() => speak('Demo modal opened.'), 100)
  }

  return (
    <div className="home-page">
      <SkipLink />
      <div
        id="accessibilityAnnouncement"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      <div id="keyboardHint" className="sr-only">
        Use Tab to move between controls. Press Space or Enter to activate buttons.
      </div>

      {/* Background Decorations */}
      <div className="bg-decoration" aria-hidden="true">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="shape shape-circle"></div>
        <div className="shape shape-triangle"></div>
      </div>

      <div className="main-container">
        <Navigation
          onStartLearning={handleStartLearning}
          onOpenSettings={() => {
            playClick()
            playModalOpen()
            speak('Opening settings.')
            setShowSettings(true)
            setTimeout(() => speak('Settings opened.'), 100)
          }}
          onOpenParents={() => {
            playClick()
            playModalOpen()
            speak('Opening parents community.')
            setShowParentsModal(true)
            setTimeout(() => speak('Parents community modal opened.'), 100)
          }}
        />

        <main id="mainContent" role="main" tabIndex={-1}>
          {/* Hero Section */}
          <section className="hero-section" id="home" aria-label="Welcome section">
            <div className="hero-content">
              <h1 className="hero-title">
                Reimagining learning for specially-abled children through AI-powered personalization.
              </h1>
              <p className="hero-description">
                Interactive games, multisensory activities, and real-time adaptive feedback come together to build confidence, accelerate growth, and create a supportive learning journey tailored to every child.
              </p>
              <ul className="hero-highlights" aria-label="Key benefits">
                <li>⚡ 5-minute missions</li>
                <li>🎯 Personalized boosts</li>
                <li>🧠 Neuro-inclusive fun</li>
              </ul>
              <div className="cta-buttons">
                <button
                  className="btn-primary"
                  onClick={handleStartLearning}
                  onFocus={() => speak('Start Learning button')}
                  aria-label="Start learning journey"
                >
                  🚀 Start Learning
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleWatchDemo}
                  onFocus={() => speak('Watch Demo button')}
                  aria-label="Watch demo video"
                >
                  ▶️ Watch Demo
                </button>
              </div>
            </div>

            <div className="hero-visual" aria-label="Animated accessibility spotlights">
              <div
                className="motion-carousel"
                role="region"
                aria-label="Accessibility spotlights"
                aria-live="polite"
              >
                <div 
                  ref={galleryRef}
                  className="motion-gallery"
                  style={{
                    transform: `translateX(-${currentCarouselIndex * 100}%)`
                  }}
                >
                  {carouselItems.map((item, index) => (
                    <figure
                      key={index}
                      className={`motion-card ${index === currentCarouselIndex ? 'active' : ''}`}
                      aria-hidden={index !== currentCarouselIndex}
                    >
                      <div className="motion-badge">{item.badge}</div>
                      <div className="motion-image-wrapper">
                        <img src={item.image} alt={item.alt} className="motion-image" />
                      </div>
                      <figcaption>
                        <h4>{item.caption}</h4>
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="motion-dots" role="tablist" aria-label="Select accessibility spotlight">
                  {carouselItems.map((_, index) => (
                    <button
                      key={index}
                      role="tab"
                      aria-selected={index === currentCarouselIndex}
                      aria-label={`View ${carouselItems[index].badge}`}
                      className={`motion-dot ${index === currentCarouselIndex ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentCarouselIndex(index)
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Accessibility Support Section */}
          <section
            className="accessibility-section"
            id="support"
            aria-label="Accessibility support selection"
          >
            <div className="section-header">
              <h2 className="section-title">Choose Your Support Needs</h2>
              <p className="section-subtitle">
                Pick a profile so we can tailor BrightWords for different accessibility needs.
              </p>
            </div>

            <div className="support-grid" role="group" aria-label="Support profile options">
              {Object.entries(supportProfiles).map(([key, profile]) => {
                const categoryName = key === 'general' ? 'General Learner' : 
                                   key === 'blind' ? 'Blind / Low Vision' :
                                   key === 'deaf' ? 'Deaf / Hard of Hearing' : 'Games'
                return (
                  <button
                    key={key}
                    className={`support-card ${selectedCategory === key ? 'active' : ''}`}
                    data-category={key}
                    onClick={() => handleSupportCategory(key)}
                    aria-pressed={selectedCategory === key}
                    aria-label={`Select ${key} support profile`}
                  >
                    <div className="support-icon">
                      {key === 'general' && '🌈'}
                      {key === 'blind' && '🦮'}
                      {key === 'deaf' && '🪄'}
                      {key === 'neurodiverse' && '🧩'}
                    </div>
                    <div className="support-info">
                      <h3>
                        {key === 'general' && 'General Learner'}
                        {key === 'blind' && 'Blind / Low Vision'}
                        {key === 'deaf' && 'Deaf / Hard of Hearing'}
                        {key === 'neurodiverse' && 'Games'}
                      </h3>
                      <p>{profile.message}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="support-message" id="categoryMessage" aria-live="polite">
              {selectedCategory
                ? supportProfiles[selectedCategory].message
                : 'Please select a support profile above to get started.'}
            </div>

            <div className="support-feature-panel" id="supportFeaturePanel" aria-live="polite">
              {!selectedCategory && (
                <div className="support-widget" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <h3 style={{ color: 'var(--primary-purple)', marginBottom: '16px' }}>
                    👆 Choose Your Support Profile
                  </h3>
                  <p style={{ color: 'var(--light-text)', fontSize: '15px', lineHeight: 1.6 }}>
                    Select a profile above to unlock personalized learning tools and features tailored to your needs!
                  </p>
                </div>
              )}

              {selectedCategory === 'blind' && (
                <div className="support-widget" style={{ padding: '28px', textAlign: 'left' }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>
                    🔊 Activities for Blind / Low Vision
                  </h3>
                  <p style={{ color: '#4b5563', marginBottom: '16px', lineHeight: 1.6 }}>
                    Practice phonics and spelling with richer speech feedback and high-contrast visuals tailored for low vision learners.
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      className="btn-primary"
                      onClick={handleStartPhonics}
                      onFocus={() => speak('Phonics Fun button')}
                      aria-label="Start Phonics Fun activity"
                    >
                      🔤 Phonics Fun
                    </button>
                    <button
                      className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Spelling Wizard. Navigating to Spelling Wizard activity.')
                      navigate('/funactivities#spelling')
                    }}
                      onFocus={() => speak('Spelling Wizard button')}
                      aria-label="Start Spelling Wizard"
                    >
                      ✏️ Spelling Wizard
                    </button>
                    <button
                      className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Explore all fun activities. Navigating to activities page.')
                      navigate('/funactivities')
                    }}
                      onFocus={() => speak('Explore all fun activities button')}
                      aria-label="Explore all fun activities"
                    >
                      Explore all fun activities
                    </button>
                  </div>
                </div>
              )}

              {selectedCategory === 'neurodiverse' && (
                <div className="support-widget" style={{ padding: '28px', textAlign: 'left' }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>
                    🎮 Games mode activities
                  </h3>
                  <p style={{ color: '#4b5563', marginBottom: '16px', lineHeight: 1.6 }}>
                    Jump into our game-based learning activities tailored for focus and fun.
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      className="btn-primary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Memory Master. Navigating to Memory Master activity.')
                      navigate('/funactivities#memory')
                    }}
                      onFocus={() => speak('Memory Master button')}
                      aria-label="Start Memory Master"
                    >
                      🧠 Memory Master
                    </button>
                    <button
                      className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Story Creator. Navigating to Story Creator activity.')
                      navigate('/funactivities#stories')
                    }}
                      onFocus={() => speak('Story Creator button')}
                      aria-label="Start Story Creator"
                    >
                      🚀 Story Creator
                    </button>
                    <button
                      className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Explore all fun activities. Navigating to activities page.')
                      navigate('/funactivities')
                    }}
                      onFocus={() => speak('Explore all fun activities button')}
                      aria-label="Explore all fun activities"
                    >
                      Explore all fun activities
                    </button>
                  </div>
                </div>
              )}

              {selectedCategory === 'deaf' && (
                <div className="support-widget" style={{ padding: '28px', textAlign: 'left' }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>
                    ✏️ Activities for Deaf / Hard of Hearing
                  </h3>
                  <p style={{ color: '#4b5563', marginBottom: '16px', lineHeight: 1.6 }}>
                    Focus on visual guidance and structured steps. Try Writing Artist or Story Explorer.
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      className="btn-primary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Writing Artist. Navigating to Writing Artist activity.')
                      navigate('/funactivities#writing')
                    }}
                      onFocus={() => speak('Writing Artist button')}
                      aria-label="Start Writing Artist"
                    >
                      🎨 Writing Artist
                    </button>
                    <button
                      className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Story Explorer. Navigating to Story Explorer activity.')
                      navigate('/funactivities#reading')
                    }}
                      onFocus={() => speak('Story Explorer button')}
                      aria-label="Start Story Explorer"
                    >
                      📖 Story Explorer
                    </button>
                    <button
                      className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Explore all fun activities. Navigating to activities page.')
                      navigate('/funactivities')
                    }}
                      onFocus={() => speak('Explore all fun activities button')}
                      aria-label="Explore all fun activities"
                    >
                      Explore all fun activities
                    </button>
                  </div>
                </div>
              )}

              {selectedCategory && selectedCategory !== 'blind' && selectedCategory !== 'neurodiverse' && (
                <div className="support-widget" style={{ padding: '28px', textAlign: 'left' }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>
                    Personalized tools for {selectedCategory === 'deaf' ? 'Deaf / Hard of Hearing' : selectedCategory === 'neurodiverse' ? 'Games' : 'General learners'}
                  </h3>
                  <p style={{ color: '#4b5563', marginBottom: '12px', lineHeight: 1.6 }}>
                    Continue exploring activities tailored to this profile. Try Fun Activities to get started.
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      playClick()
                      speak('Clicking Explore Fun Activities. Navigating to activities page.')
                      navigate('/funactivities')
                    }}
                    onFocus={() => speak('Explore Fun Activities button')}
                    aria-label="Go to Fun Activities"
                  >
                    Explore Fun Activities
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Stats Dashboard */}
          <div className="stats-container" id="progress" role="region" aria-label="Learner statistics">
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">⭐</div>
              <div className="stat-value">{stats.totalPoints}</div>
              <div className="stat-label">Total Points</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">📚</div>
              <div className="stat-value">{stats.lessonsComplete}</div>
              <div className="stat-label">Lessons Complete</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">🏆</div>
              <div className="stat-value">{stats.achievements}</div>
              <div className="stat-label">Achievements</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" aria-hidden="true">⏱️</div>
              <div className="stat-value">{stats.timeSpent}m</div>
              <div className="stat-label">Time Today</div>
            </div>
          </div>
        </main>

        <footer className="site-footer" role="contentinfo" aria-label="Site footer">
          <div className="queries-section" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.08)', width: '100%', maxWidth: '600px', display: 'block' }}>
            <h3 className="queries-title" style={{ fontFamily: "'Fredoka', cursive", fontSize: '20px', fontWeight: 600, color: '#8B5CF6', marginBottom: '16px', textAlign: 'center', display: 'block' }}>For Any Queries</h3>
            <div className="social-icons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap', width: '100%' }}>
              <a 
                href="https://www.instagram.com/brightwords.in/" 
                className="social-icon instagram-icon"
                aria-label="Follow us on Instagram"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', cursor: 'pointer', visibility: 'visible', opacity: 1 }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E4405F"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=61584591965509" 
                className="social-icon facebook-icon"
                aria-label="Follow us on Facebook"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', cursor: 'pointer', visibility: 'visible', opacity: 1 }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
              </a>
            </div>
          </div>
          <p>BrightWords • Inclusive learning for every child.</p>
          <p>All Rights Reserved</p>
        </footer>
      </div>

      {/* Watch Demo Modal */}
      {showDemoModal && (
        <div
          className="demo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demoModalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playModalClose()
              speak('Demo modal closed.')
              setShowDemoModal(false)
            }
          }}
        >
          <div className="demo-modal">
            <h3 id="demoModalTitle">Want to know what is a disability?</h3>
            <p>We can guide you to a short video that explains it clearly.</p>
            <div className="demo-modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  playClick()
                  playSuccess()
                  speak('Clicking Watch Video. Opening YouTube video in a new tab.')
                  window.open('https://www.youtube.com/watch?v=dm7uXtpNiAQ&t=4s', '_blank', 'noopener,noreferrer')
                  setShowDemoModal(false)
                  announce('Opening YouTube video in a new tab')
                }}
                onFocus={() => speak('Watch Video button')}
              >
                ▶️ Watch Video
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  playClick()
                  playModalClose()
                  speak('Clicking Cancel. Closing demo modal.')
                  setShowDemoModal(false)
                  announce('Video canceled')
                }}
                onFocus={() => speak('Cancel button')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parents Community Modal */}
      {showParentsModal && (
        <div
          className="demo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parentsModalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playModalClose()
              speak('Parents community modal closed.')
              setShowParentsModal(false)
            }
          }}
        >
          <div className="demo-modal">
            <h3 id="parentsModalTitle">Join the Parents Community</h3>
            <p>Connect with other parents via WhatsApp or Facebook.</p>
            <div className="demo-modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  playClick()
                  playSuccess()
                  speak('Clicking WhatsApp Community. Opening WhatsApp community.')
                  window.open('https://chat.whatsapp.com/BSkBimGGf4mLmXS7nmO6v5', '_blank', 'noopener,noreferrer')
                  setShowParentsModal(false)
                  announce('Opening WhatsApp community')
                }}
                onFocus={() => speak('WhatsApp Community button')}
              >
                <svg className="community-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="#25D366"
                    d="M20.52 3.48A11.86 11.86 0 0 0 12.04.08 11.86 11.86 0 0 0 3.5 3.48a11.86 11.86 0 0 0-3.4 8.53 11.87 11.87 0 0 0 1.68 6.08L.09 24l6-1.57a12 12 0 0 0 5.99 1.57h.01c3.19 0 6.19-1.24 8.45-3.5a11.86 11.86 0 0 0 3.5-8.44 11.84 11.84 0 0 0-3.52-8.58Zm-8.48 18.4h-.01a9.77 9.77 0 0 1-4.99-1.36l-.36-.21-3.56.93.95-3.46-.23-.36A9.79 9.79 0 0 1 2.2 12 9.8 9.8 0 0 1 5.08 4.9 9.8 9.8 0 0 1 12.05 2c2.62 0 5.09 1.02 6.95 2.88a9.8 9.8 0 0 1 2.88 6.96 9.8 9.8 0 0 1-2.88 6.95 9.8 9.8 0 0 1-6.96 2.87Zm5.38-7.36c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.91 1.13-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.45.13-.6.14-.14.29-.34.44-.51.15-.17.2-.29.29-.48.1-.19.05-.36-.03-.51-.08-.15-.64-1.53-.88-2.1-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.45 0 1.45 1.02 2.85 1.16 3.04.14.19 2 3.05 4.85 4.28.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.7-.7 1.94-1.38.24-.67.24-1.24.17-1.38-.07-.14-.26-.22-.55-.36Z"
                  />
                </svg>
                WhatsApp Community
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  playClick()
                  playSuccess()
                  speak('Clicking Facebook Community. Opening Facebook community.')
                  window.open('https://www.facebook.com/share/g/17Y2s832XB/', '_blank', 'noopener,noreferrer')
                  setShowParentsModal(false)
                  announce('Opening Facebook community')
                }}
                onFocus={() => speak('Facebook Community button')}
              >
                <svg className="community-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="#1877F2"
                    d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 22.99 10.125 24v-8.438H7.078v-3.49h3.047V9.356c0-3.018 1.792-4.688 4.533-4.688 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.953.931-1.953 1.887v2.266h3.328l-.532 3.489H13.88V24C19.612 22.99 24 18.1 24 12.073Z"
                  />
                </svg>
                Facebook Community
              </button>
            </div>
            <div className="demo-modal-actions" style={{ marginTop: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  playClick()
                  playModalClose()
                  speak('Clicking Cancel. Closing parents community modal.')
                  setShowParentsModal(false)
                  announce('Community selection canceled')
                }}
                onFocus={() => speak('Cancel button')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && (
        <div
          className="demo-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settingsTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playModalClose()
              speak('Settings closed.')
              setShowSettings(false)
            }
          }}
        >
          <div
            className="demo-modal"
            style={{ maxWidth: 360, textAlign: 'left' }}
            role="document"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 id="settingsTitle" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-hidden="true">⚙️</span> Settings
              </h3>
              <button
                aria-label="Close settings"
                onClick={() => {
                  playClick()
                  playModalClose()
                  speak('Closing settings.')
                  setShowSettings(false)
                }}
                onFocus={() => speak('Close settings button')}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  border: '1px solid #e6e6ef',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                  padding: 0,
                  background: '#f8f8fb',
                  color: '#111',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 10px',
                borderRadius: 14,
                background: '#f4f4fb',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                }}
              >
                {(currentUser?.name || currentUser?.given_name || 'Guest')[0] || 'G'}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#1f2937' }}>
                  {currentUser?.name || currentUser?.given_name || 'Guest'}
                </div>
                <div style={{ fontSize: 14, color: '#4b5563' }}>
                  {currentUser?.email || 'guest@brightwords.local'}
                </div>
              </div>
            </div>

            {[
              { key: 'voice', label: 'Voice Assistance', emoji: '🗣️', isVoice: true },
              { key: 'tts', label: 'Text-to-Speech', emoji: '🔊' },
              { key: 'hints', label: 'Visual Hints', emoji: '💡' },
              { key: 'sound', label: 'Sound Effects', emoji: '🎵' },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <span style={{ color: '#111827', fontWeight: 600 }}>
                  {item.emoji} {item.label}
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={item.isVoice ? voiceEnabled : settingsState[item.key]}
                    onChange={() => {
                      playToggle()
                      if (item.isVoice) {
                        toggleVoice()
                      } else {
                        const newValue = !settingsState[item.key]
                        speak(`${item.label} ${newValue ? 'enabled' : 'disabled'}.`)
                        setSettingsState((prev) => ({
                          ...prev,
                          [item.key]: newValue,
                        }))
                        // Update sound system if sound toggle is changed
                        if (item.key === 'sound') {
                          setSoundEnabled(newValue)
                          if (newValue && isSoundEnabled()) {
                            // Only announce if voice is enabled
                            if (voiceEnabled) {
                              speak('Sound effects enabled.')
                            }
                          } else if (voiceEnabled) {
                            speak('Sound effects disabled.')
                          }
                        }
                      }
                    }}
                    onFocus={() => speak(`${item.label} toggle`)}
                    style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      width: 46,
                      height: 26,
                      background: (item.isVoice ? voiceEnabled : settingsState[item.key]) ? '#8B5CF6' : '#e5e7eb',
                      borderRadius: 999,
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: (item.isVoice ? voiceEnabled : settingsState[item.key]) ? 22 : 4,
                        width: 20,
                        height: 20,
                        background: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </span>
                </label>
              </div>
            ))}

            <div style={{ paddingTop: 12 }}>
              <button
                className="btn-secondary"
                style={{ width: '100%', textAlign: 'center' }}
                onClick={() => {
                  playClick()
                  speak('Clicking Sign out. Signing out of your account.')
                  signOut(() => setShowSettings(false))
                  setShowSettings(false)
                }}
                onFocus={() => speak('Sign out button')}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home


