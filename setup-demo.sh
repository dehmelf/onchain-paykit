#!/bin/bash

# PayKit Demo Setup Script
# This script sets up the complete demo environment for Base Sepolia

set -e

echo "🚀 PayKit Demo Setup"
echo "===================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "20" ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 20+"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚙️  Installing pnpm..."
    corepack enable
    corepack prepare pnpm@9.7.0 --activate
fi

echo "✅ pnpm $(pnpm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Generate demo environment
echo ""
echo "🔑 Generating demo keys and environment..."

# Create a simple key generation script
cat > generate-keys.js << 'EOF'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { writeFileSync } from 'fs';

const deployerKey = generatePrivateKey();
const serverSignerKey = generatePrivateKey();
const paymasterSignerKey = generatePrivateKey();

const deployerAccount = privateKeyToAccount(deployerKey);
const serverSignerAccount = privateKeyToAccount(serverSignerKey);
const paymasterSignerAccount = privateKeyToAccount(paymasterSignerKey);

console.log('Generated Demo Accounts:');
console.log('📋 Deployer:', deployerAccount.address);
console.log('📋 Server Signer:', serverSignerAccount.address);
console.log('📋 Paymaster Signer:', paymasterSignerAccount.address);

const envContent = `# PayKit Demo Environment - Base Sepolia
# Generated on ${new Date().toISOString()}

# Chain Configuration
CHAIN_ID=84532
RPC_URL=https://sepolia.base.org
RELAYER_BUNDLER_URL=https://api.pimlico.io/v2/base-sepolia/rpc?apikey=YOUR_PIMLICO_KEY

# Generated Keys (FOR DEMO ONLY - DO NOT USE IN PRODUCTION)
PRIVATE_KEY=${deployerKey}
SERVER_SIGNER_PK=${serverSignerKey}
PAYMASTER_SIGNER_PK=${paymasterSignerKey}

# Contract Addresses (update after deployment)
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
PAYMENT_ROUTER_ADDRESS=0x0000000000000000000000000000000000000000
MERCHANT_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
USDC_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
PAYMASTER_ADDRESS=0x0000000000000000000000000000000000000000

# API Configuration
DATABASE_URL=postgres://paykit:paykit@localhost:5432/paykit
REDIS_URL=redis://localhost:6379
PORT=4000

# Demo Configuration
WEB_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:4000
WEBHOOK_HMAC_SECRET=demo_webhook_secret_${Math.random().toString(36).substring(7)}

# Deployment Configuration
FEE_BPS=250
FEE_RECIPIENT=${deployerAccount.address}
`;

writeFileSync('apps/api/.env', envContent);
console.log('\n✅ Environment file created: apps/api/.env');
EOF

# Run key generation
node generate-keys.js
rm generate-keys.js

echo ""
echo "✅ Demo setup complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Fund the deployer account with Base Sepolia ETH:"
echo "   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
echo ""
echo "2. (Optional) Get a Pimlico API key for bundler integration:"
echo "   https://dashboard.pimlico.io/"
echo "   Update RELAYER_BUNDLER_URL in apps/api/.env"
echo ""
echo "3. Install Foundry for contract deployment:"
echo "   curl -L https://foundry.paradigm.xyz | bash"
echo "   foundryup"
echo ""
echo "4. Deploy contracts (after funding and installing Foundry):"
echo "   cd contracts"
echo "   source ../apps/api/.env"
echo "   forge script script/Deploy.s.sol --broadcast --rpc-url \$RPC_URL --private-key \$PRIVATE_KEY"
echo ""
echo "5. Start the demo:"
echo "   Terminal 1: pnpm --filter @paykit/api dev"
echo "   Terminal 2: pnpm --filter @paykit/demo dev"
echo "   Visit: http://localhost:3001"
echo ""
echo "📖 For detailed instructions, see DEMO.md"
echo ""
echo "🎉 Happy building with PayKit!" 