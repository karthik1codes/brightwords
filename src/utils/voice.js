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

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Unlock speech on explicit user action (e.g. Start reading). */
export function unlockSpeechNow() {
  speechUnlocked = true
  removeUnlockListeners()
}

export function waitForVoices(timeoutMs = 1000) {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve([])
      return
    }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) {
      resolve(voices)
      return
    }
    const onVoices = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoices)
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      resolve(window.speechSynthesis.getVoices())
    }, timeoutMs)
  })
}

let keepAliveTimer = null

/** Chrome stops long TTS queues unless synthesis is periodically resumed. */
export function startSpeechKeepAlive() {
  stopSpeechKeepAlive()
  if (!isSpeechSupported()) return
  keepAliveTimer = setInterval(() => {
    const syn = window.speechSynthesis
    if (syn.speaking && !syn.paused) {
      syn.pause()
      syn.resume()
    }
  }, 7000)
}

export function stopSpeechKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }
}

export function speakUtterance(text, { rate = 1, onEnd, onError } = {}) {
  if (!isSpeechSupported()) return null
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = 1
  utterance.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const enVoice = voices.find((v) => v.lang.startsWith('en'))
  if (enVoice) utterance.voice = enVoice
  if (onEnd) utterance.onend = onEnd
  if (onError) utterance.onerror = onError
  window.speechSynthesis.speak(utterance)
  return utterance
}

