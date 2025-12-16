import { Keypair } from '@stellar/stellar-sdk';

async function setup() {
  console.log('🌟 Setting up Stellar Testnet accounts...\n');

  // Generate keypairs
  const admin = Keypair.random();
  const client = Keypair.random();
  const server = Keypair.random();

  console.log('Admin Account:');
  console.log('  Public:', admin.publicKey());
  console.log('  Secret:', admin.secret());

  console.log('\nClient Account:');
  console.log('  Public:', client.publicKey());
  console.log('  Secret:', client.secret());

  console.log('\nServer Account:');
  console.log('  Public:', server.publicKey());
  console.log('  Secret:', server.secret());

  // Fund from Friendbot
  console.log('\n💰 Funding accounts from Friendbot...');
  
  const friendbotUrl = 'https://friendbot.stellar.org';
  
  try {
    await fetch(`${friendbotUrl}?addr=${admin.publicKey()}`);
    console.log('✅ Admin funded');

    await fetch(`${friendbotUrl}?addr=${client.publicKey()}`);
    console.log('✅ Client funded');

    await fetch(`${friendbotUrl}?addr=${server.publicKey()}`);
    console.log('✅ Server funded');

    console.log('\n📝 Add these to your .env file:');
    console.log(`ADMIN_SECRET_KEY=${admin.secret()}`);
    console.log(`CLIENT_SECRET_KEY=${client.secret()}`);
    console.log(`SERVER_SECRET_KEY=${server.secret()}`);
    console.log(`PAYMENT_ADDRESS=${server.publicKey()}`);
    console.log(`SERVER_ADDRESS=${server.publicKey()}`);
  } catch (error) {
    console.error('Error funding accounts:', error);
  }
}

setup().catch(console.error);
