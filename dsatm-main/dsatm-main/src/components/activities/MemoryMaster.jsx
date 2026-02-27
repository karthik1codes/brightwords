import React, { useState, useEffect } from 'react'
import { speak } from '../../utils/voice'
import { playClick, playSuccess } from '../../utils/sound'
import { memoryHint } from '../../utils/funActivitiesApi'

const EMOJI_PAIRS = ['🐶', '🐱', '🌻', '⭐', '🍎', '🚀', '🎵', '🌈']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MemoryMaster({ onFocus }) {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [lock, setLock] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [hintModal, setHintModal] = useState({ show: false, loading: false, text: '', error: '' })

  useEffect(() => {
    const pairs = [...EMOJI_PAIRS, ...EMOJI_PAIRS]
    const items = shuffle(pairs).map((emoji, i) => ({ id: i, emoji }))
    setCards(items)
  }, [])

  const handleCardClick = (id) => {
    if (lock || flipped.includes(id) || matched.includes(cards[id]?.emoji)) return
    playClick()
    const next = [...flipped, id]
    setFlipped(next)
    if (next.length === 2) {
      setLock(true)
      const [a, b] = next
      const emojiA = cards[a]?.emoji
      const emojiB = cards[b]?.emoji
      if (emojiA === emojiB) {
        playSuccess()
        setMatched((m) => [...m, emojiA])
        speak('Match!')
      }
      setTimeout(() => {
        setFlipped([])
        setLock(false)
      }, 800)
    }
  }

  const allMatched = EMOJI_PAIRS.length > 0 && matched.length === EMOJI_PAIRS.length
  const unmatchedEmojis = EMOJI_PAIRS.filter(e => !matched.includes(e))
  const firstUnmatched = unmatchedEmojis[0]

  const handleGetHint = async () => {
    if (hintUsed || !firstUnmatched || allMatched) return
    playClick()
    setHintUsed(true)
    setHintModal({ show: true, loading: true, text: '', error: '' })
    try {
      const hint = await memoryHint(firstUnmatched)
      setHintModal(prev => ({ ...prev, loading: false, text: hint, error: '' }))
    } catch (err) {
      setHintModal(prev => ({ ...prev, loading: false, text: '', error: err.message || 'Hint unavailable' }))
    }
  }

  return (
    <div className="activity-play-area" aria-label="Memory Master - match the pairs">
      <p className="activity-instruction">Click two cards to find matching pairs. Matches: {matched.length} of {EMOJI_PAIRS.length}</p>
      {!allMatched && firstUnmatched && (
        <button type="button" className="btn btn-secondary" onClick={handleGetHint} disabled={hintUsed} style={{ marginBottom: 12 }}>
          {hintUsed ? 'Hint used' : 'Get a hint (AI)'}
        </button>
      )}
      {allMatched && (
        <p className="activity-feedback success" role="status">
          🎉 You matched all pairs! Great job!
        </p>
      )}
      <div className="memory-grid" role="grid">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(card.emoji)
          return (
            <button
              key={index}
              type="button"
              className={`memory-card ${isFlipped ? 'flipped' : ''}`}
              onClick={() => handleCardClick(index)}
              onFocus={() => onFocus && onFocus(isFlipped ? `Card showing ${card.emoji}` : 'Hidden card')}
              aria-label={isFlipped ? `Card ${card.emoji}` : `Card ${index + 1}, face down`}
              disabled={lock || matched.includes(card.emoji)}
            >
              <span className="memory-card-front">?</span>
              <span className="memory-card-back">{card.emoji}</span>
            </button>
          )
        })}
      </div>
      {hintModal.show && (
        <div className="activity-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="memoryHintTitle" onClick={() => setHintModal(prev => ({ ...prev, show: false }))}>
          <div className="activity-modal" onClick={e => e.stopPropagation()}>
            <h3 id="memoryHintTitle">Hint for one of the cards</h3>
            {hintModal.loading && <p>Loading hint...</p>}
            {hintModal.error && <p className="activity-feedback error">{hintModal.error}</p>}
            {!hintModal.loading && hintModal.text && <p>{hintModal.text}</p>}
            <div className="activity-modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setHintModal(prev => ({ ...prev, show: false }))}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
