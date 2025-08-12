import { createPublicClient, http, getAddress, type Hash } from 'viem';
import { baseSepolia } from 'viem/chains';
import { env } from '../utils/env';

export type UserOperation = {
  sender: `0x${string}`;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
};

export type BundlerResponse = {
  userOpHash: `0x${string}`;
};

export async function submitUserOp(userOp: UserOperation): Promise<`0x${string}`> {
  if (!process.env.RELAYER_BUNDLER_URL) {
    throw new Error('RELAYER_BUNDLER_URL not configured');
  }

  const response = await fetch(process.env.RELAYER_BUNDLER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendUserOperation',
      params: [
        {
          sender: getAddress(userOp.sender),
          nonce: `0x${userOp.nonce.toString(16)}`,
          initCode: userOp.initCode,
          callData: userOp.callData,
          callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
          verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
          preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
          maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
          maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
          paymasterAndData: userOp.paymasterAndData,
          signature: userOp.signature
        },
        process.env.PAYMENT_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000'
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Bundler error: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Bundler error: ${result.error.message}`);
  }

  return result.result as `0x${string}`;
}

export async function waitForTx(hash: `0x${string}`): Promise<void> {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/demo')
  });

  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5s intervals

  while (attempts < maxAttempts) {
    try {
      const receipt = await client.getTransactionReceipt({ hash });
      if (receipt && receipt.status === 'success') {
        return;
      }
    } catch (e) {
      // Transaction not found yet
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error(`Transaction ${hash} not confirmed after ${maxAttempts} attempts`);
}

export async function getUserOpReceipt(userOpHash: `0x${string}`): Promise<`0x${string}` | null> {
  if (!process.env.RELAYER_BUNDLER_URL) {
    throw new Error('RELAYER_BUNDLER_URL not configured');
  }

  const response = await fetch(process.env.RELAYER_BUNDLER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getUserOperationReceipt',
      params: [userOpHash]
    })
  });

  if (!response.ok) {
    throw new Error(`Bundler error: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Bundler error: ${result.error.message}`);
  }

  return result.result?.receipt?.transactionHash || null;
} 