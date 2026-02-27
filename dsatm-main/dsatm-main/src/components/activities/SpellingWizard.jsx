import React, { useState, useCallback } from 'react'
import { speak } from '../../utils/voice'
import { playClick, playSuccess } from '../../utils/sound'

const WORDS = ['cat', 'dog', 'sun', 'hat', 'run', 'bug', 'pet', 'red', 'sit', 'top', 'cup', 'map']

function speakWord(word) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export default function SpellingWizard({ onFocus }) {
  const [word, setWord] = useState(WORDS[0])
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [streak, setStreak] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)

  const playWord = useCallback(() => {
    playClick()
    speakWord(word)
    if (onFocus) onFocus('Word: ' + word)
  }, [word, onFocus])

  const nextWord = useCallback(() => {
    const idx = WORDS.indexOf(word)
    const next = WORDS[(idx + 1) % WORDS.length]
    setWord(next)
    setInput('')
    setFeedback(null)
    setHintUsed(false)
  }, [word])

  const handleCheck = () => {
    playClick()
    const trimmed = input.trim().toLowerCase()
    if (trimmed === word.toLowerCase()) {
      setStreak((s) => s + 1)
      setFeedback('correct')
      playSuccess()
      speak('Correct!')
      setTimeout(nextWord, 1200)
    } else {
      setFeedback('incorrect')
      setStreak(0)
      speak('Try again. The word was ' + word + '.')
    }
  }

  const handleHint = () => {
    playClick()
    setHintUsed(true)
    speak('First letter is ' + word[0].toUpperCase())
    if (onFocus) onFocus('Hint: first letter ' + word[0])
  }

  return (
    <div className="activity-play-area" aria-label="Spelling Wizard - listen and type the word">
      <p className="activity-instruction">Listen to the word, then type it. Streak: {streak}</p>
      <div className="spelling-controls">
        <button type="button" className="btn btn-primary" onClick={playWord} onFocus={() => onFocus && onFocus('Play word')}>
          Play word
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleHint} disabled={hintUsed} onFocus={() => onFocus && onFocus('Get hint')}>
          Hint (first letter)
        </button>
      </div>
      <div className="spelling-input-wrap">
        <input
          type="text"
          className={'spelling-input ' + (feedback === 'correct' ? 'correct' : feedback === 'incorrect' ? 'incorrect' : '')}
          value={input}
          onChange={(e) => { setInput(e.target.value); setFeedback(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="Type the word..."
          aria-label="Type the word you hear"
          autoComplete="off"
        />
        <button type="button" className="btn btn-primary" onClick={handleCheck} onFocus={() => onFocus && onFocus('Check spelling')}>
          Check
        </button>
      </div>
      {feedback === 'correct' && <p className="activity-feedback success">Correct!</p>}
      {feedback === 'incorrect' && <p className="activity-feedback error">Try again</p>}
    </div>
  )
}
