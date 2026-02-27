import React from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import PhonicsFun from '../components/activities/PhonicsFun'
import SpellingWizard from '../components/activities/SpellingWizard'
import MemoryMaster from '../components/activities/MemoryMaster'
import StoryCreator from '../components/activities/StoryCreator'
import WritingArtist from '../components/activities/WritingArtist'
import StoryExplorer from '../components/activities/StoryExplorer'
import '../styles/FunActivities.css'

const GAME_MAP = {
  phonics: { title: '🔤 Phonics Fun', Component: PhonicsFun },
  spelling: { title: '✏️ Spelling Wizard', Component: SpellingWizard },
  memory: { title: '🧠 Memory Master', Component: MemoryMaster },
  stories: { title: '🚀 Story Creator', Component: StoryCreator },
  writing: { title: '🎨 Writing Artist', Component: WritingArtist },
  reading: { title: '📖 Story Explorer', Component: StoryExplorer },
}

export default function Games() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = gameId ? GAME_MAP[gameId] : null

  if (!game) {
    navigate('/home', { replace: true })
    return null
  }

  const { title, Component } = game

  return (
    <div className="fun-activities-page" role="main">
      <header className="fun-hero">
        <div>
          <p className="eyebrow">Play</p>
          <h1>{title}</h1>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                playClick()
                speak('Back to Home.')
                navigate('/home')
              }}
              onFocus={() => speak('Back to Home button')}
              aria-label="Back to home"
            >
              ← Back to Home
            </button>
            <Link
              className="btn btn-ghost"
              to="/funactivities"
              onClick={() => {
                playClick()
                speak('Explore all fun activities.')
              }}
              onFocus={() => speak('Explore all fun activities')}
              aria-label="Explore all fun activities"
            >
              Explore all fun activities
            </Link>
          </div>
        </div>
      </header>

      <div className="fun-layout" style={{ gridTemplateColumns: '1fr', maxWidth: 720 }}>
        <section className="activity-detail" aria-labelledby="gameTitle">
          <div className="detail-header">
            <h2 id="gameTitle">{title}</h2>
          </div>
          <div className="activity-game-container">
            <Component onFocus={(msg) => msg && speak(msg)} />
          </div>
        </section>
      </div>
    </div>
  )
}
