/**
 * Voice Navigation Utility
 * Provides speech synthesis for accessibility across the BrightWords application
 */

export const speak = (text) => {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser')
    return
  }

  // Only speak if voice is enabled
  if (!isVoiceEnabled()) {
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

