// src/services/batchAggregator.ts
import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import { DatabaseService, Settlement } from './database.js';
import { PolkadotSubmitter } from './polkadotSubmitter.js';
import { MerkleTree } from '../utils/merkle.js';
import { logger } from '../utils/logger';

const ec = new EC('secp256k1');

export class BatchAggregator {
  private database: DatabaseService;
  private polkadotSubmitter: PolkadotSubmitter;
  private interval: NodeJS.Timeout | null = null;
  private batchIntervalMs: number;
  private minBatchSize: number;
  private maxBatchSize: number;
  private relayerPrivateKey: string;

  constructor(database: DatabaseService, polkadotSubmitter: PolkadotSubmitter) {
    this.database = database;
    this.polkadotSubmitter = polkadotSubmitter;
    this.batchIntervalMs = parseInt(process.env.BATCH_INTERVAL_MS || '15000');
    this.minBatchSize = parseInt(process.env.MIN_BATCH_SIZE || '1');
    this.maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE || '100');
    this.relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY || '';

    if (!this.relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY not configured');
    }
  }

  start() {
    logger.info('Starting batch aggregator...');
    this.interval = setInterval(() => {
      this.processBatch().catch((error) => {
        logger.error('Error processing batch:', error);
      });
    }, this.batchIntervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info('Batch aggregator stopped');
  }

  private async processBatch() {
    try {
      // Get pending tips
      const pendingTips = await this.database.getPendingTips(this.maxBatchSize);

      if (pendingTips.length < this.minBatchSize) {
        logger.debug(`Not enough tips to batch (${pendingTips.length}/${this.minBatchSize})`);
        return;
      }

      logger.info(`Processing batch of ${pendingTips.length} tips`);

      // Group by creator
      const grouped: Record<string, { total: bigint; txHashes: string[] }> = {};
      
      for (const tip of pendingTips) {
        if (!grouped[tip.creator]) {
          grouped[tip.creator] = { total: BigInt(0), txHashes: [] };
        }
        grouped[tip.creator].total += BigInt(tip.amount);
        grouped[tip.creator].txHashes.push(tip.tx_hash);
      }

      // Build settlement entries
      const entries: any[] = [];
      const leafHashes: string[] = [];

      for (const creator in grouped) {
        const txs = grouped[creator].txHashes;
        const merkleRoot = MerkleTree.buildRoot(txs);
        
        const entry = {
          creator,
          total: grouped[creator].total.toString(),
          tx_count: txs.length,
          merkle_root: merkleRoot,
          tx_hashes: txs,
        };
        
        entries.push(entry);
        leafHashes.push(merkleRoot || MerkleTree.hashData(JSON.stringify(entry)));
      }

      // Build global Merkle root
      const batchRoot = MerkleTree.buildRoot(leafHashes);
      const batchId = crypto.randomBytes(8).toString('hex');

      const settlement = {
        timestamp: Date.now(),
        batch_id: batchId,
        entries,
        batch_root: batchRoot,
      };

      // Sign settlement
      const settlementHex = Buffer.from(JSON.stringify(settlement)).toString('hex');
      const signature = this.signPayload(settlementHex);

      // Save to database
      await this.database.saveSettlement({
        batch_id: batchId,
        entries: settlement.entries,
        batch_root: batchRoot,
        signature,
        submitted_at: new Date(),
        confirmed: false,
      });

      // Mark tips as processed
      const allTxHashes = pendingTips.map((t) => t.tx_hash);
      await this.database.markTipsProcessed(allTxHashes, batchId);

      // Submit to Polkadot
      logger.info(`Submitting settlement ${batchId} to Polkadot...`);
      const txHash = await this.polkadotSubmitter.submitSettlement(settlement, signature);
      
      if (txHash) {
        await this.database.confirmSettlement(batchId, txHash);
        logger.info(`Settlement ${batchId} confirmed on Polkadot: ${txHash}`);
      }

    } catch (error) {
      logger.error('Error in processBatch:', error);
      throw error;
    }
  }

  private signPayload(payloadHex: string): string {
    const key = ec.keyFromPrivate(this.relayerPrivateKey, 'hex');
    const msgHash = crypto
      .createHash('sha256')
      .update(Buffer.from(payloadHex, 'hex'))
      .digest();
    const sig = key.sign(msgHash);
    const der = Buffer.from(sig.toDER());
    return der.toString('hex');
  }
}
