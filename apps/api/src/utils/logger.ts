import pino from 'pino';

// List of sensitive field names to redact from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'privateKey',
  'private_key',
  'SERVER_SIGNER_PK',
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'merchantApiKey',
  'webhookSecret',
  'pk',
  'privatekey',
  'seed',
  'mnemonic'
];

// Custom serializer to redact sensitive data
const redactSensitiveData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    // Check if this key should be redacted
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  
  return redacted;
};

// Create logger configuration
export const createLogger = (options: any = {}) => {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    ...options,
    serializers: {
      req: (req: any) => {
        const serialized = pino.stdSerializers.req(req);
        return {
          ...serialized,
          headers: redactSensitiveData(serialized.headers),
          body: redactSensitiveData(serialized.body),
          query: redactSensitiveData(serialized.query),
          params: redactSensitiveData(serialized.params)
        };
      },
      res: pino.stdSerializers.res,
      err: (err: any) => {
        const serialized = pino.stdSerializers.err(err);
        return redactSensitiveData(serialized);
      }
    },
    redact: {
      paths: SENSITIVE_FIELDS.map(field => `*.${field}`),
      censor: '[REDACTED]'
    },
    formatters: {
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          node_version: process.version
        };
      }
    }
  });
};

// Default logger instance
export const logger = createLogger();
