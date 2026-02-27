import React, { createContext, useContext, useState, useEffect } from 'react'
import { isVoiceEnabled, toggleVoice as toggleVoiceUtil } from '../utils/voice'

const AccessibilityContext = createContext()

const STORAGE_KEY = 'brightwords_accessibility_mode'
const TEXT_SIZE_STORAGE_KEY = 'brightwords_text_size'
const HIGH_CONTRAST_STORAGE_KEY = 'brightwords_high_contrast'
const DYSLEXIA_MODE_STORAGE_KEY = 'brightwords_dyslexia_mode'

export const AccessibilityProvider = ({ children }) => {
  const [accessibilityMode, setAccessibilityMode] = useState(false)
  const [textSize, setTextSize] = useState('normal') // 'normal', 'large', 'extra-large'
  const [highContrast, setHighContrast] = useState(false)
  const [dyslexiaMode, setDyslexiaMode] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) === 'on'
      const storedTextSize = localStorage.getItem(TEXT_SIZE_STORAGE_KEY) || 'normal'
      const storedHighContrast = localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY) === 'true'
      const storedDyslexiaMode = localStorage.getItem(DYSLEXIA_MODE_STORAGE_KEY) === 'true'
      const storedVoiceEnabled = isVoiceEnabled()

      setAccessibilityMode(stored)
      setTextSize(storedTextSize)
      setHighContrast(storedHighContrast)
      setDyslexiaMode(storedDyslexiaMode)
      setVoiceEnabled(storedVoiceEnabled)
    } catch (error) {
      console.warn('Unable to load accessibility preferences', error)
    }
  }, [])

  // Apply accessibility mode classes to document
  useEffect(() => {
    const body = document.body
    const html = document.documentElement

    if (accessibilityMode || highContrast || dyslexiaMode) {
      body.classList.add('accessibility-mode')
      html.classList.add('accessibility-mode')
    } else {
      body.classList.remove('accessibility-mode')
      html.classList.remove('accessibility-mode')
    }

    // Apply high contrast
    if (highContrast) {
      body.classList.add('high-contrast')
      html.classList.add('high-contrast')
    } else {
      body.classList.remove('high-contrast')
      html.classList.remove('high-contrast')
    }

    // Apply dyslexia mode
    if (dyslexiaMode) {
      body.classList.add('dyslexia-mode')
      html.classList.add('dyslexia-mode')
    } else {
      body.classList.remove('dyslexia-mode')
      html.classList.remove('dyslexia-mode')
    }

    // Apply text size
    body.classList.remove('text-size-normal', 'text-size-large', 'text-size-extra-large')
    body.classList.add(`text-size-${textSize}`)
    html.classList.remove('text-size-normal', 'text-size-large', 'text-size-extra-large')
    html.classList.add(`text-size-${textSize}`)
  }, [accessibilityMode, textSize, highContrast, dyslexiaMode])

  const toggleAccessibilityMode = () => {
    const newValue = !accessibilityMode
    setAccessibilityMode(newValue)
    try {
      localStorage.setItem(STORAGE_KEY, newValue ? 'on' : 'off')
    } catch (error) {
      console.warn('Unable to persist accessibility preference', error)
    }
  }

  const changeTextSize = (size) => {
    if (['normal', 'large', 'extra-large'].includes(size)) {
      setTextSize(size)
      try {
        localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size)
      } catch (error) {
        console.warn('Unable to persist text size preference', error)
      }
    }
  }

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    try {
      localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(newValue))
    } catch (error) {
      console.warn('Unable to persist high contrast preference', error)
    }
  }

  const toggleDyslexiaMode = () => {
    const newValue = !dyslexiaMode
    setDyslexiaMode(newValue)
    try {
      localStorage.setItem(DYSLEXIA_MODE_STORAGE_KEY, String(newValue))
    } catch (error) {
      console.warn('Unable to persist dyslexia mode preference', error)
    }
  }

  const toggleVoice = () => {
    const newValue = toggleVoiceUtil()
    setVoiceEnabled(newValue)
  }

  const value = {
    accessibilityMode,
    textSize,
    highContrast,
    dyslexiaMode,
    voiceEnabled,
    toggleAccessibilityMode,
    changeTextSize,
    toggleHighContrast,
    toggleDyslexiaMode,
    toggleVoice,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}


