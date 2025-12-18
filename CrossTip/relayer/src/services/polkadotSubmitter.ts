// src/services/polkadotSubmitter.ts
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { logger } from '../utils/logger.js';

export class PolkadotSubmitter {
  private api: ApiPromise | null = null;
  private signer: KeyringPair | null = null;
  private contractAddress: string;
  private wsEndpoint: string;

  constructor() {
    this.wsEndpoint = process.env.POLKADOT_WS_ENDPOINT || 'ws://localhost:9944';
    this.contractAddress = process.env.POLKADOT_CONTRACT_ADDRESS || '';
  }

  async initialize() {
    try {
      logger.info('Connecting to Polkadot:', this.wsEndpoint);
      
      const provider = new WsProvider(this.wsEndpoint);
      this.api = await ApiPromise.create({ provider });
      
      // Initialize keyring and signer
      const keyring = new Keyring({ type: 'sr25519' });
      const signerSeed = process.env.POLKADOT_SIGNER_SEED || '//Alice';
      this.signer = keyring.addFromUri(signerSeed);
      
      logger.info('Polkadot API initialized');
      logger.info('Signer address:', this.signer.address);
      
      // Get chain info
      const chain = await this.api.rpc.system.chain();
      const version = await this.api.rpc.system.version();
      logger.info(`Connected to ${chain} v${version}`);
      
    } catch (error) {
      logger.error('Failed to initialize Polkadot connection:', error);
      throw error;
    }
  }

  async submitSettlement(settlement: any, signature: string): Promise<string | null> {
    if (!this.api || !this.signer) {
      throw new Error('Polkadot API not initialized');
    }

    try {
      logger.info('Submitting settlement to Polkadot contract:', this.contractAddress);

      // For hackathon: simplified submission
      // In production, use proper contract call with ink! ABI
      
      // Convert settlement to payload
      const payload = JSON.stringify(settlement);
      const payloadBytes = Buffer.from(payload, 'utf-8');
      const signatureBytes = Buffer.from(signature, 'hex');

      // For demo: store in remark (in production, call ink! contract)
      // This allows testing without deployed contract
      const remarkData = {
        type: 'CrossTip::Settlement',
        batch_id: settlement.batch_id,
        batch_root: settlement.batch_root,
        entries_count: settlement.entries.length,
        signature,
      };

      const tx = this.api.tx.system.remark(JSON.stringify(remarkData));
      
      return new Promise((resolve, reject) => {
        tx.signAndSend(this.signer!, ({ status, events }) => {
          if (status.isInBlock) {
            logger.info(`Settlement included in block: ${status.asInBlock}`);
          } else if (status.isFinalized) {
            const txHash = status.asFinalized.toString();
            logger.info(`Settlement finalized: ${txHash}`);
            resolve(txHash);
          }
        }).catch((error: any) => {
          logger.error('Error submitting settlement:', error);
          reject(error);
        });
      });

      // TODO: Replace with actual contract call when ink! contract is deployed:
      /*
      const contract = new ContractPromise(
        this.api,
        contractAbi,
        this.contractAddress
      );
      
      const gasLimit = this.api.registry.createType('WeightV2', {
        refTime: 10000000000,
        proofSize: 10000000000,
      });
      
      const tx = contract.tx.submitSettlement(
        { gasLimit, storageDepositLimit: null },
        payloadBytes,
        signatureBytes
      );
      
      return new Promise((resolve, reject) => {
        tx.signAndSend(this.signer!, ({ status }) => {
          if (status.isFinalized) {
            resolve(status.asFinalized.toString());
          }
        }).catch(reject);
      });
      */
      
    } catch (error) {
      logger.error('Error in submitSettlement:', error);
      return null;
    }
  }

  async disconnect() {
    if (this.api) {
      await this.api.disconnect();
      logger.info('Polkadot connection closed');
    }
  }

  isConnected(): boolean {
    return this.api !== null && this.api.isConnected;
  }
}
