import { z } from 'zod';
import crypto from 'crypto';
import { quoteUsdToUsdc } from '../services/quotes';
import { createIntent } from '../services/intents';
import { signPaymentIntent, toBytes32 } from '../services/signatures';
import { env } from '../utils/env';

const Body = z.object({
  merchantId: z.string(),
  merchantAddr: z.string(),
  amountUsd: z.number().optional(),
  productId: z.string().optional(),
  ref: z.string(),
  payerHint: z.string().optional()
}).refine(b => !!b.amountUsd || !!b.productId, { message: 'amountUsd or productId required' });

export async function registerIntentRoutes(app: any) {
  app.post('/v1/intents', async (req: any, reply: any) => {
    const body = Body.parse(req.body);
    const amountUSDC = quoteUsdToUsdc(body.amountUsd ?? 0);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const id = crypto.randomUUID();

    const pi = {
      id,
      merchantId: body.merchantId,
      merchantAddr: body.merchantAddr as `0x${string}`,
      amountUSDC,
      ref: body.ref,
      payerHint: body.payerHint,
      expiresAt
    };

    const { chainIntentHash } = await createIntent(pi);

    const typed = {
      merchant: body.merchantAddr as `0x${string}`,
      amount: amountUSDC,
      expiresAt: BigInt(Math.floor(expiresAt.getTime() / 1000)),
      ref: toBytes32(body.ref),
      payer: (body.payerHint as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
      nonce: toBytes32(id)
    };
    let serverSig: `0x${string}` | null = null;
    try {
      serverSig = await signPaymentIntent(typed);
    } catch (e) {
      serverSig = '0x';
    }

    return reply.send({
      intentId: id,
      chainIntentHash,
      paymentIntent: {
        ...pi,
        amountUSDC: pi.amountUSDC.toString(),
        expiresAt: pi.expiresAt.toISOString()
      },
      serverSig,
      domain: {
        name: 'OnchainPayKit',
        version: '1',
        chainId: env.CHAIN_ID,
        verifyingContract: env.PAYMENT_ROUTER_ADDRESS
      }
    });
  });
} 