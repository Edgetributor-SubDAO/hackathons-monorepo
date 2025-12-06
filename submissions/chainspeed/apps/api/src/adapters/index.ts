// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - ADAPTER EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { ChainAdapter, AdapterConfig, delay, withVariation, percentile } from './base.js';

// Simulated adapters (for MVP/testing without real blockchain connections)
export { PolkadotAdapter, polkadotAdapter } from './polkadot.js';
export { StellarAdapter, stellarAdapter } from './stellar.js';

// Real adapters (use actual blockchain SDKs)
export { PolkadotRealAdapter, polkadotRealAdapter } from './polkadot.real.js';
export { StellarRealAdapter, stellarRealAdapter } from './stellar.real.js';

import { ChainAdapter } from './base.js';
import { polkadotAdapter } from './polkadot.js';
import { stellarAdapter } from './stellar.js';
import { polkadotRealAdapter } from './polkadot.real.js';
import { stellarRealAdapter } from './stellar.real.js';

// Check environment for which adapters to use
const USE_REAL_ADAPTERS = process.env.USE_REAL_ADAPTERS === 'true';

// Registry of all available adapters (switches based on environment)
export const adapters: Record<string, ChainAdapter> = USE_REAL_ADAPTERS
    ? {
        polkadot: polkadotRealAdapter,
        stellar: stellarRealAdapter,
    }
    : {
        polkadot: polkadotAdapter,
        stellar: stellarAdapter,
    };

// Simulated adapters (always available for testing)
export const simulatedAdapters: Record<string, ChainAdapter> = {
    polkadot: polkadotAdapter,
    stellar: stellarAdapter,
};

// Real adapters (always available)
export const realAdapters: Record<string, ChainAdapter> = {
    polkadot: polkadotRealAdapter,
    stellar: stellarRealAdapter,
};

export function getAdapter(chainId: string, useReal?: boolean): ChainAdapter | undefined {
    if (useReal === true) {
        return realAdapters[chainId];
    } else if (useReal === false) {
        return simulatedAdapters[chainId];
    }
    return adapters[chainId];
}

export function getSupportedChains(): string[] {
    return Object.keys(adapters);
}
