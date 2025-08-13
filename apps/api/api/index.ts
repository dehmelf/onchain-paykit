// Vercel serverless function handler
import dotenv from 'dotenv';
dotenv.config();

import { buildServer } from '../src/app.js';

const app = buildServer();

// Export as Vercel serverless function
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};
