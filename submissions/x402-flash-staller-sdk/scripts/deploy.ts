#!/usr/bin/env node

/**
 * Deploy x402-flash-settlement contract to Stellar Soroban
 * 
 * Prerequisites:
 * 1. Build the contract: cd contracts/x402-flash-settlement && cargo build --target wasm32-unknown-unknown --release
 * 2. Set ADMIN_SECRET_KEY in .env
 * 3. Have Stellar CLI installed
 * 
 * Usage:
 *   npm run deploy
 */

import {
  Keypair,
  SorobanRpc,
  Networks,
} from '@stellar/stellar-sdk';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function deploy() {
  const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
  
  // Load admin keypair
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  if (!adminSecret) {
    console.error('❌ ADMIN_SECRET_KEY not found in .env');
    process.exit(1);
  }
  
  const admin = Keypair.fromSecret(adminSecret);

  console.log('🚀 Deploying X402Flash Settlement Contract...');
  console.log('Admin:', admin.publicKey());

  // Check if WASM exists
  const wasmPath = path.join(__dirname, '../contracts/x402-flash-settlement/target/wasm32-unknown-unknown/release/x402_flash_settlement.wasm');
  
  if (!fs.existsSync(wasmPath)) {
    console.error('❌ WASM file not found. Please build the contract first:');
    console.error('   cd contracts/x402-flash-settlement');
    console.error('   cargo build --target wasm32-unknown-unknown --release');
    process.exit(1);
  }

  console.log('📝 WASM found at:', wasmPath);
  console.log('\n⚠️  To complete deployment, use the Stellar CLI:');
  console.log('\n1. Install WASM:');
  console.log(`   stellar contract install --wasm ${wasmPath} --network testnet --source ${adminSecret}`);
  console.log('\n2. Deploy contract (using the hash from step 1):');
  console.log('   stellar contract deploy --wasm-hash <HASH> --network testnet --source <ADMIN_SECRET>');
  console.log('\n3. Initialize contract:');
  console.log('   stellar contract invoke --id <CONTRACT_ID> --network testnet --source <ADMIN_SECRET> -- initialize --admin <ADMIN_PUBLIC>');
  console.log('\n4. Update .env with CONTRACT_ID');
}

deploy().catch(console.error);
