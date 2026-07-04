import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import ChatWidget from './components/ChatWidget'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import ModeSelect from './pages/ModeSelect'
import ProgressSummary from './pages/ProgressSummary'
import FunActivities from './pages/FunActivities'
import Games from './pages/Games'
import BrightWords from './pages/BrightWords'
import Feedback from './pages/Feedback'
import SignLanguage from './pages/SignLanguage'

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
      <Route 
        path="/progress-summary" 
        element={
          <ProtectedRoute>
            <ProgressSummary />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/mode-select" 
        element={
          <ProtectedRoute>
            <ModeSelect />
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
        path="/funactivities" 
        element={
          <ProtectedRoute>
            <FunActivities />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/games/:gameId" 
        element={
          <ProtectedRoute>
            <Games />
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
        {/* BrightWords AI assistant (Jotform) – floating chat on all pages: login, home, sign language, feedback, etc. */}
        <ChatWidget />
      </AccessibilityProvider>
    </AuthProvider>
  )
}

export default App
