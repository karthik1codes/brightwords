import React, { useState, useEffect, useRef } from 'react'
import { playClick, playSuccess } from '../../utils/sound'
import { writingFeedback } from '../../utils/funActivitiesApi'

function speakStep(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

const SHAPES = [
  { id: 'circle', name: 'Circle', steps: ['Start at the top.', 'Curve to the right and go around.', 'Close the circle.'] },
  { id: 'square', name: 'Square', steps: ['Start at the top left.', 'Draw down, then across to the right.', 'Draw down and close.'] },
  { id: 'triangle', name: 'Triangle', steps: ['Start at the top.', 'Draw down to the left.', 'Draw back up to the top.'] },
]

const LETTERS = [
  { id: 'A', name: 'Letter A', steps: ['Draw the first slant from top left to bottom.', 'Draw the second slant from top right to bottom.', 'Add the crossbar in the middle.'] },
  { id: 'B', name: 'Letter B', steps: ['Draw the straight line down.', 'Add the top curve to the right.', 'Add the bottom curve.'] },
  { id: 'C', name: 'Letter C', steps: ['Start at the top right.', 'Curve around toward the bottom.', 'Leave the left side open.'] },
]

// Simple validation based on drawn strokes (heuristic)
function validateDrawing(strokes, itemId, mode) {
  if (!strokes.length) return { correct: false, message: 'Draw something first, then tap Check.' }
  const allPoints = strokes.flatMap((s) => s.points)
  if (allPoints.length < 10) return { correct: false, message: 'Keep going! Trace a bit more, then tap Check.' }

  const minX = Math.min(...allPoints.map((p) => p.x))
  const maxX = Math.max(...allPoints.map((p) => p.x))
  const minY = Math.min(...allPoints.map((p) => p.y))
  const maxY = Math.max(...allPoints.map((p) => p.y))
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const aspect = w / h

  if (mode === 'letters') {
    return { correct: true, message: 'Good practice! Compare your letter with the one above and try again to improve.' }
  }

  if (itemId === 'circle') {
    const closed = strokes.some((s) => {
      const pts = s.points
      if (pts.length < 5) return false
      const first = pts[0]
      const last = pts[pts.length - 1]
      const dist = Math.hypot(last.x - first.x, last.y - first.y)
      return dist < Math.min(w, h) * 0.4
    })
    const roundEnough = aspect > 0.6 && aspect < 1.5
    if (closed && roundEnough) return { correct: true, message: 'Correct! You formed the circle well.' }
    if (!closed) return { correct: false, message: 'Not quite. Try to close the circle by ending near where you started.' }
    return { correct: false, message: 'Good try! Make it more round and close the circle.' }
  }

  if (itemId === 'square') {
    const corners = countDirectionChanges(strokes, 4)
    const rectLike = aspect > 0.5 && aspect < 2
    if (corners >= 2 && rectLike) return { correct: true, message: 'Correct! You formed the square well.' }
    return { correct: false, message: 'Not quite. Try four sides: down, across, down, then close.' }
  }

  if (itemId === 'triangle') {
    const corners = countDirectionChanges(strokes, 3)
    if (corners >= 2) return { correct: true, message: 'Correct! You formed the triangle well.' }
    return { correct: false, message: 'Not quite. Try three lines: down left, then right, then back up.' }
  }

  return { correct: true, message: 'Good attempt! Keep practicing.' }
}

function countDirectionChanges(strokes, maxPoints) {
  const points = strokes.flatMap((s) => s.points)
  if (points.length < 6) return 0
  let changes = 0
  const step = Math.max(1, Math.floor(points.length / (maxPoints + 2)))
  for (let i = step; i < points.length - step; i += step) {
    const prev = points[i - step]
    const curr = points[i]
    const next = points[i + step]
    const d1 = Math.atan2(curr.y - prev.y, curr.x - prev.x)
    const d2 = Math.atan2(next.y - curr.y, next.x - curr.x)
    const diff = Math.abs(d2 - d1)
    if (diff > 0.5 && diff < Math.PI * 0.9) changes++
  }
  return changes
}

function WritingCanvas({ width, height, strokes, onStrokesChange, disabled }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef([])

  const getPoint = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const startDraw = (e) => {
    if (disabled) return
    e.preventDefault()
    const p = getPoint(e)
    if (!p) return
    isDrawing.current = true
    currentStroke.current = [p]
  }

  const moveDraw = (e) => {
    if (!isDrawing.current || disabled) return
    e.preventDefault()
    const p = getPoint(e)
    if (!p) return
    currentStroke.current.push(p)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      const prev = currentStroke.current[currentStroke.current.length - 2]
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
  }

  const endDraw = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentStroke.current.length > 0) {
      onStrokesChange([...strokes, { points: currentStroke.current }])
    }
    currentStroke.current = []
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#5b21b6'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    })
  }, [strokes])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="writing-canvas"
      aria-label="Drawing area - trace the shape or letter"
      onMouseDown={startDraw}
      onMouseMove={moveDraw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={moveDraw}
      onTouchEnd={endDraw}
      style={{ touchAction: 'none' }}
    />
  )
}

