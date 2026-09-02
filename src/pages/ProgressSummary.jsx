import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../utils/apiBase'
import '../styles/Home.css'

const EMPTY_PROGRESS = { activity_events: 0, completed_activities: 0, practice_minutes: 0, active_days: [], activity_breakdown: {} }

const ProgressSummary = () => {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [status, setStatus] = useState('Loading activity summary…')

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(apiUrl('/api/progress'), { credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load activity summary.')
        setProgress({ ...EMPTY_PROGRESS, ...data.progress })
        setStatus('')
      } catch (error) {
        setStatus(error.message || 'Unable to load activity summary.')
      }
    }
    loadProgress()
  }, [])

  const activityRows = Object.entries(progress.activity_breakdown)
    .sort(([, a], [, b]) => (b.completed + b.opened) - (a.completed + a.opened))
    .slice(0, 5)
  const cards = [
    { label: 'Learning activities explored', value: progress.activity_events, detail: 'Recorded activity opens and learning actions.' },
    { label: 'Activities completed', value: progress.completed_activities, detail: 'Only activities that report a completed outcome.' },
    { label: 'Active learning days', value: progress.active_days.length, detail: 'Days with at least one recorded learning action.' },
    { label: 'Activity types tried', value: Object.keys(progress.activity_breakdown).length, detail: 'Different BrightWords activities the learner has opened.' },
  ]

  return <div className="home-page"><div className="main-container"><main id="mainContent" role="main" tabIndex={-1}>
    <section className="accessibility-section" aria-label="Parent activity summary" style={{ marginTop: 32, paddingBottom: 48 }}>
      <div className="section-header" style={{ marginBottom: 32 }}>
        <h2 className="section-title">Parent Activity Summary</h2>
        <p className="section-subtitle">A simple record of your child’s activity in BrightWords. This is not a clinical, emotional, or predictive assessment.</p>
      </div>
      {status && <p className="activity-status" role="status">{status}</p>}
      {!status && <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24, maxWidth: 1200, margin: '0 auto 32px' }}>
          {cards.map((card) => <section key={card.label} className="support-widget" style={{ padding: 24, minHeight: 155 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#4c1d95', lineHeight: 1.3 }}>{card.label}</h3>
            <p style={{ margin: '14px 0 10px', fontSize: 34, fontWeight: 800, color: '#6d28d9' }}>{card.value}</p>
            <p style={{ margin: 0, color: '#4b5563', fontSize: 13, lineHeight: 1.45 }}>{card.detail}</p>
          </section>)}
        </div>
        <section className="support-widget" style={{ padding: 24, maxWidth: 1200, margin: '0 auto 32px' }} aria-labelledby="activityBreakdownTitle">
          <h3 id="activityBreakdownTitle" style={{ marginTop: 0, color: '#4c1d95' }}>Activity breakdown</h3>
          {activityRows.length ? <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', lineHeight: 1.8 }}>
            {activityRows.map(([activity, totals]) => <li key={activity}><strong>{activity}</strong>: opened {totals.opened} time{totals.opened === 1 ? '' : 's'}, completed {totals.completed} time{totals.completed === 1 ? '' : 's'}.</li>)}
          </ul> : <p style={{ margin: 0, color: '#4b5563' }}>Activity details will appear after the learner starts an activity.</p>}
        </section>
      </>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => navigate('/home', { replace: true })}>Continue to Home</button>
        <button className="btn-secondary" onClick={() => navigate('/feedback', { state: { from: 'parent-mode' } })}>Share feedback</button>
      </div>
    </section>
  </main></div></div>
}

export default ProgressSummary
