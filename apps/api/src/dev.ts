// apps/api/src/dev.ts
import { buildServer } from './app';
import dotenv from 'dotenv';

// Load environment variables for local development
dotenv.config({ path: '.env' });

// Debug environment loading
console.log('🔧 Environment loaded:');
console.log('  CHAIN_ID:', process.env.CHAIN_ID);
console.log('  PAYMENT_ROUTER_ADDRESS:', process.env.PAYMENT_ROUTER_ADDRESS);
console.log('  SERVER_SIGNER_PK:', process.env.SERVER_SIGNER_PK ? 'SET' : 'NOT SET');

const port = Number(process.env.PORT || 3000);
const host = 'localhost';

async function main() {
  const app = buildServer();
  try {
    await app.listen({ port, host });
    app.log.info(`🚀 PayKit API listening on http://${host}:${port} with CORS enabled`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
