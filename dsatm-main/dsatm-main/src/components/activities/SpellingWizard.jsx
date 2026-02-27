import React, { useState, useCallback, useEffect } from 'react'
import { speak } from '../../utils/voice'
import { playClick, playSuccess } from '../../utils/sound'
import { spellingWords, spellingHint } from '../../utils/funActivitiesApi'

const FALLBACK_WORDS = ['cat', 'dog', 'sun', 'hat', 'run', 'bug', 'pet', 'red', 'sit', 'top', 'cup', 'map']

function speakWord(word) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export default function SpellingWizard({ onFocus }) {
  const [words, setWords] = useState(FALLBACK_WORDS)
  const [wordIndex, setWordIndex] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [streak, setStreak] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [wordsLoading, setWordsLoading] = useState(true)
  const [aiHint, setAiHint] = useState({ show: false, loading: false, text: '', error: '' })

  const word = words[wordIndex] ?? words[0]

  const loadWords = useCallback(async () => {
    setWordsLoading(true)
    try {
      const list = await spellingWords(undefined, undefined)
      if (Array.isArray(list) && list.length > 0) setWords(list)
    } catch {
      setWords(FALLBACK_WORDS)
    } finally {
      setWordsLoading(false)
    }
  }, [])

  useEffect(() => { loadWords() }, [loadWords])

  const playWord = useCallback(() => {
    playClick()
    speakWord(word)
    if (onFocus) onFocus('Word: ' + word)
  }, [word, onFocus])

  const nextWord = useCallback(() => {
    setWordIndex(i => (i + 1) % words.length)
    setInput('')
    setFeedback(null)
    setHintUsed(false)
  }, [words.length])

  const handleNewSet = () => {
    playClick()
    loadWords()
    setWordIndex(0)
    setInput('')
    setFeedback(null)
    setHintUsed(false)
  }

  const handleAiHint = async () => {
    playClick()
    setAiHint({ show: true, loading: true, text: '', error: '' })
    try {
      const hint = await spellingHint(word)
      setAiHint(prev => ({ ...prev, loading: false, text: hint, error: '' }))
    } catch (err) {
      setAiHint(prev => ({ ...prev, loading: false, text: '', error: err.message || 'Hint unavailable' }))
    }
  }

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
      {wordsLoading && <p className="activity-feedback">Loading words...</p>}
      <div className="spelling-controls">
        <button type="button" className="btn btn-primary" onClick={playWord} onFocus={() => onFocus && onFocus('Play word')}>
          Play word
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleHint} disabled={hintUsed} onFocus={() => onFocus && onFocus('Get hint')}>
          Hint (first letter)
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleAiHint} onFocus={() => onFocus && onFocus('AI hint')}>
          AI hint
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleNewSet} disabled={wordsLoading}>New set</button>
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
      {aiHint.show && (
        <div className="activity-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="aiHintTitle" onClick={() => setAiHint(prev => ({ ...prev, show: false }))}>
          <div className="activity-modal" onClick={e => e.stopPropagation()}>
            <h3 id="aiHintTitle">AI hint for this word</h3>
            {aiHint.loading && <p>Loading hint...</p>}
            {aiHint.error && <p className="activity-feedback error">{aiHint.error}</p>}
            {!aiHint.loading && aiHint.text && <p>{aiHint.text}</p>}
            <div className="activity-modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setAiHint(prev => ({ ...prev, show: false }))}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
