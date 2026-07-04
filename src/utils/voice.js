/**
 * Voice Navigation Utility
 * Provides speech synthesis for accessibility across the BrightWords application.
 * Browsers (e.g. Chrome) require a user gesture before the first speak() – we unlock on first click/key.
 */

let speechUnlocked = false

function unlockSpeech() {
  if (speechUnlocked) return
  speechUnlocked = true
  removeUnlockListeners()
}

let unlockListenersAttached = false

function removeUnlockListeners() {
  if (typeof document === 'undefined') return
  document.removeEventListener('click', unlockSpeech, true)
  document.removeEventListener('keydown', unlockSpeech, true)
  document.removeEventListener('touchstart', unlockSpeech, true)
  unlockListenersAttached = false
}

/**
 * Call once at app load so the first user click/key unlocks speech synthesis.
 */
export function initSpeechUnlock() {
  if (typeof document === 'undefined' || unlockListenersAttached) return
  unlockListenersAttached = true
  document.addEventListener('click', unlockSpeech, { capture: true, once: true })
  document.addEventListener('keydown', unlockSpeech, { capture: true, once: true })
  document.addEventListener('touchstart', unlockSpeech, { capture: true, once: true })
}

/**
 * @param {string} text
 * @param {{ force?: boolean }} options - force: true to speak even when Voice Assistance is off (e.g. voice command replies)
 */
export const speak = (text, options = {}) => {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser')
    return
  }

  // Only speak if voice is enabled (or force for voice-command replies)
  if (!options.force && !isVoiceEnabled()) {
    return
  }

  // Browsers block speech until there has been a user gesture (e.g. click). Skip until unlocked.
  if (!speechUnlocked) {
    return
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const msg = new SpeechSynthesisUtterance(text)
  msg.lang = 'en-US'
  msg.rate = 1
  msg.pitch = 1
  msg.volume = 1

  window.speechSynthesis.speak(msg)
}

export const isVoiceEnabled = () => {
  return localStorage.getItem('voiceEnabled') === 'true'
}

export const toggleVoice = () => {
  const current = isVoiceEnabled()
  const newValue = !current
  localStorage.setItem('voiceEnabled', String(newValue))
  
  if (newValue) {
    speak('Voice assistance enabled.')
  } else {
    // Cancel any ongoing speech when disabling
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }
  
  return newValue
}

