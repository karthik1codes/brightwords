import React, { useState } from 'react'
import { playClick } from '../../utils/sound'

const LETTER_SOUNDS = {
  A: 'A says ay', B: 'B says buh', C: 'C says cuh', D: 'D says duh', E: 'E says eh',
  F: 'F says fuh', G: 'G says guh', H: 'H says huh', I: 'I says ih', J: 'J says juh',
  K: 'K says kuh', L: 'L says luh', M: 'M says muh', N: 'N says nuh', O: 'O says oh',
  P: 'P says puh', Q: 'Q says qu', R: 'R says ruh', S: 'S says suh', T: 'T says tuh',
  U: 'U says uh', V: 'V says vuh', W: 'W says wuh', X: 'X says ks', Y: 'Y says yuh', Z: 'Z says zuh',
}

const LETTERS = Object.keys(LETTER_SOUNDS)

function speakPhonics(text, slowMode = false) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = slowMode ? 0.7 : 1
  u.pitch = 1
  u.volume = 1
  window.speechSynthesis.speak(u)
}

export default function PhonicsFun({ onFocus }) {
  const [slowMode, setSlowMode] = useState(false)

  const handleTileClick = (letter) => {
    playClick()
    const phrase = LETTER_SOUNDS[letter]
    speakPhonics(phrase, slowMode)
    if (onFocus) onFocus(`${letter}. ${phrase}`)
  }

  return (
    <div className="activity-play-area" aria-label="Phonics Fun - tap a letter to hear its sound">
      <p className="activity-instruction">Tap a letter to hear its sound. Try repeating it aloud!</p>
      <label className="activity-toggle">
        <input
          type="checkbox"
          checked={slowMode}
          onChange={(e) => setSlowMode(e.target.checked)}
          aria-label="Slow mode for sounds"
        />
        <span>Slow mode</span>
      </label>
      <div className="phonics-grid" role="list">
        {LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            className="phonics-tile"
            onClick={() => handleTileClick(letter)}
            onFocus={() => onFocus && onFocus(`Letter ${letter}`)}
            aria-label={`Letter ${letter}. ${LETTER_SOUNDS[letter]}`}
            role="listitem"
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  )
}
