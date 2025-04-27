import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card Component
 * 
 * A container component with standardized styling for content sections
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Content inside the card
 * @param {string} props.title - Optional card title
 * @param {string} props.subtitle - Optional card subtitle
 * @param {ReactNode} props.footer - Optional footer content
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="p-4 md:p-6 border-b border-gray-200">
          {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      
      <div className={`p-4 md:p-6 ${!title && !subtitle ? '' : ''}`}>
        {children}
      </div>
      
      {footer && (
        <div className="p-4 md:p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  footer: PropTypes.node,
  className: PropTypes.string,
};

export default Card;