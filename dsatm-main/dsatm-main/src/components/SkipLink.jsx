import React from 'react'
import { useSkipLink } from '../hooks/useSkipLink'
import '../styles/SkipLink.css'

const SkipLink = ({ targetId = 'mainContent', children = 'Skip to main content' }) => {
  const skipLinkRef = useSkipLink(targetId)

  return (
    <a
      href={`#${targetId}`}
      ref={skipLinkRef}
      className="skip-link"
      id="skipLink"
      aria-describedby="keyboardHint"
    >
      {children}
    </a>
  )
}

export default SkipLink


