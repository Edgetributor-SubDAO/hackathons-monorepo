// Horizon transaction submission utilities
import { Horizon, TransactionBuilder } from 'stellar-sdk';
import { config } from '../../config';

/**
 * Submits a signed transaction to the Stellar network
 */
export async function submitTransaction(signedTransactionXDR: string): Promise<any> {
  const server = new Horizon.Server(config.stellar.horizonUrl);
  
  try {
    // Parse the XDR string back to a transaction object
    const transaction = TransactionBuilder.fromXDR(signedTransactionXDR, config.stellar.networkPassphrase);
    const response = await server.submitTransaction(transaction);
    console.log('Transaction submitted successfully:', response);
    return response;
  } catch (error: any) {
    console.error('Transaction submission failed:', error);
    
    // Parse Stellar error for better user experience
    if (error.response && error.response.data) {
      const { extras } = error.response.data;
      if (extras && extras.result_codes) {
        const { transaction, operations } = extras.result_codes;
        
        // Common error handling
        if (transaction === 'tx_insufficient_balance') {
          throw new Error('Insufficient balance to complete this transaction');
        } else if (transaction === 'tx_bad_seq') {
          throw new Error('Transaction sequence number is invalid. Please try again.');
        } else if (operations && operations.includes('op_underfunded')) {
          throw new Error('Insufficient balance for this operation');
        } else if (operations && operations.includes('op_destination_account_not_exist')) {
          throw new Error('Destination account does not exist');
        }
      }
    }
    
    throw new Error(error.message || 'Transaction failed to submit');
  }
}

/**
 * Checks the current network fee stats
 */
export async function getFeeStats(): Promise<any> {
  const server = new Horizon.Server(config.stellar.horizonUrl);
  return server.feeStats();
}

/**
 * Gets transaction history for an account
 */
export async function getTransactionHistory(accountId: string, limit = 10): Promise<any> {
  const server = new Horizon.Server(config.stellar.horizonUrl);
  return server.transactions()
    .forAccount(accountId)
    .limit(limit)
    .order('desc')
    .call();
}