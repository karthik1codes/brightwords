import React, { useState, useRef, useEffect, useCallback } from 'react'
import { playClick } from '../../utils/sound'
import {
  isSpeechSupported,
  unlockSpeechNow,
  waitForVoices,
  startSpeechKeepAlive,
  stopSpeechKeepAlive,
  speakUtterance,
} from '../../utils/voice'

export default function PdfReader() {
  const [file, setFile] = useState(null)
  const [pdfObjectUrl, setPdfObjectUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [aiEnhanced, setAiEnhanced] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const wordIndexRef = useRef(0)
  const wordsRef = useRef([])
  const utteranceRef = useRef(null)
  const speechRateRef = useRef(speechRate)
  const stoppedRef = useRef(false)
  const pausedRef = useRef(false)
  speechRateRef.current = speechRate

  useEffect(() => {
    return () => {
      stopSpeechKeepAlive()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl)
    }
  }, [pdfObjectUrl])

  const speakNextWord = useCallback(() => {
    if (!isSpeechSupported()) return
    if (stoppedRef.current || pausedRef.current) return

    const words = wordsRef.current
    const i = wordIndexRef.current
    if (i >= words.length) {
      stopSpeechKeepAlive()
      setIsPlaying(false)
      setPaused(false)
      pausedRef.current = false
      return
    }

    const word = words[i]
    wordIndexRef.current = i + 1
    utteranceRef.current = speakUtterance(word, {
      rate: speechRateRef.current,
      onEnd: () => {
        utteranceRef.current = null
        speakNextWord()
      },
      onError: () => {
        utteranceRef.current = null
        speakNextWord()
      },
    })
  }, [])

  const handleFileChange = async (e) => {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    if (chosen.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }
    playClick()
    setError('')
    setText('')
    setAiEnhanced(false)
    if (pdfObjectUrl) {
      URL.revokeObjectURL(pdfObjectUrl)
      setPdfObjectUrl(null)
    }
    setPdfObjectUrl(URL.createObjectURL(chosen))
    setFile(chosen)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('pdf', chosen)
      const res = await fetch('/api/pdf/extract-and-normalize', {
        method: 'POST',
        body: formData,
      })
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error('PDF service is unavailable. Please try again in a moment.')
      }
      const data = await res.json()
      if (!res.ok) {
        const message = data.error || 'Failed to process PDF'
        throw new Error(message.includes('Groq') ? 'Could not enhance text with AI. Please try again.' : message)
      }
      const extracted = (data.text || '').trim()
      setText(extracted)
      setAiEnhanced(Boolean(data.aiEnhanced))
      const words = extracted ? extracted.split(/\s+/).filter(Boolean) : []
      wordsRef.current = words
      wordIndexRef.current = 0
    } catch (err) {
      setError(err.message || 'Failed to process PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    if (!text) return
    if (!isSpeechSupported()) {
      setError('Text-to-speech is not supported in this browser.')
      return
    }

    playClick()
    unlockSpeechNow()
    stoppedRef.current = false
    pausedRef.current = false
    setPaused(false)

    if (window.speechSynthesis) window.speechSynthesis.cancel()
    wordIndexRef.current = 0
    wordsRef.current = text.split(/\s+/).filter(Boolean)
    setIsPlaying(true)
    setError('')

    await waitForVoices()
    startSpeechKeepAlive()
    speakNextWord()
  }

  const handlePause = () => {
    playClick()
    pausedRef.current = true
    setPaused(true)
    if (window.speechSynthesis) window.speechSynthesis.pause()
  }

  const handleResume = () => {
    playClick()
    pausedRef.current = false
    setPaused(false)
    if (!window.speechSynthesis) return
    window.speechSynthesis.resume()
    if (!window.speechSynthesis.speaking) {
      speakNextWord()
    }
  }

  const handleStop = () => {
    playClick()
    stoppedRef.current = true
    pausedRef.current = false
    stopSpeechKeepAlive()
    setIsPlaying(false)
    setPaused(false)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    wordIndexRef.current = 0
  }

  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="activity-play-area" aria-label="PDF Reader - upload a PDF to hear it read word by word">
      <p className="activity-instruction">
        Upload a PDF and hear its contents read out word by word. The text is processed with AI for clearer reading.
      </p>

      <label className="activity-file-label" style={{ display: 'block', marginBottom: 12 }}>
        <span className="btn btn-primary" style={{ cursor: 'pointer' }}>
          Choose PDF file
        </span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={loading}
          aria-label="Choose a PDF file to read"
          style={{ position: 'absolute', width: 0.1, height: 0.1, opacity: 0, overflow: 'hidden' }}
        />
      </label>

      {loading && <p className="activity-status" role="status">Processing PDF…</p>}
      {error && <p className="activity-error" style={{ color: 'var(--danger, #c00)' }}>{error}</p>}
      {file && !loading && (
        <p className="activity-status">
          {file.name} — {wordCount} word{wordCount !== 1 ? 's' : ''} ready
          {!aiEnhanced && wordCount > 0 ? ' (read from PDF text)' : ''}.
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <label className="activity-status" style={{ display: 'block', marginBottom: 6 }}>
          Reading speed: {speechRate.toFixed(1)}×
        </label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={speechRate}
          onChange={(e) => setSpeechRate(Number(e.target.value))}
          disabled={isPlaying}
          aria-label="Adjust reading speed"
          style={{ width: '100%', maxWidth: 200, accentColor: 'var(--primary, #7c3aed)' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleStart}
          disabled={!text || isPlaying}
          aria-label="Start reading PDF word by word"
        >
          Start reading
        </button>
        {isPlaying && (
          <>
            {paused ? (
              <button type="button" className="btn btn-secondary" onClick={handleResume} aria-label="Resume reading">
                Resume
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={handlePause} aria-label="Pause reading">
                Pause
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={handleStop} aria-label="Stop reading">
              Stop
            </button>
          </>
        )}
      </div>

      {pdfObjectUrl && (
        <div style={{ marginTop: 24 }}>
          <h3 className="activity-status" style={{ marginBottom: 8, fontSize: '1rem' }}>
            View PDF
          </h3>
          <div
            style={{
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#fff',
              minHeight: 480,
            }}
          >
            <iframe
              src={pdfObjectUrl}
              title="Uploaded PDF document"
              style={{ width: '100%', height: 560, border: 'none' }}
            />
          </div>
        </div>
      )}

      {text && (
        <details style={{ marginTop: 20 }}>
          <summary className="activity-status" style={{ cursor: 'pointer', marginBottom: 8 }}>
            Extracted text (for reference)
          </summary>
          <div
            className="activity-text-preview"
            style={{
              maxHeight: 200,
              overflow: 'auto',
              padding: 12,
              background: 'var(--bg-secondary, #f5f5f5)',
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.5,
            }}
            aria-label="Extracted text preview"
          >
            {text}
          </div>
        </details>
      )}
    </div>
  )
}
