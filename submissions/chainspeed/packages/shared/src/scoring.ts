// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - SCORING ENGINE
//                    Normalize metrics to 0-100 scores
// ═══════════════════════════════════════════════════════════════════════════

import { GenericMetrics, ChainSpeedScores, ChainSpeedResult } from './types';

/**
 * Score latency metric (lower is better)
 * <50ms → 95-100
 * 50-100ms → 85-95
 * 100-200ms → 70-85
 * 200-500ms → 50-70
 * >500ms → 0-50
 */
function scoreLatency(latencyP50: number): number {
    if (latencyP50 <= 50) {
        return Math.round(95 + (50 - latencyP50) / 10);
    } else if (latencyP50 <= 100) {
        return Math.round(85 + (100 - latencyP50) / 5);
    } else if (latencyP50 <= 200) {
        return Math.round(70 + (200 - latencyP50) / 6.67);
    } else if (latencyP50 <= 500) {
        return Math.round(50 + (500 - latencyP50) / 15);
    } else {
        return Math.max(0, Math.round(50 - (latencyP50 - 500) / 50));
    }
}

/**
 * Score throughput metric (higher is better)
 * >1000 TPS → 95-100
 * 100-1000 TPS → 70-95
 * 10-100 TPS → 50-70
 * <10 TPS → 0-50
 */
function scoreThroughput(tps: number): number {
    if (tps >= 1000) {
        return Math.min(100, Math.round(95 + (tps - 1000) / 200));
    } else if (tps >= 100) {
        return Math.round(70 + (tps - 100) / 36);
    } else if (tps >= 10) {
        return Math.round(50 + (tps - 10) / 4.5);
    } else {
        return Math.max(0, Math.round(tps * 5));
    }
}

/**
 * Score finality time (lower is better)
 * <1s → 95-100 (instant finality chains like Stellar)
 * 1-6s → 85-95 (fast finality)
 * 6-15s → 70-85 (medium finality like Polkadot)
 * 15-60s → 40-70
 * >60s → 0-40
 */
function scoreFinality(finalitySeconds: number): number {
    if (finalitySeconds <= 1) {
        return Math.round(95 + (1 - finalitySeconds) * 5);
    } else if (finalitySeconds <= 6) {
        return Math.round(85 + (6 - finalitySeconds) * 2);
    } else if (finalitySeconds <= 15) {
        return Math.round(70 + (15 - finalitySeconds) * 1.67);
    } else if (finalitySeconds <= 60) {
        return Math.round(40 + (60 - finalitySeconds) * 0.67);
    } else {
        return Math.max(0, Math.round(40 - (finalitySeconds - 60) / 3));
    }
}

/**
 * Score reliability (error rate - lower is better)
 * 0% errors → 100
 * 0.1% errors → 99
 * 1% errors → 90
 * 5% errors → 50
 * >10% errors → 0
 */
function scoreReliability(errorRate: number): number {
    if (errorRate <= 0) {
        return 100;
    } else if (errorRate <= 0.001) {
        return Math.round(99 + (0.001 - errorRate) * 1000);
    } else if (errorRate <= 0.01) {
        return Math.round(90 + (0.01 - errorRate) * 1000);
    } else if (errorRate <= 0.05) {
        return Math.round(50 + (0.05 - errorRate) * 1000);
    } else if (errorRate <= 0.1) {
        return Math.round((0.1 - errorRate) * 1000);
    } else {
        return 0;
    }
}

/**
 * Calculate individual scores from generic metrics
 */
export function scoreGeneric(metrics: GenericMetrics): Omit<ChainSpeedScores, 'overall'> {
    return {
        latency: Math.min(100, Math.max(0, scoreLatency(metrics.rpcLatencyP50))),
        throughput: Math.min(100, Math.max(0, scoreThroughput(metrics.txThroughput))),
        finality: Math.min(100, Math.max(0, scoreFinality(metrics.finalityTime))),
        reliability: Math.min(100, Math.max(0, scoreReliability(metrics.errorRate))),
    };
}

/**
 * Compute overall score from individual scores
 * Uses weighted average with configurable weights
 */
export function computeOverall(
    scores: Omit<ChainSpeedScores, 'overall'>,
    weights: { latency: number; throughput: number; finality: number; reliability: number } = {
        latency: 0.3,
        throughput: 0.25,
        finality: 0.25,
        reliability: 0.2,
    }
): ChainSpeedScores {
    const { latency, throughput, finality, reliability } = scores;

    const overall = Math.round(
        latency * weights.latency +
        throughput * weights.throughput +
        finality * weights.finality +
        reliability * weights.reliability
    );

    return {
        ...scores,
        overall: Math.min(100, Math.max(0, overall)),
    };
}

/**
 * Calculate complete scores from metrics
 */
export function calculateScores(metrics: GenericMetrics): ChainSpeedScores {
    const partialScores = scoreGeneric(metrics);
    return computeOverall(partialScores);
}

/**
 * Determine the winner from multiple test results
 */
export function determineWinner(results: ChainSpeedResult[]): string {
    if (results.length === 0) {
        throw new Error('No results to compare');
    }

    let winner = results[0];
    for (const result of results) {
        if (result.scores.overall > winner.scores.overall) {
            winner = result;
        }
    }

    return winner.chainId;
}

/**
 * Compare two results and return comparison data
 */
export function compareResults(a: ChainSpeedResult, b: ChainSpeedResult): {
    winner: string;
    margin: number;
    comparison: {
        metric: string;
        aValue: number;
        bValue: number;
        winner: string;
    }[];
} {
    const winner = a.scores.overall >= b.scores.overall ? a.chainId : b.chainId;
    const margin = Math.abs(a.scores.overall - b.scores.overall);

    const comparison = [
        { metric: 'latency', aValue: a.scores.latency, bValue: b.scores.latency, winner: a.scores.latency >= b.scores.latency ? a.chainId : b.chainId },
        { metric: 'throughput', aValue: a.scores.throughput, bValue: b.scores.throughput, winner: a.scores.throughput >= b.scores.throughput ? a.chainId : b.chainId },
        { metric: 'finality', aValue: a.scores.finality, bValue: b.scores.finality, winner: a.scores.finality >= b.scores.finality ? a.chainId : b.chainId },
        { metric: 'reliability', aValue: a.scores.reliability, bValue: b.scores.reliability, winner: a.scores.reliability >= b.scores.reliability ? a.chainId : b.chainId },
    ];

    return { winner, margin, comparison };
}
