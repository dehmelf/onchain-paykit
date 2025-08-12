import { z } from 'zod';
import { createPublicClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import crypto from 'crypto';

const PayoutBody = z.object({
  merchantId: z.string(),
  amount: z.string().regex(/^\d+(\.\d+)?$/), // Decimal string
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Ethereum address
  description: z.string().optional()
});

export async function registerPayoutRoutes(app: any) {
  // In-memory storage for MVP (replace with Prisma)
  const payouts = new Map<string, any>();
  const payoutHistory = new Map<string, any[]>();

  app.post('/v1/payouts', async (req: any, reply: any) => {
    const body = PayoutBody.parse(req.body);
    
    // Validate amount
    const amountWei = parseEther(body.amount);
    if (amountWei <= 0n) {
      return reply.status(400).send({ error: 'Amount must be greater than 0' });
    }

    // For MVP, simulate a payout (in production, call USDCVault.debit)
    const payout: any = {
      id: crypto.randomUUID(),
      merchantId: body.merchantId,
      amount: body.amount,
      amountWei: amountWei.toString(),
      to: body.to,
      description: body.description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    payouts.set(payout.id, payout);

    // Add to history
    if (!payoutHistory.has(body.merchantId)) {
      payoutHistory.set(body.merchantId, []);
    }
    payoutHistory.get(body.merchantId)!.push(payout);

    // Simulate blockchain interaction
    try {
      // In production, this would call the smart contract
      // await usdcVault.debit(merchantAddress, amountWei, body.to);
      
      payout.status = 'completed';
      payout.completedAt = new Date().toISOString();
      payout.txHash = `0x${crypto.randomBytes(32).toString('hex')}`; // Mock hash

      return reply.send({
        message: 'Payout initiated successfully',
        payout: {
          ...payout,
          amountWei: undefined // Don't expose internal representation
        }
      });
    } catch (error) {
      payout.status = 'failed';
      payout.error = error instanceof Error ? error.message : 'Unknown error';
      
      return reply.status(500).send({
        error: 'Payout failed',
        payout: {
          ...payout,
          amountWei: undefined
        }
      });
    }
  });

  app.get('/v1/payouts/:id', async (req: any, reply: any) => {
    const { id } = req.params;
    const payout = payouts.get(id);
    
    if (!payout) {
      return reply.status(404).send({ error: 'Payout not found' });
    }

    return reply.send({
      payout: {
        ...payout,
        amountWei: undefined
      }
    });
  });

  app.get('/v1/payouts/merchant/:merchantId', async (req: any, reply: any) => {
    const { merchantId } = req.params;
    const history = payoutHistory.get(merchantId) || [];
    
    const payouts = history.map(p => ({
      ...p,
      amountWei: undefined
    }));

    return reply.send({ payouts });
  });

  app.post('/v1/payouts/:id/retry', async (req: any, reply: any) => {
    const { id } = req.params;
    const payout = payouts.get(id);
    
    if (!payout) {
      return reply.status(404).send({ error: 'Payout not found' });
    }

    if (payout.status !== 'failed') {
      return reply.status(400).send({ error: 'Can only retry failed payouts' });
    }

    // Reset status and retry
    payout.status = 'pending';
    payout.error = undefined;
    payout.retryCount = (payout.retryCount || 0) + 1;

    // Simulate retry
    try {
      // await usdcVault.debit(merchantAddress, BigInt(payout.amountWei), payout.to);
      
      payout.status = 'completed';
      payout.completedAt = new Date().toISOString();
      payout.txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

      return reply.send({
        message: 'Payout retry successful',
        payout: {
          ...payout,
          amountWei: undefined
        }
      });
    } catch (error) {
      payout.status = 'failed';
      payout.error = error instanceof Error ? error.message : 'Unknown error';
      
      return reply.status(500).send({
        error: 'Payout retry failed',
        payout: {
          ...payout,
          amountWei: undefined
        }
      });
    }
  });
} 