// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - BASE ADAPTER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

import {
    ChainFamily,
    TestMode,
    Region,
    ChainSpeedResult,
    ChainSpecificMetrics,
    TestProgressEvent,
} from '@chainspeed/shared';

export interface AdapterConfig {
    mode: TestMode;
    rpcEndpoint?: string;
    region: Region;
    onProgress?: (event: Omit<TestProgressEvent, 'type' | 'testId'>) => void;
}

export interface ChainAdapter<TSpecific extends ChainSpecificMetrics = ChainSpecificMetrics> {
    /** Unique chain identifier */
    chainId: string;
    /** Chain family for categorization */
    family: ChainFamily;
    /** Default RPC endpoint */
    defaultRpc: string;
    /** Run performance test and return results */
    runTest(testId: string, config: AdapterConfig): Promise<ChainSpeedResult<TSpecific>>;
}

/**
 * Helper to simulate network delay for more realistic testing
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate percentiles from an array of numbers
 */
export function percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

/**
 * Generate random variation for metrics (for MVP simulation)
 */
export function withVariation(base: number, variationPercent: number = 10): number {
    const variation = base * (variationPercent / 100);
    return base + (Math.random() - 0.5) * 2 * variation;
}
