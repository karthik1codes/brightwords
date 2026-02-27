import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAnnouncement } from '../hooks/useAnnouncement'
import { speak } from '../utils/voice'
import { playClick, playSuccess } from '../utils/sound'
import '../styles/Subscription.css'

const RAZORPAY_KEY_ID = 'rzp_test_Rneu0aaeOPlIHD'
const API_BASE_URL = 'http://localhost:3000/api'

const Subscription = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const announce = useAnnouncement()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Plan configurations - keys must match backend plan keys
  const plans = {
    monthly: {
      name: 'Individual Monthly',
      amount: 9900, // ₹99 in paise
      currency: 'INR',
      duration: 'monthly',
      description: 'Monthly subscription to Sign Language Learning (Individual)',
      displayPrice: '₹99',
      displayPeriod: '/month',
      note: 'Billed monthly',
      features: [
        'Unlimited sign language conversions',
        'Access to all 3D avatar animations',
        'Learn sign language alphabets & words',
        'Create sign language videos',
        'Priority support',
      ],
    },
    yearly: {
      name: 'Individual Yearly',
      amount: 118800, // ₹1,188 in paise (₹99 × 12)
      currency: 'INR',
      duration: 'yearly',
      description: 'Yearly subscription to Sign Language Learning (Individual)',
      displayPrice: '₹1,188',
      displayPeriod: '/year',
      note: 'Billed annually',
      features: [
        'Everything in Monthly Plan',
        'Same as ₹99/month × 12 months',
        'Best value for long-term learning',
        'Early access to new features',
        '24/7 priority support',
      ],
    },
    team_monthly: {
      name: 'Team Monthly',
      amount: 150000, // ₹1,500 in paise
      currency: 'INR',
      duration: 'monthly',
      description: 'Monthly subscription to Sign Language Learning (Team)',
      displayPrice: '₹1,500',
      displayPeriod: '/month',
      note: 'Billed monthly',
      features: [
        'All Individual plan benefits',
        'Multi-seat team access',
        'Shared progress & reporting',
        'Priority onboarding & support',
      ],
    },
    team_yearly: {
      name: 'Team Yearly',
      amount: 1800000, // ₹18,000 in paise (₹1,500 × 12)
      currency: 'INR',
      duration: 'yearly',
      description: 'Yearly subscription to Sign Language Learning (Team)',
      displayPrice: '₹18,000',
      displayPeriod: '/year',
      note: 'Billed annually',
      features: [
        'Everything in Team Monthly',
        'Same as ₹1,500/month × 12 months',
        'Best value for teams',
        'Dedicated success manager',
        'Priority support (24/7)',
      ],
    },
  }

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Subscription page.')
  }, [])

  useEffect(() => {
    // Check if already subscribed
    const subscription = getSubscriptionStatus()
    if (subscription && subscription.status === 'active' && new Date(subscription.endDate) > new Date()) {
      navigate('/sign-language')
    }

    // Load Razorpay script if not already loaded
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        console.log('✅ Razorpay SDK already loaded')
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]')
      if (existingScript) {
        console.log('⚠️ Razorpay script already in DOM, waiting for load...')
        existingScript.addEventListener('load', () => {
          console.log('✅ Razorpay SDK loaded from existing script')
        })
        return
      }

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        console.log('✅ Razorpay SDK loaded successfully')
      }
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay SDK')
        setErrorMessage('Failed to load payment gateway. Please check your internet connection and refresh the page.')
      }
      document.body.appendChild(script)
    }

    loadRazorpayScript()
  }, [navigate])

  const getSubscriptionStatus = () => {
    try {
      const stored = localStorage.getItem('sign_language_subscription')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error getting subscription status:', error)
    }
    return null
  }

  const getUserInfo = () => {
    if (currentUser) {
      return {
        email: currentUser.email,
        name: currentUser.name || currentUser.given_name || '',
        given_name: currentUser.given_name,
        picture: currentUser.picture,
      }
    }
    return null
  }

  const selectPlan = (planType) => {
    setSelectedPlan(planType)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const initiatePayment = async (planType) => {
    console.log('🔄 Initiating payment for plan:', planType)
    
    const plan = plans[planType]
    if (!plan) {
      console.error('❌ Invalid plan selected:', planType)
      setErrorMessage('Invalid plan selected. Please try again.')
      return
    }

    console.log('✅ Plan found:', plan.name, 'Amount:', plan.amount)

    const user = getUserInfo()
    if (!user) {
      // ProtectedRoute will handle redirecting to login if not authenticated
      // This should not happen since Subscription is a protected route
      setErrorMessage('Please login first')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // Health check
      try {
        const healthCheck = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        })
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding properly')
        }
      } catch (healthError) {
        throw new Error(
          'Cannot connect to backend server. Please make sure the server is running on http://localhost:3000.'
        )
      }

      // Create order
      const orderPayload = {
        plan: planType,
        amount: plan.amount,
        currency: plan.currency,
        userEmail: user.email,
        userName: user.name || user.given_name || 'User',
      }
      
      console.log('📤 Creating order with payload:', {
        ...orderPayload,
        amount: plan.amount,
        plan: planType
      })

      const orderResponse = await fetch(`${API_BASE_URL}/subscription/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
        signal: AbortSignal.timeout(10000),
      })

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText || 'Server error' }
        }
        console.error('❌ Order creation failed:', errorData)
        const errorMsg = errorData.error || errorData.details || `Server error: ${orderResponse.status}`
        throw new Error(errorMsg)
      }

      const orderData = await orderResponse.json()
      console.log('✅ Order created successfully:', orderData)

      if (!orderData.orderId) {
        console.error('❌ No order ID in response:', orderData)
        throw new Error(orderData.error || 'Failed to create order: No order ID received')
      }

      // Wait for Razorpay SDK to be available
      let retryCount = 0
      const maxRetries = 10
      
      while (typeof window.Razorpay === 'undefined' && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 200))
        retryCount++
      }

      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please check your internet connection and refresh the page.')
      }

      console.log('✅ Razorpay SDK is ready, opening payment gateway...')

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: plan.amount,
        currency: plan.currency,
        name: 'BrightWords',
        description: plan.description,
        order_id: orderData.orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: '',
        },
        theme: { color: '#8B5CF6' },
        handler: (response) => handlePaymentSuccess(response, planType),
        modal: {
          ondismiss: () => {
            setLoading(false)
            setErrorMessage('Payment was cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (response) => {
        console.error('❌ Payment failed:', response)
        setLoading(false)
        setErrorMessage('Payment failed: ' + (response.error?.description || response.error?.reason || 'Unknown error'))
      })
      
      // Open Razorpay checkout
      console.log('🚀 Opening Razorpay checkout with order ID:', orderData.orderId)
      razorpay.open()
      console.log('✅ Razorpay checkout opened successfully')
    } catch (error) {
      console.error('Payment initiation error:', error)
      let errorMsg = ''
      if (error.message === 'Failed to fetch' || error.message.includes('network')) {
        errorMsg =
          'Backend Server Not Running! Please make sure the server is running on http://localhost:3000. Check the terminal/console where you started the backend server.'
      } else {
        errorMsg = 'Error: ' + error.message
      }
      setErrorMessage(errorMsg)
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (response, planType) => {
    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/subscription/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          plan: planType,
          userEmail: getUserInfo().email,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Payment verification failed')
      }

      saveSubscriptionStatus(planType, verifyData.subscription)
      setSuccessMessage('Payment successful! Your subscription is now active. Redirecting...')
      announce('Payment successful! Subscription activated.')
      setTimeout(() => navigate('/sign-language'), 2000)
    } catch (error) {
      console.error('Payment verification error:', error)
      setErrorMessage('Payment verification failed. Please contact support.')
      setLoading(false)
    }
  }

  const saveSubscriptionStatus = (planType, subscriptionData) => {
    const subscription = {
      plan: planType,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: calculateEndDate(planType),
      ...subscriptionData,
    }
    localStorage.setItem('sign_language_subscription', JSON.stringify(subscription))
  }

  const calculateEndDate = (planType) => {
    const endDate = new Date()
    if (planType === 'monthly' || planType === 'team_monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (planType === 'yearly' || planType === 'team_yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }
    return endDate.toISOString()
  }

  return (
    <div className="subscription-page" role="main">
      <div className="subscription-container">
        <div className="subscription-header">
          <h1>🤟 Unlock Sign Language Learning</h1>
          <p>Choose a plan to access premium sign language features</p>
        </div>

        {successMessage && (
          <div className="success-message" role="alert" aria-live="polite">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="error-message" role="alert" aria-live="assertive">
            {errorMessage.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < errorMessage.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="plan-section">
          <h2 className="plan-section-title">Individual Plans</h2>
          <div className="plans-grid" role="group" aria-label="Individual subscription plans">
            {['monthly', 'yearly'].map((planKey) => {
              const plan = plans[planKey]
              const isSelected = selectedPlan === planKey
              return (
                <div
                  key={planKey}
                  className={`plan-card ${planKey === 'yearly' ? 'popular' : ''} ${isSelected ? 'selected' : ''}`}
                  data-plan={planKey}
                  role="option"
                  aria-selected={isSelected}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">
                    {plan.displayPrice}<span>{plan.displayPeriod}</span>
                  </div>
                  <div className="plan-period">{plan.note}</div>
                  <ul className="plan-features" role="list" style={{ flexGrow: 1 }}>
                    {plan.features.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <button
                    className="subscribe-button"
                    onClick={() => {
                      playClick()
                      speak(`Clicking Subscribe to ${plan.name}. Initiating payment.`)
                      selectPlan(planKey)
                      initiatePayment(planKey)
                    }}
                    onFocus={() => speak(`Subscribe to ${plan.name} button`)}
                    disabled={loading}
                    aria-label={`Subscribe to ${plan.name}`}
                  >
                    {loading && isSelected ? (
                      <>
                        <span className="loading-spinner"></span> Processing...
                      </>
                    ) : (
                      plan.duration === 'monthly' ? 'Subscribe Monthly' : 'Subscribe Yearly'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="plan-section">
          <h2 className="plan-section-title">Team Plans</h2>
          <div className="plans-grid" role="group" aria-label="Team subscription plans">
            {['team_monthly', 'team_yearly'].map((planKey) => {
              const plan = plans[planKey]
              const isSelected = selectedPlan === planKey
              return (
                <div
                  key={planKey}
                  className={`plan-card ${planKey === 'team_yearly' ? 'popular' : ''} ${isSelected ? 'selected' : ''}`}
                  data-plan={planKey}
                  role="option"
                  aria-selected={isSelected}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">
                    {plan.displayPrice}<span>{plan.displayPeriod}</span>
                  </div>
                  <div className="plan-period">{plan.note}</div>
                  <ul className="plan-features" role="list" style={{ flexGrow: 1 }}>
                    {plan.features.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <button
                    className="subscribe-button"
                    onClick={() => {
                      playClick()
                      speak(`Clicking Subscribe to ${plan.name}. Initiating payment.`)
                      selectPlan(planKey)
                      initiatePayment(planKey)
                    }}
                    onFocus={() => speak(`Subscribe to ${plan.name} button`)}
                    disabled={loading}
                    aria-label={`Subscribe to ${plan.name}`}
                  >
                    {loading && isSelected ? (
                      <>
                        <span className="loading-spinner"></span> Processing...
                      </>
                    ) : (
                      plan.duration === 'monthly' ? 'Subscribe Monthly' : 'Subscribe Yearly'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="back-link">
          <Link 
            to="/home" 
            aria-label="Back to home page"
            onClick={() => {
              playClick()
              speak('Clicking Back to Home. Navigating to home page.')
            }}
            onFocus={() => speak('Back to Home link')}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Subscription


