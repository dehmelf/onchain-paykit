# Frontend Deployment Guide

## Prerequisites
1. Deploy your API first and note the URL
2. Have your smart contract addresses ready (PAYMASTER_ADDRESS and USDC_ADDRESS)
3. Get a WalletConnect Project ID from https://cloud.walletconnect.com/

## Environment Variables to Configure

Before deploying, update these values in your chosen platform:

- `NEXT_PUBLIC_API_URL`: Your deployed API URL (e.g., `https://your-api.railway.app/api`)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect Project ID
- `NEXT_PUBLIC_PAYMASTER_ADDRESS`: Your deployed Paymaster contract address
- `NEXT_PUBLIC_USDC_ADDRESS`: Your deployed USDC contract address

## Deployment Options

### Option 1: Netlify (Recommended - Easiest)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy from the demo directory**:
   ```bash
   cd apps/demo
   netlify deploy --prod
   ```

4. **Set environment variables**:
   ```bash
   netlify env:set NEXT_PUBLIC_API_URL "https://your-api-domain.com/api"
   netlify env:set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID "your_project_id"
   netlify env:set NEXT_PUBLIC_PAYMASTER_ADDRESS "0x..."
   netlify env:set NEXT_PUBLIC_USDC_ADDRESS "0x..."
   ```

5. **Redeploy**:
   ```bash
   netlify deploy --prod
   ```

### Option 2: Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and initialize**:
   ```bash
   railway login
   railway init
   ```

3. **Deploy**:
   ```bash
   railway up
   ```

4. **Set environment variables**:
   ```bash
   railway variables set NEXT_PUBLIC_API_URL="https://your-api-domain.com/api"
   railway variables set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id"
   railway variables set NEXT_PUBLIC_PAYMASTER_ADDRESS="0x..."
   railway variables set NEXT_PUBLIC_USDC_ADDRESS="0x..."
   ```

5. **Redeploy**:
   ```bash
   railway up
   ```

### Option 3: Render

1. **Push to GitHub** (required for Render)

2. **Create a new Web Service on Render**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Use these settings:
     - **Root Directory**: `apps/demo`
     - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @paykit/demo build`
     - **Start Command**: `pnpm start`

3. **Add environment variables in Render dashboard**

4. **Deploy**

### Option 4: Local Docker Deployment

1. **Create Dockerfile** (if not exists):
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY . .
   RUN npm install -g pnpm
   RUN pnpm install
   RUN pnpm --filter @paykit/demo build
   WORKDIR /app/apps/demo
   EXPOSE 3001
   CMD ["pnpm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t paykit-demo .
   docker run -p 3001:3001 \
     -e NEXT_PUBLIC_API_URL="https://your-api-domain.com/api" \
     -e NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id" \
     -e NEXT_PUBLIC_PAYMASTER_ADDRESS="0x..." \
     -e NEXT_PUBLIC_USDC_ADDRESS="0x..." \
     paykit-demo
   ```

## Testing Your Deployment

After deployment, verify:

1. **Frontend loads**: Visit your deployed URL
2. **API connection**: Check browser console for API errors
3. **Wallet connection**: Try connecting a wallet
4. **Contract interaction**: Test a transaction if contracts are deployed

## Troubleshooting

- **API CORS errors**: Ensure your API allows requests from your frontend domain
- **Build failures**: Check Node version compatibility (use Node 20+)
- **Environment variables not working**: Ensure they start with `NEXT_PUBLIC_`
- **Wallet connection issues**: Verify WalletConnect Project ID is valid

## Update API URL After API Deployment

Once your API is deployed, update the `NEXT_PUBLIC_API_URL`:

1. **For local development**:
   Edit `apps/demo/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://your-deployed-api.com/api
   ```

2. **For production**:
   Update the environment variable in your deployment platform and redeploy.
