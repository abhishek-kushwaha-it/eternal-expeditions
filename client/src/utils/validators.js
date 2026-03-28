/* ============================================
   VALIDATION UTILITIES
   ============================================ */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters',
      strength: 'weak',
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const strength = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  const strengthMap = { 1: 'weak', 2: 'fair', 3: 'good', 4: 'strong' };

  return {
    isValid: strength >= 2,
    message: strength >= 2 ? 'Password is strong enough' : 'Password needs more complexity',
    strength: strengthMap[strength] || 'weak',
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSpecialChars,
  };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  // Simple validation - adjust based on your requirements
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate form field
 */
export const validateField = (name, value, field) => {
  const errors = {};

  // Required field validation
  if (field.required && (!value || value.toString().trim() === '')) {
    errors[name] = `${field.label || name} is required`;
    return errors;
  }

  // Min length validation
  if (field.minLength && value.length < field.minLength) {
    errors[name] = `${field.label || name} must be at least ${field.minLength} characters`;
    return errors;
  }

  // Max length validation
  if (field.maxLength && value.length > field.maxLength) {
    errors[name] = `${field.label || name} must not exceed ${field.maxLength} characters`;
    return errors;
  }

  // Email validation
  if (field.type === 'email' && !validateEmail(value)) {
    errors[name] = 'Please enter a valid email address';
    return errors;
  }

  // Phone validation
  if (field.type === 'phone' && !validatePhone(value)) {
    errors[name] = 'Please enter a valid phone number';
    return errors;
  }

  // Custom validation function
  if (field.validate && typeof field.validate === 'function') {
    const validationResult = field.validate(value);
    if (validationResult !== true) {
      errors[name] = validationResult;
    }
  }

  return errors;
};

/**
 * Validate form object
 */
export const validateForm = (formData, formSchema) => {
  const errors = {};

  Object.entries(formSchema).forEach(([fieldName, fieldConfig]) => {
    const fieldErrors = validateField(fieldName, formData[fieldName] || '', fieldConfig);
    Object.assign(errors, fieldErrors);
  });

  return errors;
};

/**
 * Check if all form fields are valid
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};
