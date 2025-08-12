import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export type PriceData = {
  usdc: number;
  timestamp: number;
  source: string;
};

export class PriceOracle {
  private lastCheck = 0;
  private lastPrice = 1.0; // USDC is pegged to USD
  private readonly minInterval = 60000; // 1 minute between checks
  private readonly maxDeviation = 0.05; // 5% max deviation

  constructor(
    private readonly rpcUrl: string = process.env.RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/demo'
  ) {}

  async sanityCheckPrice(): Promise<boolean> {
    const now = Date.now();
    
    // Rate limit checks
    if (now - this.lastCheck < this.minInterval) {
      return true; // Use cached price
    }

    try {
      const price = await this.fetchUSDCPrice();
      this.lastPrice = price;
      this.lastCheck = now;
      
      // Check for significant deviation (USDC should be ~$1.00)
      const deviation = Math.abs(price - 1.0);
      if (deviation > this.maxDeviation) {
        console.warn(`USDC price deviation detected: $${price} (${deviation * 100}%)`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Price oracle error:', error);
      return false;
    }
  }

  private async fetchUSDCPrice(): Promise<number> {
    // For MVP, return 1.0 since USDC is pegged
    // In production, integrate with Coinbase/Chainlink price feeds
    return 1.0;
  }

  async getCurrentPrice(): Promise<PriceData> {
    return {
      usdc: this.lastPrice,
      timestamp: this.lastCheck,
      source: 'internal'
    };
  }

  async validateAmount(amountUsd: number): Promise<boolean> {
    // Basic validation: amount should be reasonable
    if (amountUsd <= 0 || amountUsd > 1000000) { // $0 to $1M
      return false;
    }

    // Check if price is sane before proceeding
    return await this.sanityCheckPrice();
  }
}

export const priceOracle = new PriceOracle();

export async function sanityCheckPrice(): Promise<boolean> {
  return priceOracle.sanityCheckPrice();
}

export async function validatePaymentAmount(amountUsd: number): Promise<boolean> {
  return priceOracle.validateAmount(amountUsd);
} 