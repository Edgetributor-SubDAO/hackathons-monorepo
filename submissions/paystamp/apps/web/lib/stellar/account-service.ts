/**
 * Stellar Account Service
 * Fetches account information from Horizon API
 */

export interface StellarAccount {
  accountId: string;
  balances: Array<{
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
    limit?: string;
  }>;
  sequence: string;
  subentry_count: number;
}

export class StellarAccountService {
  private horizonUrl: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.horizonUrl =
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org';
  }

  /**
   * Get account information from Horizon
   */
  async getAccount(accountId: string): Promise<StellarAccount> {
    try {
      const response = await fetch(
        `${this.horizonUrl}/accounts/${accountId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Account not found. Account may need to be funded.');
        }
        throw new Error(`Failed to fetch account: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        accountId: data.account_id,
        balances: data.balances || [],
        sequence: data.sequence,
        subentry_count: data.subentry_count || 0,
      };
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to fetch account: ${error.message}`);
    }
  }

  /**
   * Get XLM balance
   */
  async getXlmBalance(accountId: string): Promise<string> {
    try {
      const account = await this.getAccount(accountId);
      const xlmBalance = account.balances.find(
        (b) => b.asset_type === 'native'
      );
      return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : '0.00';
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return '0.00';
      }
      throw error;
    }
  }

  /**
   * Check if account exists and is funded
   */
  async isAccountFunded(accountId: string): Promise<boolean> {
    try {
      await this.getAccount(accountId);
      return true;
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return false;
      }
      // If there's another error, assume account exists but we can't verify
      return true;
    }
  }
}

