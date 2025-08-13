# PayKit API Security Documentation

## Overview

This document outlines the security measures implemented in the PayKit API to ensure safe and reliable operations.

## Security Features

### 1. Request Logging with Secret Filtering

The API uses a custom logger that automatically redacts sensitive information from logs:

- **Redacted Fields**: passwords, tokens, API keys, private keys, and other sensitive data
- **Implementation**: `src/utils/logger.ts`
- **Coverage**: All request/response logs, error logs, and debug information

#### Configuration

```javascript
// Sensitive fields are automatically redacted
const SENSITIVE_FIELDS = [
  'password', 'token', 'apiKey', 'secret', 
  'privateKey', 'SERVER_SIGNER_PK', 'authorization'
];
```

### 2. Rate Limiting

Protects against abuse and DDoS attacks:

- **General Limit**: 100 requests per 15 minutes per IP
- **Strict Limit**: 20 requests per 15 minutes for sensitive endpoints (`/intents`, `/payouts`)
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Implementation**: `src/middleware/security.ts`

### 3. Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=63072000
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 4. Input Sanitization

All incoming data is sanitized to prevent XSS and injection attacks:

- Removes script tags
- Strips javascript: URLs
- Removes event handlers
- Sanitizes nested objects recursively

### 5. CORS Configuration

Configurable CORS settings via environment variables:

```bash
ALLOWED_ORIGINS=https://example.com,https://api.example.com
```

### 6. API Key Authentication

Optional API key validation for protected endpoints:

```bash
VALID_API_KEYS=key1,key2,key3
```

Usage:
```bash
curl -H "X-API-Key: key1" https://api.example.com/intents
```

### 7. Webhook Signature Validation

Validates webhook requests using HMAC-SHA256 signatures:

```javascript
// Headers required for webhooks
X-Webhook-Signature: <hmac_signature>
X-Webhook-Timestamp: <unix_timestamp>
```

### 8. Request ID Tracking

Every request gets a unique ID for tracing:

```javascript
X-Request-Id: <uuid>
```

## Performance Optimization

### Memory and Timeout Configuration

Optimized for blockchain interactions:

| Endpoint Type | Max Duration | Memory |
|--------------|--------------|---------|
| Main API     | 300s         | 1024 MB |
| Intents      | 120s         | 512 MB  |
| Payouts      | 180s         | 768 MB  |
| Webhooks     | 60s          | 256 MB  |

### Monitoring Endpoints

#### Health Check (`/health`)
```bash
curl https://api.example.com/health
```

Response:
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "env": {
    "chainId": "8453",
    "hasSignerKey": true,
    "hasPaymentRouter": true
  }
}
```

#### Readiness Check (`/readiness`)
```bash
curl https://api.example.com/readiness
```

Response:
```json
{
  "ready": true,
  "checks": {
    "environment": true,
    "signerKey": true,
    "paymentRouter": true,
    "chainId": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Version Information (`/version`)
```bash
curl https://api.example.com/version
```

Response:
```json
{
  "version": "1.0.0",
  "buildTime": "2024-01-01T00:00:00.000Z",
  "commitSha": "abc123",
  "nodeVersion": "v20.0.0",
  "environment": "production"
}
```

## Best Practices

### Environment Variables

1. Never commit sensitive values to git
2. Use `.env.example` as a template
3. Store production secrets in Vercel's environment variables
4. Rotate API keys and secrets regularly

### Deployment Security

1. Always use HTTPS in production
2. Enable Vercel's DDoS protection
3. Set up monitoring alerts for failed auth attempts
4. Review access logs regularly

### Development Security

1. Use different API keys for dev/staging/production
2. Test rate limiting locally
3. Verify secret redaction in logs
4. Run security audits: `npm audit`

## Security Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] CORS origins properly restricted
- [ ] Rate limiting tested
- [ ] Webhook signatures implemented
- [ ] SSL certificate active
- [ ] Monitoring endpoints accessible
- [ ] Logs reviewed for secret leakage
- [ ] Security headers verified
- [ ] Input sanitization tested
- [ ] API keys rotated

## Incident Response

In case of a security incident:

1. **Immediate Actions**:
   - Rotate all API keys and secrets
   - Review access logs
   - Enable stricter rate limiting

2. **Investigation**:
   - Check `/version` for deployed version
   - Review error logs (secrets are redacted)
   - Analyze rate limit violations

3. **Recovery**:
   - Deploy patches via Vercel
   - Update security documentation
   - Notify affected users if necessary

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

## Contact

For security concerns or vulnerability reports, please contact the security team.
