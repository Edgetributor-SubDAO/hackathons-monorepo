// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - TEST ORCHESTRATOR
//                    Manages test execution and result aggregation
// ═══════════════════════════════════════════════════════════════════════════

import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
    TestMode,
    Region,
    ChainSpeedResult,
    StartTestRequest,
    TestProgressEvent,
    TestResultEvent,
    TestCompleteEvent,
    TestErrorEvent,
    determineWinner,
} from '@chainspeed/shared';
import { getAdapter, getSupportedChains, AdapterConfig } from '../adapters/index.js';

// In-memory storage for MVP (replace with DB in production)
interface TestRecord {
    id: string;
    mode: TestMode;
    chains: string[];
    status: 'running' | 'complete' | 'error';
    results: ChainSpeedResult[];
    winner?: string;
    createdAt: string;
    completedAt?: string;
}

const testStore: Map<string, TestRecord> = new Map();

export class TestOrchestrator {
    private io: SocketIOServer;
    private region: Region = 'us-east'; // Default region for MVP

    constructor(io: SocketIOServer) {
        this.io = io;
    }

    /**
     * Start a new test
     */
    async startTest(request: StartTestRequest, socketId?: string): Promise<string> {
        const testId = uuidv4();

        // Validate chains
        const supportedChains = getSupportedChains();
        const validChains = request.chains.filter(c => supportedChains.includes(c));

        if (validChains.length === 0) {
            throw new Error(`No valid chains provided. Supported: ${supportedChains.join(', ')}`);
        }

        // Create test record
        const testRecord: TestRecord = {
            id: testId,
            mode: request.mode,
            chains: validChains,
            status: 'running',
            results: [],
            createdAt: new Date().toISOString(),
        };
        testStore.set(testId, testRecord);

        // Join socket to test room if provided
        if (socketId) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(`test:${testId}`);
            }
        }

        // Run tests in parallel
        this.executeTests(testId, validChains, request).catch(error => {
            console.error(`[Orchestrator] Test ${testId} failed:`, error);
            this.emitError(testId, undefined, error.message);
        });

        return testId;
    }

    /**
     * Execute tests for all chains
     */
    private async executeTests(testId: string, chains: string[], request: StartTestRequest): Promise<void> {
        const results: ChainSpeedResult[] = [];

        // Run all chain tests in parallel
        const testPromises = chains.map(async (chainId) => {
            const adapter = getAdapter(chainId);
            if (!adapter) {
                this.emitError(testId, chainId, `Adapter not found for chain: ${chainId}`);
                return null;
            }

            const config: AdapterConfig = {
                mode: request.mode,
                rpcEndpoint: request.mode === 'node-diagnostic' && request.selectedChain === chainId
                    ? request.userRpc
                    : undefined,
                region: this.region,
                onProgress: (event) => {
                    this.emitProgress(testId, {
                        ...event,
                        testId,
                        type: 'test:progress',
                    });
                },
            };

            try {
                const result = await adapter.runTest(testId, config);
                this.emitResult(testId, result);
                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.emitError(testId, chainId, errorMessage);
                return null;
            }
        });

        // Wait for all tests to complete
        const testResults = await Promise.all(testPromises);

        // Filter out null results (failed tests)
        const validResults = testResults.filter((r): r is ChainSpeedResult => r !== null);

        // Update test record
        const testRecord = testStore.get(testId);
        if (testRecord) {
            testRecord.results = validResults;
            testRecord.status = 'complete';
            testRecord.completedAt = new Date().toISOString();

            if (validResults.length > 0) {
                testRecord.winner = determineWinner(validResults);
            }
        }

        // Emit completion
        if (validResults.length > 0) {
            this.emitComplete(testId, validResults);
        }
    }

    /**
     * Get test result by ID
     */
    getTestResult(testId: string): TestRecord | undefined {
        return testStore.get(testId);
    }

    /**
     * Get all test results (for leaderboard)
     */
    getAllResults(): TestRecord[] {
        return Array.from(testStore.values());
    }

    // WebSocket event emitters
    private emitProgress(testId: string, event: TestProgressEvent): void {
        this.io.to(`test:${testId}`).emit('test:progress', event);
    }

    private emitResult(testId: string, result: ChainSpeedResult): void {
        const event: TestResultEvent = {
            type: 'test:result',
            testId,
            payload: result,
        };
        this.io.to(`test:${testId}`).emit('test:result', event);
    }

    private emitComplete(testId: string, results: ChainSpeedResult[]): void {
        const winner = determineWinner(results);
        const event: TestCompleteEvent = {
            type: 'test:complete',
            testId,
            winner,
            results,
        };
        this.io.to(`test:${testId}`).emit('test:complete', event);
    }

    private emitError(testId: string, chainId: string | undefined, error: string): void {
        const event: TestErrorEvent = {
            type: 'test:error',
            testId,
            chainId,
            error,
        };
        this.io.to(`test:${testId}`).emit('test:error', event);
    }
}

// Singleton instance (will be initialized in index.ts)
let orchestrator: TestOrchestrator | null = null;

export function initOrchestrator(io: SocketIOServer): TestOrchestrator {
    orchestrator = new TestOrchestrator(io);
    return orchestrator;
}

export function getOrchestrator(): TestOrchestrator {
    if (!orchestrator) {
        throw new Error('Orchestrator not initialized');
    }
    return orchestrator;
}
