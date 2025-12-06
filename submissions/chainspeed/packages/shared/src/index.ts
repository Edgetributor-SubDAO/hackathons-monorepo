// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - SHARED PACKAGE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Export all types
export * from './types';

// Export scoring functions
export {
    scoreGeneric,
    computeOverall,
    calculateScores,
    determineWinner,
    compareResults,
} from './scoring';

// Chain configurations
import { ChainConfig } from './types';

export const SUPPORTED_CHAINS: ChainConfig[] = [
    {
        id: 'polkadot',
        name: 'Polkadot',
        family: 'substrate',
        logo: '/chains/polkadot.svg',
        color: '#E6007A',
        defaultRpc: 'wss://rpc.polkadot.io',
        description: 'Heterogeneous multi-chain protocol enabling cross-chain transfers',
    },
    {
        id: 'stellar',
        name: 'Stellar',
        family: 'stellar',
        logo: '/chains/stellar.svg',
        color: '#000000',
        defaultRpc: 'https://horizon.stellar.org',
        description: 'Open network for storing and moving money with Soroban smart contracts',
    },
];

export function getChainConfig(chainId: string): ChainConfig | undefined {
    return SUPPORTED_CHAINS.find(c => c.id === chainId);
}
