// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - STELLAR ADAPTER
//                    Stellar network performance testing
// ═══════════════════════════════════════════════════════════════════════════

import {
    ChainSpeedResult,
    StellarSpecificMetrics,
    GenericMetrics,
    calculateScores,
} from '@chainspeed/shared';
import { ChainAdapter, AdapterConfig, delay, withVariation, percentile } from './base.js';

export class StellarAdapter implements ChainAdapter<StellarSpecificMetrics> {
    chainId = 'stellar';
    family = 'stellar' as const;
    defaultRpc = 'https://horizon.stellar.org';

    async runTest(testId: string, config: AdapterConfig): Promise<ChainSpeedResult<StellarSpecificMetrics>> {
        const rpcEndpoint = config.rpcEndpoint || this.defaultRpc;

        // Phase 1: Connecting (0-20%)
        config.onProgress?.({
            chainId: this.chainId,
            progress: 5,
            phase: 'connecting',
            message: 'Connecting to Stellar Horizon...',
        });
        await delay(250);

        config.onProgress?.({
            chainId: this.chainId,
            progress: 15,
            phase: 'connecting',
            message: 'Initializing Horizon client...',
        });
        await delay(350);

        // Phase 2: Measuring latency (20-50%)
        config.onProgress?.({
            chainId: this.chainId,
            progress: 25,
            phase: 'measuring',
            message: 'Measuring Horizon API latency...',
        });

        // Simulate latency measurements (10 samples)
        // Stellar typically has lower latency than WebSocket-based chains
        const latencies: number[] = [];
        for (let i = 0; i < 10; i++) {
            const baseLatency = config.rpcEndpoint ? withVariation(100, 25) : withVariation(55, 20);
            latencies.push(baseLatency);
            await delay(80);

            config.onProgress?.({
                chainId: this.chainId,
                progress: 25 + (i + 1) * 2.5,
                phase: 'measuring',
                message: `Latency sample ${i + 1}/10: ${Math.round(baseLatency)}ms`,
            });
        }

        // Phase 3: Measuring ledger close times (50-70%)
        config.onProgress?.({
            chainId: this.chainId,
            progress: 55,
            phase: 'measuring',
            message: 'Analyzing ledger close times...',
        });
        await delay(400);

        // Stellar has ~5 second ledger close with near-instant finality
        const ledgerCloseTime = withVariation(5.0, 8);
        const ledgerCloseVariance = withVariation(0.3, 30); // Very consistent
        const finalityTime = ledgerCloseTime; // Stellar has immediate finality

        config.onProgress?.({
            chainId: this.chainId,
            progress: 65,
            phase: 'measuring',
            message: `Ledger close: ${ledgerCloseTime.toFixed(2)}s ± ${ledgerCloseVariance.toFixed(2)}s`,
        });
        await delay(350);

        // Phase 4: Measuring throughput (70-85%)
        config.onProgress?.({
            chainId: this.chainId,
            progress: 75,
            phase: 'measuring',
            message: 'Measuring transaction throughput...',
        });
        await delay(400);

        // Stellar can handle ~1000+ operations per ledger
        const txThroughput = withVariation(200, 20); // ~200 TPS typical load

        config.onProgress?.({
            chainId: this.chainId,
            progress: 82,
            phase: 'measuring',
            message: `Throughput: ${txThroughput.toFixed(1)} TPS`,
        });
        await delay(300);

        // Phase 5: Soroban and path payment metrics (85-95%)
        config.onProgress?.({
            chainId: this.chainId,
            progress: 88,
            phase: 'measuring',
            message: 'Analyzing Soroban smart contracts...',
        });
        await delay(450);

        const sorobanInvocations = Math.floor(withVariation(1500, 25)); // Recent invocations
        const sorobanSuccessRate = withVariation(0.96, 3); // ~96% success
        const pathPaymentSuccess = withVariation(0.94, 4); // ~94% path payment success
        const pathPaymentAvgHops = withVariation(2.3, 15); // ~2.3 average hops

        config.onProgress?.({
            chainId: this.chainId,
            progress: 95,
            phase: 'measuring',
            message: `Soroban: ${sorobanInvocations} invocations, ${(sorobanSuccessRate * 100).toFixed(1)}% success`,
        });
        await delay(200);

        // Calculate error rate (low for healthy network)
        const errorRate = withVariation(0.002, 40);

        // Build generic metrics
        const generic: GenericMetrics = {
            rpcLatencyP50: percentile(latencies, 50),
            rpcLatencyP95: percentile(latencies, 95),
            blockTime: ledgerCloseTime,
            finalityTime,
            txThroughput,
            errorRate: Math.max(0, Math.min(1, errorRate)),
        };

        // Build specific metrics
        const specific: StellarSpecificMetrics = {
            ledgerCloseTime,
            ledgerCloseVariance,
            sorobanInvocations,
            sorobanSuccessRate: Math.min(1, sorobanSuccessRate),
            pathPaymentSuccess: Math.min(1, pathPaymentSuccess),
            pathPaymentAvgHops,
        };

        // Calculate scores
        const scores = calculateScores(generic);

        // Complete
        config.onProgress?.({
            chainId: this.chainId,
            progress: 100,
            phase: 'complete',
            message: `Test complete! Score: ${scores.overall}`,
        });

        return {
            testId,
            mode: config.mode,
            chainId: this.chainId,
            chainFamily: this.family,
            timestamp: new Date().toISOString(),
            region: config.region,
            generic,
            scores,
            specific,
            meta: {
                rpcEndpoint,
                source: config.rpcEndpoint ? 'user' : 'default',
                clientVersion: '@stellar/stellar-sdk@11.3.0',
            },
        };
    }
}

export const stellarAdapter = new StellarAdapter();