export default function WritingArtist({ onFocus }) {
  const [mode, setMode] = useState(null)
  const [current, setCurrent] = useState(0)
  const [strokes, setStrokes] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [aiFeedback, setAiFeedback] = useState('')

  const items = mode === 'shapes' ? SHAPES : mode === 'letters' ? LETTERS : []
  const item = items[current]

  useEffect(() => {
    if (item?.steps?.[0]) speakStep(`Trace ${item.name}. ${item.steps.join(' ')}`)
  }, [item?.id])

  const handleCheck = () => {
    playClick()
    if (!item) return
    const result = validateDrawing(strokes, item.id, mode)
    setFeedback(result)
    setAiFeedback('')
    if (result.correct) playSuccess()
    speakStep(result.message)
    writingFeedback(item.id, result.correct)
      .then((text) => setAiFeedback(text || ''))
      .catch(() => setAiFeedback(''))
  }

  const handleClear = () => {
    playClick()
    setStrokes([])
    setFeedback(null)
    setAiFeedback('')
  }

  const handleTryNext = () => {
    playClick()
    setStrokes([])
    setFeedback(null)
    setAiFeedback('')
    setCurrent((c) => (c + 1) % items.length)
  }

  const handleChooseMode = (newMode) => {
    playClick()
    setMode(newMode)
    setCurrent(0)
    setStrokes([])
    setFeedback(null)
    setAiFeedback('')
  }

  const handleStartOver = () => {
    playClick()
    setMode(null)
    setCurrent(0)
    setStrokes([])
    setFeedback(null)
    setAiFeedback('')
  }

  if (mode === null) {
    return (
      <div className="activity-play-area writing-artist-simple" aria-label="Writing Artist - trace shapes and letters">
        <p className="writing-artist-intro">Trace shapes or letters by following the steps. Then check if your drawing is correct.</p>
        <div className="writing-mode-cards">
          <button type="button" className="writing-mode-card" onClick={() => handleChooseMode('shapes')} onFocus={() => onFocus && onFocus('Choose Shapes')} aria-label="Choose Shapes">
            <span className="mode-icon" aria-hidden="true">⬡</span>
            <span className="mode-title">Shapes</span>
            <span className="mode-desc">Circle, Square, Triangle</span>
          </button>
          <button type="button" className="writing-mode-card" onClick={() => handleChooseMode('letters')} onFocus={() => onFocus && onFocus('Choose Letters')} aria-label="Choose Letters">
            <span className="mode-icon" aria-hidden="true">Aa</span>
            <span className="mode-title">Letters</span>
            <span className="mode-desc">A, B, C</span>
          </button>
        </div>
      </div>
    )
  }

  const canvasSize = 280

  return (
    <div className="activity-play-area writing-dashboard" aria-label={`Writing Artist - ${item?.name}`}>
      <p className="writing-artist-intro">Tracing: <strong>{item.name}</strong></p>
      <div className="writing-dashboard-instructions">
        <p className="writing-dashboard-steps-label">Follow these steps:</p>
        <ol className="writing-steps-list">
          {item.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="writing-dashboard-reference">
        <span className="writing-dashboard-ref-label">Trace this:</span>
        <div className="writing-symbol-simple">
          {mode === 'shapes' && item.id === 'circle' && <span className="shape-visual circle">○</span>}
          {mode === 'shapes' && item.id === 'square' && <span className="shape-visual square">□</span>}
          {mode === 'shapes' && item.id === 'triangle' && <span className="shape-visual triangle">△</span>}
          {mode === 'letters' && <span className="letter-visual">{item.id}</span>}
        </div>
      </div>
      <div className="writing-dashboard-canvas-wrap">
        <span className="writing-dashboard-canvas-label">Your drawing:</span>
        <WritingCanvas width={canvasSize} height={canvasSize} strokes={strokes} onStrokesChange={setStrokes} disabled={false} />
      </div>
      <div className="writing-dashboard-actions">
        <button type="button" className="btn btn-secondary" onClick={handleClear} onFocus={() => onFocus && onFocus('Clear drawing')} aria-label="Clear drawing">
          Clear
        </button>
        <button type="button" className="btn btn-primary" onClick={handleCheck} onFocus={() => onFocus && onFocus('Check my drawing')} aria-label="Check my drawing">
          Check my drawing
        </button>
      </div>
      {feedback && (
        <div className={`writing-feedback ${feedback.correct ? 'correct' : 'wrong'}`} role="status">
          <span className="writing-feedback-icon">{feedback.correct ? '✓' : '✗'}</span>
          <p className="writing-feedback-message">{feedback.message}</p>
          {aiFeedback && <p className="writing-feedback-ai">{aiFeedback}</p>}
        </div>
      )}
      <div className="writing-dashboard-nav">
        <button type="button" className="btn btn-primary" onClick={handleTryNext} onFocus={() => onFocus && onFocus('Try next')}>
          Try next
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleStartOver} onFocus={() => onFocus && onFocus('Start over')}>
          Start over
        </button>
      </div>
    </div>
  )
}
