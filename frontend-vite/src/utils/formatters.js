/**
 * Format a date string into a more readable format
 * @param {string} dateString - The date string to format
 * @param {object} options - Optional formatting options
 * @returns {string} - The formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Default date formatting options
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: options.includeTime ? '2-digit' : undefined,
    minute: options.includeTime ? '2-digit' : undefined,
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if formatting fails
  }
};

/**
 * Format a number with commas as thousands separators
 * @param {number} number - The number to format
 * @returns {string} - The formatted number string
 */
export const formatNumber = (number) => {
  if (number === undefined || number === null) return '';
  
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};