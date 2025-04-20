import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component for displaying structured content with consistent styling
 */
const Card = ({
  children,
  title,
  subtitle,
  footer,
  onClick,
  hover = false,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md overflow-hidden
        ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {/* Header (optional) */}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-xl font-semibold text-gray-800">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      
      {/* Content */}
      <div className="px-6 py-4">
        {children}
      </div>
      
      {/* Footer (optional) */}
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  footer: PropTypes.node,
  onClick: PropTypes.func,
  hover: PropTypes.bool,
  className: PropTypes.string,
};

export default Card;
