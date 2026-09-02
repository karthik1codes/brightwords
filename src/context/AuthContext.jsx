import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiUrl } from '../utils/apiBase'

const GOOGLE_CLIENT_ID = '369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com'
const AuthContext = createContext()

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Unable to complete sign-in.')
  return data
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const restoreSession = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/auth/session'), { credentials: 'same-origin' })
      if (response.status === 401) {
        setCurrentUser(null)
        return
      }
      const data = await readJson(response)
      setCurrentUser(data.user || null)
    } catch (error) {
      console.warn('Could not restore session:', error)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (credentialResponse, navigate) => {
    if (!credentialResponse?.credential) throw new Error('Google did not return a credential.')
    const response = await fetch(apiUrl('/api/auth/google'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    })
    const data = await readJson(response)
    setCurrentUser(data.user)
    if (navigate && typeof navigate === 'function') navigate('/mode-select', { replace: true })
    return data.user
  }, [])

  const signOut = useCallback(async (navigate) => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'same-origin' })
    } finally {
      setCurrentUser(null)
      if (navigate && typeof navigate === 'function') navigate('/login', { replace: true })
    }
  }, [])

  const initializeGoogleAuth = useCallback(() => {
    if (!window.google?.accounts?.id) return
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, cancel_on_tap_outside: true })
  }, [])

  useEffect(() => {
    restoreSession()
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleAuth
      document.head.appendChild(script)
    } else {
      initializeGoogleAuth()
    }
  }, [initializeGoogleAuth, restoreSession])

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      isAuthenticated: Boolean(currentUser),
      login,
      signOut,
      initializeGoogleAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
