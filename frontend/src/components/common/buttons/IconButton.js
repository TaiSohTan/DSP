import React from 'react';
import PropTypes from 'prop-types';

/**
 * IconButton component for icon-based buttons with consistent styling
 */
const IconButton = ({
  icon,
  onClick,
  ariaLabel,
  size = 'medium',
  variant = 'default',
  disabled = false,
  className = '',
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3'
  };
  
  // Size for the icon itself
  const iconSizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };
  
  // Variant classes
  const variantClasses = {
    default: 'text-gray-700 hover:text-primary-700 hover:bg-primary-50',
    primary: 'text-primary-600 hover:text-primary-800 hover:bg-primary-50',
    danger: 'text-red-600 hover:text-red-800 hover:bg-red-50',
  };
  
  // Base classes
  const baseClasses = 'rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors';
  
  // Disabled state
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.medium}
    ${variantClasses[variant] || variantClasses.default}
    ${disabledClasses}
    ${className}
  `.trim();
  
  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Render the icon with appropriate sizing */}
      {React.cloneElement(icon, {
        className: `${iconSizeClasses[size] || iconSizeClasses.medium} ${icon.props.className || ''}`
      })}
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.element.isRequired,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'primary', 'danger']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default IconButton;
