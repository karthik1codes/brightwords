import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../utils/apiBase'
import '../styles/Home.css'

const ProgressSummary = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [stats, setStats] = useState({
    totalPoints: 0,
    lessonsComplete: 0,
    achievements: 0,
    timeSpent: 0,
    streak: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.email) return
      try {
        const res = await fetch(
          apiUrl(`/api/stats/${encodeURIComponent(
            currentUser.email
          )}?name=${encodeURIComponent(currentUser.name || currentUser.given_name || '')}`)
        )
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats({
          totalPoints: data.total_points || 0,
          lessonsComplete: data.lessons_complete || 0,
          achievements: data.achievements || 0,
          timeSpent: data.time_spent || 0,
          streak: data.streak || 0,
        })
      } catch (error) {
        console.warn('Error fetching stats for summary:', error)
      }
    }
    fetchStats()
  }, [currentUser])

  const { totalPoints, lessonsComplete, achievements, timeSpent, streak } = stats

  // Composite score 0–100 from activities (points, lessons, achievements, time, streak)
  const growthScore = Math.min(
    100,
    Math.round(
      (totalPoints / 10 + lessonsComplete * 5 + achievements * 8 + timeSpent / 2 + streak * 3) / 2
    )
  )
  const skillScore = Math.min(100, Math.round((lessonsComplete * 12 + achievements * 15) / 2))
  const emotionalScore = Math.min(100, Math.round((achievements * 12 + streak * 10) / 2))
  const engagementScore = Math.min(100, Math.round((timeSpent * 2 + totalPoints / 5) / 2))
  const consistencyScore = Math.min(100, Math.round(streak * 15 + lessonsComplete * 3))
  const readinessScore = Math.min(
    100,
    Math.round((growthScore + skillScore + consistencyScore) / 3)
  )
  const overallScore = Math.min(
    100,
    Math.round(
      (totalPoints / 8 + lessonsComplete * 4 + achievements * 6 + timeSpent / 3 + streak * 5) / 2
    )
  )

  const cards = [
    {
      title: 'Improvement & Growth Overview',
      score: growthScore,
      sub: [
        { label: 'Lessons', value: lessonsComplete },
        { label: 'Points', value: totalPoints },
        { label: 'Milestones', value: achievements },
      ],
    },
    {
      title: 'Skill-Specific Development Tracking',
      score: skillScore,
      sub: [
        { label: 'Activities completed', value: lessonsComplete },
        { label: 'Achievements', value: achievements },
      ],
    },
    {
      title: 'Emotional & Behavioral Progress',
      score: emotionalScore,
      sub: [
        { label: 'Achievement unlocks', value: achievements },
        { label: 'Day streak', value: streak },
      ],
    },
    {
      title: 'Personalized Learning Style Insights',
      score: engagementScore,
      sub: [
        { label: 'Time on task (min)', value: timeSpent },
        { label: 'Points earned', value: totalPoints },
      ],
    },
    {
      title: 'Consistency & Routine Monitoring',
      score: consistencyScore,
      sub: [
        { label: 'Current streak (days)', value: streak },
        { label: 'Lessons completed', value: lessonsComplete },
      ],
    },
    {
      title: 'Predictive Growth & Support Recommendations',
      score: readinessScore,
      sub: [
        { label: 'Growth score', value: growthScore },
        { label: 'Consistency score', value: consistencyScore },
      ],
    },
    {
      title: 'Shareable Professional Progress Report',
      score: overallScore,
      sub: [
        { label: 'Total points', value: totalPoints },
        { label: 'Time (min)', value: timeSpent },
        { label: 'Achievements', value: achievements },
      ],
    },
  ]

  return (
    <div className="home-page">
      <div className="main-container">
        <main id="mainContent" role="main" tabIndex={-1}>
          <section
            className="accessibility-section"
            aria-label="Parent mode progress overview"
            style={{ marginTop: 32, paddingBottom: 48 }}
          >
            <div className="section-header" style={{ marginBottom: 32 }}>
              <h2 className="section-title">Parent Mode</h2>
              <p className="section-subtitle">
                See how far your child has come—every step, every try, every win. Celebrating their journey with you.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
                maxWidth: 1200,
                margin: '0 auto 32px',
              }}
            >
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="support-widget"
                  style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    minHeight: 160,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#4c1d95',
                      lineHeight: 1.3,
                    }}
                  >
                    {card.title}
                  </h3>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: '#6d28d9',
                      lineHeight: 1,
                    }}
                  >
                    {card.score}
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#7c3aed', marginLeft: 4 }}>
                      / 100
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px 16px',
                      fontSize: 13,
                      color: '#6b7280',
                    }}
                  >
                    {card.sub.map((item, i) => (
                      <span key={i}>
                        <strong style={{ color: '#374151' }}>{item.label}:</strong> {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn-primary"
                onClick={() => navigate('/home', { replace: true })}
              >
                Continue to Home
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/feedback', { state: { from: 'parent-mode' } })}
                aria-label="Share your feedback"
              >
                Share your thoughts — Feedback
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default ProgressSummary
