import { createWalletClient, http, toHex, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../utils/env.js';

export type PaymasterPolicy = {
  intentId: string;
  amount: bigint;
  merchant: `0x${string}`;
  windowTs: bigint;
  maxSponsoredUsdPerHour: bigint;
};

export type PaymasterPolicySigned = PaymasterPolicy & {
  signature: `0x${string}`;
  signer: `0x${string}`;
};

export async function signPaymasterPolicy(payload: PaymasterPolicy): Promise<PaymasterPolicySigned> {
  if (!process.env.PAYMASTER_SIGNER_PK) {
    throw new Error('PAYMASTER_SIGNER_PK not configured');
  }

  const account = privateKeyToAccount(process.env.PAYMASTER_SIGNER_PK as `0x${string}`);
  
  // Create policy hash for signing
  const policyHash = keccak256(encodePacked(
    ['string', 'uint256', 'address', 'uint256', 'uint256'],
    [payload.intentId, payload.amount, payload.merchant, payload.windowTs, payload.maxSponsoredUsdPerHour]
  ));

  const signature = await account.signMessage({ message: { raw: policyHash } });

  return {
    ...payload,
    signature,
    signer: account.address
  };
}

export function validatePaymasterPolicy(
  policy: PaymasterPolicySigned,
  currentTs: bigint,
  allowlist: Set<`0x${string}`>
): boolean {
  // Check if merchant is allowlisted
  if (!allowlist.has(policy.merchant)) {
    return false;
  }

  // Check if policy is within time window
  if (currentTs < policy.windowTs || currentTs > policy.windowTs + 3600n) { // 1 hour window
    return false;
  }

  // Check if amount is within hourly limit
  if (policy.amount > policy.maxSponsoredUsdPerHour) {
    return false;
  }

  return true;
}

export function buildPaymasterAndData(
  policy: PaymasterPolicySigned,
  paymasterAddress: `0x${string}`
): `0x${string}` {
  // Encode policy data for paymaster contract
  const encodedPolicy = encodePacked(
    ['string', 'uint256', 'address', 'uint256', 'uint256', 'bytes', 'address'],
    [
      policy.intentId,
      policy.amount,
      policy.merchant,
      policy.windowTs,
      policy.maxSponsoredUsdPerHour,
      policy.signature,
      policy.signer
    ]
  );

  // Return paymaster address + encoded policy data
  return (paymasterAddress + encodedPolicy.slice(2)) as `0x${string}`;
} 