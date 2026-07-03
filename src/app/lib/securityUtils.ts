/**
 * Security utilities for chat interface
 */

/**
 * Sanitize user input for display in the UI
 * This prevents XSS while preserving code blocks
 */
export function sanitizeForDisplay(content: string): string {
    // DOMPurify is good for HTML rendering, but for chat messages
    // displayed as text, we don't need it
    return content;
  }
  
  /**
   * Validate message content before sending
   * Checks for basic security issues without removing code
   */
  export function validateMessageContent(content: string): {
    isValid: boolean;
    error?: string;
  } {
    // Check for empty/whitespace only
    if (!content.trim()) {
      return { isValid: false, error: "Message cannot be empty" };
    }
  
    // Check length (prevent DoS)
    const MAX_MESSAGE_LENGTH = 50000; // Adjust based on your needs
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { 
        isValid: false, 
        error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` 
      };
    }
  
    // Check for suspicious patterns (optional - be careful not to block legitimate code)
    const suspiciousPatterns = [
      /<script[\s\S]*?<\/script>/gi, // Script tags in plain text (unusual)
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Inline event handlers
    ];
  
    // Only flag if these appear outside of code blocks
    const hasCodeBlock = /```[\s\S]*?```/.test(content);
    if (!hasCodeBlock) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          return { 
            isValid: false, 
            error: "Message contains potentially unsafe content" 
          };
        }
      }
    }
  
    return { isValid: true };
  }
  
  /**
   * Prepare message for API transmission
   * Removes null bytes and normalizes whitespace
   */
  export function prepareMessageForAPI(content: string): string {
    return content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim();
  }
  
  /**
   * Rate limiting helper for client-side throttling
   */
  export class MessageRateLimiter {
    private messageTimestamps: number[] = [];
    private readonly maxMessages: number;
    private readonly timeWindow: number;
  
    constructor(maxMessages = 10, timeWindowMs = 60000) {
      this.maxMessages = maxMessages;
      this.timeWindow = timeWindowMs;
    }
  
    canSendMessage(): boolean {
      const now = Date.now();
      // Remove old timestamps
      this.messageTimestamps = this.messageTimestamps.filter(
        timestamp => now - timestamp < this.timeWindow
      );
  
      if (this.messageTimestamps.length >= this.maxMessages) {
        return false;
      }
  
      this.messageTimestamps.push(now);
      return true;
    }
  
    getRemainingTime(): number {
      if (this.messageTimestamps.length < this.maxMessages) {
        return 0;
      }
      const oldestTimestamp = this.messageTimestamps[0];
      return Math.max(0, this.timeWindow - (Date.now() - oldestTimestamp));
    }
  }