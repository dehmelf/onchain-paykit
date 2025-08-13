import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: FastifyRequest) => string;
}

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, max, keyGenerator } = config;

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const now = Date.now();
    const resetTime = now + windowMs;

    const current = rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime });
      return;
    }

    if (current.count >= max) {
      reply.header('X-RateLimit-Limit', max.toString());
      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
      reply.header('Retry-After', Math.ceil((current.resetTime - now) / 1000).toString());
      
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }

    current.count++;
    rateLimitStore.set(key, current);

    reply.header('X-RateLimit-Limit', max.toString());
    reply.header('X-RateLimit-Remaining', (max - current.count).toString());
    reply.header('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
  };
}

// Security headers middleware
export function securityHeaders(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  // Additional security headers
  reply.header('X-Request-Id', req.id);
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Content-Security-Policy', "default-src 'self'");
  
  // Remove potentially revealing headers
  reply.removeHeader('X-Powered-By');
  reply.removeHeader('Server');
  
  done();
}

// Input sanitization middleware
export function sanitizeInput(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  // Recursively sanitize input
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        // Skip potentially dangerous keys
        if (!key.startsWith('__') && !key.startsWith('constructor')) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  done();
}

// API key validation middleware
export function validateApiKey(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }
  
  // In production, validate against database or secure store
  // This is a placeholder implementation
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }
  
  done();
}

// Request signature validation for webhooks
export function validateWebhookSignature(secret: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    
    if (!signature || !timestamp) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing webhook signature or timestamp'
      });
    }
    
    // Check timestamp to prevent replay attacks (5 minute window)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    
    if (Math.abs(currentTime - webhookTime) > 300) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Webhook timestamp is too old or invalid'
      });
    }
    
    // Validate signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      });
    }
  };
}

// Register all security middleware
export function registerSecurityMiddleware(app: FastifyInstance) {
  // Apply security headers to all routes
  app.addHook('onRequest', securityHeaders);
  
  // Apply input sanitization to all routes
  app.addHook('preHandler', sanitizeInput);
  
  // Apply rate limiting to specific routes
  const generalRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  });
  
  const strictRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    keyGenerator: (req) => `${req.ip}:${req.url}`
  });
  
  // Apply general rate limit to all routes
  app.addHook('onRequest', generalRateLimit);
  
  // Apply stricter rate limits to sensitive endpoints
  app.addHook('onRequest', async (req, reply) => {
    if (req.url.includes('/intents') || req.url.includes('/payouts')) {
      await strictRateLimit(req, reply);
    }
  });
}
