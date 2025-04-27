import React from 'react';
import PropTypes from 'prop-types';

/**
 * Alert Component
 * 
 * Displays feedback messages to users
 * 
 * @param {Object} props
 * @param {string} props.type - Type of alert: 'info', 'success', 'warning', or 'error'
 * @param {string} props.title - Optional title for the alert
 * @param {string} props.message - Content of the alert
 * @param {boolean} props.dismissible - Whether the alert can be dismissed
 * @param {function} props.onDismiss - Function to call when dismiss button is clicked
 * @param {string} props.className - Additional CSS classes
 */
const Alert = ({ 
  type = 'info', 
  title, 
    message, 
  dismissible = false, 
  onDismiss, 
  className = '' 
}) => {
  // Alert styling based on type
  const alertStyles = {
    info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800',
    success: 'bg-green-50 border-l-4 border-green-500 text-green-800',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800',
    error: 'bg-red-50 border-l-4 border-red-500 text-red-800'
  };

  return (
    <div className={`p-4 rounded-md relative ${alertStyles[type]} ${className}`} role="alert">
      {title && <div className="font-medium text-sm mb-1">{title}</div>}
      <div className="text-sm">{message}</div>
      
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-lg hover:bg-gray-200 rounded-full h-6 w-6 flex items-center justify-center focus:outline-none opacity-70 hover:opacity-100"
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export default Alert;