import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable checkbox component with label and description support
 */
const Checkbox = ({
  id,
  name,
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  error = '',
  ...props
}) => {
  // Generate a unique ID if not provided
  const checkboxId = id || `checkbox-${name || Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`
            h-4 w-4 rounded 
            border-gray-300 text-primary-600 focus:ring-primary-500
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-red-500' : ''}
          `}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label 
          htmlFor={checkboxId} 
          className={`font-medium ${disabled ? 'text-gray-500' : 'text-gray-700'} ${error ? 'text-red-600' : ''}`}
        >
          {label}
        </label>
        {description && (
          <p className={`text-gray-500 ${disabled ? 'opacity-60' : ''}`}>{description}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

Checkbox.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.node,
  description: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.string,
};

export default Checkbox;