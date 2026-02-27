import React, { useState } from 'react'
import { speak } from '../../utils/voice'
import { playClick } from '../../utils/sound'

const PASSAGE = 'The sun was high in the sky. A small bird sat on a branch. It sang a sweet song. Then it flew away to find food.'

const WORDS = PASSAGE.split(/\s+/)

function speakWord(w) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(w)
  u.lang = 'en-US'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function StoryExplorer({ onFocus }) {
  const [highlighted, setHighlighted] = useState(null)

  const readAll = () => {
    playClick()
    speak(PASSAGE)
    if (onFocus) onFocus('Reading passage aloud')
  }

  const onWordClick = (word) => {
    playClick()
    setHighlighted(word)
    speakWord(word)
  }

  return (
    <div className="activity-play-area story-explorer" aria-label="Story Explorer - read and hear the passage">
      <p className="activity-instruction">Click any word to hear it. Use "Read to me" to hear the whole passage.</p>
      <button type="button" className="btn btn-primary" onClick={readAll} onFocus={() => onFocus && onFocus('Read to me')}>
        🔊 Read to me
      </button>
      <div
        className="story-passage open-dyslexic"
        role="article"
        aria-label="Story passage"
      >
        {WORDS.map((word, i) => (
          <button
            key={i}
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
      <p className="activity-tip">Tip: Click a word to hear it again. Summarize the passage in your own words when done!</p>
    </div>
  )
}
