
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

  const createIntent = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          merchantAddr: '0x0000000000000000000000000000000000000000', // TODO: get from merchant lookup
          amountUsd,
          ref: refId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create intent: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (e) {
      throw new Error(`Intent creation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const buildAndSubmitUserOp = async (intentData: any) => {
    // TODO: implement full AA userOp building
    // This would include:
    // 1. Get user's smart account address
    // 2. Build callData for PaymentRouter.pay(pi, serverSig)
    // 3. Get paymaster sponsorship
    // 4. Sign with user's smart account
    // 5. Submit via bundler
    
    // For MVP, simulate the flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would return the actual transaction hash
    return '0x' + '0'.repeat(64);
  };

  const onClick = async () => {
    try {
      setState('creating');
      setError('');

      // Step 1: Create payment intent
      const intentData = await createIntent();
      
      setState('paying');
      
      // Step 2: Build and submit AA userOp
      const txHash = await buildAndSubmitUserOp(intentData);
      
      setState('success');
      
      // TODO: Listen for transaction confirmation
      // In production, poll for inclusion and update state
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  };

  const resetState = () => {
    setState('idle');
    setError('');
  };

  return (
    <div>
      <button 
        onClick={onClick} 
        disabled={state !== 'idle'}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '8px',
          border: 'none',
          cursor: state === 'idle' ? 'pointer' : 'not-allowed',
          backgroundColor: state === 'idle' ? '#0052ff' : '#ccc',
          color: 'white',
          fontWeight: '600'
        }}
      >
        {state === 'idle' && `Pay $${amountUsd.toFixed(2)} USDC`}
        {state === 'creating' && 'Creating intent...'}
        {state === 'paying' && 'Paying...'}
        {state === 'success' && 'Paid Successfully!'}
        {state === 'error' && 'Error - Click to retry'}
      </button>
      
      {error && (
        <div style={{ marginTop: '8px', color: '#d32f2f', fontSize: '14px' }}>
          {error}
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