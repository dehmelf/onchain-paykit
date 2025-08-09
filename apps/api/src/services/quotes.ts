export function quoteUsdToUsdc(amountUsd: number): bigint {
  // USDC 1:1; assume 6 decimals
  return BigInt(Math.round(amountUsd * 1_000_000));
} 