import { apiUrl } from './apiBase'

// Records only activity metadata (not learner answers, story text, or PDF content).
export async function recordLearningActivity(event) {
  try {
    const response = await fetch(apiUrl('/api/progress/events'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    if (!response.ok) throw new Error('Progress update failed')
    return await response.json()
  } catch (error) {
    // Progress reporting must never interrupt a learning activity.
    console.warn('Could not record learning activity:', error)
    return null
  }
}
