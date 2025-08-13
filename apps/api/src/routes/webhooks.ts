import { z } from 'zod';
import { signHmacSha256, verifyHmacSha256 } from '../utils/hmac.js';

const WebhookConfigBody = z.object({
  merchantId: z.string(),
  webhookUrl: z.string().url(),
  events: z.array(z.enum(['payment.paid', 'payment.refunded', 'payment.expired'])).optional()
});

const WebhookDeliveryBody = z.object({
  merchantId: z.string(),
  type: z.enum(['payment.paid', 'payment.refunded', 'payment.expired']),
  payload: z.record(z.any()),
  signature: z.string()
});

export async function registerWebhookRoutes(app: any) {
  // In-memory storage for MVP (replace with Prisma + BullMQ)
  const webhookConfigs = new Map<string, any>();
  const webhookEvents = new Map<string, any[]>();

  app.post('/v1/webhooks/merchant', async (req: any, reply: any) => {
    const body = WebhookConfigBody.parse(req.body);
    
    const config = {
      merchantId: body.merchantId,
      webhookUrl: body.webhookUrl,
      events: body.events || ['payment.paid', 'payment.refunded', 'payment.expired'],
      createdAt: new Date().toISOString()
    };

    webhookConfigs.set(body.merchantId, config);
    
    return reply.send({ 
      message: 'Webhook configured successfully',
      config: { ...config, secret: process.env.WEBHOOK_HMAC_SECRET ? '***' : 'not set' }
    });
  });

  app.get('/v1/webhooks/merchant/:merchantId', async (req: any, reply: any) => {
    const { merchantId } = req.params;
    const config = webhookConfigs.get(merchantId);
    
    if (!config) {
      return reply.status(404).send({ error: 'Webhook config not found' });
    }

    return reply.send({ config });
  });

  app.post('/v1/webhooks/test', async (req: any, reply: any) => {
    const body = WebhookDeliveryBody.parse(req.body);
    
    if (!process.env.WEBHOOK_HMAC_SECRET) {
      return reply.status(500).send({ error: 'WEBHOOK_HMAC_SECRET not configured' });
    }

    const config = webhookConfigs.get(body.merchantId);
    if (!config) {
      return reply.status(404).send({ error: 'Webhook config not found' });
    }

    // Verify signature
    const expectedSignature = signHmacSha256(JSON.stringify(body.payload), process.env.WEBHOOK_HMAC_SECRET);
    if (body.signature !== expectedSignature) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    // Store event for debugging
    if (!webhookEvents.has(body.merchantId)) {
      webhookEvents.set(body.merchantId, []);
    }
    webhookEvents.get(body.merchantId)!.push({
      ...body,
      timestamp: new Date().toISOString()
    });

    // Attempt delivery
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PayKit-Signature': expectedSignature,
          'X-PayKit-Event': body.type,
          'X-PayKit-Merchant-Id': body.merchantId
        },
        body: JSON.stringify(body.payload)
      });

      if (response.ok) {
        return reply.send({ 
          message: 'Webhook delivered successfully',
          statusCode: response.status
        });
      } else {
        return reply.status(400).send({ 
          error: 'Webhook delivery failed',
          statusCode: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Webhook delivery error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/v1/webhooks/events/:merchantId', async (req: any, reply: any) => {
    const { merchantId } = req.params;
    const events = webhookEvents.get(merchantId) || [];
    
    return reply.send({ events });
  });
} 