import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { speak } from '../utils/voice'
import { playClick, playSuccess, playError } from '../utils/sound'
import OTPInput from '../components/OTPInput'
import '../styles/Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { currentUser, isLoading, initializeGoogleAuth, login, loginWithMobile, sendOTP } = useAuth()
  const [buttonContainerReady, setButtonContainerReady] = useState(false)
  
  // Mobile login state
  const [showMobileLogin, setShowMobileLogin] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // PublicRoute component handles redirecting authenticated users
  // No need for manual navigation here - PublicRoute will handle it

  useEffect(() => {
    // Wait for Google script to load
    const checkGoogleScript = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogleScript)
        initializeGoogleAuth()
        setButtonContainerReady(true)
      }
    }, 150)

    // Load Google script if not present
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.accounts?.id) {
          initializeGoogleAuth()
          setButtonContainerReady(true)
        }
      }
      document.head.appendChild(script)
    }

    return () => clearInterval(checkGoogleScript)
  }, [initializeGoogleAuth])

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Login page.')
  }, [])

  // Resend OTP timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Handle send OTP (Backend)
  const handleSendOTP = async () => {
    const trimmedPhone = phoneNumber.trim()
    
    // Basic validation
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits)')
      setSuccessMessage('')
      speak('Please enter a valid phone number')
      return
    }

    setIsSendingOTP(true)
    setError('')
    setSuccessMessage('')
    
    try {
      playClick()
      
      const response = await sendOTP(trimmedPhone)
      
      if (response?.success) {
        setOtpSent(true)
        setResendTimer(30) // 30 second cooldown
        const message = response.mode === 'console' || response.mode === 'console-fallback'
          ? 'OTP generated. Check backend console for the OTP code.'
          : 'OTP sent successfully. Please check your phone.'
        setSuccessMessage(message)
        speak(message)
        playSuccess()
      } else {
        setError(response?.error || response?.message || 'Failed to send OTP. Please try again.')
        speak(response?.error || 'Failed to send OTP')
        playError()
      }
    } catch (err) {
      console.error('[Login] Send OTP error:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
      speak(`Error: ${err.message || 'Failed to send OTP'}`)
      playError()
    } finally {
      setIsSendingOTP(false)
    }
  }

  // Handle verify OTP (Backend)
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      speak('Please enter the complete 6-digit OTP')
      return
    }

    setIsVerifyingOTP(true)
    setError('')
    
    try {
      playClick()
      await loginWithMobile(phoneNumber.trim(), otp, navigate)
      speak('Mobile verification successful. Welcome back!')
      playSuccess()
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
      speak(`Error: ${err.message || 'Invalid OTP'}`)
      playError()
      setOtp('')
    } finally {
      setIsVerifyingOTP(false)
    }
  }

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return
    await handleSendOTP()
  }

  // Handle back to main login
  const handleBackToMain = () => {
    playClick()
    setShowMobileLogin(false)
    setPhoneNumber('')
    setOtp('')
    setOtpSent(false)
    setError('')
    setSuccessMessage('')
    setResendTimer(0)
    speak('Returning to login options')
  }

  useEffect(() => {
    if (buttonContainerReady && window.google?.accounts?.id) {
      const buttonContainer = document.getElementById('googleBtn')
      if (buttonContainer && !buttonContainer.hasChildNodes()) {
        window.google.accounts.id.initialize({
          client_id: '369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com',
          callback: (response) => {
            try {
              // Validate response first
              if (!response) {
                console.error('No response from Google Sign-In')
                return
              }
              
              if (!response.credential) {
                console.error('No credential in response:', response)
                // Check if it's a cancellation
                if (response.error) {
                  console.log('Sign-in cancelled or error:', response.error)
                  speak('Sign in canceled.')
                  return
                }
                return
              }

              playClick()
              playSuccess()
              speak('Signing in with Google.')
              // Use login function from AuthContext and pass navigate function
              // AuthContext will handle navigation after setting user state
              login(response, navigate)
            } catch (error) {
              console.error('Error during sign-in:', error)
              speak('Error signing in. Please try again.')
              // Don't show error to user - let PublicRoute handle redirect
              // The error is logged for debugging
            }
          },
          cancel_on_tap_outside: true,
        })

        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'filled_blue',
          size: 'large',
          width: '100%',
          shape: 'pill',
        })

        // Add focus handler to Google button container
        if (buttonContainer) {
          buttonContainer.addEventListener('focus', () => {
            speak('Sign in with Google button')
          }, true)
        }

        if (!currentUser) {
          window.google.accounts.id.prompt()
        }
      }
    }
  }, [buttonContainerReady, currentUser, login, navigate])

  if (isLoading) {
    return (
      <div className="login-page" role="main">
        {/* Background Decorations */}
        <div className="login-bg-decoration" aria-hidden="true">
          <div className="login-cloud login-cloud1"></div>
          <div className="login-cloud login-cloud2"></div>
          <div className="login-shape login-shape-circle"></div>
          <div className="login-shape login-shape-triangle"></div>
        </div>
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-loading-spinner" aria-label="Loading"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page" role="main">
      {/* Background Decorations */}
      <div className="login-bg-decoration" aria-hidden="true">
        <div className="login-cloud login-cloud1"></div>
        <div className="login-cloud login-cloud2"></div>
        <div className="login-shape login-shape-circle"></div>
        <div className="login-shape login-shape-triangle"></div>
      </div>

      <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
        <div className="login-card">
          <div className="login-logo" aria-hidden="true">
            <span className="login-star">⭐</span>
          </div>
          <h1 id="loginTitle" className="login-title">
            Welcome to <span className="login-brand">BrightWords</span>
          </h1>
          {!showMobileLogin ? (
            <>
              <p className="login-subtitle">
                Sign in to unlock your personalized learning journey.
              </p>
              <div className="google-btn-wrapper">
                <div id="googleBtn" aria-live="polite" aria-label="Sign in with Google"></div>
              </div>
              
              <div className="login-divider">
                <span>or</span>
              </div>

              <button
                className="mobile-login-btn"
                onClick={() => {
                  playClick()
                  speak('Continue with Mobile Number button')
                  setShowMobileLogin(true)
                }}
                onFocus={() => speak('Continue with Mobile Number button')}
                aria-label="Continue with Mobile Number"
              >
                📱 Continue with Mobile Number
              </button>

              <p className="login-hint">
                Need a different account? Use the account switcher in the Google dialog.
              </p>
            </>
          ) : (
            <>
              <button
                className="back-to-main-btn"
                onClick={handleBackToMain}
                onFocus={() => speak('Back to login options button')}
                aria-label="Back to login options"
              >
                ← Back
              </button>

              {!otpSent ? (
                <>
                  <h2 className="mobile-login-title">Enter Your Mobile Number</h2>
                  <p className="mobile-login-subtitle">
                    We'll send you a 6-digit verification code
                  </p>
                  
                  <div className="phone-input-wrapper">
                    <input
                      type="tel"
                      className="phone-input"
                      placeholder="9876543210 or +919876543210"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Allow digits, +, spaces, and hyphens
                        let value = e.target.value.replace(/[^\d+\s-]/g, '')
                        // Limit to reasonable length
                        if (value.length <= 15) {
                          setPhoneNumber(value)
                          setError('')
                        }
                      }}
                      onFocus={() => speak('Phone number input. Enter your 10 digit mobile number or include country code.')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendOTP()
                        }
                      }}
                      disabled={isSendingOTP}
                      aria-label="Phone number"
                    />
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', textAlign: 'center' }}>
                      Enter 10 digits (e.g., 9876543210) or with country code (e.g., +919876543210)
                    </p>
                  </div>

                  {error && <div className="login-error">{error}</div>}
                  {successMessage && <div className="login-success">{successMessage}</div>}

                  <button
                    className="send-otp-btn"
                    onClick={handleSendOTP}
                    disabled={isSendingOTP || !phoneNumber || phoneNumber.length < 10}
                    onFocus={() => speak('Send OTP button')}
                    aria-label="Send OTP"
                  >
                    {isSendingOTP ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mobile-login-title">Enter Verification Code</h2>
                  <p className="mobile-login-subtitle">
                    We sent a 6-digit code to {phoneNumber}
                  </p>

                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleVerifyOTP}
                    disabled={isVerifyingOTP}
                    length={6}
                  />

                  {error && <div className="login-error">{error}</div>}
                  {successMessage && <div className="login-success">{successMessage}</div>}

                  <button
                    className="verify-otp-btn"
                    onClick={handleVerifyOTP}
                    disabled={isVerifyingOTP || otp.length !== 6}
                    onFocus={() => speak('Verify OTP button')}
                    aria-label="Verify OTP"
                  >
                    {isVerifyingOTP ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <div className="resend-otp-wrapper">
                    <button
                      className="resend-otp-btn"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0}
                      onFocus={() => speak(resendTimer > 0 ? `Resend OTP available in ${resendTimer} seconds` : 'Resend OTP button')}
                      aria-label={resendTimer > 0 ? `Resend OTP available in ${resendTimer} seconds` : 'Resend OTP'}
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
