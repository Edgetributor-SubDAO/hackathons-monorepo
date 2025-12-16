import { Keypair } from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

async function setup() {
  console.log('🔑 Setting up Stellar wallet for MCP...\n');

  // Generate new keypair
  const keypair = Keypair.random();

  console.log('Public Key:', keypair.publicKey());
  console.log('Secret Key:', keypair.secret());

  // Fund from friendbot
  console.log('\n💰 Funding from Friendbot...');
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${keypair.publicKey()}`
  );

  if (response.ok) {
    console.log('✅ Account funded!');
  } else {
    console.log('❌ Failed to fund account');
  }

  // Create .env file
  const envContent = `
# Stellar Configuration
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK=Test SDF Network ; September 2015
HORIZON_URL=https://horizon-testnet.stellar.org

# Wallet
WALLET_SECRET_KEY=${keypair.secret()}
WALLET_PUBLIC_KEY=${keypair.publicKey()}

# Contracts (update after deployment)
X402_CONTRACT_ID=
USDC_CONTRACT_ID=

# Agent Registry (optional)
AGENT_REGISTRY_URL=https://registry.x402.ai
`;

  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent.trim());
  console.log('\n✅ .env file created!');
  console.log('\n📝 Next steps:');
  console.log('1. Deploy x402-flash contract');
  console.log('2. Update X402_CONTRACT_ID in .env');
  console.log('3. Build: npm run build');
  console.log('4. Configure Claude Desktop');
}

setup().catch(console.error);
