import crypto from 'crypto';

export function signHmacSha256(payload: string, secret: string): string {
  const mac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${mac}`;
}

export function verifyHmacSha256(payload: string, signature: string, secret: string): boolean {
  const expected = signHmacSha256(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
} 