const { ApiError } = require('../middleware/error.middleware');

/**
 * Validate required fields
 */
const validateRequired = (fields, data) => {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new ApiError(
      400,
      `Missing required fields: ${missing.join(', ')}`
    );
  }
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email) return true; // Email is optional in most cases
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Invalid email format');
  }
  return true;
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Allow various phone formats
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    throw new ApiError(400, 'Invalid phone number format');
  }
  return true;
};

/**
 * Validate number range
 */
const validateNumberRange = (value, min, max, fieldName) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new ApiError(400, `${fieldName} must be a valid number`);
  }
  if (min !== undefined && num < min) {
    throw new ApiError(400, `${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new ApiError(400, `${fieldName} must not exceed ${max}`);
  }
  return true;
};

/**
 * Validate string length
 */
const validateLength = (value, min, max, fieldName) => {
  if (!value) return false;
  
  const length = value.length;
  if (min !== undefined && length < min) {
    throw new ApiError(400, `${fieldName} must be at least ${min} characters`);
  }
  if (max !== undefined && length > max) {
    throw new ApiError(400, `${fieldName} must not exceed ${max} characters`);
  }
  return true;
};

/**
 * Validate enum values
 */
const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new ApiError(
      400,
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return true;
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str;
  // Remove potentially dangerous characters but keep legitimate ones
  return str.trim().replace(/[<>]/g, '');
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePhone,
  validateNumberRange,
  validateLength,
  validateEnum,
  sanitizeString,
};
