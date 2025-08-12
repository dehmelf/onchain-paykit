import { z } from 'zod';

const schema = z.object({
  CHAIN_ID: z.coerce.number().default(84532),
  PAYMENT_ROUTER_ADDRESS: z.string().default('0x0000000000000000000000000000000000000000'),
  SERVER_SIGNER_PK: z.string().optional(),
  PORT: z.coerce.number().default(4000)
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse(process.env); 