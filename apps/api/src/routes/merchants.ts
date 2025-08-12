import { z } from 'zod';
import crypto from 'crypto';
import { validatePaymentAmount } from '../services/oracles';

const CreateMerchantBody = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(1).max(100),
  metadataUri: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  feeBps: z.number().min(0).max(1000).optional() // 0-10%
});

const UpdateMerchantBody = z.object({
  name: z.string().min(1).max(100).optional(),
  metadataUri: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  feeBps: z.number().min(0).max(1000).optional()
});

export async function registerMerchantRoutes(app: any) {
  // In-memory storage for MVP (replace with Prisma)
  const merchants = new Map<string, any>();

  app.post('/v1/merchants', async (req: any, reply: any) => {
    const body = CreateMerchantBody.parse(req.body);
    
    // Generate API key
    const apiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const merchant = {
      id: crypto.randomUUID(),
      address: body.address,
      name: body.name,
      metadataUri: body.metadataUri,
      webhookUrl: body.webhookUrl,
      feeBps: body.feeBps || 0,
      apiKeyHash,
      createdAt: new Date().toISOString()
    };

    merchants.set(merchant.id, merchant);

    return reply.send({
      merchant: {
        ...merchant,
        apiKey // Only returned once
      }
    });
  });

  app.get('/v1/merchants/:id', async (req: any, reply: any) => {
    const { id } = req.params;
    const merchant = merchants.get(id);
    
    if (!merchant) {
      return reply.status(404).send({ error: 'Merchant not found' });
    }

    // Don't return apiKeyHash in response
    const { apiKeyHash, ...publicMerchant } = merchant;
    return reply.send({ merchant: publicMerchant });
  });

  app.put('/v1/merchants/:id', async (req: any, reply: any) => {
    const { id } = req.params;
    const body = UpdateMerchantBody.parse(req.body);
    
    const merchant = merchants.get(id);
    if (!merchant) {
      return reply.status(404).send({ error: 'Merchant not found' });
    }

    // Update fields
    Object.assign(merchant, body);
    merchant.updatedAt = new Date().toISOString();

    const { apiKeyHash, ...publicMerchant } = merchant;
    return reply.send({ merchant: publicMerchant });
  });

  app.get('/v1/merchants', async (req: any, reply: any) => {
    const merchantList = Array.from(merchants.values()).map(m => {
      const { apiKeyHash, ...publicMerchant } = m;
      return publicMerchant;
    });

    return reply.send({ merchants: merchantList });
  });
} 