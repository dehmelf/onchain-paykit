// apps/api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import crypto from 'crypto';
import { createLogger } from './utils/logger.js';
import { registerSecurityMiddleware } from './middleware/security.js';
import { registerIntentRoutes } from './routes/intents.js';
import { registerMerchantRoutes } from './routes/merchants.js';
import { registerWebhookRoutes } from './routes/webhooks.js';
import { registerPayoutRoutes } from './routes/payouts.js';

// Version information
const VERSION = process.env.API_VERSION || '1.0.0';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA || 'development';

export function buildServer() {
  const app = Fastify({
    logger: createLogger(),
    bodyLimit: 1048576, // 1MB limit
    requestIdLogLabel: 'reqId',
    genReqId: () => crypto.randomUUID()
  });

  // CORS (adjust origin as needed)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : true;

  app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Register security middleware
  // registerSecurityMiddleware(app);

  // Root route
  app.get('/', async () => ({
    name: 'PayKit API',
    version: VERSION,
    status: 'running',
    endpoints: [
      '/health',
      '/readiness',
      '/version',
      '/intents',
      '/merchants',
      '/webhooks',
      '/payouts'
    ]
  }));

  // Health probe (liveness check)
  app.get('/health', async () => ({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      chainId: process.env.CHAIN_ID,
      hasSignerKey: !!process.env.SERVER_SIGNER_PK,
      hasPaymentRouter: !!process.env.PAYMENT_ROUTER_ADDRESS
    }
  }));

  // Readiness probe (checks if the service is ready to handle requests)
  app.get('/readiness', async (request, reply) => {
    const checks = {
      environment: true,
      signerKey: !!process.env.SERVER_SIGNER_PK,
      paymentRouter: !!process.env.PAYMENT_ROUTER_ADDRESS,
      chainId: !!process.env.CHAIN_ID
    };

    const isReady = Object.values(checks).every(check => check === true);

    if (!isReady) {
      return reply.code(503).send({ error: 'Service not ready', checks });
    }

    return {
      ready: true,
      checks,
      timestamp: new Date().toISOString()
    };
  });

  // Version endpoint
  app.get('/version', async () => ({
    version: VERSION,
    buildTime: BUILD_TIME,
    commitSha: COMMIT_SHA,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  }));

  // Register your API routes
  app.register(registerIntentRoutes, { prefix: '/intents' });
  app.register(registerMerchantRoutes, { prefix: '/merchants' });
  app.register(registerWebhookRoutes, { prefix: '/webhooks' });
  app.register(registerPayoutRoutes, { prefix: '/payouts' });

  return app;
}
