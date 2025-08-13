import { toHex, stringToBytes, keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../utils/env.js';

export type PaymentIntentTyped = {
  merchant: `0x${string}`;
  amount: bigint;
  expiresAt: bigint;
  ref: `0x${string}`;
  payer: `0x${string}`;
  nonce: `0x${string}`;
};

const domain = {
  name: 'OnchainPayKit',
  version: '1',
  chainId: BigInt(env.CHAIN_ID),
  verifyingContract: env.PAYMENT_ROUTER_ADDRESS as `0x${string}`
} as const;

export const PaymentIntentTypes = {
  PaymentIntent: [
    { name: 'merchant', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'ref', type: 'bytes32' },
    { name: 'payer', type: 'address' },
    { name: 'nonce', type: 'bytes32' }
  ]
} as const;

export async function signPaymentIntent(pi: PaymentIntentTyped): Promise<`0x${string}`> {
  if (!env.SERVER_SIGNER_PK) throw new Error('SERVER_SIGNER_PK missing');
  const account = privateKeyToAccount(env.SERVER_SIGNER_PK as `0x${string}`);
  const signature = await account.signTypedData({
    domain,
    primaryType: 'PaymentIntent',
    types: PaymentIntentTypes as any,
    message: pi as any
  });
  return signature;
}

export function toBytes32(str: string): `0x${string}` {
  const bytes = stringToBytes(str);
  if (bytes.length > 32) {
    return keccak256(bytes);
  }
  return toHex(bytes, { size: 32 });
} 