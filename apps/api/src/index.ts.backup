import Fastify from 'fastify';
import dotenv from 'dotenv';
import pino from 'pino';
import { registerIntentRoutes } from './routes/intents';
import { registerMerchantRoutes } from './routes/merchants';
import { registerWebhookRoutes } from './routes/webhooks';
import { registerPayoutRoutes } from './routes/payouts';

dotenv.config({ path: '.env' });

// Debug environment loading
console.log('Environment loaded:');
console.log('CHAIN_ID:', process.env.CHAIN_ID);
console.log('PAYMENT_ROUTER_ADDRESS:', process.env.PAYMENT_ROUTER_ADDRESS);
console.log('SERVER_SIGNER_PK:', process.env.SERVER_SIGNER_PK ? 'SET' : 'NOT SET');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = Fastify({ logger });

// Add CORS headers manually to all responses
app.addHook('onSend', async (request, reply, payload) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.header('Access-Control-Allow-Credentials', 'true');
  return payload;
});

// Enhanced health endpoint
app.get('/health', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  
  return { 
    ok: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      chainId: process.env.CHAIN_ID,
      hasSignerKey: !!process.env.SERVER_SIGNER_PK,
      hasPaymentRouter: !!process.env.PAYMENT_ROUTER_ADDRESS
    }
  };
});

// Handle preflight OPTIONS requests
app.options('*', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.code(204).send();
});

// Register all routes
await registerIntentRoutes(app);
await registerMerchantRoutes(app);
await registerWebhookRoutes(app);
await registerPayoutRoutes(app);

const port = Number(process.env.PORT ?? '4000');
await app.listen({ port, host: '0.0.0.0' });
logger.info(`🚀 PayKit API listening on ${port} with CORS enabled`);
