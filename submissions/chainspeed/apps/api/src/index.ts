// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED API - MAIN SERVER
//                    Express + Socket.io for real-time testing
// ═══════════════════════════════════════════════════════════════════════════

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { testRouter } from './routes/test.js';
import { leaderboardRouter } from './routes/leaderboard.js';

// Load environment variables
import 'dotenv/config';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.io server
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Store io instance for routes to access
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Info
app.get('/api', (req, res) => {
    res.json({
        name: 'ChainSpeed API',
        version: '1.0.0',
        description: 'Ookla for Web3 - Blockchain Performance Testing',
        endpoints: {
            'GET /api/chains': 'List supported chains',
            'POST /api/test/start': 'Start a new test',
            'GET /api/result/:id': 'Get test result by ID',
            'GET /api/leaderboard': 'Get chain leaderboard',
        },
    });
});

// Mount routers
app.use('/api', testRouter);
app.use('/api', leaderboardRouter);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });

    // Allow clients to join a test room
    socket.on('join:test', (testId: string) => {
        socket.join(`test:${testId}`);
        console.log(`[Socket] Client ${socket.id} joined test room: ${testId}`);
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ⚡ ChainSpeed API Server                                    ║
║   "Ookla for Web3"                                            ║
║                                                               ║
║   Server:    http://localhost:${PORT}                           ║
║   WebSocket: ws://localhost:${PORT}                             ║
║   CORS:      ${CORS_ORIGIN}                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export { io };
