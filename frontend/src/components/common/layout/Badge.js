import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge component for status indicators and labels
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = false,
  className = '',
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  // Size classes
  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-2.5 py-0.5',
    large: 'text-base px-3 py-1',
  };

  // Rounded classes
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`
        inline-flex items-center font-medium ${variantClasses[variant] || variantClasses.default}
        ${sizeClasses[size] || sizeClasses.medium}
        ${roundedClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  rounded: PropTypes.bool,
  className: PropTypes.string,
};

export default Badge;
