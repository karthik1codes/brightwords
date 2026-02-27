import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAnnouncement } from '../hooks/useAnnouncement'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import '../styles/FunActivities.css'

const doodles = {
  phonics: (
    <svg className="activity-doodle-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M40 80 L60 50 L80 80 L100 45 L120 80 L140 55 L160 80" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="doodle-line" />
      <circle cx="50" cy="110" r="18" stroke="#ec4899" strokeWidth="3" fill="none" className="doodle-circle" />
      <text x="45" y="116" fontSize="14" fontWeight="bold" fill="#8b5cf6">A</text>
      <circle cx="100" cy="110" r="18" stroke="#ec4899" strokeWidth="3" fill="none" className="doodle-circle" />
      <text x="95" y="116" fontSize="14" fontWeight="bold" fill="#8b5cf6">B</text>
      <circle cx="150" cy="110" r="18" stroke="#ec4899" strokeWidth="3" fill="none" className="doodle-circle" />
      <text x="145" y="116" fontSize="14" fontWeight="bold" fill="#8b5cf6">C</text>
    </svg>
  ),
  memory: (
    <svg className="activity-doodle-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="35" y="35" width="50" height="50" rx="8" stroke="#8b5cf6" strokeWidth="3" fill="none" className="doodle-card" />
      <rect x="115" y="35" width="50" height="50" rx="8" stroke="#8b5cf6" strokeWidth="3" fill="none" className="doodle-card" />
      <rect x="35" y="95" width="50" height="50" rx="8" stroke="#ec4899" strokeWidth="3" fill="none" className="doodle-card" />
      <rect x="115" y="95" width="50" height="50" rx="8" stroke="#ec4899" strokeWidth="3" fill="none" className="doodle-card" />
      <path d="M55 60 L75 60 M65 50 L65 70" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="140" cy="60" r="8" stroke="#ec4899" strokeWidth="2" fill="none" />
    </svg>
  ),
  stories: (
    <svg className="activity-doodle-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M30 120 L30 50 L70 50 L70 120 Z" stroke="#8b5cf6" strokeWidth="3" fill="rgba(139,92,246,0.08)" className="doodle-book" />
      <path d="M75 55 L75 115 M85 55 L85 115 M95 55 L95 115" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      <path d="M110 120 L110 45 L160 45 L160 120 Z" stroke="#ec4899" strokeWidth="3" fill="rgba(236,72,153,0.08)" className="doodle-book" />
      <path d="M120 60 L155 60 M120 75 L145 75 M120 90 L150 90" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      <circle cx="170" cy="35" r="12" stroke="#8b5cf6" strokeWidth="2" fill="none" className="doodle-star" />
    </svg>
  ),
  spelling: (
    <svg className="activity-doodle-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M45 100 L55 60 L65 85 L75 60 L85 100" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="doodle-line" />
      <path d="M100 55 L100 105 M100 55 L140 55 L140 80 L100 80 L140 105" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="doodle-line" />
      <path d="M155 60 L155 100 L185 100" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="doodle-line" />
      <rect x="40" y="115" width="120" height="8" rx="2" fill="rgba(139,92,246,0.2)" className="doodle-base" />
    </svg>
  ),
  writing: (
    <svg className="activity-doodle-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M50 100 L55 50 L120 45 L125 95 L60 100 Z" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139,92,246,0.06)" className="doodle-palette" />
      <circle cx="75" cy="65" r="12" fill="#ec4899" opacity="0.8" className="doodle-dot" />
      <circle cx="100" cy="75" r="10" fill="#8b5cf6" opacity="0.8" className="doodle-dot" />
      <circle cx="95" cy="95" r="8" fill="#f59e0b" opacity="0.8" className="doodle-dot" />
      <path d="M135 100 L165 55 L175 60 L145 105 Z" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round" className="doodle-brush" />
    </svg>
  ),
  reading: (
    <svg className="activity-doodle-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M45 45 L45 125 L75 125 L75 45 Z" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139,92,246,0.06)" className="doodle-book" />
      <path d="M52 65 L68 65 M52 78 L68 78 M52 91 L62 91" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M95 50 L155 50 L155 120 L95 120 Z" stroke="#ec4899" strokeWidth="2.5" fill="rgba(236,72,153,0.06)" className="doodle-book" />
      <path d="M105 70 L145 70 M105 85 L140 85 M105 100 L135 100" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="170" cy="85" r="15" stroke="#8b5cf6" strokeWidth="2" fill="none" className="doodle-glasses" />
    </svg>
  ),
}

