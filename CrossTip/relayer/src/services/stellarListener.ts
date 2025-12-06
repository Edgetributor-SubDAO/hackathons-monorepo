// src/services/stellarListener.ts
import { Horizon } from 'stellar-sdk';
import { DatabaseService, TipEvent } from './database.js';
import { logger } from '../utils/logger.js';

export class StellarListener {
  private server: Horizon.Server;
  private contractId: string;
  private running: boolean = false;
  private database: DatabaseService;

  constructor(database: DatabaseService) {
    this.database = database;
    this.server = new Horizon.Server(
      process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
    );
    this.contractId = process.env.SOROBAN_CONTRACT_ID || '';
    
    if (!this.contractId) {
      throw new Error('SOROBAN_CONTRACT_ID not configured');
    }
  }

  async start() {
    this.running = true;
    logger.info('Starting Stellar listener for contract:', this.contractId);
    
    // Listen for contract events
    this.listenForEvents();
    
    // Also listen for direct payments (fallback)
    this.listenForPayments();
  }

  private listenForEvents() {
    // Use Horizon streaming for contract events
    // Note: This is simplified; in production use proper event streaming
    this.server
      .operations()
      .forAccount(this.contractId)
      .cursor('now')
      .stream({
        onmessage: async (operation: any) => {
          try {
            await this.handleOperation(operation);
          } catch (error) {
            logger.error('Error handling operation:', error);
          }
        },
        onerror: (error: any) => {
          logger.error('Stream error:', error);
          if (this.running) {
            // Reconnect after delay
            setTimeout(() => this.listenForEvents(), 5000);
          }
        },
      });
    
    logger.info('Event stream started');
  }

  private listenForPayments() {
    this.server
      .payments()
      .forAccount(this.contractId)
      .cursor('now')
      .stream({
        onmessage: async (payment: any) => {
          try {
            if (payment.type === 'payment') {
              await this.handlePayment(payment);
            }
          } catch (error) {
            logger.error('Error handling payment:', error);
          }
        },
        onerror: (error: any) => {
          logger.error('Payment stream error:', error);
          if (this.running) {
            setTimeout(() => this.listenForPayments(), 5000);
          }
        },
      });
  }

  private async handleOperation(operation: any) {
    // Parse Soroban contract invocations
    if (operation.type === 'invoke_host_function') {
      logger.debug('Contract invocation detected:', operation.id);
      
      // Extract tip event data from operation
      // This is simplified - in production, properly parse Soroban events
      const tipEvent: TipEvent = {
        creator: operation.source_account || 'unknown',
        tipper: operation.source_account || 'unknown',
        amount: '1000000', // Parse from contract event
        tx_hash: operation.transaction_hash,
        timestamp: new Date(operation.created_at),
        processed: false,
      };
      
      await this.database.saveTipEvent(tipEvent);
      logger.info('Tip event recorded:', tipEvent.tx_hash);
    }
  }

  private async handlePayment(payment: any) {
    const tipEvent: TipEvent = {
      creator: payment.to,
      tipper: payment.from,
      amount: payment.amount,
      tx_hash: payment.transaction_hash,
      timestamp: new Date(payment.created_at),
      processed: false,
    };
    
    await this.database.saveTipEvent(tipEvent);
    logger.info('Payment tip recorded:', tipEvent.tx_hash);
  }

  stop() {
    this.running = false;
    logger.info('Stellar listener stopped');
  }

  isRunning(): boolean {
    return this.running;
  }
}
