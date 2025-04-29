import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button Component
 * 
 * An elegant button component with various styling variants and animations
 * 
 * @param {Object} props
 * @param {string} props.variant - Button style variant: 'primary', 'secondary', 'danger', 'outline', 'white', 'success', 'glass'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {string} props.type - Button type: 'button', 'submit', 'reset'
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.fullWidth - Whether the button should take up the full width of its container
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {function} props.onClick - Function to call when the button is clicked
 * @param {ReactNode} props.children - Content inside the button
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.leftIcon - Icon to display on the left side of the button
 * @param {ReactNode} props.rightIcon - Icon to display on the right side of the button
 */

const Button = ({ 
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  isLoading = false,
  onClick,
  children,
  className = '',
  leftIcon = null,
  rightIcon = null,
  ...rest
}) => {
  // Base button classes
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm transform hover:scale-[1.02] active:scale-[0.98]";
  
  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  // Variant classes
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white focus:ring-primary-500 shadow-primary-500/20",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-300 border border-gray-200 shadow-gray-200/30",
    danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white focus:ring-red-500 shadow-red-500/20",
    outline: "bg-transparent border border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
    white: "bg-white hover:bg-gray-50 text-primary-600 focus:ring-primary-400 border border-gray-100",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white focus:ring-green-500 shadow-green-500/20",
    glass: "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 focus:ring-white/50"
  };
  
  // Loading state
  const loadingClasses = isLoading ? "relative !text-transparent cursor-wait" : "";
  
  // Disabled state 
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed hover:scale-100 hover:from-primary-600 hover:to-primary-500' : '';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses} 
    ${sizeClasses[size]}
    ${variantClasses[variant]} 
    ${loadingClasses}
    ${disabledClasses}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={disabled || isLoading ? undefined : onClick}
      {...rest}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      {leftIcon && <span className={`mr-2 ${isLoading ? 'opacity-0' : ''}`}>{leftIcon}</span>}
      <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      {rightIcon && <span className={`ml-2 ${isLoading ? 'opacity-0' : ''}`}>{rightIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'outline', 'white', 'success', 'glass']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
};

export default Button;