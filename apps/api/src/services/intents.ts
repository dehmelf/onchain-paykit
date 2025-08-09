export type PaymentIntent = {
  id: string;
  merchantId: string;
  merchantAddr: string;
  amountUSDC: bigint;
  ref: string;
  payerHint?: string;
  expiresAt: Date;
};

export function buildChainIntentHash(_pi: PaymentIntent): `0x${string}` {
  // TODO: must match PaymentRouter.quoteIntentId
  return '0x0000000000000000000000000000000000000000000000000000000000000000';
} 