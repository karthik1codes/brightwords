import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/**
 * Hook to trap focus within a container element
 * @param {boolean} isActive - Whether the focus trap should be active
 * @param {React.RefObject} containerRef - Ref to the container element
 */
export const useFocusTrap = (isActive, containerRef) => {
  const lastFocusRef = useRef(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current

    const getFocusable = (element) => {
      return Array.from(element.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(
          (node) =>
            !node.hasAttribute('disabled') &&
            node.tabIndex !== -1 &&
            node.offsetParent !== null
        )
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return

      const focusable = getFocusable(container)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    // Store the element that had focus before the trap was activated
    lastFocusRef.current = document.activeElement

    // Focus the first focusable element
    const focusable = getFocusable(container)
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 0)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that had focus before
      if (lastFocusRef.current && typeof lastFocusRef.current.focus === 'function') {
        lastFocusRef.current.focus()
      }
    }
  }, [isActive, containerRef])
}


