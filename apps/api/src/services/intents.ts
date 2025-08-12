import { keccak256, encodePacked } from 'viem';
import { toBytes32 } from './signatures';

export type PaymentIntent = {
  id: string;
  merchantId: string;
  merchantAddr: `0x${string}`;
  amountUSDC: bigint;
  ref: string;
  payerHint?: string;
  expiresAt: Date;
};

export function buildChainIntentHash(pi: PaymentIntent): `0x${string}` {
  const typeHash = keccak256(
    new TextEncoder().encode(
      'PaymentIntent(address merchant,uint256 amount,uint256 expiresAt,bytes32 ref,address payer,bytes32 nonce)'
    )
  );
  const refBytes = toBytes32(pi.ref);
  const nonceBytes = toBytes32(pi.id);
  const expires = BigInt(Math.floor(pi.expiresAt.getTime() / 1000));
  // payer is optional; use zero address in hash when not provided
  const payer: `0x${string}` = (pi.payerHint as `0x${string}`) ??
    '0x0000000000000000000000000000000000000000';

  const encoded = encodePacked(
    ['bytes32', 'address', 'uint256', 'uint256', 'bytes32', 'address', 'bytes32'],
    [typeHash, pi.merchantAddr, pi.amountUSDC, expires, refBytes, payer, nonceBytes]
  );
  return keccak256(encoded);
}

export async function createIntent(params: PaymentIntent) {
  const chainIntentHash = buildChainIntentHash(params);
  return { chainIntentHash };
} 