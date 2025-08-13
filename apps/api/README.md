# PayKit API - Local Development

A local Fastify API server for payment processing with USDC on Base Sepolia.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file with your configuration:
```bash
# Server config
PORT=3000
LOG_LEVEL=info

# Chain configuration
CHAIN_ID=84532
PAYMENT_ROUTER_ADDRESS=0x376fA17d5B005666e3F70A4915Ce40489ee7619c

# Server signer private key (example - DO NOT USE IN PRODUCTION)
SERVER_SIGNER_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Running Locally

Start the development server with hot-reload:
```bash
pnpm dev
```

Or run once without watching:
```bash
pnpm dev:once
```

The server will start on http://localhost:3000

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Create Payment Intent
```bash
curl -X POST http://localhost:3000/intents/v1/intents \
  -H 'Content-Type: application/json' \
  -d '{
    "merchantId": "test-merchant",
    "merchantAddr": "0x1234567890123456789012345678901234567890",
    "amountUsd": 100,
    "ref": "ORDER-001"
  }'
```

### Other Routes

- **Merchants**: `/merchants/v1/merchants`
- **Webhooks**: `/webhooks/v1/webhooks/merchant`
- **Payouts**: `/payouts/v1/payouts`

## Development

- Routes are defined in `src/routes/`
- Services are in `src/services/`
- Main app configuration is in `src/app.ts`
- Server entry point is `src/dev.ts`

## Testing

Run tests:
```bash
pnpm test
```

Type checking:
```bash
pnpm typecheck
```
