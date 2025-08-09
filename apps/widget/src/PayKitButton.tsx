
import React, { useState } from 'react';

type Props = {
  merchantId: string;
  amountUsd: number;
  refId: string;
};

export function PayKitButton({ merchantId, amountUsd, refId }: Props) {
  const [state, setState] = useState<'idle' | 'creating' | 'paying' | 'success' | 'error'>('idle');

  const onClick = async () => {
    try {
      setState('creating');
      // TODO: call API to create intent
      setState('paying');
      // TODO: build AA userOp and submit via bundler
      setState('success');
    } catch (e) {
      setState('error');
    }
  };

  return (
    <button onClick={onClick} disabled={state !== 'idle'}>
      {state === 'idle' && `Pay ${amountUsd.toFixed(2)} USDC`}
      {state === 'creating' && 'Creating intent...'}
      {state === 'paying' && 'Paying...'}
      {state === 'success' && 'Paid'}
      {state === 'error' && 'Error'}
    </button>
  );
} 