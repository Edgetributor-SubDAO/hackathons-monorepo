import axios from "axios";
import type {
  StellarActivity,
  HorizonAccountResponse,
  HorizonTransaction,
  HorizonPayment,
} from "../types/index.js";

// ============================================
// Stellar Scanner Service
// ============================================

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";

/**
 * Validates a Stellar address format
 */
export function isValidStellarAddress(address: string): boolean {
  // Stellar public keys start with 'G' and are 56 characters long
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * Fetches account information from Stellar Horizon API
 */
async function fetchAccount(address: string): Promise<HorizonAccountResponse | null> {
  try {
    const response = await axios.get<HorizonAccountResponse>(
      `${HORIZON_URL}/accounts/${address}`,
      { timeout: 10000 }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // Account not found (not activated yet)
    }
    throw error;
  }
}

/**
 * Fetches transaction history for an account
 */
async function fetchTransactions(address: string, limit = 200): Promise<HorizonTransaction[]> {
  try {
    const response = await axios.get(
      `${HORIZON_URL}/accounts/${address}/transactions`,
      {
        params: { limit, order: "desc" },
        timeout: 15000,
      }
    );
    return response.data._embedded?.records || [];
  } catch (error) {
    console.error("Error fetching Stellar transactions:", error);
    return [];
  }
}

/**
 * Fetches payment operations for an account
 */
async function fetchPayments(address: string, limit = 200): Promise<HorizonPayment[]> {
  try {
    const response = await axios.get(
      `${HORIZON_URL}/accounts/${address}/payments`,
      {
        params: { limit, order: "desc" },
        timeout: 15000,
      }
    );
    return response.data._embedded?.records || [];
  } catch (error) {
    console.error("Error fetching Stellar payments:", error);
    return [];
  }
}

/**
 * Calculate account age in days from the last modified time
 */
function calculateAccountAge(account: HorizonAccountResponse): number {
  if (!account.last_modified_time) return 0;
  const createdAt = new Date(account.last_modified_time);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate total volume from payments
 */
function calculateTotalVolume(payments: HorizonPayment[], address: string): number {
  return payments.reduce((total, payment) => {
    if (payment.type === "payment" || payment.type === "path_payment_strict_receive") {
      const amount = parseFloat(payment.amount) || 0;
      // Only count outgoing payments for volume (to avoid double counting)
      if (payment.from === address) {
        return total + amount;
      }
    }
    return total;
  }, 0);
}

/**
 * Count unique assets held by the account
 */
function countUniqueAssets(account: HorizonAccountResponse): number {
  return account.balances.filter(
    (balance) => parseFloat(balance.balance) > 0
  ).length;
}

/**
 * Count unique recipients from payments (anti-gaming metric)
 */
function countUniqueRecipients(payments: HorizonPayment[], address: string): number {
  const recipients = new Set<string>();
  payments.forEach((payment) => {
    if (payment.from === address && payment.to && payment.to !== address) {
      recipients.add(payment.to);
    }
    if (payment.to === address && payment.from && payment.from !== address) {
      recipients.add(payment.from);
    }
  });
  return recipients.size;
}

/**
 * Get oldest transaction date
 */
function getOldestTransaction(transactions: HorizonTransaction[]): string | null {
  if (transactions.length === 0) return null;
  // Sort by created_at ascending and get the first one
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  return sorted[0]?.created_at || null;
}

/**
 * Calculate transaction frequency score
 * Based on how regularly the user transacts
 */
function calculateFrequencyScore(transactions: HorizonTransaction[], accountAge: number): number {
  if (transactions.length === 0 || accountAge === 0) return 0;
  
  // Calculate average transactions per week
  const weeks = Math.max(1, accountAge / 7);
  const txPerWeek = transactions.length / weeks;
  
  // Score: 1+ tx/week = 50pts, 3+ = 70pts, 7+ (daily) = 90pts, 14+ = 100pts
  if (txPerWeek >= 14) return 100;
  if (txPerWeek >= 7) return 90;
  if (txPerWeek >= 3) return 70;
  if (txPerWeek >= 1) return 50;
  if (txPerWeek >= 0.5) return 30;
  return Math.floor(txPerWeek * 60); // Less than 0.5/week
}

/**
 * Calculate Stellar Score Breakdown (5 params, 100 pts each = 500 max)
 * 
 * 1. Volume Score (0-100): Total value transacted
 * 2. Unique Recipients Score (0-100): Distinct addresses (anti-gaming)
 * 3. Frequency Score (0-100): How often they transact
 * 4. Account Age Score (0-100): How old the account is
 * 5. Diversity Score (0-100): Types of activities/assets
 */
function calculateStellarScoreBreakdown(
  activity: {
    totalVolume: number;
    uniqueRecipients: number;
    transactionCount: number;
    accountAge: number;
    assetDiversity: number;
    liquidityProvided: number;
  },
  transactions: HorizonTransaction[]
): { scoreBreakdown: import("../types/index.js").ChainScoreBreakdown; score: number } {
  
  // 1. Volume Score (0-100)
  // Log scale: 10 XLM = 20pts, 100 = 40pts, 1000 = 60pts, 10000 = 80pts, 100000+ = 100pts
  let volumeScore = 0;
  if (activity.totalVolume > 0) {
    volumeScore = Math.min(100, Math.floor(Math.log10(activity.totalVolume + 1) * 20));
  }

  // 2. Unique Recipients Score (0-100)
  // 1 recipient = 10pts, 5 = 30pts, 10 = 50pts, 25 = 70pts, 50 = 85pts, 100+ = 100pts
  let uniqueRecipientsScore = 0;
  if (activity.uniqueRecipients > 0) {
    if (activity.uniqueRecipients >= 100) uniqueRecipientsScore = 100;
    else if (activity.uniqueRecipients >= 50) uniqueRecipientsScore = 85;
    else if (activity.uniqueRecipients >= 25) uniqueRecipientsScore = 70;
    else if (activity.uniqueRecipients >= 10) uniqueRecipientsScore = 50;
    else if (activity.uniqueRecipients >= 5) uniqueRecipientsScore = 30;
    else uniqueRecipientsScore = activity.uniqueRecipients * 10;
  }

  // 3. Frequency Score (0-100)
  const frequencyScore = calculateFrequencyScore(transactions, activity.accountAge);

  // 4. Account Age Score (0-100)
  // 7 days = 10pts, 30 = 30pts, 90 = 50pts, 180 = 70pts, 365 = 85pts, 730+ = 100pts
  let accountAgeScore = 0;
  if (activity.accountAge >= 730) accountAgeScore = 100;
  else if (activity.accountAge >= 365) accountAgeScore = 85;
  else if (activity.accountAge >= 180) accountAgeScore = 70;
  else if (activity.accountAge >= 90) accountAgeScore = 50;
  else if (activity.accountAge >= 30) accountAgeScore = 30;
  else if (activity.accountAge >= 7) accountAgeScore = 10;
  else accountAgeScore = Math.floor(activity.accountAge * 1.4);

  // 5. Diversity Score (0-100)
  // Combines: asset diversity + LP activity
  // 1 asset = 10pts, 3 = 30pts, 5 = 50pts, 10 = 70pts, 15+ = 85pts
  // + LP bonus: up to 15pts for liquidity provision
  let diversityScore = 0;
  if (activity.assetDiversity >= 15) diversityScore = 85;
  else if (activity.assetDiversity >= 10) diversityScore = 70;
  else if (activity.assetDiversity >= 5) diversityScore = 50;
  else if (activity.assetDiversity >= 3) diversityScore = 30;
  else diversityScore = activity.assetDiversity * 10;
  
  // LP bonus
  if (activity.liquidityProvided > 0) {
    diversityScore = Math.min(100, diversityScore + Math.min(15, Math.floor(Math.log10(activity.liquidityProvided) * 5)));
  }

  const scoreBreakdown = {
    volumeScore,
    uniqueRecipientsScore,
    frequencyScore,
    accountAgeScore,
    diversityScore,
  };

  const totalScore = volumeScore + uniqueRecipientsScore + frequencyScore + accountAgeScore + diversityScore;

  return {
    scoreBreakdown,
    score: Math.min(500, totalScore),
  };
}

/**
 * Main function to scan Stellar blockchain activity for an address
 */
export async function scanStellarActivity(address: string): Promise<StellarActivity> {
  // Validate address
  if (!isValidStellarAddress(address)) {
    throw new Error("Invalid Stellar address format");
  }

  console.log(`[Stellar Scanner] Scanning address: ${address}`);

  // Fetch account data
  const account = await fetchAccount(address);
  
  if (!account) {
    // Return empty activity for non-activated accounts
    console.log(`[Stellar Scanner] Account not found or not activated: ${address}`);
    return {
      address,
      transactionCount: 0,
      totalVolume: 0,
      liquidityProvided: 0,
      accountAge: 0,
      assetDiversity: 0,
      paymentCount: 0,
      uniqueRecipients: 0,
      oldestTransaction: null,
      scoreBreakdown: {
        volumeScore: 0,
        uniqueRecipientsScore: 0,
        frequencyScore: 0,
        accountAgeScore: 0,
        diversityScore: 0,
      },
      score: 0,
    };
  }

  // Fetch transaction and payment history in parallel
  const [transactions, payments] = await Promise.all([
    fetchTransactions(address),
    fetchPayments(address),
  ]);

  // Calculate activity metrics
  const accountAge = calculateAccountAge(account);
  const totalVolume = calculateTotalVolume(payments, address);
  const assetDiversity = countUniqueAssets(account);
  const uniqueRecipients = countUniqueRecipients(payments, address);
  const oldestTransaction = getOldestTransaction(transactions);
  const paymentCount = payments.filter(
    (p) => p.type === "payment" || p.type === "path_payment_strict_receive"
  ).length;

  // Check for liquidity pool participation
  // (simplified - in production, would check LP operations)
  const liquidityProvided = 0; // TODO: Implement LP detection

  // Calculate new 5-param score breakdown
  const { scoreBreakdown, score } = calculateStellarScoreBreakdown(
    {
      totalVolume,
      uniqueRecipients,
      transactionCount: transactions.length,
      accountAge,
      assetDiversity,
      liquidityProvided,
    },
    transactions
  );

  console.log(`[Stellar Scanner] Completed scan for ${address}:`, {
    transactions: transactions.length,
    payments: paymentCount,
    volume: totalVolume.toFixed(2),
    uniqueRecipients,
    age: accountAge,
    scoreBreakdown,
    score,
  });

  return {
    address,
    transactionCount: transactions.length,
    totalVolume,
    liquidityProvided,
    accountAge,
    assetDiversity,
    paymentCount,
    uniqueRecipients,
    oldestTransaction,
    scoreBreakdown,
    score,
  };
}

export default {
  scanStellarActivity,
  isValidStellarAddress,
};
