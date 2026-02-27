import React, { useState, useEffect } from 'react'
import { playClick } from '../../utils/sound'
import { storyGenerate } from '../../utils/funActivitiesApi'

const SETTINGS = ['Forest', 'Castle', 'Space', 'Ocean', 'Garden']
const CHARACTERS = ['Knight', 'Robot', 'Cat', 'Dragon', 'Explorer']
const GOALS = ['Find a key', 'Save the queen', 'Get home', 'Discover treasure', 'Make a friend']

function speakStory(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export default function StoryCreator({ onFocus }) {
  const [setting, setSetting] = useState(null)
  const [character, setCharacter] = useState(null)
  const [goal, setGoal] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [story, setStory] = useState(null)
  const [storyLoading, setStoryLoading] = useState(false)
  const [storyError, setStoryError] = useState('')

  useEffect(() => {
    if (!setting || !character || !goal) {
      setStory(null)
      setStoryError('')
      return
    }
    let cancelled = false
    setStoryLoading(true)
    setStoryError('')
    storyGenerate(setting, character, goal)
      .then((text) => {
        if (!cancelled) setStory(text || null)
      })
      .catch((err) => {
        if (!cancelled) setStoryError(err.message || 'Could not generate story')
      })
      .finally(() => {
        if (!cancelled) setStoryLoading(false)
      })
    return () => { cancelled = true }
  }, [setting, character, goal])

  const handleDragStart = (e, type, value) => {
    setDragging({ type, value })
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, value }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDrop = (e, type, setter) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.type === type) setter(data.value)
    } catch {}
    setDragging(null)
  }

  const handleDragOver = (e) => e.preventDefault()

  const readStory = () => {
    playClick()
    if (story) speakStory(story)
  }

  const clearStory = () => {
    playClick()
    setSetting(null)
    setCharacter(null)
    setGoal(null)
    setStory(null)
    setStoryError('')
  }

  return (
    <div className="activity-play-area" aria-label="Story Creator - drag prompts to build your story">
      <p className="activity-instruction">Drag one chip from each group into the boxes below, then hear your story!</p>
      <div className="story-drops">
        <div
          className={`story-drop ${setting ? 'filled' : ''}`}
          onDrop={(e) => handleDrop(e, 'setting', setSetting)}
          onDragOver={handleDragOver}
          aria-label="Setting"
        >
          <span className="drop-label">Setting</span>
          {setting || 'Drop here'}
        </div>
        <div
          className={`story-drop ${character ? 'filled' : ''}`}
          onDrop={(e) => handleDrop(e, 'character', setCharacter)}
          onDragOver={handleDragOver}
          aria-label="Character"
        >
          <span className="drop-label">Character</span>
          {character || 'Drop here'}
        </div>
        <div
          className={`story-drop ${goal ? 'filled' : ''}`}
          onDrop={(e) => handleDrop(e, 'goal', setGoal)}
          onDragOver={handleDragOver}
          aria-label="Goal"
        >
          <span className="drop-label">Goal</span>
          {goal || 'Drop here'}
        </div>
      </div>
      <div className="story-chips">
        <div className="chip-group">
          <span className="chip-group-label">Settings</span>
          {SETTINGS.map((s) => (
            <span
              key={s}
              className="story-chip"
              draggable
              onDragStart={(e) => handleDragStart(e, 'setting', s)}
              onClick={() => setSetting(s)}
              role="button"
              tabIndex={0}
              aria-label={`Setting: ${s}`}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="chip-group">
          <span className="chip-group-label">Characters</span>
          {CHARACTERS.map((c) => (
            <span
              key={c}
              className="story-chip"
              draggable
              onDragStart={(e) => handleDragStart(e, 'character', c)}
              onClick={() => setCharacter(c)}
              role="button"
              tabIndex={0}
              aria-label={`Character: ${c}`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="chip-group">
          <span className="chip-group-label">Goals</span>
          {GOALS.map((g) => (
            <span
              key={g}
              className="story-chip"
              draggable
              onDragStart={(e) => handleDragStart(e, 'goal', g)}
              onClick={() => setGoal(g)}
              role="button"
              tabIndex={0}
              aria-label={`Goal: ${g}`}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
      {(story || storyLoading || storyError) && (
        <div className="story-result">
          {storyLoading && <p className="activity-feedback">Generating your story...</p>}
          {storyError && <p className="activity-feedback error">{storyError}</p>}
          {story && (
            <>
              <div className="story-text story-text-long">
                {story.split(/\.\s+/).filter(Boolean).map((sentence, i) => (
                  <p key={i}>{sentence}{sentence.endsWith('.') ? '' : '.'}</p>
                ))}
              </div>
              <div className="story-actions">
                <button type="button" className="btn btn-primary" onClick={readStory} onFocus={() => onFocus && onFocus('Read my story')}>
                  🔊 Read my story
                </button>
                <button type="button" className="btn btn-secondary" onClick={clearStory} onFocus={() => onFocus && onFocus('Start over')}>
                  Start over
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
