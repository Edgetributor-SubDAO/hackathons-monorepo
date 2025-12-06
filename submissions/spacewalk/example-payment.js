#!/usr/bin/env node
/**
 * Example: Make a payment on Spacewalk parachain
 * 
 * Usage: node example-payment.js
 * 
 * Prerequisites:
 *   npm install @polkadot/api @polkadot/keyring
 */

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

async function main() {
    console.log('🔗 Connecting to Spacewalk parachain...');
    
    // Connect to Spacewalk
    const provider = new WsProvider('ws://localhost:9951');
    const api = await ApiPromise.create({ provider });
    
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    
    // Alice account (from dev chain)
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    
    console.log('📊 Account addresses:');
    console.log(`   Alice: ${alice.address}`);
    console.log(`   Bob: ${bob.address}`);
    
    // Check balances
    const aliceBalance = await api.query.system.account(alice.address);
    console.log(`\n💰 Alice balance: ${aliceBalance.data.free.toString()}`);
    
    // Make a transfer (native currency)
    console.log('\n💸 Making payment: Alice → Bob (1000 units)...');
    
    const transfer = api.tx.balances.transferKeepAlive(bob.address, 1000);
    
    const hash = await transfer.signAndSend(alice);
    console.log(`✅ Transaction submitted: ${hash}`);
    
    // Wait for block
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check new balances
    const bobBalance = await api.query.system.account(bob.address);
    console.log(`\n💰 Bob balance: ${bobBalance.data.free.toString()}`);
    
    await api.disconnect();
    console.log('\n✅ Done!');
}

main().catch(console.error);

