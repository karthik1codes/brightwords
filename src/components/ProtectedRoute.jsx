import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute component - wraps routes that require authentication
 * Uses both async and sync checks to prevent race conditions
 * Redirects to /login with replace: true if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuthSync } = useAuth()

  // Use synchronous check first to avoid race conditions
  const hasValidSession = checkAuthSync()

  // Show loading state only if we're still loading AND there's no valid session
  if (isLoading && !hasValidSession) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="loading-spinner" aria-label="Loading"></div>
      </div>
    )
  }

  if (!isAuthenticated && !hasValidSession) {
    // Redirect to /login with replace: true so back button cannot return to protected pages
    return <Navigate to="/login" replace />
  }

  // User is authenticated (either way), render the protected content
  return children
}

export default ProtectedRoute
