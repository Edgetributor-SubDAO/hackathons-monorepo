// src/index.ts - Main Relayer Entry Point
import dotenv from 'dotenv';
import { StellarListener } from './services/stellarListener.js';
import { PolkadotSubmitter } from './services/polkadotSubmitter.js';
import { BatchAggregator } from './services/batchAggregator.js';
import { DatabaseService } from './services/database.js';
import { logger } from './utils/logger.js';
import express from 'express';

dotenv.config();

class CrossTipRelayer {
  private stellarListener: StellarListener;
  private polkadotSubmitter: PolkadotSubmitter;
  private batchAggregator: BatchAggregator;
  private database: DatabaseService;
  private app: express.Application;

  constructor() {
    this.database = new DatabaseService();
    this.stellarListener = new StellarListener(this.database);
    this.polkadotSubmitter = new PolkadotSubmitter();
    this.batchAggregator = new BatchAggregator(
      this.database,
      this.polkadotSubmitter
    );
    this.app = express();
  }

  async start() {
    try {
      // Initialize database
      await this.database.initialize();
      logger.info('Database initialized');

      // Initialize Polkadot connection
      await this.polkadotSubmitter.initialize();
      logger.info('Polkadot connection initialized');

      // Start Stellar event listener
      await this.stellarListener.start();
      logger.info('Stellar listener started');

      // Start batch aggregator
      this.batchAggregator.start();
      logger.info('Batch aggregator started');

      // Start HTTP server for health checks
      this.setupHttpServer();
      
      logger.info('CrossTip Relayer started successfully');
    } catch (error) {
      logger.error('Failed to start relayer:', error);
      process.exit(1);
    }
  }

  private setupHttpServer() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        stellar: this.stellarListener.isRunning(),
        polkadot: this.polkadotSubmitter.isConnected(),
      });
    });

    this.app.get('/stats', async (req, res) => {
      const stats = await this.database.getStats();
      res.json(stats);
    });

    const port = process.env.PORT || 3001;
    this.app.listen(port, () => {
      logger.info(`HTTP server listening on port ${port}`);
    });
  }

  async stop() {
    logger.info('Stopping relayer...');
    this.stellarListener.stop();
    this.batchAggregator.stop();
    await this.polkadotSubmitter.disconnect();
    await this.database.close();
    logger.info('Relayer stopped');
  }
}

// Main execution
const relayer = new CrossTipRelayer();

relayer.start().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await relayer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await relayer.stop();
  process.exit(0);
});
