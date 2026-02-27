import React, { useState, useCallback, useMemo } from 'react'
import { playClick } from '../../utils/sound'
import { storyPassage, storyExplain } from '../../utils/funActivitiesApi'

const FALLBACK_STORIES = [
  { title: 'The Little Bird', text: 'The sun was high in the sky. A small bird sat on a branch. It sang a sweet song. Then it flew away to find food.' },
  { title: 'The Kind Dog', text: 'Max was a kind dog. He lived with a girl named Lily. Every day Max walked with Lily to the park. They played with a big red ball. Max was the happiest dog in the world.' },
  { title: 'The Rainy Day', text: 'It was a rainy day. Sam looked out of the window. He saw puddles on the street. He put on his yellow raincoat and boots. Sam went outside to splash in the puddles.' },
  { title: 'The Garden', text: 'Nina had a small garden. She planted seeds in the soil. She watered them every morning. Soon green leaves grew. Then bright flowers bloomed in the sun.' },
  { title: 'The Lost Kite', text: 'Ben flew his kite at the park. The wind was strong. The kite went up and up. Then the string broke. Ben ran to find his kite and found it in a tree.' },
]

const MIN_RATE = 0.5
const MAX_RATE = 1.5
const RATE_STEP = 0.1
const DEFAULT_RATE = 1

function speakWithRate(text, rate = 1) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = Math.max(MIN_RATE, Math.min(MAX_RATE, rate))
  u.pitch = 1
  u.volume = 1
  window.speechSynthesis.speak(u)
}

