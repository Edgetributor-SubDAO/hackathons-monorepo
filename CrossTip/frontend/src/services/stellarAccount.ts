// Enhanced Stellar Account Management Service
import { 
  Keypair, 
  BASE_FEE,
  Operation, 
  Asset, 
  TransactionBuilder,
  Horizon
} from 'stellar-sdk';
import { config } from '../config';

export interface AccountInfo {
  publicKey: string;
  secretKey?: string; // Only for newly created accounts
  balance: string;
  trustlines: Array<{
    asset: string;
    balance: string;
  }>;
}

export interface CreateAccountResult {
  account: AccountInfo;
  transactionHash: string;
  success: boolean;
  error?: string;
}

export class StellarAccountService {
  private horizonServer: Horizon.Server;
  private networkPassphrase: string;

  constructor() {
    // Initialize Horizon server for classic operations
    this.horizonServer = new Horizon.Server(config.stellar.horizonUrl);
    
    this.networkPassphrase = config.stellar.networkPassphrase;
  }

  /**
   * Generate a new Stellar keypair
   */
  generateKeypair(): { publicKey: string; secretKey: string } {
    const keypair = Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
  }

  /**
   * Create and fund account using Friendbot (testnet only)
   */
  async createTestnetAccount(): Promise<CreateAccountResult> {
    try {
      const keypair = Keypair.random();
      
      // Request funding from Friendbot using Horizon server
      const friendbotUrl = `${config.stellar.horizonUrl}/friendbot?addr=${encodeURIComponent(keypair.publicKey())}`;
      const response = await fetch(friendbotUrl);
      
      if (!response.ok) {
        throw new Error(`Friendbot request failed: ${response.status} ${response.statusText}`);
      }
      
      const friendbotResponse = await response.json();
      console.log("SUCCESS! New account created:", friendbotResponse);

      // Wait a moment for the account to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch account details
      const accountInfo = await this.getAccountInfo(keypair.publicKey());
      
      return {
        account: {
          publicKey: keypair.publicKey(),
          secretKey: keypair.secret(),
          balance: accountInfo.balance,
          trustlines: accountInfo.trustlines
        },
        transactionHash: friendbotResponse.hash || 'friendbot-funding',
        success: true
      };
    } catch (error) {
      console.error('Error creating testnet account:', error);
      return {
        account: { publicKey: '', balance: '0', trustlines: [] },
        transactionHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a child account from an existing funded account
   */
  async createChildAccount(
    parentSecretKey: string, 
    startingBalance: string = "5"
  ): Promise<CreateAccountResult> {
    try {
      const parentKeypair = Keypair.fromSecret(parentSecretKey);
      const childKeypair = Keypair.random();
      
      // Get parent account
      const parentAccount = await this.horizonServer.loadAccount(parentKeypair.publicKey());
      
      // Build create account transaction
      const createAccountTx = new TransactionBuilder(parentAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.createAccount({
            destination: childKeypair.publicKey(),
            startingBalance: startingBalance,
          })
        )
        .setTimeout(180)
        .build();

      createAccountTx.sign(parentKeypair);

      const sendTxResponse = await this.horizonServer.submitTransaction(createAccountTx);
      
      if (!sendTxResponse.successful) {
        throw new Error(`Transaction failed: ${JSON.stringify(sendTxResponse)}`);
      }

      console.log("Created new child account:", childKeypair.publicKey());

      // Wait a moment for account to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      const accountInfo = await this.getAccountInfo(childKeypair.publicKey());

      return {
        account: {
          publicKey: childKeypair.publicKey(),
          secretKey: childKeypair.secret(),
          balance: accountInfo.balance,
          trustlines: accountInfo.trustlines
        },
        transactionHash: sendTxResponse.hash,
        success: true
      };
    } catch (error) {
      console.error('Error creating child account:', error);
      return {
        account: { publicKey: '', balance: '0', trustlines: [] },
        transactionHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get account information including balances and trustlines
   */
  async getAccountInfo(publicKey: string): Promise<AccountInfo> {
    try {
      // Get account details from Horizon
      const account = await this.horizonServer.loadAccount(publicKey);
      
      // Find native balance
      const nativeBalance = account.balances.find((balance: any) => balance.asset_type === 'native')?.balance || '0';
      
      // Get trustlines
      const trustlines: Array<{ asset: string; balance: string }> = account.balances
        .filter((balance: any) => balance.asset_type !== 'native')
        .map((balance: any) => ({
          asset: balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12'
            ? `${balance.asset_code}:${balance.asset_issuer}`
            : balance.asset_type,
          balance: balance.balance
        }));

      return {
        publicKey,
        balance: nativeBalance,
        trustlines
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  /**
   * Create trustline for USDC (common for cross-chain operations)
   */
  async createUSDCTrustline(userSecretKey: string): Promise<string> {
    try {
      const userKeypair = Keypair.fromSecret(userSecretKey);
      const account = await this.horizonServer.loadAccount(userKeypair.publicKey());

      // Testnet USDC asset
      const testnetUsdc = new Asset(
        "USDC",
        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
      );

      const trustlineTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: testnetUsdc }))
        .setTimeout(180)
        .build();

      trustlineTx.sign(userKeypair);

      const sendTxResponse = await this.horizonServer.submitTransaction(trustlineTx);
      
      if (!sendTxResponse.successful) {
        throw new Error(`Trustline transaction failed: ${JSON.stringify(sendTxResponse)}`);
      }

      return sendTxResponse.hash;
    } catch (error) {
      console.error('Error creating USDC trustline:', error);
      throw error;
    }
  }

  /**
   * Check if account exists on the network
   */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      await this.horizonServer.loadAccount(publicKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Stellar address format
   */
  isValidStellarAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      // For stellar-sdk v11, we can get some basic network info
      return {
        friendbotUrl: `${config.stellar.horizonUrl}/friendbot`,
        passphrase: this.networkPassphrase,
        protocolVersion: 'unknown'
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

export const stellarAccountService = new StellarAccountService();