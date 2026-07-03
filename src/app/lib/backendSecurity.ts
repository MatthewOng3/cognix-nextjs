/**
 * Backend security validation for chat messages
 * Place this in your API route handlers
 */

// Example for Node.js/Express backend
interface MessageValidationResult {
    isValid: boolean;
    sanitizedContent?: string;
    error?: string;
  }
  
  /**
   * Validate and sanitize message on the backend
   * This is your primary defense against malicious input
   */
  export function validateBackendMessage(
    content: string,
    userId: string
  ): MessageValidationResult {
    // 1. Type check
    if (typeof content !== 'string') {
      return { isValid: false, error: 'Invalid content type' };
    }
  
    // 2. Length validation
    if (content.length === 0 || content.length > 50000) {
      return { isValid: false, error: 'Content length out of bounds' };
    }
  
    // 3. Remove null bytes and control characters (except newlines/tabs)
    const sanitized = content
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
    // 4. Check for SQL injection patterns (if you're using SQL)
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b).*(\bFROM\b|\bWHERE\b|\bINTO\b)/gi,
      /;.*(-{2}|\/\*)/gi, // SQL comments
    ];
  
    for (const pattern of sqlPatterns) {
      if (pattern.test(sanitized)) {
        console.warn(`Potential SQL injection attempt from user ${userId}`);
        // Don't reject, just log - users might legitimately discuss SQL
        // But you can add rate limiting for repeated attempts
      }
    }
  
    // 5. Check for NoSQL injection patterns (if using MongoDB/NoSQL)
    try {
      // Check if content parses as JSON object with $where or other operators
      if (sanitized.trim().startsWith('{')) {
        const parsed = JSON.parse(sanitized);
        if (hasNoSQLInjectionPattern(parsed)) {
          console.warn(`Potential NoSQL injection attempt from user ${userId}`);
        }
      }
    } catch {
      // Not JSON, continue
    }
  
    return {
      isValid: true,
      sanitizedContent: sanitized,
    };
  }
  
  /**
   * Check for NoSQL injection patterns in parsed JSON
   */
  function hasNoSQLInjectionPattern(obj: any): boolean {
    const dangerousOperators = ['$where', '$regex', '$ne', '$gt', '$lt'];
    
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
  
    for (const key of Object.keys(obj)) {
      if (dangerousOperators.includes(key)) {
        return true;
      }
      if (typeof obj[key] === 'object') {
        if (hasNoSQLInjectionPattern(obj[key])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Rate limiting for message sending (backend)
   * Use Redis or similar for production
   */
  class BackendRateLimiter {
    private attempts: Map<string, number[]> = new Map();
    
    constructor(
      private maxAttempts: number = 20,
      private windowMs: number = 60000
    ) {}
  
    checkLimit(userId: string): { allowed: boolean; retryAfter?: number } {
      const now = Date.now();
      const userAttempts = this.attempts.get(userId) || [];
      
      // Remove old attempts
      const recentAttempts = userAttempts.filter(
        timestamp => now - timestamp < this.windowMs
      );
  
      if (recentAttempts.length >= this.maxAttempts) {
        const oldestAttempt = recentAttempts[0];
        const retryAfter = Math.ceil((oldestAttempt + this.windowMs - now) / 1000);
        return { allowed: false, retryAfter };
      }
  
      recentAttempts.push(now);
      this.attempts.set(userId, recentAttempts);
      
      return { allowed: true };
    }
  }
  
  // Singleton instance
  const rateLimiter = new BackendRateLimiter();
  
  /**
   * Example Express middleware for message validation
   */
  export function messageValidationMiddleware(req: any, res: any, next: any) {
    const { content } = req.body;
    const userId = req.user?.id; // Assume you have auth middleware
  
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    // Check rate limit
    const rateCheck = rateLimiter.checkLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: rateCheck.retryAfter,
      });
    }
  
    // Validate message
    const validation = validateBackendMessage(content, userId);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }
  
    // Store sanitized content in request for later use
    req.sanitizedContent = validation.sanitizedContent;
    next();
  }
  
  /**
   * Parameterized query example (if using PostgreSQL)
   * NEVER concatenate user input into SQL queries
   */
  export async function saveChatMessage(
    db: any,
    userId: string,
    sessionId: string,
    content: string
  ) {
    // ✅ GOOD: Using parameterized queries
    const query = `
      INSERT INTO messages (user_id, session_id, content, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    return await db.query(query, [userId, sessionId, content]);
    
    // ❌ BAD: Never do this!
    // const query = `INSERT INTO messages VALUES ('${userId}', '${content}')`;
  }
 