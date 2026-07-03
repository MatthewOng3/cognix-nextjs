/**
 * Email validation and sanitization utilities
 * Provides secure email validation and sanitization to prevent XSS and injection attacks
 */

// RFC 5322 compliant email regex (simplified but effective)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Check if we're in a browser environment (for DOMPurify)
const isBrowser = typeof window !== 'undefined';

// Helper function to safely get DOMPurify instance (only in browser)
function getDOMPurify() {
  if (!isBrowser) {
    return null;
  }
  
  try {
    // Dynamic require for browser environments only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify');
    return DOMPurify.default || DOMPurify;
  } catch {
    return null;
  }
}

// Maximum email length (RFC 5321 limit is 320 characters)
const MAX_EMAIL_LENGTH = 320;

// Dangerous characters that could be used for injection attacks
const DANGEROUS_CHARS_REGEX = /[<>\"'%;()&+]/g;

/**
 * Validates an email address format
 * @param email - The email address to validate
 * @returns true if the email format is valid, false otherwise
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Check length
  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  // Check format with regex
  return EMAIL_REGEX.test(email);
}

/**
 * Sanitizes an email address to prevent XSS and injection attacks
 * Uses DOMPurify in browser environments for HTML/script removal, falls back to regex in server environments
 * @param email - The email address to sanitize
 * @returns Sanitized email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = email.trim();

  // Use DOMPurify in browser environments to remove any HTML tags, scripts, or event handlers
  // This provides defense-in-depth against XSS attacks
  // In server environments, we rely on regex-based sanitization
  const DOMPurifyInstance = getDOMPurify();
  if (DOMPurifyInstance) {
    sanitized = DOMPurifyInstance.sanitize(sanitized, {
      ALLOWED_TAGS: [], // No HTML tags allowed in emails
      ALLOWED_ATTR: [], // No HTML attributes allowed
      KEEP_CONTENT: true, // Keep the text content, just strip HTML
    });
  } else {
    // Server-side fallback: Remove HTML tags and scripts using regex
    // This is less comprehensive than DOMPurify but works in Node.js
    sanitized = sanitized
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers (onclick=, onerror=, etc.)
  }

  // Convert to lowercase (emails are case-insensitive)
  sanitized = sanitized.toLowerCase();

  // Remove any remaining dangerous characters (though valid emails shouldn't have these)
  // This is an additional safety measure in case someone tries to inject code
  sanitized = sanitized.replace(DANGEROUS_CHARS_REGEX, '');

  // Limit length
  if (sanitized.length > MAX_EMAIL_LENGTH) {
    sanitized = sanitized.substring(0, MAX_EMAIL_LENGTH);
  }

  return sanitized;
}

/**
 * Validates and sanitizes an email address
 * @param email - The email address to validate and sanitize
 * @returns Object with isValid flag and sanitized email
 */
export function validateAndSanitizeEmail(email: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Email is required',
    };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Email cannot be empty',
    };
  }

  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      sanitized: '',
      error: `Email must be less than ${MAX_EMAIL_LENGTH} characters`,
    };
  }

  const sanitized = sanitizeEmail(trimmed);

  if (!isValidEmailFormat(sanitized)) {
    return {
      isValid: false,
      sanitized: sanitized,
      error: 'Please enter a valid email address',
    };
  }

  return {
    isValid: true,
    sanitized: sanitized,
  };
}

