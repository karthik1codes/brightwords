import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../utils/voice'
import { playClick, playSuccess } from '../utils/sound'

function Feedback() {
  const navigate = useNavigate()

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the Feedback page.')
  }, [])

  // Feedback page is accessible to everyone - no authentication required
  // since feedback forms are public Google Forms
  console.log('Feedback component rendered - page should be visible')

  // Feedback Form URLs
  const feedbackForms = {
    'overall': 'https://forms.gle/gaCtLrhYftNxYFyN6',
    'activities': 'https://forms.gle/XbvrZtWcgpU6i6gG6',
    'accessibility': 'https://forms.gle/Q6AqrMv4G7ZtVJSNA',
    'ux': 'https://forms.gle/7NiAmqrt8AUibwfq6',
    'features': 'https://forms.gle/BpYkPWwx3jiUTxtV6'
  }

  const openFeedbackForm = (formType) => {
    const formUrl = feedbackForms[formType]
    const formNames = {
      'overall': 'Overall Website Feedback',
      'activities': 'Learning Activities Feedback',
      'accessibility': 'Accessibility Features Feedback',
      'ux': 'User Experience Feedback',
      'features': 'Feature Suggestions'
    }
    
    if (formUrl) {
      playClick()
      playSuccess()
      speak(`Clicking ${formNames[formType] || 'feedback form'}. Opening feedback form in a new tab.`)
      window.open(formUrl, '_blank', 'noopener,noreferrer')
    } else {
      playClick()
      speak('Feedback form not available. Please try again later.')
      alert('Feedback form not available. Please try again later.')
    }
  }

  // Always render the feedback page - it's public

  const feedbackCards = [
    {
      icon: '🌐',
      title: 'Overall Website Feedback',
      description: 'Tell us what you think about the overall website design. Rate our webpage on various metrics like satisfaction, appearance, usability, and accessibility features.',
      formType: 'overall'
    },
    {
      icon: '🎮',
      title: 'Learning Activities Feedback',
      description: 'Share your experience with our learning activities (Phonics Fun, Spelling Wizard, Story Explorer, Memory Master). Help us improve the educational content and gameplay.',
      formType: 'activities'
    },
    {
      icon: '♿',
      title: 'Accessibility Features Feedback',
      description: 'Help us improve our accessibility features. Tell us how well the support profiles (Blind/Low Vision, Deaf/Hard of Hearing, Games) work for you and what we can improve.',
      formType: 'accessibility'
    },
    {
      icon: '✨',
      title: 'User Experience Feedback',
      description: 'Share your thoughts on the user experience, navigation, ease of use, and overall satisfaction with BrightWords. Your input helps us create a better learning platform.',
      formType: 'ux'
    },
    {
      icon: '💡',
      title: 'Feature Suggestions',
      description: 'Have ideas for new features or improvements? Let us know what features you\'d like to see added to BrightWords to make learning even better!',
      formType: 'features'
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(237, 233, 254, 0.3))',
      fontFamily: "'Nunito', sans-serif",
      overflowX: 'hidden'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '15px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer' 
          }} 
          onClick={() => {
            playClick()
            speak('Clicking BrightWords logo. Navigating to home page.')
            // Navigate directly to home - no authentication check needed
            navigate('/home')
          }}
          onFocus={() => speak('BrightWords logo')}
          role="button"
          tabIndex={0}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0
          }}>✨</div>
          <span style={{ 
            fontFamily: "'Fredoka', cursive", 
            fontSize: 'clamp(18px, 4vw, 24px)', 
            fontWeight: 700, 
            color: '#8B5CF6' 
          }}>BrightWords</span>
        </div>
        <button
          onClick={() => {
            playClick()
            speak('Clicking Back to Home. Navigating to home page.')
            // Navigate directly to home - no authentication check needed
            navigate('/home')
          }}
          onFocus={() => speak('Back to Home button')}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 'clamp(14px, 3vw, 16px)',
            whiteSpace: 'nowrap',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ← Back to Home
        </button>
      </nav>

      {/* Feedback Section */}
      <section style={{
        padding: '40px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px' 
        }}>
          <h2 style={{
            fontFamily: "'Fredoka', cursive",
            fontSize: 'clamp(28px, 6vw, 36px)',
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: '10px'
          }}>Give Your Feedback!</h2>
          <p style={{
            color: '#6B7280',
            fontSize: 'clamp(16px, 3vw, 18px)',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Help us improve BrightWords by providing your valuable feedback. Your feedback will be used to improve the UI/UX of the website so that we can provide the best possible service to you!
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '40px',
          width: '100%',
          padding: '0 10px'
        }}>
          {feedbackCards.map((card, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '20px',
                border: '2px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '300px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)'
                e.currentTarget.style.borderColor = '#8B5CF6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                color: 'white',
                padding: '20px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: 'clamp(28px, 5vw, 32px)', display: 'block' }}>
                  {card.icon}
                </span>
                <h3 style={{
                  fontFamily: "'Fredoka', cursive",
                  fontSize: 'clamp(18px, 4vw, 20px)',
                  fontWeight: 600,
                  margin: 0,
                  color: 'white'
                }}>{card.title}</h3>
              </div>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexGrow: 1,
                gap: '20px'
              }}>
                <p style={{
                  color: '#4B5563',
                  fontSize: 'clamp(14px, 3vw, 15px)',
                  lineHeight: 1.6,
                  margin: 0,
                  flexGrow: 1
                }}>
                  {card.description}
                </p>
                <button
                  onClick={() => openFeedbackForm(card.formType)}
                  onFocus={() => speak(`Open ${card.title} feedback form button`)}
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    fontSize: 'clamp(14px, 3vw, 16px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'
                  }}
                  aria-label={`Open ${card.title.toLowerCase()} form`}
                >
                  📝 Open Feedback Form
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Feedback
