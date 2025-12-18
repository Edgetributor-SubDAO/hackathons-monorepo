// src/services/database.ts
import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger.js';

export interface TipEvent {
  id?: number;
  creator: string;
  tipper: string;
  amount: string;
  tx_hash: string;
  timestamp: Date;
  processed: boolean;
  batch_id?: string;
}

export interface Settlement {
  id?: number;
  batch_id: string;
  entries: any;
  batch_root: string;
  signature: string;
  submitted_at: Date;
  confirmed: boolean;
  polkadot_tx_hash?: string;
}

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async initialize() {
    await this.createTables();
  }

  private async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tip_events (
          id SERIAL PRIMARY KEY,
          creator TEXT NOT NULL,
          tipper TEXT NOT NULL,
          amount TEXT NOT NULL,
          tx_hash TEXT UNIQUE NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          processed BOOLEAN DEFAULT FALSE,
          batch_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_tip_events_processed ON tip_events(processed);
        CREATE INDEX IF NOT EXISTS idx_tip_events_batch_id ON tip_events(batch_id);
        CREATE INDEX IF NOT EXISTS idx_tip_events_creator ON tip_events(creator);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS settlements (
          id SERIAL PRIMARY KEY,
          batch_id TEXT UNIQUE NOT NULL,
          entries JSONB NOT NULL,
          batch_root TEXT NOT NULL,
          signature TEXT NOT NULL,
          submitted_at TIMESTAMP DEFAULT NOW(),
          confirmed BOOLEAN DEFAULT FALSE,
          polkadot_tx_hash TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_settlements_batch_id ON settlements(batch_id);
        CREATE INDEX IF NOT EXISTS idx_settlements_confirmed ON settlements(confirmed);
      `);

      logger.info('Database tables initialized');
    } finally {
      client.release();
    }
  }

  async saveTipEvent(event: TipEvent): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO tip_events (creator, tipper, amount, tx_hash, timestamp)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [event.creator, event.tipper, event.amount, event.tx_hash, event.timestamp]
      );
      logger.debug('Tip event saved:', event.tx_hash);
    } catch (error) {
      logger.error('Error saving tip event:', error);
      throw error;
    }
  }

  async getPendingTips(limit: number = 100): Promise<TipEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM tip_events 
       WHERE processed = FALSE 
       ORDER BY timestamp ASC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async markTipsProcessed(txHashes: string[], batchId: string): Promise<void> {
    await this.pool.query(
      `UPDATE tip_events 
       SET processed = TRUE, batch_id = $1 
       WHERE tx_hash = ANY($2)`,
      [batchId, txHashes]
    );
  }

  async saveSettlement(settlement: Settlement): Promise<void> {
    await this.pool.query(
      `INSERT INTO settlements (batch_id, entries, batch_root, signature, submitted_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        settlement.batch_id,
        JSON.stringify(settlement.entries),
        settlement.batch_root,
        settlement.signature,
        settlement.submitted_at,
      ]
    );
    logger.info('Settlement saved:', settlement.batch_id);
  }

  async confirmSettlement(batchId: string, txHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE settlements 
       SET confirmed = TRUE, polkadot_tx_hash = $1 
       WHERE batch_id = $2`,
      [txHash, batchId]
    );
  }

  async getStats() {
    const result = await this.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tip_events) as total_tips,
        (SELECT COUNT(*) FROM tip_events WHERE processed = TRUE) as processed_tips,
        (SELECT COUNT(*) FROM settlements) as total_settlements,
        (SELECT COUNT(*) FROM settlements WHERE confirmed = TRUE) as confirmed_settlements,
        (SELECT COALESCE(SUM(CAST(amount AS BIGINT)), 0) FROM tip_events) as total_amount
    `);
    return result.rows[0];
  }

  async close() {
    await this.pool.end();
  }
}
