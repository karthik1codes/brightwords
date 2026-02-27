import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAnnouncement } from '../hooks/useAnnouncement'
import { speak } from '../utils/voice'
import { playClick, playSuccess } from '../utils/sound'
import '../styles/FunActivities.css'

const defaultActivities = [
  {
    id: 'phonics',
    title: '🔤 Phonics Fun',
    description: 'Hear and practice sounds for everyday words.',
    tips: [
      'Tap each tile to hear the sound.',
      'Try to repeat it aloud after you listen.',
      'Switch to slow mode if the sounds feel too quick.',
    ],
  },
  {
    id: 'memory',
    title: '🧠 Memory Master',
    description: 'Match pairs with sound cues and visual hints.',
    tips: [
      'Start with fewer pairs, then increase difficulty.',
      'Use sound cues first, then rely on visuals.',
      'Track matches to build short-term memory step by step.',
    ],
  },
  {
    id: 'stories',
    title: '🚀 Story Creator',
    description: 'Drag and drop prompts to build your own adventure.',
    tips: [
      'Pick a setting, a character, and a goal to begin.',
      'Add a twist in the middle to keep it exciting.',
      'Record yourself reading the story for extra practice.',
    ],
  },
  {
    id: 'spelling',
    title: '✏️ Spelling Wizard',
    description: 'Listen to the word and type it back to grow your streak.',
    tips: [
      'Use hints to reveal the first letter.',
      'Repeat the word twice before typing.',
      'Aim for three correct answers to unlock a badge.',
    ],
  },
  {
    id: 'writing',
    title: '🎨 Writing Artist',
    description: 'Trace shapes and letters with guided steps.',
    tips: [
      'Follow the stroke order arrows.',
      'Use the high-contrast toggle for clearer lines.',
      'Pause between strokes to keep focus steady.',
    ],
  },
  {
    id: 'reading',
    title: '📖 Story Explorer',
    description: 'Read short passages with dyslexia-friendly fonts.',
    tips: [
      'Highlight tricky words and replay them.',
      'Slow down narration to 0.8x for better clarity.',
      'Summarize the paragraph in your own words.',
    ],
  },
]

const storageKey = 'brightwords_funactivities_progress'

const FunActivities = () => {
  const location = useLocation()
  const announce = useAnnouncement()
  const [activeId, setActiveId] = useState('phonics')
  const [progress, setProgress] = useState({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setProgress(JSON.parse(saved))
      }
    } catch {
      // ignore storage failures to avoid blocking UI
    }
  }, [])

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

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress))
    } catch {
      // ignore storage failures to avoid blocking UI
    }
  }, [progress])

  const activeActivity = useMemo(
    () => defaultActivities.find((act) => act.id === activeId) ?? defaultActivities[0],
    [activeId],
  )

  const handleComplete = (id) => {
    setProgress((prev) => {
      const current = prev[id] || { completions: 0, lastPlayed: null }
      const updated = {
        ...prev,
        [id]: { completions: current.completions + 1, lastPlayed: new Date().toISOString() },
      }
      return updated
    })
    announce('Great job! Activity marked as complete.')
  }

  return (
    <div className="fun-activities-page" role="main">
      <header className="fun-hero">
        <div>
          <p className="eyebrow">Personalized practice</p>
          <h1>Fun Activities Hub</h1>
          <p className="lead">
            Pick an activity, explore adaptive tips, and track your completions without leaving the
            BrightWords app.
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
            const progressEntry = progress[activity.id]
            return (
              <button
                key={activity.id}
                className={`activity-tile ${isActive ? 'active' : ''}`}
                onClick={() => {
                  playClick()
                  speak(`Clicking ${activity.title}. ${activity.description}`)
                  setActiveId(activity.id)
                  announce(`${activity.title} selected`)
                }}
                aria-pressed={isActive}
                aria-label={`Open ${activity.title}`}
              >
                <div className="tile-title">{activity.title}</div>
                <p className="tile-desc">{activity.description}</p>
                {progressEntry && (
                  <p className="tile-progress" aria-live="polite">
                    Completed {progressEntry.completions} time{progressEntry.completions === 1 ? '' : 's'}
                  </p>
                )}
              </button>
            )
          })}
        </section>

        <section className="activity-detail" aria-labelledby="activityTitle" aria-live="polite">
          <div className="detail-header">
            <h2 id="activityTitle">{activeActivity.title}</h2>
            <p className="detail-desc">{activeActivity.description}</p>
          </div>
          <div className="tips" role="list" aria-label="Activity tips">
            {activeActivity.tips.map((tip, idx) => (
              <div className="tip-card" role="listitem" key={idx}>
                <span className="tip-badge" aria-hidden="true">
                  {idx + 1}
                </span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => {
                playClick()
                playSuccess()
                speak('Clicking Mark Complete. Activity marked as complete.')
                handleComplete(activeActivity.id)
              }}
              onFocus={() => speak('Mark Complete button')}
            >
              Mark Complete
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                playClick()
                playSuccess()
                speak('Clicking Save Progress. Progress saved.')
                announce('Progress saved. Feel free to switch activities.')
              }}
              onFocus={() => speak('Save Progress button')}
            >
              Save Progress
            </button>
          </div>
          {progress[activeActivity.id]?.lastPlayed && (
            <p className="last-played" aria-live="polite">
              Last played {new Date(progress[activeActivity.id].lastPlayed).toLocaleString()}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default FunActivities


