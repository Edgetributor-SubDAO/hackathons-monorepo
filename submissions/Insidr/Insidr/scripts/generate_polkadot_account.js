#!/usr/bin/env node

// Simple script to generate a Polkadot testnet account
// Install with: npm install @polkadot/keyring @polkadot/util-crypto

const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate, cryptoWaitReady } = require('@polkadot/util-crypto');

async function generateAccount() {
  await cryptoWaitReady();
  
  const mnemonic = mnemonicGenerate();
  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromMnemonic(mnemonic);

  console.log('Polkadot Testnet Account Generated:');
  console.log('===================================');
  console.log('Mnemonic:', mnemonic);
  console.log('Address:', account.address);
  console.log('Public Key:', account.publicKey.toString('hex'));
  console.log('');
  console.log('Fund this account at: https://faucet.polkadot.io/westend');
  console.log('Or: https://use.ink/faucet');
}

generateAccount().catch(console.error);
