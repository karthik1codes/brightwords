import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import FunActivities from './pages/FunActivities'
import BrightWords from './pages/BrightWords'
import SuperPower from './pages/SuperPower'
import Feedback from './pages/Feedback'
import SignLanguage from './pages/SignLanguage'
import Subscription from './pages/Subscription'

// Catch-all route component that checks authentication
function CatchAllRoute() {
  const { isAuthenticated, isLoading, checkAuthSync } = useAuth()
  
  // Use synchronous check to avoid race conditions
  const hasValidSession = checkAuthSync()
  
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
  
  // Redirect authenticated users to home (/home), others to login
  return <Navigate to={(isAuthenticated || hasValidSession) ? "/home" : "/login"} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - login & signup (only accessible when not authenticated) */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes - require authentication */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      
      {/* Root path redirects to /home */}
      <Route 
        path="/" 
        element={<Navigate to="/home" replace />}
      />
      
      <Route 
        path="/signlanguage" 
        element={
          <ProtectedRoute>
            <SignLanguage />
          </ProtectedRoute>
        } 
      />
      {/* backward compatible hyphenated path */}
      <Route 
        path="/sign-language" 
        element={
          <ProtectedRoute>
            <SignLanguage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscription" 
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/funactivities" 
        element={
          <ProtectedRoute>
            <FunActivities />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/brightwords" 
        element={
          <ProtectedRoute>
            <BrightWords />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superpower" 
        element={
          <ProtectedRoute>
            <SuperPower />
          </ProtectedRoute>
        } 
      />
      
      {/* Public routes - accessible without authentication */}
      <Route path="/feedback" element={<Feedback />} />
      
      {/* Catch-all route - check auth and redirect appropriately */}
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppRoutes />
      </AccessibilityProvider>
    </AuthProvider>
  )
}

export default App
