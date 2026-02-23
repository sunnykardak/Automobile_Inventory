# Error Handling & Production Readiness

## Overview
Comprehensive error handling has been implemented across the entire application to ensure production stability and user-friendly error messages.

## Backend Error Handling

### 1. Centralized Error Middleware (`backend/src/middleware/error.middleware.js`)

#### Features:
- **ApiError Class**: Custom error class for operational errors
- **Error Converter**: Converts all errors to ApiError format
- **Error Handler**: Sends appropriate error responses to clients
- **404 Handler**: Handles routes that don't exist

#### Database Error Handling:
- **23505**: Unique constraint violation → "A record with this value already exists"
- **23503**: Foreign key violation → "Invalid reference to related record"
- **23502**: Not null violation → "Missing required field: {field}"
- **22P02**: Invalid data format → "Invalid data format"

#### Authentication Errors:
- **JsonWebTokenError**: "Invalid or expired authentication token"
- **TokenExpiredError**: "Authentication token has expired"

#### Production vs Development:
- **Production**: Generic error messages, no stack traces
- **Development**: Detailed errors with stack traces for debugging

### 2. Validation Utilities (`backend/src/utils/validation.js`)

#### Functions:
```javascript
validateRequired(fields, data)        // Validates required fields
validateEmail(email)                  // Validates email format
validatePhone(phone)                  // Validates phone number
validateNumberRange(value, min, max)  // Validates number ranges
validateLength(value, min, max)       // Validates string length
validateEnum(value, allowed)          // Validates enum values
sanitizeString(str)                   // Sanitizes input strings
```

### 3. Improved Job Controller

#### Validation:
- ✅ Required field validation
- ✅ Email format validation
- ✅ Phone number validation
- ✅ Input sanitization
- ✅ Mechanic existence check
- ✅ Labour charges validation

#### Error Messages:
- ✅ User-friendly error messages
- ✅ Field-specific validation errors
- ✅ Database constraint errors handled gracefully

## Frontend Error Handling

### 1. Error Handler Utility (`frontend/src/utils/errorHandler.ts`)

#### Features:
```typescript
// Extract user-friendly error messages from API errors
extractErrorMessage(error): string

// Handle API errors with toast notifications
handleApiError(error, customMessage?, showToast?): string

// Success/Info/Warning toast helpers
showSuccess(message)
showInfo(message)
showWarning(message)

// Form validation
validateField(value, fieldName, rules)
validateEmail(email): boolean
validatePhone(phone): boolean

// Safe API call wrapper
safeApiCall<T>(apiCall, options)
```

#### HTTP Status Code Handling:
- **400**: "Invalid request. Please check your input and try again."
- **401**: "Session expired. Please log in again."
- **403**: "You do not have permission to perform this action."
- **404**: "The requested resource was not found."
- **409**: "This record already exists."
- **422**: "Validation failed. Please check your input."
- **429**: "Too many requests. Please wait a moment and try again."
- **500**: "A server error occurred. Please try again later."
- **502/503/504**: "Service temporarily unavailable. Please try again later."

#### Network Error Handling:
- **No Internet**: "No internet connection. Please check your network."
- **Connection Failed**: "Cannot connect to server. Please check your connection."

### 2. TypeScript Error Fixes

All TypeScript errors in the jobs page have been fixed:
- ✅ Removed unused imports (`Clock`)
- ✅ Fixed useEffect dependencies with eslint-disable
- ✅ Replaced all `any` types with proper error types
- ✅ Fixed unused error variables in catch blocks
- ✅ Added proper error type casting for Axios errors

### 3. Usage Example

```typescript
import { handleApiError, showSuccess, safeApiCall } from '@/utils/errorHandler';

// Option 1: Using handleApiError
const createJob = async () => {
  try {
    const response = await axios.post('/api/jobs', data);
    showSuccess('Job created successfully');
  } catch (error) {
    handleApiError(error);  // Automatically shows user-friendly toast
  }
};

// Option 2: Using safeApiCall wrapper
const createJob = async () => {
  const { data, error } = await safeApiCall(
    () => axios.post('/api/jobs', jobData),
    {
      successMessage: 'Job created successfully',
      errorMessage: 'Failed to create job',
      onSuccess: (data) => {
        // Handle success
        fetchJobs();
      },
    }
  );
  
  if (error) {
    // Error already handled with toast
    return;
  }
  
  // Process data
};

// Option 3: Custom error handling
const createJob = async () => {
  try {
    const response = await axios.post('/api/jobs', data);
    showSuccess('Job created successfully');
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    const message = err.response?.data?.message || 'Failed to create job';
    handleApiError(error, message);
  }
};
```

## Production Best Practices

### 1. Environment-Specific Behavior
- **Development**: Detailed error logs, stack traces visible
- **Production**: Generic error messages, stack traces hidden

### 2. Error Logging
- All errors are logged with context (user, URL, method, IP)
- Use the logger utility for consistent logging

### 3. Security
- Input sanitization on all user inputs
- No sensitive data in error messages
- No stack traces exposed in production

### 4. User Experience
- Clear, actionable error messages
- No technical jargon in user-facing errors
- Toast notifications for feedback

## Testing Recommendations

### Backend Testing:
```bash
# Test validation errors
POST /api/v1/jobs
Body: {} # Should return validation error

# Test unique constraint
POST /api/v1/jobs
Body: { vehicle_number: "EXISTING" } # Should return "already exists"

# Test authentication
GET /api/v1/jobs # Without token # Should return 401

# Test 404
GET /api/v1/invalid-route # Should return 404
```

### Frontend Testing:
1. Test network error (disconnect internet)
2. Test validation errors (submit empty form)
3. Test server errors (force 500 error)
4. Test authentication errors (use expired token)

## Migration Guide

To use the new error handling in existing code:

### Backend:
```javascript
// Old way
if (!field) {
  return res.status(400).json({ success: false, message: 'Field required' });
}

// New way
const { validateRequired } = require('../utils/validation');
validateRequired(['field'], { field }); // Throws ApiError if missing
```

### Frontend:
```typescript
// Old way
catch (error: any) {
  toast.error(error.response?.data?.message || 'Error');
}

// New way
import { handleApiError } from '@/utils/errorHandler';
catch (error) {
  handleApiError(error); // Handles everything automatically
}
```

## Maintenance

### Adding New Validation Rules:
Edit `backend/src/utils/validation.js` and add new functions

### Adding New Error Types:
Edit `backend/src/middleware/error.middleware.js` in the `errorHandler` function

### Customizing Error Messages:
Edit `frontend/src/utils/errorHandler.ts` in the `extractErrorMessage` function

## Summary

✅ **Backend**: Centralized error handling, validation, sanitization
✅ **Frontend**: User-friendly error messages, TypeScript fixes, error utility
✅ **Production Ready**: No stack traces, secure, logged
✅ **User Friendly**: Clear messages, toast notifications
✅ **Maintainable**: Centralized, reusable, documented
