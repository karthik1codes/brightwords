import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AUTH_STORAGE_KEY = 'brightwords_google_user'
const GOOGLE_CLIENT_ID = '369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Decode JWT credential
  const decodeJwtCredential = useCallback((token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      return null
    }
  }, [])

  // Check if user is authenticated (synchronous check)
  const checkAuthSync = useCallback(() => {
    try {
      // Check Google auth
      const cached = localStorage.getItem(AUTH_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.credential) {
          const tokenData = decodeJwtCredential(parsed.credential)
          if (tokenData && tokenData.email) return true
        }
      }

      return false
    } catch (error) {
      return false
    }
  }, [decodeJwtCredential])

  // Restore session from localStorage
  const restoreSession = useCallback(() => {
    try {
      // Try Google auth first
      const cached = localStorage.getItem(AUTH_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.credential) {
          const tokenData = decodeJwtCredential(parsed.credential)
          if (tokenData && tokenData.email) {
            setCurrentUser({
              ...parsed,
              ...tokenData,
              loginTime: new Date().toISOString(),
              loginMethod: 'google',
            })
            setIsLoading(false)
            return
          }
        }
      }

      // No valid session
      setCurrentUser(null)
      setIsLoading(false)
    } catch (error) {
      console.warn('Error restoring session:', error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setCurrentUser(null)
      setIsLoading(false)
    }
  }, [decodeJwtCredential])

  // Login function - sets token and stores in localStorage
  // Accepts optional navigate function to handle navigation after login
  const login = useCallback((userData, navigate) => {
    try {
      if (!userData?.credential) {
        console.error('No credential provided to login function')
        throw new Error('Invalid request: No credential provided')
      }

      const profile = decodeJwtCredential(userData.credential)
      if (!profile || !profile.email) {
        console.error('Failed to decode credential or missing email')
        throw new Error('Invalid request: Failed to decode credential')
      }

      const user = {
        ...profile,
        credential: userData.credential,
        loginTime: new Date().toISOString(),
      }

      // Set state first
      setCurrentUser(user)
      
      // Save to localStorage
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError)
        // Continue anyway - state is set
      }
      
      // Navigate to home after state is set
      // Use requestAnimationFrame to ensure React has processed the state update
      if (navigate && typeof navigate === 'function') {
        requestAnimationFrame(() => {
          try {
            navigate("/home", { replace: true })
          } catch (navError) {
            console.error('Navigation error:', navError)
            // Fallback: use window.location if navigate fails
            window.location.href = '/home'
          }
        })
      }
    } catch (error) {
      console.error('Error in login function:', error)
      // Re-throw to let the caller handle it
      throw error
    }
  }, [decodeJwtCredential])

  // Handle credential response - this is called by Google Sign-In button
  // Note: Navigation will be handled by the login callback in Login component
  const handleCredentialResponse = useCallback(
    (response) => {
      if (!response?.credential) return

      const profile = decodeJwtCredential(response.credential)
      const user = {
        ...profile,
        credential: response.credential,
        loginTime: new Date().toISOString(),
      }

      setCurrentUser(user)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      // Navigation will be handled by the component using this callback
    },
    [decodeJwtCredential]
  )

  // Sign out - clears auth state and navigates to signin
  // Accepts optional navigate function to handle navigation after logout
  const signOut = useCallback((navigate) => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setCurrentUser(null)
    
    // Navigate to signin with replace: true to prevent back navigation
    if (navigate && typeof navigate === 'function') {
      navigate("/login", { replace: true })
    }
  }, [])

  // Initialize Google Auth
  const initializeGoogleAuth = useCallback(() => {
    if (!window.google?.accounts?.id) {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval)
          initializeGoogleAuth()
        }
      }, 150)
      return
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      cancel_on_tap_outside: true,
    })
  }, [handleCredentialResponse])

  // Load session on mount
  useEffect(() => {
    // Restore session immediately
    restoreSession()

    // Set up Google Auth script
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        initializeGoogleAuth()
      }
      document.head.appendChild(script)
    } else {
      initializeGoogleAuth()
    }
  }, [restoreSession, initializeGoogleAuth])

  const value = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    checkAuthSync,
    login,
    signOut,
    initializeGoogleAuth,
    handleCredentialResponse,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

