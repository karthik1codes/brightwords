/**
 * Speech recognition (voice input) via Web Speech API.
 * Listens to the microphone and returns transcribed text.
 */

const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)

export function isSpeechRecognitionSupported() {
  return !!SpeechRecognition
}

/**
 * Create a recognition instance. Call start() after user gesture.
 * @param {Object} options
 * @param {boolean} options.continuous
 * @param {boolean} options.interimResults
 * @param {string} options.lang
 * @returns {SpeechRecognition | null}
 */
export function createRecognition(options = {}) {
  if (!SpeechRecognition) return null
  const recognition = new SpeechRecognition()
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? false
  recognition.lang = options.lang ?? 'en-US'
  recognition.maxAlternatives = options.maxAlternatives ?? 1
  return recognition
}

/**
 * One-shot listen: start recognition, resolve with final transcript when user stops speaking (or after one result).
 * Rejects on error or if unsupported.
 * Must be called from a user gesture (e.g. click).
 * @param {Object} options
 * @returns {Promise<string>} final transcript (may be empty)
 */
export function listenOnce(options = {}) {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition is not supported in this browser.'))
      return
    }

    const recognition = createRecognition({
      continuous: false,
      interimResults: true,
      lang: options.lang ?? 'en-US',
    })

    let finalTranscript = ''

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalTranscript = (finalTranscript + ' ' + transcript).trim()
        }
      }
    }

    recognition.onend = () => {
      resolve(finalTranscript)
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        resolve(finalTranscript)
        return
      }
      if (event.error === 'not-allowed') {
        reject(new Error('Microphone access was denied or blocked.'))
        return
      }
      if (event.error === 'no-speech') {
        resolve('')
        return
      }
      reject(new Error(event.error || 'Speech recognition error'))
    }

    recognition.start()
  })
}
