import { Keypair, Horizon } from 'stellar-sdk';
import { config } from '../config';

export class TestAccountService {
  private server: Horizon.Server;
  private testKeypair: Keypair | null = null;

  constructor() {
    this.server = new Horizon.Server(config.stellar.horizonUrl);
    
    // Only initialize test keypair in development
    if (config.development.testMode && config.development.testKeypair.secretKey) {
      try {
        this.testKeypair = Keypair.fromSecret(config.development.testKeypair.secretKey);
      } catch (error) {
        console.warn('Failed to initialize test keypair:', error);
      }
    }
  }

  /**
   * Get the test keypair for development
   */
  getTestKeypair(): Keypair | null {
    return this.testKeypair;
  }

  /**
   * Get test account public key
   */
  getTestPublicKey(): string | null {
    return this.testKeypair?.publicKey() || config.development.testKeypair.publicKey;
  }

  /**
   * Fund the test account using Stellar's friendbot (testnet only)
   */
  async fundTestAccount(): Promise<boolean> {
    const publicKey = this.getTestPublicKey();
    if (!publicKey) {
      throw new Error('No test account available');
    }

    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      
      if (response.ok) {
        console.log('✅ Test account funded successfully');
        return true;
      } else {
        console.error('❌ Failed to fund test account:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error funding test account:', error);
      return false;
    }
  }

  /**
   * Get account balance and info
   */
  async getAccountInfo(): Promise<any> {
    const publicKey = this.getTestPublicKey();
    if (!publicKey) {
      throw new Error('No test account available');
    }

    try {
      const account = await this.server.loadAccount(publicKey);
      return {
        id: account.id,
        sequence: account.sequence,
        balances: account.balances,
        signers: account.signers,
        data: account.data_attr,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return {
          error: 'Account not found - needs funding',
          publicKey,
          fundUrl: `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
        };
      }
      throw error;
    }
  }

  /**
   * Check if account exists and is funded
   */
  async isAccountFunded(): Promise<boolean> {
    try {
      const info = await this.getAccountInfo();
      return !info.error;
    } catch {
      return false;
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      horizonUrl: config.stellar.horizonUrl,
      networkPassphrase: config.stellar.networkPassphrase,
      isTestnet: config.stellar.horizonUrl.includes('testnet'),
    };
  }

  /**
   * Get Stellar Expert URL for the test account
   */
  getExplorerUrl(): string {
    const publicKey = this.getTestPublicKey();
    const network = config.stellar.horizonUrl.includes('testnet') ? 'testnet' : 'public';
    return `https://stellar.expert/explorer/${network}/account/${publicKey}`;
  }
}

// Export singleton instance
export const testAccountService = new TestAccountService();