// Stellar transaction utilities for CrossTip
import {
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Horizon,
} from 'stellar-sdk';
import { config } from '../../config';

// High maximum fee for better inclusion chances
const maxFeePerOperation = "100000";
const standardTimebounds = 300; // 5 minutes for user to review/sign/submit

export interface CreatePaymentTransactionParams {
  source: string;
  destination: string;
  asset?: string;
  amount: string;
  memo?: string;
}

export interface CreateTipTransactionParams {
  source: string;
  creator: string;
  amount: string;
  memo?: string;
}

export interface TransactionResult {
  transaction: string;
  network_passphrase: string;
}

/**
 * Creates a standard payment transaction for tip payments
 */
export async function createPaymentTransaction({
  source,
  destination,
  asset,
  amount,
  memo,
}: CreatePaymentTransactionParams): Promise<TransactionResult> {
  const server = new Horizon.Server(config.stellar.horizonUrl);
  const sourceAccount = await server.loadAccount(source);
  
  const transaction = new TransactionBuilder(sourceAccount, {
    networkPassphrase: config.stellar.networkPassphrase,
    fee: maxFeePerOperation,
  });

  // Determine the asset to send
  let sendAsset: Asset;
  if (asset && asset !== "native") {
    const [code, issuer] = asset.split(":");
    sendAsset = new Asset(code, issuer);
  } else {
    sendAsset = Asset.native();
  }

  // Add memo if provided
  if (memo) {
    transaction.addMemo(Memo.text(memo));
  }

  // Add payment operation
  transaction.addOperation(
    Operation.payment({
      destination: destination,
      amount: amount.toString(),
      asset: sendAsset,
    }),
  );

  const builtTransaction = transaction.setTimeout(standardTimebounds).build();
  
  return {
    transaction: builtTransaction.toXDR(),
    network_passphrase: config.stellar.networkPassphrase,
  };
}

/**
 * Creates a create account transaction when destination account doesn't exist
 */
export async function createCreateAccountTransaction({
  source,
  destination,
  amount,
  memo,
}: CreatePaymentTransactionParams): Promise<TransactionResult> {
  // Minimum balance check (1 XLM minimum for account creation)
  if (parseFloat(amount.toString()) < 1) {
    throw new Error("Insufficient starting balance - minimum 1 XLM required for account creation");
  }

  const server = new Horizon.Server(config.stellar.horizonUrl);
  const sourceAccount = await server.loadAccount(source);
  
  const transaction = new TransactionBuilder(sourceAccount, {
    networkPassphrase: config.stellar.networkPassphrase,
    fee: maxFeePerOperation,
  });

  // Add memo if provided
  if (memo) {
    transaction.addMemo(Memo.text(memo));
  }

  // Add createAccount operation
  transaction.addOperation(
    Operation.createAccount({
      destination: destination,
      startingBalance: amount.toString(),
    }),
  );

  const builtTransaction = transaction.setTimeout(standardTimebounds).build();
  
  return {
    transaction: builtTransaction.toXDR(),
    network_passphrase: config.stellar.networkPassphrase,
  };
}

/**
 * Creates a tip transaction using the Soroban contract
 */
export async function createTipTransaction({
  source,
  creator,
  amount,
  memo,
}: CreateTipTransactionParams): Promise<TransactionResult> {
  const server = new Horizon.Server(config.stellar.horizonUrl);
  const sourceAccount = await server.loadAccount(source);
  
  const transaction = new TransactionBuilder(sourceAccount, {
    networkPassphrase: config.stellar.networkPassphrase,
    fee: maxFeePerOperation,
  });

  // Add memo for tip context
  const tipMemo = memo ? `Tip: ${memo}` : `Tip for ${creator.slice(0, 8)}...`;
  transaction.addMemo(Memo.text(tipMemo));

  // For now, create a direct payment to creator
  // TODO: Replace with Soroban contract invocation when contract is deployed
  transaction.addOperation(
    Operation.payment({
      destination: creator,
      amount: amount.toString(),
      asset: Asset.native(),
    }),
  );

  const builtTransaction = transaction.setTimeout(standardTimebounds).build();
  
  return {
    transaction: builtTransaction.toXDR(),
    network_passphrase: config.stellar.networkPassphrase,
  };
}

/**
 * Checks if a Stellar account exists and is funded
 */
export async function checkAccountExists(publicKey: string): Promise<boolean> {
  try {
    const server = new Horizon.Server(config.stellar.horizonUrl);
    await server.loadAccount(publicKey);
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Gets account balances for display
 */
export async function getAccountBalances(publicKey: string): Promise<any[]> {
  const server = new Horizon.Server(config.stellar.horizonUrl);
  const account = await server.loadAccount(publicKey);
  return account.balances;
}