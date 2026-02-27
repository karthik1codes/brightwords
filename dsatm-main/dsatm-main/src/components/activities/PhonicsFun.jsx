import React, { useState, useRef, useEffect } from 'react'
import { playClick } from '../../utils/sound'
import { phonicsExplain } from '../../utils/funActivitiesApi'

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
  const [lastPlayedLetter, setLastPlayedLetter] = useState('A')
  const [explainModal, setExplainModal] = useState({ show: false, loading: false, explanation: '', error: '' })
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
    setLastPlayedLetter(letter)
    speakPhonics(letter)
  }

  const handleExplain = async () => {
    playClick()
    setExplainModal({ show: true, loading: true, explanation: '', error: '' })
    try {
      const explanation = await phonicsExplain(lastPlayedLetter)
      setExplainModal(prev => ({ ...prev, loading: false, explanation, error: '' }))
    } catch (err) {
      setExplainModal(prev => ({ ...prev, loading: false, explanation: '', error: err.message || 'Failed to load' }))
    }
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
      <button type="button" className="btn btn-secondary" onClick={handleExplain} style={{ marginBottom: 12 }}>
        Explain this sound (AI)
      </button>
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
      {explainModal.show && (
        <div className="activity-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="phonicsExplainTitle" onClick={() => setExplainModal(prev => ({ ...prev, show: false }))}>
          <div className="activity-modal" onClick={e => e.stopPropagation()}>
            <h3 id="phonicsExplainTitle">Explain sound: {lastPlayedLetter}</h3>
            {explainModal.loading && <p>Loading...</p>}
            {explainModal.error && <p className="activity-feedback error">{explainModal.error}</p>}
            {!explainModal.loading && explainModal.explanation && <p>{explainModal.explanation}</p>}
            <div className="activity-modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setExplainModal(prev => ({ ...prev, show: false }))}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