const defaultActivities = [
  {
    id: 'phonics',
    title: '🔤 Phonics Fun',
    description: 'Jump into letter sounds!',
    imageAlt: 'Letters and sounds doodle',
    longDescription: 'Jump into letter sounds! Hear each letter, say it back, and get comfy with everyday words—one sound at a time. Perfect for building reading confidence and making the link between sounds and letters feel like play. Tap through the alphabet, repeat after the voice, and discover how words are made. Great for slow mode when you want to take your time.',
    doodle: doodles.phonics,
  },
  {
    id: 'memory',
    title: '🧠 Memory Master',
    description: 'Flip, match, and remember!',
    imageAlt: 'Memory game doodle',
    longDescription: 'Flip, match, and remember! Pair up tiles with sound cues and visual hints to give your memory a fun workout. Start with fewer pairs and level up as you get sharper. Use sound first, then rely on visuals—ideal for building focus and short-term memory. Every match feels like a little win.',
    doodle: doodles.memory,
  },
  {
    id: 'stories',
    title: '🚀 Story Creator',
    description: 'You’re the author!',
    imageAlt: 'Story books doodle',
    longDescription: 'You’re the author! Drag and drop your way into your own adventure—pick characters, places, and twists. Choose a setting, add a hero, and throw in a surprise in the middle. Build stories that are silly, spooky, or sweet. Record yourself reading them aloud for extra practice and lots of laughs.',
    doodle: doodles.stories,
  },
  {
    id: 'spelling',
    title: '✏️ Spelling Wizard',
    description: 'Listen, type, and level up!',
    imageAlt: 'Spelling doodle',
    longDescription: 'Listen, type, and level up! Nail the word, build your streak, and unlock rewards as you go. Hear the word, use hints if you need the first letter, and type it back. Aim for three in a row to unlock a badge. Perfect for building spelling confidence one word at a time.',
    doodle: doodles.spelling,
  },
  {
    id: 'writing',
    title: '🎨 Writing Artist',
    description: 'Trace and create!',
    imageAlt: 'Art and brush doodle',
    longDescription: 'Trace shapes and letters with friendly guides. Follow the stroke order, take your time, and watch your skills grow. Use the high-contrast toggle for clearer lines and pause between strokes to keep focus steady. Great for building hand control and confidence with a pencil or finger.',
    doodle: doodles.writing,
  },
  {
    id: 'reading',
    title: '📖 Story Explorer',
    description: 'Dive into stories!',
    imageAlt: 'Reading doodle',
    longDescription: 'Dive into short stories made for easy reading. Highlight tricky words and replay them, slow down the narrator to 0.8x for clarity, and enjoy the ride. Summarize the paragraph in your own words to check understanding. Designed with dyslexia-friendly fonts and clear layouts so reading feels good.',
    doodle: doodles.reading,
  },
]

const FunActivities = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const announce = useAnnouncement()
  const hashFromUrl = (location.hash || '').replace('#', '')
  const initialId = defaultActivities.some((a) => a.id === hashFromUrl) ? hashFromUrl : 'phonics'
  const [activeId, setActiveId] = useState(initialId)

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Fun Activities page.')
  }, [])

  // Select activity from hash (e.g., #memory or #stories)
  useEffect(() => {
    const hash = location.hash?.replace('#', '')
    if (hash) {
      const match = defaultActivities.find((act) => act.id === hash)
      if (match) {
        setActiveId(hash)
      }
    }
  }, [location.hash])

  const activeActivity = useMemo(
    () => defaultActivities.find((act) => act.id === activeId) ?? defaultActivities[0],
    [activeId],
  )

  return (
    <div className="fun-activities-page" role="main">
      <header className="fun-hero">
        <div>
          <p className="eyebrow">Personalized practice</p>
          <h1>Fun Activities Hub</h1>
          <p className="lead">
            Pick an activity and read what each one is about. Find the one that sounds like fun!
          </p>
          <div className="hero-actions">
            <Link 
              className="btn btn-primary" 
              to="/home" 
              aria-label="Back to home"
              onClick={() => {
                playClick()
                speak('Clicking Back to Home. Navigating to home page.')
              }}
              onFocus={() => speak('Back to Home button')}
            >
              ← Back to Home
            </Link>
            <Link 
              className="btn btn-ghost" 
              to="/signlanguage" 
              aria-label="Go to sign language page"
              onClick={() => {
                playClick()
                speak('Clicking Sign Language. Navigating to Sign Language page.')
              }}
              onFocus={() => speak('Sign Language button')}
            >
              🤟 Sign Language
            </Link>
          </div>
        </div>
      </header>

      <div className="fun-layout">
        <section className="activity-list" aria-label="Activities list">
          {defaultActivities.map((activity) => {
            const isActive = activity.id === activeId
            return (
              <button
                key={activity.id}
                className={`activity-tile ${isActive ? 'active' : ''}`}
                data-activity={activity.id}
                onClick={() => {
                  playClick()
                  speak(`Clicking ${activity.title}. ${activity.description}`)
                  setActiveId(activity.id)
                  navigate(`/funactivities#${activity.id}`, { replace: true })
                  announce(`${activity.title} selected`)
                }}
                aria-pressed={isActive}
                aria-label={`Open ${activity.title}`}
              >
                <div className="tile-title">{activity.title}</div>
              </button>
            )
          })}
        </section>

        <section className="activity-detail" aria-labelledby="activityTitle" aria-live="polite" data-activity={activeId}>
          <div className="detail-header">
            <h2 id="activityTitle">{activeActivity.title}</h2>
            <p className="detail-desc detail-desc-long">{activeActivity.longDescription || activeActivity.description}</p>
            {activeActivity.doodle && (
              <div className="activity-detail-image-wrap activity-doodle-wrap">
                {activeActivity.doodle}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default FunActivities


