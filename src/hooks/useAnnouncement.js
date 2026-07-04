import { useEffect, useRef } from 'react'

/**
 * Hook to create an accessible announcement for screen readers
 * Returns a function to announce messages
 */
export const useAnnouncement = () => {
  const announcementRef = useRef(null)

  useEffect(() => {
    // Create or get announcement element
    let announcementEl = document.getElementById('accessibilityAnnouncement')

    if (!announcementEl) {
      announcementEl = document.createElement('div')
      announcementEl.id = 'accessibilityAnnouncement'
      announcementEl.className = 'sr-only'
      announcementEl.setAttribute('role', 'status')
      announcementEl.setAttribute('aria-live', 'polite')
      announcementEl.setAttribute('aria-atomic', 'true')
      document.body.appendChild(announcementEl)
    }

    announcementRef.current = announcementEl

    return () => {
      // Don't remove the element on cleanup as it's shared
    }
  }, [])

  const announce = (message) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message
      // Clear after a delay to allow re-announcement of the same message
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, 1000)
    }
  }

  return announce
}


