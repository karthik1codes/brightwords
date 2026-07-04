import React, { useState } from 'react'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import '../styles/ChatWidget.css'

// BrightWords AI assistant – Jotform chatbot, shown on every page via App.jsx
const JOTFORM_AGENT_URL = 'https://www.jotform.com/agent/019c9ed9cbbc7bf7ba63392338df7fd36abe'

const ChatWidget = () => {
  const [chatOpen, setChatOpen] = useState(false)

  const handleToggle = () => {
    playClick()
    setChatOpen((open) => !open)
    speak(chatOpen ? 'Closing chat.' : 'Opening BrightWords AI assistant.')
  }

  const handleClose = () => {
    playClick()
    setChatOpen(false)
    speak('Closing chat.')
  }

  return (
    <div className="chat-widget" aria-label="Chat with BrightWords AI assistant">
      <button
        type="button"
        className="chat-widget-toggle"
        onClick={handleToggle}
        aria-expanded={chatOpen}
        aria-label={chatOpen ? 'Close chat' : 'Open BrightWords AI assistant'}
        aria-haspopup="dialog"
        title="Chat with BrightWords AI assistant"
      >
        <span className="chat-widget-icon" aria-hidden="true">
          {chatOpen ? '✕' : '💬'}
        </span>
      </button>
      {chatOpen && (
        <div
          className="chat-widget-panel"
          role="dialog"
          aria-modal="true"
          aria-label="BrightWords AI assistant chat"
        >
          <div className="chat-widget-panel-header">
            <span>BrightWords AI assistant</span>
            <div className="chat-widget-panel-actions">
              <a
                href={JOTFORM_AGENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-widget-open-new"
                aria-label="Open chat in new tab"
                title="Open in new tab"
              >
                ↗
              </a>
              <button
                type="button"
                className="chat-widget-close"
                onClick={handleClose}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>
          <iframe
            src={JOTFORM_AGENT_URL}
            title="BrightWords AI assistant"
            className="chat-widget-iframe"
            allow="microphone; camera"
          />
        </div>
      )}
    </div>
  )
}

export default ChatWidget
