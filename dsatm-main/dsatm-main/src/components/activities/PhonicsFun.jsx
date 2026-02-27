import React, { useState, useRef, useEffect } from 'react'
import { playClick } from '../../utils/sound'

// Clear phonics phrases - letter name and sound for accurate, consistent output
const LETTER_SOUNDS = {
  A: 'A, ay', B: 'B, buh', C: 'C, cuh', D: 'D, duh', E: 'E, eh',
  F: 'F, fuh', G: 'G, guh', H: 'H, huh', I: 'I, ih', J: 'J, juh',
  K: 'K, kuh', L: 'L, luh', M: 'M, muh', N: 'N, nuh', O: 'O, oh',
  P: 'P, puh', Q: 'Q, kw', R: 'R, ruh', S: 'S, suh', T: 'T, tuh',
  U: 'U, uh', V: 'V, vuh', W: 'W, wuh', X: 'X, ks', Y: 'Y, yuh', Z: 'Z, zuh',
}

const LETTERS = Object.keys(LETTER_SOUNDS)

export default function PhonicsFun({ onFocus }) {
  const [slowMode, setSlowMode] = useState(false)
  const speakTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [])

  const speakPhonics = (letter) => {
    if (!window.speechSynthesis) return
    const phrase = LETTER_SOUNDS[letter]
    const rate = slowMode ? 0.75 : 0.95

    // Cancel any current or queued speech immediately
    window.speechSynthesis.cancel()

    // Wait for cancel to fully take effect before speaking (prevents overlap and lag)
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    speakTimeoutRef.current = setTimeout(() => {
      speakTimeoutRef.current = null
      const u = new SpeechSynthesisUtterance(phrase)
      u.lang = 'en-US'
      u.rate = rate
      u.pitch = 1
      u.volume = 1
      u.onstart = () => {}
      u.onend = () => {}
      window.speechSynthesis.speak(u)
    }, 80)
  }

  const handleTileClick = (letter) => {
    playClick()
    speakPhonics(letter)
    // Do not speak again via onFocus - we already spoke in speakPhonics (avoids double/lag)
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
            aria-label={`Letter ${letter}, ${LETTER_SOUNDS[letter]}`}
            role="listitem"
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  )
}
