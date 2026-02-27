import React, { useState } from 'react'
import { speak } from '../../utils/voice'
import { playClick } from '../../utils/sound'

const SHAPES = [
  { id: 'circle', name: 'Circle', steps: ['Draw a curve from the top.', 'Keep going around.', 'Close the circle.'] },
  { id: 'square', name: 'Square', steps: ['Draw a line from the top-left down.', 'Draw across to the right.', 'Draw down, then close at the start.'] },
  { id: 'triangle', name: 'Triangle', steps: ['Start at the top point.', 'Draw down to the left.', 'Draw to the right, then back up to the top.'] },
]

const LETTERS = [
  { id: 'A', steps: ['Slant from top-left to bottom.', 'Slant from top-right to bottom.', 'Cross in the middle.'] },
  { id: 'B', steps: ['Draw a straight line down.', 'Curve at the top to the right.', 'Curve at the bottom to the right.'] },
  { id: 'C', steps: ['Start at the top right.', 'Curve around to the bottom.', 'Leave the left side open.'] },
]

export default function WritingArtist({ onFocus }) {
  const [mode, setMode] = useState('shapes')
  const [current, setCurrent] = useState(0)
  const [step, setStep] = useState(0)
  const items = mode === 'shapes' ? SHAPES : LETTERS
  const item = items[current] || items[0]
  const steps = item.steps || []
  const isLastStep = step >= steps.length - 1

  const nextStep = () => {
    playClick()
    if (step < steps.length - 1) {
      setStep(step + 1)
      speak(steps[step + 1])
    } else {
      speak(`${item.name} complete!`)
      setStep(0)
      setCurrent((c) => (c + 1) % items.length)
    }
  }

  const prevStep = () => {
    playClick()
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="activity-play-area" aria-label="Writing Artist - follow stroke steps">
      <p className="activity-instruction">Follow the stroke order. Use Next to go step by step.</p>
      <div className="writing-mode-toggle">
        <button
          type="button"
          className={`btn ${mode === 'shapes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setMode('shapes'); setCurrent(0); setStep(0); playClick() }}
        >
          Shapes
        </button>
        <button
          type="button"
          className={`btn ${mode === 'letters' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setMode('letters'); setCurrent(0); setStep(0); playClick() }}
        >
          Letters
        </button>
      </div>
      <div className="writing-display">
        <div className="writing-symbol" aria-hidden="true">
          {mode === 'shapes' && item.id === 'circle' && <span className="shape-circle">○</span>}
          {mode === 'shapes' && item.id === 'square' && <span className="shape-square">□</span>}
          {mode === 'shapes' && item.id === 'triangle' && <span className="shape-triangle">△</span>}
          {mode === 'letters' && <span className="letter-symbol">{item.id}</span>}
        </div>
        <p className="writing-step-text" aria-live="polite">
          Step {step + 1}: {steps[step]}
        </p>
      </div>
      <div className="writing-nav">
        <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={step === 0}>
          Previous step
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep} onFocus={() => onFocus && onFocus(steps[step])}>
          {isLastStep ? 'Complete & next' : 'Next step'}
        </button>
      </div>
    </div>
  )
}
