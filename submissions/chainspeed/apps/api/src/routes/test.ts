// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - TEST ROUTES
//                    API endpoints for test management
// ═══════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { StartTestRequest, StartTestResponse, SUPPORTED_CHAINS } from '@chainspeed/shared';
import { initOrchestrator, getOrchestrator } from '../services/orchestrator.js';
import { getSupportedChains } from '../adapters/index.js';

export const testRouter = Router();

// Initialize orchestrator on first request
let initialized = false;

function ensureInitialized(io: SocketIOServer): void {
    if (!initialized) {
        initOrchestrator(io);
        initialized = true;
    }
}

/**
 * GET /api/chains
 * List all supported chains
 */
testRouter.get('/chains', (req: Request, res: Response) => {
    res.json({
        chains: SUPPORTED_CHAINS,
        supported: getSupportedChains(),
    });
});

/**
 * POST /api/test/start
 * Start a new performance test
 */
testRouter.post('/test/start', async (req: Request, res: Response) => {
    try {
        const io: SocketIOServer = req.app.get('io');
        ensureInitialized(io);

        const body: StartTestRequest = req.body;

        // Validate request
        if (!body.mode) {
            return res.status(400).json({
                status: 'error',
                message: 'mode is required (network-benchmark or node-diagnostic)',
            });
        }

        if (!body.chains || !Array.isArray(body.chains) || body.chains.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'chains array is required',
            });
        }

        // For node-diagnostic mode, validate userRpc
        if (body.mode === 'node-diagnostic' && !body.userRpc) {
            return res.status(400).json({
                status: 'error',
                message: 'userRpc is required for node-diagnostic mode',
            });
        }

        const orchestrator = getOrchestrator();
        const testId = await orchestrator.startTest(body, body.socketId);

        const response: StartTestResponse = {
            testId,
            status: 'started',
            message: `Testing ${body.chains.join(', ')} in ${body.mode} mode`,
        };

        res.json(response);
    } catch (error) {
        console.error('[Test Route] Error starting test:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to start test',
        });
    }
});

/**
 * GET /api/result/:id
 * Get test result by ID
 */
testRouter.get('/result/:id', (req: Request, res: Response) => {
    try {
        const io: SocketIOServer = req.app.get('io');
        ensureInitialized(io);

        const { id } = req.params;
        const orchestrator = getOrchestrator();
        const result = orchestrator.getTestResult(id);

        if (!result) {
            return res.status(404).json({
                status: 'error',
                message: 'Test result not found',
            });
        }

        res.json(result);
    } catch (error) {
        console.error('[Test Route] Error getting result:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to get result',
        });
    }
});
