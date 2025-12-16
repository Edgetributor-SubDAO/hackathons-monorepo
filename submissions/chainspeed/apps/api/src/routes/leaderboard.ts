// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - LEADERBOARD ROUTES
//                    API endpoints for chain rankings
// ═══════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { LeaderboardEntry, ChainSpeedResult, SUPPORTED_CHAINS } from '@chainspeed/shared';
import { initOrchestrator, getOrchestrator } from '../services/orchestrator.js';

export const leaderboardRouter = Router();

// Initialize orchestrator on first request
let initialized = false;

function ensureInitialized(io: SocketIOServer): void {
    if (!initialized) {
        initOrchestrator(io);
        initialized = true;
    }
}

/**
 * GET /api/leaderboard
 * Get chain performance rankings
 */
leaderboardRouter.get('/leaderboard', (req: Request, res: Response) => {
    try {
        const io: SocketIOServer = req.app.get('io');
        ensureInitialized(io);

        const orchestrator = getOrchestrator();
        const allTests = orchestrator.getAllResults();

        // Aggregate results by chain
        const chainStats: Map<string, {
            scores: number[];
            latency: number[];
            throughput: number[];
            finality: number[];
            reliability: number[];
            lastUpdated: string;
        }> = new Map();

        for (const test of allTests) {
            if (test.status !== 'complete') continue;

            for (const result of test.results) {
                const stats = chainStats.get(result.chainId) || {
                    scores: [],
                    latency: [],
                    throughput: [],
                    finality: [],
                    reliability: [],
                    lastUpdated: result.timestamp,
                };

                stats.scores.push(result.scores.overall);
                stats.latency.push(result.scores.latency);
                stats.throughput.push(result.scores.throughput);
                stats.finality.push(result.scores.finality);
                stats.reliability.push(result.scores.reliability);

                if (result.timestamp > stats.lastUpdated) {
                    stats.lastUpdated = result.timestamp;
                }

                chainStats.set(result.chainId, stats);
            }
        }

        // Build leaderboard entries
        const leaderboard: LeaderboardEntry[] = [];

        for (const [chainId, stats] of chainStats) {
            const chainConfig = SUPPORTED_CHAINS.find(c => c.id === chainId);
            if (!chainConfig) continue;

            const avg = (arr: number[]) => arr.length > 0
                ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
                : 0;

            leaderboard.push({
                chainId,
                chainName: chainConfig.name,
                chainFamily: chainConfig.family,
                avgScore: avg(stats.scores),
                testCount: stats.scores.length,
                lastUpdated: stats.lastUpdated,
                scores: {
                    latency: avg(stats.latency),
                    throughput: avg(stats.throughput),
                    finality: avg(stats.finality),
                    reliability: avg(stats.reliability),
                },
            });
        }

        // Sort by average score (descending)
        leaderboard.sort((a, b) => b.avgScore - a.avgScore);

        // If no data yet, return default entries
        if (leaderboard.length === 0) {
            for (const chain of SUPPORTED_CHAINS) {
                leaderboard.push({
                    chainId: chain.id,
                    chainName: chain.name,
                    chainFamily: chain.family,
                    avgScore: 0,
                    testCount: 0,
                    lastUpdated: new Date().toISOString(),
                    scores: {
                        latency: 0,
                        throughput: 0,
                        finality: 0,
                        reliability: 0,
                    },
                });
            }
        }

        res.json({
            leaderboard,
            totalTests: allTests.length,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Leaderboard Route] Error:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to get leaderboard',
        });
    }
});
