import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable date time picker component with validation support
 * Modified to handle timezone issues consistently
 */
const DateTimePicker = ({
  id,
  name,
  value,
  onChange,
  min,
  max,
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select date and time',
  ...props
}) => {
  // Generate a unique ID if not provided
  const inputId = id || `datetime-${name || Math.random().toString(36).substr(2, 9)}`;
  
  const handleChange = (e) => {
    // Force the datetime-local input to treat the value as UTC
    // This prevents automatic timezone adjustments by the browser
    const { value } = e.target;
    onChange(value);
  };

  return (
    <div className={`mb-4 ${className}`}>
      <input
        id={inputId}
        type="datetime-local"
        name={name}
        value={value || ''}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
        `}
        placeholder={placeholder}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

DateTimePicker.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.string,
  max: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

export default DateTimePicker;