import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const schema = z.object({
  CHAIN_ID: z.coerce.number(),
  PAYMENT_ROUTER_ADDRESS: z.string(),
  SERVER_SIGNER_PK: z.string(),
  PORT: z.coerce.number().default(4000)
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse(process.env);