export default function StoryExplorer({ onFocus }) {
  const [stories, setStories] = useState(FALLBACK_STORIES)
  const [storyIndex, setStoryIndex] = useState(0)
  const [highlighted, setHighlighted] = useState(null)
  const [speed, setSpeed] = useState(DEFAULT_RATE)
  const [newStoryLoading, setNewStoryLoading] = useState(false)
  const [explainModal, setExplainModal] = useState({ show: false, loading: false, type: 'explain', content: null, error: '' })

  const currentStory = stories[storyIndex]
  const passage = currentStory?.text ?? ''
  const words = useMemo(() => passage.split(/\s+/), [passage])

  const handleGetNewStory = useCallback(async () => {
    playClick()
    setNewStoryLoading(true)
    try {
      const { title, text } = await storyPassage('nature', 'easy')
      if (text) {
        setStories(prev => [...prev, { title, text }])
        setStoryIndex(stories.length)
        setHighlighted(null)
      }
    } catch {
      // keep current stories
    } finally {
      setNewStoryLoading(false)
    }
  }, [stories.length])

  const handleExplain = useCallback(async (type) => {
    if (!passage.trim()) return
    playClick()
    setExplainModal({ show: true, loading: true, type, content: null, error: '' })
    try {
      const data = await storyExplain(passage, type)
      if (type === 'explain') {
        setExplainModal(prev => ({ ...prev, loading: false, content: { explanation: data.explanation }, error: '' }))
      } else {
        setExplainModal(prev => ({ ...prev, loading: false, content: { question: data.question, suggestedAnswer: data.suggestedAnswer }, error: '' }))
      }
    } catch (err) {
      setExplainModal(prev => ({ ...prev, loading: false, content: null, error: err.message || 'Failed' }))
    }
  }, [passage])

  const readAll = useCallback(() => {
    playClick()
    if (!passage) return
    speakWithRate(passage, speed)
    if (onFocus) onFocus('Reading entire story aloud')
  }, [passage, speed, onFocus])

  const onWordClick = useCallback((word) => {
    playClick()
    setHighlighted(word)
    speakWithRate(word, speed)
  }, [speed])

  const handleSpeedChange = (e) => {
    const value = parseFloat(e.target.value)
    setSpeed(value)
    playClick()
  }

  const goToStory = (delta) => {
    playClick()
    setHighlighted(null)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setStoryIndex((i) => {
      const next = i + delta
      if (next < 0) return stories.length - 1
      if (next >= stories.length) return 0
      return next
    })
  }

  return (
    <div className="activity-play-area story-explorer" aria-label="Story Explorer - read and hear stories">
      <p className="activity-instruction">Use &quot;Read to me&quot; to hear the entire story at once. Click any word to hear it again.</p>
      <div className="story-explorer-controls">
        <button
          type="button"
          className="btn btn-primary read-to-me-btn"
          onClick={readAll}
          onFocus={() => onFocus && onFocus('Read to me - reads entire story')}
          aria-label="Read entire story aloud"
        >
          🔊 Read to me
        </button>
        <div className="speed-control" role="group" aria-label="Narration speed">
          <label htmlFor="story-speed" className="speed-label">
            Narration speed: <strong>{speed.toFixed(1)}×</strong>
          </label>
          <input
            id="story-speed"
            type="range"
            min={MIN_RATE}
            max={MAX_RATE}
            step={RATE_STEP}
            value={speed}
            onChange={handleSpeedChange}
            className="speed-slider"
            aria-valuemin={MIN_RATE}
            aria-valuemax={MAX_RATE}
            aria-valuenow={speed}
            aria-valuetext={`${speed.toFixed(1)} times speed`}
          />
          <div className="speed-marks" aria-hidden="true">
            <span>0.5×</span>
            <span>1×</span>
            <span>1.5×</span>
          </div>
        </div>
      </div>
      <div className="story-picker">
        <span className="story-picker-label">Story:</span>
        <div className="story-picker-buttons">
          <button type="button" className="btn btn-ghost story-nav-btn" onClick={() => goToStory(-1)} aria-label="Previous story">← Previous</button>
          <span className="story-picker-title" aria-live="polite">{currentStory?.title}</span>
          <button type="button" className="btn btn-ghost story-nav-btn" onClick={() => goToStory(1)} aria-label="Next story">Next →</button>
          <button type="button" className="btn btn-secondary" onClick={handleGetNewStory} disabled={newStoryLoading} style={{ marginLeft: 8 }}>
            {newStoryLoading ? 'Loading...' : 'Get new story'}
          </button>
        </div>
      </div>
      {passage && (
        <div className="story-explorer-controls" style={{ marginTop: 8, gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => handleExplain('explain')}>Explain this story</button>
          <button type="button" className="btn btn-secondary" onClick={() => handleExplain('question')}>Ask a question</button>
        </div>
      )}
      <div
        className="story-passage open-dyslexic"
        role="article"
        aria-label={`Story: ${currentStory?.title}`}
      >
        {words.map((word, i) => (
          <button
            key={`${storyIndex}-${i}`}
            type="button"
            className={`story-word ${highlighted === word ? 'highlighted' : ''}`}
            onClick={() => onWordClick(word)}
            onFocus={() => onFocus && onFocus(word)}
            aria-label={`Word: ${word}`}
          >
            {word}
          </button>
        ))}
      </div>
      <p className="activity-tip">Tip: Click a word to hear it again at the same speed. Summarize the passage in your own words when done!</p>
      {explainModal.show && (
        <div className="activity-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="storyExplainTitle" onClick={() => setExplainModal(prev => ({ ...prev, show: false }))}>
          <div className="activity-modal" onClick={e => e.stopPropagation()}>
            <h3 id="storyExplainTitle">{explainModal.type === 'explain' ? 'Story explanation' : 'Question about the story'}</h3>
            {explainModal.loading && <p>Loading...</p>}
            {explainModal.error && <p className="activity-feedback error">{explainModal.error}</p>}
            {!explainModal.loading && explainModal.content && (
              <>
                {explainModal.content.explanation && <p>{explainModal.content.explanation}</p>}
                {explainModal.content.question && <p><strong>Question:</strong> {explainModal.content.question}</p>}
                {explainModal.content.suggestedAnswer != null && <p><strong>Suggested answer:</strong> {explainModal.content.suggestedAnswer}</p>}
              </>
            )}
            <div className="activity-modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setExplainModal(prev => ({ ...prev, show: false }))}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
