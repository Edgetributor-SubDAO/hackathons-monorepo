'use client';

// These libraries access window at import time, so we need to use dynamic imports
const POLKADOT_RPC = process.env.NEXT_PUBLIC_POLKADOT_RPC || 'wss://rpc.polkadot.io';

export async function connectPolkadotWallet() {
    // Check if we're in browser
    if (typeof window === 'undefined') {
        throw new Error('Cannot connect wallet on server side');
    }

    // Dynamic import to avoid SSR issues
    const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
    const { ApiPromise, WsProvider } = await import('@polkadot/api');

    // Ask extensions (Talisman/SubWallet/polkadot.js) for access
    const extensions = await web3Enable('Neon Arena');
    if (!extensions || extensions.length === 0) {
        throw new Error('No Polkadot wallet extension found (install Talisman/SubWallet).');
    }

    const accounts = await web3Accounts();
    if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Polkadot wallet.');
    }

    const address = accounts[0].address;

    const provider = new WsProvider(POLKADOT_RPC);
    const api = await ApiPromise.create({ provider });

    return {
        address,
        api,
    };
}

export async function connectStellarWallet() {
    // Check if we're in browser
    if (typeof window === 'undefined') {
        throw new Error('Cannot connect wallet on server side');
    }

    // Dynamic import to avoid SSR issues
    const { isConnected, getAddress } = await import('@stellar/freighter-api');

    const connected = await isConnected();
    if (!connected) {
        throw new Error('Freighter wallet not found or not connected.');
    }

    const result = await getAddress();

    if (result.error) {
        throw new Error(result.error);
    }

    return {
        address: result.address,
    };
}
