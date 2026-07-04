/**
 * Fun Activities AI API – calls backend /api/fun-activities/* (Groq).
 */
import { getApiBase, apiUrl } from './apiBase'

const BASE = getApiBase()

async function safeJson(res) {
  const text = await res.text()
  const isJson = (res.headers.get('content-type') || '').includes('application/json') ||
    (text.trim().startsWith('{') || text.trim().startsWith('['))
  if (!isJson) throw new Error('AI service unavailable. Start the backend: in a terminal run "cd backend && node server.js" (port 3000).')
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid response from server')
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

async function apiRequest(path, options) {
  try {
    const res = await fetch(`${BASE}${path}`, options)
    return await safeJson(res)
  } catch (e) {
    if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message.includes('fetch')))
      throw new Error('Backend not reachable. Start it with: cd backend && node server.js')
    throw e
  }
}

export async function phonicsExplain(letter) {
  const data = await apiRequest('/api/fun-activities/phonics-explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letter }),
  })
  return data.explanation || ''
}

export async function spellingWords(level = 'easy', topic = 'everyday') {
  const data = await apiRequest('/api/fun-activities/spelling-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, topic }),
  })
  return data.words || []
}

export async function spellingHint(word) {
  const data = await apiRequest('/api/fun-activities/spelling-hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  return data.hint || ''
}

export async function storyGenerate(setting, character, goal) {
  const data = await apiRequest('/api/fun-activities/story-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setting, character, goal }),
  })
  return data.story || ''
}

export async function storyPassage(topic = 'nature', level = 'easy') {
  const data = await apiRequest('/api/fun-activities/story-passage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level }),
  })
  return { title: data.title || 'New Story', text: data.text || '' }
}

export async function storyExplain(text, type = 'explain') {
  return apiRequest('/api/fun-activities/story-explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, type }),
  })
}

export async function memoryHint(emoji) {
  const data = await apiRequest('/api/fun-activities/memory-hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji }),
  })
  return data.hint || ''
}

export async function writingFeedback(itemId, correct) {
  const data = await apiRequest('/api/fun-activities/writing-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, correct }),
  })
  return data.feedback || ''
}
