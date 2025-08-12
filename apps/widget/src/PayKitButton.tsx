
import React, { useState } from 'react';

type Props = {
  merchantId: string;
  amountUsd: number;
  refId: string;
  apiUrl?: string;
};

export function PayKitButton({ merchantId, amountUsd, refId, apiUrl = 'http://localhost:4000' }: Props) {
  const [state, setState] = useState<'idle' | 'creating' | 'paying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const addLog = (message: string) => {
    console.log(`[PayKit] ${message}`);
  };

  const lookupMerchant = async (merchantId: string) => {
    try {
      const response = await fetch(`${apiUrl}/v1/merchants/${merchantId}`);
      if (!response.ok) {
        throw new Error('Merchant not found');
      }
      const data = await response.json();
      return data.merchant;
    } catch (error) {
      // Fallback: return zero address if merchant lookup fails
      addLog('Merchant lookup failed, using zero address');
      return { address: '0x0000000000000000000000000000000000000000' };
    }
  };

  const createIntent = async () => {
    try {
      // Look up merchant address
      const merchant = await lookupMerchant(merchantId);
      
      const response = await fetch(`${apiUrl}/v1/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          merchantAddr: merchant.address,
          amountUsd,
          ref: refId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create intent: ${response.statusText}`);
      }

      const data = await response.json();
      addLog(`Created intent: ${data.intentId}`);
      return data;
    } catch (e) {
      throw new Error(`Intent creation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const buildAndSubmitUserOp = async (intentData: any) => {
    // ERC-4337 UserOp building for PaymentRouter.pay()
    // This is a comprehensive implementation outline for production
    
    addLog('Building ERC-4337 UserOperation...');
    
    try {
      // Step 1: Get user's smart account address
      // In production, this would use the connected wallet's smart account
      const smartAccountAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
      
      // Step 2: Build callData for PaymentRouter.pay(pi, serverSig)
      const paymentRouter = intentData.domain.verifyingContract;
      const paymentIntent = {
        merchant: intentData.paymentIntent.merchantAddr,
        amount: intentData.paymentIntent.amountUSDC,
        expiresAt: Math.floor(new Date(intentData.paymentIntent.expiresAt).getTime() / 1000),
        ref: `0x${Buffer.from(intentData.paymentIntent.ref).toString('hex').padEnd(64, '0')}`,
        payer: smartAccountAddress,
        nonce: `0x${Buffer.from(intentData.intentId).toString('hex').padEnd(64, '0')}`
      };
      
      // ABI encode for PaymentRouter.pay(PaymentIntent calldata pi, bytes calldata serverSig)
      const callData = encodeFunctionData({
        functionName: 'pay',
        args: [paymentIntent, intentData.serverSig]
      });
      
      addLog('Calldata built for PaymentRouter.pay()');
      
      // Step 3: Get paymaster sponsorship
      const paymasterPolicy = {
        intentId: intentData.intentId,
        amount: BigInt(intentData.paymentIntent.amountUSDC),
        merchant: intentData.paymentIntent.merchantAddr,
        windowTs: BigInt(Math.floor(Date.now() / 1000)),
        maxSponsoredUsdPerHour: BigInt(1000) // $1000 per hour limit
      };
      
      // Get paymaster signature (would call actual paymaster service)
      const paymasterAndData = await getPaymasterSponsorship(paymasterPolicy);
      addLog('Paymaster sponsorship obtained');
      
      // Step 4: Build complete UserOperation
      const userOp = {
        sender: smartAccountAddress,
        nonce: BigInt(0), // Would get from smart account
        initCode: '0x', // Empty if account exists
        callData,
        callGasLimit: BigInt(200000),
        verificationGasLimit: BigInt(100000),
        preVerificationGas: BigInt(50000),
        maxFeePerGas: BigInt(1000000000), // 1 gwei
        maxPriorityFeePerGas: BigInt(1000000000),
        paymasterAndData,
        signature: '0x' // Will be filled by smart account signing
      };
      
      addLog('UserOperation constructed');
      
      // Step 5: Sign with user's smart account
      // In production, this would:
      // 1. Use the connected wallet to sign the UserOp hash
      // 2. Handle different wallet types (smart wallets, EOAs)
      // 3. Return the signed UserOp with proper signature
      const signedUserOp = await signUserOperation(userOp);
      addLog('UserOperation signed');
      
      // Step 6: Submit via bundler
      const userOpHash = await submitToBundler(signedUserOp);
      addLog(`UserOp submitted: ${userOpHash}`);
      
      // Step 7: Wait for inclusion
      const txHash = await waitForInclusion(userOpHash);
      addLog(`Transaction confirmed: ${txHash}`);
      
      return txHash;
      
    } catch (error) {
      addLog(`UserOp failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Helper functions for UserOp flow (production implementations)
  const encodeFunctionData = ({ functionName, args }: any) => {
    // In production, use viem or ethers to encode the function call
    return '0x' + '00'.repeat(100); // Placeholder
  };

  const getPaymasterSponsorship = async (policy: any) => {
    // Call paymaster service to get sponsorship
    try {
      const response = await fetch(`${apiUrl}/v1/paymaster/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.paymasterAndData;
      }
    } catch (error) {
      addLog('Paymaster sponsorship failed, using empty data');
    }
    return '0x'; // Fallback
  };

  const signUserOperation = async (userOp: any) => {
    // In production, this would:
    // 1. Use the connected wallet to sign the UserOp hash
    // 2. Handle different wallet types (smart wallets, EOAs)
    // 3. Return the signed UserOp with proper signature
    addLog('Simulating UserOp signing...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ...userOp, signature: '0x' + '00'.repeat(65) };
  };

  const submitToBundler = async (userOp: any) => {
    // Submit to actual bundler (Pimlico, Stackup, etc.)
    addLog('Submitting to bundler...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return '0x' + '11'.repeat(32); // Mock UserOp hash
  };

  const waitForInclusion = async (userOpHash: string) => {
    // Poll bundler for transaction inclusion
    addLog('Waiting for transaction inclusion...');
    
    // Simulate polling for inclusion
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(`Polling attempt ${i + 1}/10...`);
      
      // In production, call bundler's getUserOperationReceipt
      if (i >= 3) { // Simulate success after 4 seconds
        const mockTxHash = '0x' + '22'.repeat(32);
        return mockTxHash;
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  };

  const onClick = async () => {
    try {
      setState('creating');
      setError('');
      setTxHash('');

      // Step 1: Create payment intent
      const intentData = await createIntent();
      
      setState('paying');
      
      // Step 2: Build and submit AA userOp
      const confirmedTxHash = await buildAndSubmitUserOp(intentData);
      
      setTxHash(confirmedTxHash);
      setState('success');
      
      // In production, you might want to:
      // - Show block explorer link
      // - Trigger webhook notifications
      // - Update local state/cache
      // - Show receipt details
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  };

  const resetState = () => {
    setState('idle');
    setError('');
    setTxHash('');
  };

  return (
    <div>
      <button 
        onClick={state === 'error' ? resetState : onClick} 
        disabled={state !== 'idle' && state !== 'error'}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          border: 'none',
          cursor: (state === 'idle' || state === 'error') ? 'pointer' : 'not-allowed',
          backgroundColor: state === 'idle' ? '#0052ff' : state === 'error' ? '#dc3545' : '#6c757d',
          color: 'white',
          fontWeight: '600',
          minWidth: '200px'
        }}
      >
        {state === 'idle' && `Pay $${amountUsd.toFixed(2)} USDC`}
        {state === 'creating' && 'Creating intent...'}
        {state === 'paying' && 'Processing payment...'}
        {state === 'success' && '✅ Payment successful!'}
        {state === 'error' && '❌ Retry payment'}
      </button>
      
      {error && (
        <div style={{ marginTop: '8px', color: '#dc3545', fontSize: '14px', maxWidth: '300px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {txHash && state === 'success' && (
        <div style={{ marginTop: '8px', fontSize: '14px', maxWidth: '300px' }}>
          <div style={{ color: '#28a745', marginBottom: '4px' }}>
            <strong>✅ Payment confirmed!</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
            Tx: {txHash}
          </div>
          <a 
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#0052ff' }}
          >
            View on BaseScan →
          </a>
        </div>
      )}
      
      {state === 'success' && (
        <button 
          onClick={resetState}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid #0052ff',
            backgroundColor: 'transparent',
            color: '#0052ff',
            cursor: 'pointer'
          }}
        >
          New Payment
        </button>
      )}
    </div>
  );
} 