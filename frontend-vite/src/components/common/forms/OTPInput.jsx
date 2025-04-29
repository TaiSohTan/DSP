import React, { useRef, useEffect } from 'react';

/**
 * A specialized input component for OTP (One-Time Password) entry
 * Features:
 * - Auto-focus on first empty field
 * - Auto-advance to next field after entry
 * - Keyboard navigation (arrow keys)
 * - Backspace handling
 * - Paste support for entire OTP
 * 
 * @param {Object} props Component props
 * @param {Array} props.otpDigits Array of OTP digit values
 * @param {Function} props.setOtpDigits Setter function for OTP digits
 * @param {number} props.length Number of OTP digits (default: 6)
 * @param {boolean} props.disabled Whether the input is disabled
 */

const OTPInput = ({ 
  otpDigits = [], 
  setOtpDigits, 
  length = 6,
  disabled = false
}) => {
  // Create refs for each OTP input field for auto-focus
  const otpRefs = useRef([]);

  // Initialize refs on component mount
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, length);
    
    // Auto-focus the first input on page load or first empty field
    if (!disabled) {
      const firstEmptyIndex = otpDigits.findIndex(d => !d);
      const indexToFocus = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
      
      if (otpRefs.current[indexToFocus]) {
        setTimeout(() => otpRefs.current[indexToFocus].focus(), 100);
      }
    }
  }, [length, disabled, otpDigits]);

  // Handle input change for each digit
  const handleDigitChange = (index, value) => {
    // Only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    // Update the digit at the specified index
    if (cleanValue.length <= 1) {
      const newOtpDigits = [...otpDigits];
      newOtpDigits[index] = cleanValue;
      setOtpDigits(newOtpDigits);
      
      // If user entered a digit and it's not the last input, focus the next one
      if (cleanValue && index < length - 1) {
        otpRefs.current[index + 1].focus();
      }
    } else if (cleanValue.length > 1) {
      // Handle paste event with multiple digits
      const pastedDigits = cleanValue.split('').slice(0, length);
      const newOtpDigits = [...otpDigits];
      
      pastedDigits.forEach((digit, i) => {
        if (index + i < length) {
          newOtpDigits[index + i] = digit;
        }
      });
      
      setOtpDigits(newOtpDigits);
      
      // Focus the appropriate field after paste
      const nextEmptyIndex = newOtpDigits.findIndex(d => !d);
      if (nextEmptyIndex !== -1 && nextEmptyIndex < length) {
        otpRefs.current[nextEmptyIndex].focus();
      } else {
        // All fields filled, focus the last one
        otpRefs.current[length - 1].focus();
      }
    }
  };
  
  // Handle key press (backspace, arrow keys)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        // If current field has a value, clear it
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = '';
        setOtpDigits(newOtpDigits);
      } else if (index > 0) {
        // If current field is empty and user pressed backspace, focus previous field
        otpRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move focus to previous field on left arrow
      otpRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      // Move focus to next field on right arrow
      otpRefs.current[index + 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 md:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => otpRefs.current[index] = el}
          id={`otp-input-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="1"
          value={otpDigits[index] || ''}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Digit ${index + 1} of verification code`}
          className={`
            w-10 h-12 md:w-12 md:h-14 
            text-center text-xl md:text-2xl font-bold 
            border-2 rounded-lg 
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-400
            transition-all duration-150 ease-in-out
            ${!otpDigits[index] ? 'animate-pulse' : ''}
          `}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default OTPInput;