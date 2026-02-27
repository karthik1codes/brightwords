import React, { useState } from 'react'
import { callGrok } from '../utils/grokClient'

function GrokHelper() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAsk = async (event) => {
    event.preventDefault()
    setError('')
    setAnswer('')

    const trimmed = question.trim()
    if (!trimmed) return

    setIsLoading(true)
    try {
      const content = await callGrok({
        messages: [
          {
            role: 'system',
            content:
              'You are Grok, an AI helper for the BrightWords app. ' +
              'Give short, clear answers for parents and children. ' +
              'Be kind, encouraging, and accessible.',
          },
          {
            role: 'user',
            content: trimmed,
          },
        ],
        temperature: 0.7,
      })
      setAnswer(content)
    } catch (err) {
      setError(err?.message || 'Something went wrong while talking to Grok.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      aria-label="Ask Grok, the BrightWords helper"
      style={{
        width: '100%',
        maxWidth: 720,
        margin: '32px auto 24px',
        padding: '20px 20px 16px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, #eef2ff, #fdf2ff)',
        boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
      }}
    >
      <h3
        style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 700,
          color: '#4c1d95',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span role="img" aria-hidden="true">
          🤖
        </span>
        Ask Grok a question
      </h3>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 14,
          color: '#4b5563',
        }}
      >
        Type a question about learning support, accessibility, or BrightWords. Grok will reply in a
        friendly, simple way.
      </p>
      <form onSubmit={handleAsk}>
        <label className="sr-only" htmlFor="grokQuestion">
          Ask Grok a question
        </label>
        <textarea
          id="grokQuestion"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="Example: How can I help my child focus during reading time?"
          style={{
            width: '100%',
            resize: 'vertical',
            minHeight: 72,
            maxHeight: 180,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid #ddd6fe',
            fontSize: 14,
            lineHeight: 1.5,
            outline: 'none',
          }}
        />
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: isLoading || !question.trim() ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Asking Grok…' : 'Ask Grok'}
          </button>
          <span
            style={{
              fontSize: 12,
              color: '#6b7280',
              flex: 1,
              textAlign: 'right',
            }}
          >
            Grok may sometimes be wrong. Double-check important advice.
          </span>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: '8px 10px',
            borderRadius: 10,
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {answer && (
        <div
          aria-live="polite"
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 14,
            background: 'white',
            border: '1px solid #e5e7eb',
            fontSize: 14,
            color: '#111827',
            maxHeight: 220,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {answer}
        </div>
      )}
    </section>
  )
}

export default GrokHelper

