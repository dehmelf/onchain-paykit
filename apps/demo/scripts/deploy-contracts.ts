#!/usr/bin/env tsx
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';
import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
dotenv.config({ path: '../../apps/api/.env' });

async function deployContracts() {
  console.log('🚀 Deploying PayKit contracts to Base Sepolia...\n');

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.RPC_URL)
  });

  try {
    // Check if Foundry is installed
    await execAsync('forge --version');
    console.log('✅ Foundry detected');
  } catch (error) {
    console.error('❌ Foundry not found. Please install:');
    console.error('   curl -L https://foundry.paradigm.xyz | bash && foundryup');
    process.exit(1);
  }

  try {
    console.log('📦 Building contracts...');
    const { stdout } = await execAsync('cd ../../contracts && forge build');
    console.log('✅ Contracts built successfully');

    console.log('\n🚀 Deploying contracts...');
    const deployResult = await execAsync(
      `cd ../../contracts && forge script script/Deploy.s.sol --broadcast --rpc-url ${process.env.RPC_URL} --private-key ${process.env.PRIVATE_KEY}`,
      { env: { ...process.env } }
    );

    console.log('✅ Deployment successful!');
    console.log('\n📋 Deployment Output:');
    console.log(deployResult.stdout);

    // Parse deployment addresses from output
    // This is a simplified parser - in production you'd use forge's JSON output
    const parseAddress = (contractName: string, output: string): string => {
      const regex = new RegExp(`${contractName}[^:]*:\\s*(0x[a-fA-F0-9]{40})`);
      const match = output.match(regex);
      return match ? match[1] : '0x0000000000000000000000000000000000000000';
    };

    const addresses = {
      MERCHANT_REGISTRY_ADDRESS: parseAddress('MerchantRegistry', deployResult.stdout),
      USDC_VAULT_ADDRESS: parseAddress('USDCVault.*with router', deployResult.stdout),
      PAYMENT_ROUTER_ADDRESS: parseAddress('PaymentRouter.*with vault', deployResult.stdout),
      PAYMASTER_ADDRESS: parseAddress('Paymaster', deployResult.stdout),
      FEE_SPLITTER_ADDRESS: parseAddress('FeeSplitter', deployResult.stdout)
    };

    console.log('\n📋 Deployed Contract Addresses:');
    Object.entries(addresses).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    // Update environment files
    console.log('\n📝 Updating environment files...');
    updateEnvFile('../../apps/api/.env', addresses);
    updateEnvFile('../../.env.demo', addresses);

    console.log('✅ Environment files updated');
    console.log('\n🎉 Deployment complete! You can now:');
    console.log('1. Start the API: pnpm --filter @paykit/api dev');
    console.log('2. Start the demo: pnpm --filter @paykit/demo dev');
    console.log('3. Visit: http://localhost:3001');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

function updateEnvFile(filePath: string, addresses: Record<string, string>) {
  let content = readFileSync(filePath, 'utf8');
  
  Object.entries(addresses).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  });

  writeFileSync(filePath, content);
}

deployContracts().catch(console.error); 