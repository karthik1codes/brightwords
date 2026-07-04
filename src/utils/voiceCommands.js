/**
 * Maps voice input (transcript) to responses and optional navigation.
 * Used to respond to whatever the user says via TTS and/or routing.
 */

const COMMANDS = [
  // Navigation
  { patterns: [/go (to )?home|home page|main page|dashboard/i], response: 'Opening home.', path: '/home' },
  { patterns: [/go to learn|open learn|learn (page)?/i], response: 'Opening Learn.', path: '/funactivities' },
  { patterns: [/sign language|sign language (page)?|open sign/i], response: 'Opening Sign Language.', path: '/signlanguage' },
  { patterns: [/progress|my progress|see progress/i], response: 'Opening home.', path: '/home' },
  { patterns: [/feedback|give feedback|feedback page/i], response: 'Opening Feedback.', path: '/feedback' },
  { patterns: [/communities?|community|parents?/i], response: 'You can find Communities in the menu on the home page.', path: null },
  // Help & info
  { patterns: [/what (can you do|do you do)|help|how (do I )?use/i], response: 'You can say: go to learn, open sign language, go home, what is my streak, or open feedback. Try saying one of those.' },
  { patterns: [/streak|my streak|day streak/i], response: 'Your streak shows on the home page near your name. Sign in and visit Home to see it.' },
  { patterns: [/start (learning)?|begin|how do I start/i], response: 'Say "go to learn" to open activities, or tap Learn in the menu.' },
  { patterns: [/hello|hi |hey |good morning|good afternoon/i], response: 'Hello! Say "help" to hear what I can do, or try "go to learn" or "open sign language".' },
  { patterns: [/thank you|thanks/i], response: "You're welcome." },
  { patterns: [/bye|goodbye/i], response: 'Goodbye. Come back anytime.' },
]

/**
 * Get response and optional path for a voice transcript.
 * @param {string} transcript
 * @returns {{ response: string, path?: string }}
 */
export function getVoiceCommandResponse(transcript) {
  const t = (transcript || '').trim()
  if (!t) {
    return { response: "I didn't hear anything. Try again, or say 'help' for options." }
  }

  for (const { patterns, response, path } of COMMANDS) {
    for (const p of patterns) {
      if (p.test(t)) {
        return { response, path: path ?? undefined }
      }
    }
  }

  // No command matched – respond to whatever they said
  return {
    response: `You said: "${t}". I can help with things like going to Learn, Sign Language, Home, or Feedback. Say "help" to hear all options.`,
  }
}
