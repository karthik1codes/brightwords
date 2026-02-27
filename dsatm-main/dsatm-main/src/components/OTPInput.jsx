import React, { useRef, useEffect, useState } from 'react'
import { speak } from '../utils/voice'
import { playClick } from '../utils/sound'
import '../styles/OTPInput.css'

const OTPInput = ({ value, onChange, onComplete, disabled = false, length = 6 }) => {
  const inputRefs = useRef([])
  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [disabled])

  const handleChange = (index, e) => {
    const input = e.target.value.replace(/\D/g, '') // Only digits
    
    if (input.length > 1) {
      // Handle paste
      const pastedValue = input.slice(0, length)
      const newValue = pastedValue.split('')
      onChange(newValue.join(''))
      
      // Focus the last filled input or the last input
      const lastIndex = Math.min(pastedValue.length - 1, length - 1)
      if (inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex].focus()
        setFocusedIndex(lastIndex)
      }
      return
    }

    const newValue = value.split('')
    newValue[index] = input
    const updatedValue = newValue.join('')
    onChange(updatedValue)

    // Move to next input if digit entered
    if (input && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }

    // Check if OTP is complete
    if (updatedValue.length === length) {
      onComplete?.(updatedValue)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pastedData.length > 0) {
      onChange(pastedData)
      const lastIndex = Math.min(pastedData.length - 1, length - 1)
      inputRefs.current[lastIndex]?.focus()
      setFocusedIndex(lastIndex)
      if (pastedData.length === length) {
        onComplete?.(pastedData)
      }
    }
  }

  const handleFocus = (index) => {
    setFocusedIndex(index)
    speak(`OTP digit ${index + 1}`)
  }

  return (
    <div className="otp-input-container" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`otp-input-box ${focusedIndex === index ? 'focused' : ''}`}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

export default OTPInput

