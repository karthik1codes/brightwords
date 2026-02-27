import React, { useEffect, useRef } from 'react'
import { speak } from '../utils/voice'

function SuperPower() {
  const iframeRef = useRef(null)

  // Page load announcement
  useEffect(() => {
    speak('Welcome to the SuperPower page.')
  }, [])

  useEffect(() => {
    // Load the SuperPower landing page (pick hear/speak/see) so features are accessible without AWS Cognito
    if (iframeRef.current) {
      iframeRef.current.src = '/aws-augmentability-main/index-landing.html'
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', border: 'none', padding: 0, margin: 0, overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="SuperPower - AWS AugmentAbility"
        allow="camera; microphone"
      />
    </div>
  )
}

export default SuperPower
