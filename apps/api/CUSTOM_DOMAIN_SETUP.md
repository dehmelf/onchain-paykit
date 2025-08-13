# Custom Domain Setup Guide for PayKit API

This guide walks you through setting up a custom domain (e.g., `api.example.com`) for your PayKit API on Vercel.

## Prerequisites

1. Access to your domain's DNS settings
2. Vercel account with the PayKit API deployed
3. Domain ownership verification

## Step 1: Add Domain in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your custom domain (e.g., `api.example.com`)
5. Click **Add**

## Step 2: Configure DNS Records

### Option A: Using a Subdomain (Recommended)
For `api.example.com`, add a CNAME record:

```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
TTL: 3600 (or auto)
```

### Option B: Using an Apex Domain
For `example.com`, add an A record:

```
Type: A
Name: @ (or leave empty)
Value: 76.76.21.21
TTL: 3600 (or auto)
```

## Step 3: SSL Certificate

Vercel automatically provisions and renews SSL certificates for your custom domain. This process usually takes a few minutes after DNS propagation.

## Step 4: Environment Variables

Update your environment variables in Vercel to reflect the new domain:

```bash
# In Vercel Dashboard > Settings > Environment Variables
API_DOMAIN=api.example.com
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

## Step 5: Update CORS Settings

If needed, update the CORS configuration in your app to allow requests from your domain:

```typescript
// In app.ts
app.register(cors, {
  origin: [
    'https://example.com',
    'https://www.example.com',
    'https://api.example.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
```

## Step 6: Testing

After DNS propagation (usually 5-30 minutes):

1. Test the health endpoint:
   ```bash
   curl https://api.example.com/health
   ```

2. Test the version endpoint:
   ```bash
   curl https://api.example.com/version
   ```

3. Test the readiness endpoint:
   ```bash
   curl https://api.example.com/readiness
   ```

## Monitoring

Once your custom domain is set up, you can monitor it using:

- **Uptime monitoring**: Set up monitors for `/health` and `/readiness`
- **SSL monitoring**: Verify certificate expiration
- **Performance monitoring**: Track response times

## Troubleshooting

### Domain not resolving
- Check DNS propagation using: `nslookup api.example.com`
- Verify DNS records are correctly configured
- Wait up to 48 hours for full propagation

### SSL certificate issues
- Ensure domain is properly verified in Vercel
- Check that DNS is pointing to Vercel
- Wait for automatic certificate provisioning (usually < 10 minutes)

### CORS errors
- Update CORS configuration in app.ts
- Ensure environment variables are set correctly
- Clear browser cache and cookies

## Additional Security Headers

The following security headers are automatically applied via `vercel.json`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000`

## Support

For additional help:
- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel Support](https://vercel.com/support)
