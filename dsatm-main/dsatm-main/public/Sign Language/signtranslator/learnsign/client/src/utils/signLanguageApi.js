/**
 * Helper for Sign Language AI API calls.
 * Handles non-JSON responses (e.g. 404 HTML) and returns a clear error message.
 */
const API_UNAVAILABLE_MSG =
  'AI service unavailable. Start the BrightWords backend (cd dsatm-main/dsatm-main/backend && node server.js) and open the app from the dev server (e.g. http://localhost:8000).';

export async function signLanguageFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  const isJson =
    res.headers.get('content-type')?.includes('application/json') ||
    (text.trim().startsWith('{') || text.trim().startsWith('['));
  if (!isJson || (!res.ok && text.trim().startsWith('<'))) {
    if (!res.ok && text.trim().startsWith('<!')) {
      throw new Error(API_UNAVAILABLE_MSG);
    }
    throw new Error(res.ok ? 'Invalid response from server' : `Request failed (${res.status}). ${API_UNAVAILABLE_MSG}`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(API_UNAVAILABLE_MSG);
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * Base URL for BrightWords backend API (explain, gloss, video, etc.).
 * When embedded in BrightWords, use same origin so /api is proxied to the backend.
 * REACT_APP_AI_API_BASE can override (e.g. http://localhost:3000) if needed.
 */
export function getAiApiBase() {
  const env = (process.env.REACT_APP_AI_API_BASE || '').trim().replace(/\/$/, '');
  if (env) return env;
  if (typeof window !== 'undefined' && window.location && window.location.origin)
    return window.location.origin;
  return '';
}
