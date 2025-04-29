/**
 * Security utility functions for authentication and OTP verification
 */

/**
 * Generates a simple device fingerprint based on available browser information
 * This creates a relatively unique identifier for the current device/browser
 * @returns {string} A fingerprint hash for the current device
 */
export const generateDeviceFingerprint = () => {
  // Collect available device information
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const pixelRatio = window.devicePixelRatio || 1;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  
  // Combine all information into a single string
  const rawFingerprint = [
    userAgent,
    language,
    screenWidth,
    screenHeight,
    colorDepth,
    pixelRatio,
    timezone,
  ].join('|');
  
  // Create a simple hash of the string
  return hashString(rawFingerprint);
};

/**
 * Simple string hashing function to create a numeric hash
 * @param {string} str String to hash
 * @returns {string} Hashed string
 */
const hashString = (str) => {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and take the last 16 chars
  const hashHex = (hash >>> 0).toString(16);
  return hashHex.padStart(8, '0');
};

/**
 * Formats remaining time for OTP expiration
 * @param {number} expiresInSeconds Seconds until expiration
 * @returns {string} Formatted time string (e.g., "2:30")
 */
export const formatExpirationTime = (expiresInSeconds) => {
  if (expiresInSeconds <= 0) return "0:00";
  
  const minutes = Math.floor(expiresInSeconds / 60);
  const seconds = Math.floor(expiresInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Checks if there are signs of rate limiting based on recent failed attempts
 * @param {Array} attempts Array of timestamp objects for recent attempts
 * @param {number} threshold Number of attempts that trigger rate limiting
 * @param {number} timeWindowSeconds Time window in seconds to consider for rate limiting
 * @returns {boolean} True if rate limiting should be applied
 */
export const shouldApplyRateLimit = (attempts, threshold = 5, timeWindowSeconds = 300) => {
  if (!attempts || attempts.length === 0) return false;
  
  const now = Date.now();
  const recentAttempts = attempts.filter(
    timestamp => (now - timestamp) < timeWindowSeconds * 1000
  );
  
  return recentAttempts.length >= threshold;
};

/**
 * Gets appropriate feedback for OTP verification attempts
 * @param {number} attemptsRemaining Number of attempts remaining
 * @param {number} maxAttempts Maximum allowed attempts
 * @returns {Object} Feedback object with type and message
 */
export const getOtpFeedback = (attemptsRemaining, maxAttempts = 5) => {
  if (attemptsRemaining === maxAttempts) {
    return { type: 'info', message: null };
  }
  
  if (attemptsRemaining <= 0) {
    return {
      type: 'error',
      message: 'Maximum attempts reached. Please request a new code.'
    };
  }
  
  if (attemptsRemaining === 1) {
    return {
      type: 'warning',
      message: 'Last attempt! Please verify your code carefully.'
    };
  }
  
  return {
    type: 'warning',
    message: `${attemptsRemaining} attempts remaining.`
  };
};