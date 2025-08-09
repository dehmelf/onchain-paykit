import Fastify from 'fastify';
import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = Fastify({ logger });

app.get('/health', async () => ({ ok: true }));

const port = Number(process.env.PORT ?? '4000');
await app.listen({ port, host: '0.0.0.0' });
logger.info(`API listening on ${port}`); 