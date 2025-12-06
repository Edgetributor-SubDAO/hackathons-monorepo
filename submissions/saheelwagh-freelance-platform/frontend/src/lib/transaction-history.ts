/**
 * Transaction History Service
 * 
 * Stores transaction history in localStorage for display in the UI.
 * Links to Stellar Explorer for transparency.
 */

const STORAGE_KEY = 'polkstellar_transaction_history';
const MAX_TRANSACTIONS = 50; // Keep last 50 transactions

export type TransactionType = 
  | 'create_project'
  | 'fund_milestone'
  | 'submit_milestone'
  | 'release_milestone';

export type TransactionStatus = 'pending' | 'success' | 'error';

export interface Transaction {
  id: string; // Unique ID for React keys
  hash: string; // Stellar transaction hash
  type: TransactionType;
  status: TransactionStatus;
  timestamp: string; // ISO timestamp
  projectId: number;
  milestoneIndex?: number;
  amount?: number; // In stroops
  fromAddress?: string;
  toAddress?: string;
  errorMessage?: string;
}

/**
 * Generate Stellar Explorer URL for a transaction
 */
export function getStellarExplorerUrl(hash: string): string {
  // Stellar Expert is a popular explorer for Stellar testnet
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

/**
 * Alternative: StellarChain explorer
 */
export function getStellarChainUrl(hash: string): string {
  return `https://testnet.stellarchain.io/transactions/${hash}`;
}

/**
 * Get all stored transactions
 */
export function getAllTransactions(): Transaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error reading transaction history:', err);
    return [];
  }
}

/**
 * Get transactions for a specific project
 */
export function getProjectTransactions(projectId: number): Transaction[] {
  return getAllTransactions().filter((tx) => tx.projectId === projectId);
}

/**
 * Get recent transactions (last N)
 */
export function getRecentTransactions(count: number = 10): Transaction[] {
  return getAllTransactions().slice(0, count);
}

/**
 * Add a new transaction to history
 */
export function addTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  const newTx: Transaction = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const all = getAllTransactions();
    // Add to beginning (most recent first)
    all.unshift(newTx);
    // Keep only last MAX_TRANSACTIONS
    const trimmed = all.slice(0, MAX_TRANSACTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log('Added transaction:', newTx);
  } catch (err) {
    console.error('Error saving transaction:', err);
  }

  return newTx;
}

/**
 * Update transaction status (e.g., pending -> success)
 */
export function updateTransactionStatus(
  id: string,
  status: TransactionStatus,
  hash?: string,
  errorMessage?: string
): void {
  try {
    const all = getAllTransactions();
    const index = all.findIndex((tx) => tx.id === id);
    if (index !== -1) {
      all[index].status = status;
      if (hash) all[index].hash = hash;
      if (errorMessage) all[index].errorMessage = errorMessage;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch (err) {
    console.error('Error updating transaction:', err);
  }
}

/**
 * Get transaction type display name
 */
export function getTransactionTypeName(type: TransactionType): string {
  switch (type) {
    case 'create_project':
      return 'Create Project';
    case 'fund_milestone':
      return 'Fund Milestone';
    case 'submit_milestone':
      return 'Submit Work';
    case 'release_milestone':
      return 'Release Funds';
    default:
      return type;
  }
}

/**
 * Get transaction type icon/emoji
 */
export function getTransactionTypeIcon(type: TransactionType): string {
  switch (type) {
    case 'create_project':
      return '📝';
    case 'fund_milestone':
      return '💰';
    case 'submit_milestone':
      return '📤';
    case 'release_milestone':
      return '✅';
    default:
      return '📋';
  }
}

/**
 * Clear all transaction history (for testing)
 */
export function clearTransactionHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Format timestamp for display
 */
export function formatTransactionTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
