import React, { useState, useEffect } from 'react'
import { speak } from '../../utils/voice'
import { playClick, playSuccess } from '../../utils/sound'

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

  return (
    <div className="activity-play-area" aria-label="Memory Master - match the pairs">
      <p className="activity-instruction">Click two cards to find matching pairs. Matches: {matched.length} of {EMOJI_PAIRS.length}</p>
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
    </div>
  )
}
