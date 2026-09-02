import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * PublicRoute component - for routes that should redirect to home if already authenticated
 * Used for login and signup pages
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state only if we're still loading AND there's no valid session
  if (isLoading) {
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

  // If already authenticated (either way), redirect to home (/home) with replace: true
  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  // User is not authenticated, show the public route (login/signup page)
  return children
}

export default PublicRoute
