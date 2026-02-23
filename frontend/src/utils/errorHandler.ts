import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Types for error handling
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
  code?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Extract user-friendly error message from API error
 */
export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    // Check if we have a response from the server
    if (axiosError.response) {
      const { data, status } = axiosError.response;
      
      // Use the server's message if available
      if (data && typeof data === 'object' && 'message' in data) {
        return data.message;
      }
      
      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This record already exists.';
        case 422:
          return 'Validation failed. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'A server error occurred. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `An error occurred (${status}). Please try again.`;
      }
    }
    
    // Network error (no response from server)
    if (axiosError.request) {
      if (!navigator.onLine) {
        return 'No internet connection. Please check your network.';
      }
      return 'Cannot connect to server. Please check your connection.';
    }
    
    // Request setup error
    return 'An error occurred while making the request.';
  }
  
  // Non-Axios error
  if (error instanceof Error) {
    return error.message;
  }
  
  // Unknown error type
  return 'An unexpected error occurred.';
};

/**
 * Handle API errors with toast notifications
 */
export const handleApiError = (
  error: unknown,
  customMessage?: string,
  showToast = true
): string => {
  const message = customMessage || extractErrorMessage(error);
  
  if (showToast) {
    toast.error(message);
  }
  
  // Log detailed error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }
  
  return message;
};

/**
 * Show success message
 */
export const showSuccess = (message: string): void => {
  toast.success(message);
};

/**
 * Show info message
 */
export const showInfo = (message: string): void => {
  toast(message, {
    icon: 'ℹ️',
  });
};

/**
 * Show warning message
 */
export const showWarning = (message: string): void => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

/**
 * Validate form field
 */
export const validateField = (
  value: string | number | null | undefined,
  fieldName: string,
  rules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    patternMessage?: string;
  }
): string | null => {
  if (!rules) return null;
  
  const stringValue = String(value || '');
  
  if (rules.required && !stringValue.trim()) {
    return `${fieldName} is required`;
  }
  
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} must not exceed ${rules.maxLength} characters`;
  }
  
  if (rules.min !== undefined && Number(value) < rules.min) {
    return `${fieldName} must be at least ${rules.min}`;
  }
  
  if (rules.max !== undefined && Number(value) > rules.max) {
    return `${fieldName} must not exceed ${rules.max}`;
  }
  
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return rules.patternMessage || `${fieldName} format is invalid`;
  }
  
  return null;
};

/**
 * Validate email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Safe API call wrapper with error handling
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await apiCall();
    
    if (options?.successMessage && options.showSuccessToast !== false) {
      showSuccess(options.successMessage);
    }
    
    if (options?.onSuccess) {
      options.onSuccess(data);
    }
    
    return { data, error: null };
  } catch (error) {
    const errorMessage = handleApiError(
      error,
      options?.errorMessage,
      options?.showErrorToast !== false
    );
    
    if (options?.onError) {
      options.onError(error);
    }
    
    return { data: null, error: errorMessage };
  }
};
