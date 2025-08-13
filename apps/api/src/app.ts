// apps/api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerIntentRoutes } from './routes/intents';
import { registerMerchantRoutes } from './routes/merchants';
import { registerWebhookRoutes } from './routes/webhooks';
import { registerPayoutRoutes } from './routes/payouts';

export function buildServer() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
    bodyLimit: 1048576 // 1MB limit
  });

  // CORS (adjust origin as needed)
  app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Health probe
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

  // Register your API routes
  app.register(registerIntentRoutes, { prefix: '/intents' });
  app.register(registerMerchantRoutes, { prefix: '/merchants' });
  app.register(registerWebhookRoutes, { prefix: '/webhooks' });
  app.register(registerPayoutRoutes, { prefix: '/payouts' });

  return app;
}
