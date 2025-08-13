import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { writeFileSync } from 'fs';

const deployerKey = generatePrivateKey();
const serverSignerKey = generatePrivateKey();
const paymasterSignerKey = generatePrivateKey();

const deployerAccount = privateKeyToAccount(deployerKey);
const serverSignerAccount = privateKeyToAccount(serverSignerKey);
const paymasterSignerAccount = privateKeyToAccount(paymasterSignerKey);

console.log('🔑 Generated Demo Accounts:');
console.log('📋 Deployer:', deployerAccount.address);
console.log('📋 Server Signer:', serverSignerAccount.address);
console.log('📋 Paymaster Signer:', paymasterSignerAccount.address);
console.log('');

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
console.log('✅ Environment file created: apps/api/.env');
console.log('');
console.log('🎯 IMPORTANT: Fund this address with Base Sepolia ETH:');
console.log(`   Address: ${deployerAccount.address}`);
console.log('   Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
console.log(''); 