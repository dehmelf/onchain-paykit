import Fastify from 'fastify';
import dotenv from 'dotenv';
import pino from 'pino';
import { registerIntentRoutes } from './routes/intents';
import { registerMerchantRoutes } from './routes/merchants';
import { registerWebhookRoutes } from './routes/webhooks';
import { registerPayoutRoutes } from './routes/payouts';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = Fastify({ logger });

app.get('/health', async () => ({ ok: true }));

// Register all routes
await registerIntentRoutes(app);
await registerMerchantRoutes(app);
await registerWebhookRoutes(app);
await registerPayoutRoutes(app);

const port = Number(process.env.PORT ?? '4000');
await app.listen({ port, host: '0.0.0.0' });
logger.info(`API listening on ${port}`); 