/**
 * Global Sound Effects Engine
 * WCAG 2.2 compliant sound system for BrightWords
 * 
 * Requirements:
 * - Sounds are short (0.1-0.4s)
 * - Sounds are soft (20-30% volume)
 * - No autoplay, no looping
 * - Only plays on intentional user actions
 */

const STORAGE_KEY = 'soundEnabled'
const DEFAULT_VOLUME = 0.2 // 20% volume
const VOICE_MODE_VOLUME = 0.1 // 10% volume when voice assistance is on

// Audio context for generating sounds
let audioContext = null

// Initialize audio context (lazy initialization)
// Must be initialized on user interaction to avoid autoplay restrictions
const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      // Resume audio context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      return null
    }
  } else if (audioContext.state === 'suspended') {
    // Resume if context was suspended
    audioContext.resume()
  }
  return audioContext
}

// Check if sound is enabled
export const isSoundEnabled = () => {
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

// Set sound enabled state
export const setSoundEnabled = (enabled) => {
  localStorage.setItem(STORAGE_KEY, String(enabled))
}

// Get current volume based on voice assistance state
const getVolume = () => {
  const voiceEnabled = localStorage.getItem('voiceEnabled') === 'true'
  return voiceEnabled ? VOICE_MODE_VOLUME : DEFAULT_VOLUME
}

// Generate a simple tone
const generateTone = (frequency, duration, type = 'sine') => {
  const ctx = getAudioContext()
  if (!ctx) return null

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.value = frequency

  // Envelope: quick attack, smooth release
  const now = ctx.currentTime
  const volume = getVolume()

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01) // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration) // Smooth release

  oscillator.start(now)
  oscillator.stop(now + duration)

  return { oscillator, gainNode }
}

/**
 * Play a click sound (short, high-pitched)
 * Duration: ~0.15s
 */
export const playClick = () => {
  if (!isSoundEnabled()) return
  generateTone(800, 0.15, 'sine')
}

/**
 * Play a success sound (pleasant, medium-pitched)
 * Duration: ~0.25s
 */
export const playSuccess = () => {
  if (!isSoundEnabled()) return
  
  const ctx = getAudioContext()
  if (!ctx) return

  // Two-tone success sound
  const now = ctx.currentTime
  const volume = getVolume()

  // First tone
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.type = 'sine'
  osc1.frequency.value = 523.25 // C5
  gain1.gain.setValueAtTime(0, now)
  gain1.gain.linearRampToValueAtTime(volume, now + 0.01)
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
  osc1.start(now)
  osc1.stop(now + 0.15)

  // Second tone (slightly delayed)
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.type = 'sine'
  osc2.frequency.value = 659.25 // E5
  gain2.gain.setValueAtTime(0, now + 0.1)
  gain2.gain.linearRampToValueAtTime(volume, now + 0.11)
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
  osc2.start(now + 0.1)
  osc2.stop(now + 0.25)
}

/**
 * Play a toggle sound (medium-pitched, quick)
 * Duration: ~0.12s
 */
export const playToggle = () => {
  if (!isSoundEnabled()) return
  generateTone(600, 0.12, 'sine')
}

/**
 * Play an error sound (lower-pitched, brief)
 * Duration: ~0.2s
 */
export const playError = () => {
  if (!isSoundEnabled()) return
  
  const ctx = getAudioContext()
  if (!ctx) return

  // Short descending tone
  const now = ctx.currentTime
  const volume = getVolume()

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(400, now)
  oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2)

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

  oscillator.start(now)
  oscillator.stop(now + 0.2)
}

/**
 * Play a modal open sound (gentle, ascending)
 * Duration: ~0.2s
 */
export const playModalOpen = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const volume = getVolume()

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(300, now)
  oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.2)

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

  oscillator.start(now)
  oscillator.stop(now + 0.2)
}

/**
 * Play a modal close sound (gentle, descending)
 * Duration: ~0.2s
 */
export const playModalClose = () => {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const volume = getVolume()

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(500, now)
  oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.2)

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

  oscillator.start(now)
  oscillator.stop(now + 0.2)
}

