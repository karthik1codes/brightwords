import { useEffect, useRef } from 'react'

/**
 * Hook to handle skip navigation link functionality
 * @param {string} targetId - ID of the target element to skip to
 */
export const useSkipLink = (targetId = 'mainContent') => {
  const skipLinkRef = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => {
    targetRef.current = document.getElementById(targetId)

    const handleClick = (event) => {
      event.preventDefault()
      const target = targetRef.current || document.getElementById(targetId)

      if (target) {
        target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })

        // Remove tabindex after focus to restore normal tab order
        setTimeout(() => {
          target.removeAttribute('tabindex')
        }, 1000)
      }
    }

    const skipLink = skipLinkRef.current
    if (skipLink) {
      skipLink.addEventListener('click', handleClick)
    }

    return () => {
      if (skipLink) {
        skipLink.removeEventListener('click', handleClick)
      }
    }
  }, [targetId])

  return skipLinkRef
}


