/**
 * BrightWords API base URL for production and development.
 * - Production (Vercel): use same-origin /api (proxied via vercel.json) or VITE_API_BASE
 * - Dev on port 8000: same-origin via Vite proxy
 * - Dev on other ports: direct to localhost:3000
 */
export function getApiBase() {
  const envBase = (import.meta.env.VITE_API_BASE || '').trim().replace(/\/$/, '')
  if (envBase) return envBase

  if (typeof window === 'undefined') return ''

  const { hostname, port, protocol } = window.location
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isLocal && port === '8000') return ''
  if (isLocal && port && port !== '3000') return 'http://localhost:3000'

  // Production: same-origin (Vercel rewrites /api → backend)
  if (protocol === 'https:' || (!isLocal && !port)) return ''

  return ''
}

export function apiUrl(path) {
  const base = getApiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
