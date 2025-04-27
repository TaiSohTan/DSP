import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable text input component with validation support
 */
const TextInput = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  className = '',
  fullWidth = false,
  icon = null,
  labelClassName = '', // Add prop for custom label styling
  ...props
}) => {
  // Generate a unique ID if not provided
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-sm font-medium text-gray-800 mb-1 ${disabled ? 'opacity-70' : ''} ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            ${fullWidth ? 'w-full' : 'max-w-md'} 
            ${icon ? 'pl-10' : 'pl-4'} 
            pr-4 py-2.5 border rounded-lg shadow-sm 
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-primary-500 focus:border-primary-500
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
          `}
          {...props}
        />
        
        {type === 'password' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {/* Password visibility toggle could be added here */}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
};

TextInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  labelClassName: PropTypes.string, // Add prop type for labelClassName
};

export default TextInput;