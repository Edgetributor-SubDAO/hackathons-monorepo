import axios from "axios";
import type { PolkadotActivity } from "../types/index.js";

// ============================================
// Polkadot Scanner Service
// ============================================

// Subscan API endpoint for Polkadot
const SUBSCAN_API = "https://polkadot.api.subscan.io";
const SUBSCAN_API_KEY = process.env.SUBSCAN_API_KEY || "";

/**
 * Validates a Polkadot address format (SS58 encoding)
 * Polkadot addresses start with '1' and are typically 47-48 characters
 * Kusama addresses start with uppercase letters
 * Generic substrate addresses can start with '5'
 */
export function isValidPolkadotAddress(address: string): boolean {
  // Basic SS58 validation - starts with valid prefix and has correct length
  return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address);
}

/**
 * Make a request to Subscan API
 */
async function subscanRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (SUBSCAN_API_KEY) {
      headers["X-API-Key"] = SUBSCAN_API_KEY;
    }

    const response = await axios.post<{ code: number; data: T }>(
      `${SUBSCAN_API}${endpoint}`,
      body,
      { headers, timeout: 15000 }
    );

    if (response.data.code !== 0) {
      console.warn(`[Polkadot Scanner] API error for ${endpoint}:`, response.data);
      return null;
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[Polkadot Scanner] Request failed for ${endpoint}:`, error.message);
    }
    return null;
  }
}

/**
 * Fetch account information from Subscan
 */
interface AccountInfo {
  address: string;
  balance: string;
  lock: string;
  balance_lock: string;
  bonded: string;
  reserved: string;
  democracy_lock: string;
  conviction_lock: string;
  election_lock: string;
  nonce: number;
  account_display?: {
    address: string;
    display?: string;
    judgements?: Array<{
      index: number;
      judgement: string;
    }>;
    identity?: boolean;
  };
}

async function fetchAccountInfo(address: string): Promise<AccountInfo | null> {
  return subscanRequest<AccountInfo>("/api/v2/scan/search", { key: address });
}

/**
 * Fetch staking info
 */
interface StakingInfo {
  bonded_owner: string;
  controller: string;
  controller_display?: { address: string };
  reward_account: string;
  stash: string;
  stash_display?: { address: string };
}

async function fetchStakingInfo(address: string): Promise<StakingInfo | null> {
  return subscanRequest<StakingInfo>("/api/scan/staking/validator", { 
    stash: address 
  });
}

/**
 * Fetch nominations (staking delegations)
 */
interface NominatorInfo {
  rank_nominator: number;
  bonded: string;
  targets: string[];
}

async function fetchNominatorInfo(address: string): Promise<NominatorInfo | null> {
  const result = await subscanRequest<{ info: NominatorInfo }>("/api/scan/staking/nominator", {
    address,
  });
  return result?.info || null;
}

/**
 * Fetch governance/democracy votes
 */
interface VoteInfo {
  count: number;
  list: Array<{
    referendum_index: number;
    account: string;
    amount: string;
    conviction: number;
    passed: boolean;
  }>;
}

async function fetchVotes(address: string): Promise<VoteInfo | null> {
  return subscanRequest<VoteInfo>("/api/scan/democracy/votes", {
    address,
    row: 100,
    page: 0,
  });
}

/**
 * Fetch transfer history to estimate activity
 */
interface TransferList {
  count: number;
  transfers: Array<{
    from: string;
    to: string;
    success: boolean;
    hash: string;
    block_num: number;
    block_timestamp: number;
    amount: string;
  }>;
}

async function fetchTransfers(address: string): Promise<TransferList | null> {
  return subscanRequest<TransferList>("/api/v2/scan/transfers", {
    address,
    row: 100,
    page: 0,
  });
}

/**
 * Fetch extrinsics count for activity measurement
 */
interface ExtrinsicCount {
  count: number;
}

async function fetchExtrinsicCount(address: string): Promise<number> {
  const result = await subscanRequest<ExtrinsicCount>("/api/v2/scan/extrinsics", {
    address,
    row: 1,
    page: 0,
  });
  return result?.count || 0;
}

/**
 * Calculate account age from first activity
 */
async function calculateAccountAge(address: string): Promise<{ age: number; oldestTransaction: string | null }> {
  // Try to get the first extrinsic to determine account age
  const result = await subscanRequest<{ extrinsics: Array<{ block_timestamp: number }> }>(
    "/api/v2/scan/extrinsics",
    {
      address,
      row: 1,
      page: 0,
      order: "asc", // Get oldest first
    }
  );

  if (result?.extrinsics?.[0]?.block_timestamp) {
    const firstActivity = new Date(result.extrinsics[0].block_timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstActivity.getTime());
    return {
      age: Math.floor(diffTime / (1000 * 60 * 60 * 24)),
      oldestTransaction: firstActivity.toISOString(),
    };
  }

  return { age: 0, oldestTransaction: null };
}

/**
 * Count unique addresses interacted with
 */
function countUniqueRecipients(transfers: TransferList | null, address: string): number {
  if (!transfers?.transfers) return 0;
  
  const recipients = new Set<string>();
  transfers.transfers.forEach((tx) => {
    if (tx.from === address && tx.to && tx.to !== address) {
      recipients.add(tx.to);
    }
    if (tx.to === address && tx.from && tx.from !== address) {
      recipients.add(tx.from);
    }
  });
  return recipients.size;
}

/**
 * Calculate transaction frequency score
 */
function calculateFrequencyScore(extrinsicCount: number, accountAge: number): number {
  if (extrinsicCount === 0 || accountAge === 0) return 0;
  
  // Calculate average extrinsics per week
  const weeks = Math.max(1, accountAge / 7);
  const txPerWeek = extrinsicCount / weeks;
  
  // Score: 1+ tx/week = 50pts, 3+ = 70pts, 7+ (daily) = 90pts, 14+ = 100pts
  if (txPerWeek >= 14) return 100;
  if (txPerWeek >= 7) return 90;
  if (txPerWeek >= 3) return 70;
  if (txPerWeek >= 1) return 50;
  if (txPerWeek >= 0.5) return 30;
  return Math.floor(txPerWeek * 60);
}

/**
 * Check if account has verified identity
 */
function hasVerifiedIdentity(accountInfo: AccountInfo | null): boolean {
  if (!accountInfo?.account_display?.judgements) return false;
  
  // Check for positive judgements (Reasonable, KnownGood)
  return accountInfo.account_display.judgements.some(
    (j) => j.judgement === "Reasonable" || j.judgement === "KnownGood"
  );
}

/**
 * Calculate Polkadot Score Breakdown (5 params, 100 pts each = 500 max)
 * 
 * 1. Volume Score (0-100): Total value staked/transferred
 * 2. Unique Recipients Score (0-100): Distinct addresses (anti-gaming)
 * 3. Frequency Score (0-100): How often they transact
 * 4. Account Age Score (0-100): How old the account is
 * 5. Diversity Score (0-100): Types of activities (stake, vote, nominate, identity)
 */
function calculatePolkadotScoreBreakdown(
  activity: {
    stakingAmount: number;
    uniqueRecipients: number;
    extrinsicCount: number;
    accountAge: number;
    governanceVotes: number;
    validatorNominations: number;
    identityVerified: boolean;
    parachainInteractions: number;
  }
): { scoreBreakdown: import("../types/index.js").ChainScoreBreakdown; score: number } {
  
  // 1. Volume Score (0-100) - Based on staking amount
  // Log scale: 1 DOT = 10pts, 10 = 30pts, 100 = 50pts, 1000 = 70pts, 10000 = 90pts, 100000+ = 100pts
  let volumeScore = 0;
  if (activity.stakingAmount > 0) {
    if (activity.stakingAmount >= 100000) volumeScore = 100;
    else if (activity.stakingAmount >= 10000) volumeScore = 90;
    else if (activity.stakingAmount >= 1000) volumeScore = 70;
    else if (activity.stakingAmount >= 100) volumeScore = 50;
    else if (activity.stakingAmount >= 10) volumeScore = 30;
    else volumeScore = Math.floor(activity.stakingAmount * 10);
  }

  // 2. Unique Recipients Score (0-100)
  let uniqueRecipientsScore = 0;
  if (activity.uniqueRecipients > 0) {
    if (activity.uniqueRecipients >= 100) uniqueRecipientsScore = 100;
    else if (activity.uniqueRecipients >= 50) uniqueRecipientsScore = 85;
    else if (activity.uniqueRecipients >= 25) uniqueRecipientsScore = 70;
    else if (activity.uniqueRecipients >= 10) uniqueRecipientsScore = 50;
    else if (activity.uniqueRecipients >= 5) uniqueRecipientsScore = 30;
    else uniqueRecipientsScore = activity.uniqueRecipients * 6;
  }

  // 3. Frequency Score (0-100)
  const frequencyScore = calculateFrequencyScore(activity.extrinsicCount, activity.accountAge);

  // 4. Account Age Score (0-100)
  let accountAgeScore = 0;
  if (activity.accountAge >= 730) accountAgeScore = 100;
  else if (activity.accountAge >= 365) accountAgeScore = 85;
  else if (activity.accountAge >= 180) accountAgeScore = 70;
  else if (activity.accountAge >= 90) accountAgeScore = 50;
  else if (activity.accountAge >= 30) accountAgeScore = 30;
  else if (activity.accountAge >= 7) accountAgeScore = 10;
  else accountAgeScore = Math.floor(activity.accountAge * 1.4);

  // 5. Diversity Score (0-100)
  // Combines: governance, staking, nominations, identity, parachain
  let diversityScore = 0;
  
  // Governance votes: up to 30pts
  if (activity.governanceVotes >= 10) diversityScore += 30;
  else if (activity.governanceVotes >= 5) diversityScore += 20;
  else if (activity.governanceVotes >= 1) diversityScore += 10;
  
  // Validator nominations: up to 25pts
  if (activity.validatorNominations >= 10) diversityScore += 25;
  else if (activity.validatorNominations >= 5) diversityScore += 15;
  else if (activity.validatorNominations >= 1) diversityScore += 10;
  
  // Identity verified: 20pts bonus
  if (activity.identityVerified) diversityScore += 20;
  
  // Parachain interactions: up to 25pts
  if (activity.parachainInteractions >= 20) diversityScore += 25;
  else if (activity.parachainInteractions >= 10) diversityScore += 15;
  else if (activity.parachainInteractions >= 5) diversityScore += 10;
  else if (activity.parachainInteractions >= 1) diversityScore += 5;
  
  diversityScore = Math.min(100, diversityScore);

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
 * Main function to scan Polkadot blockchain activity for an address
 */
export async function scanPolkadotActivity(address: string): Promise<PolkadotActivity> {
  // Validate address
  if (!isValidPolkadotAddress(address)) {
    throw new Error("Invalid Polkadot address format");
  }

  console.log(`[Polkadot Scanner] Scanning address: ${address}`);

  // Fetch all data in parallel for efficiency
  const [accountInfo, nominatorInfo, votes, accountAgeData, extrinsicCount, transfers] = await Promise.all([
    fetchAccountInfo(address),
    fetchNominatorInfo(address),
    fetchVotes(address),
    calculateAccountAge(address),
    fetchExtrinsicCount(address),
    fetchTransfers(address),
  ]);

  // Parse staking amount from nominator info
  const stakingAmount = nominatorInfo?.bonded
    ? parseFloat(nominatorInfo.bonded) / 1e10 // Convert Planck to DOT
    : 0;

  // Count validator nominations
  const validatorNominations = nominatorInfo?.targets?.length || 0;

  // Get governance votes count
  const governanceVotes = votes?.count || 0;

  // Check for verified identity
  const identityVerified = hasVerifiedIdentity(accountInfo);

  // Estimate staking duration (simplified - would need historical data for accuracy)
  const stakingDuration = stakingAmount > 0 ? accountAgeData.age : 0;

  // Parachain interactions (estimated from extrinsic count - simplified)
  const parachainInteractions = Math.floor(extrinsicCount / 10);

  // Count unique recipients
  const uniqueRecipients = countUniqueRecipients(transfers, address);

  // Calculate new 5-param score breakdown
  const { scoreBreakdown, score } = calculatePolkadotScoreBreakdown({
    stakingAmount,
    uniqueRecipients,
    extrinsicCount,
    accountAge: accountAgeData.age,
    governanceVotes,
    validatorNominations,
    identityVerified,
    parachainInteractions,
  });

  console.log(`[Polkadot Scanner] Completed scan for ${address}:`, {
    votes: governanceVotes,
    staked: stakingAmount.toFixed(2),
    nominations: validatorNominations,
    uniqueRecipients,
    age: accountAgeData.age,
    identity: identityVerified,
    scoreBreakdown,
    score,
  });

  return {
    address,
    governanceVotes,
    stakingAmount,
    stakingDuration,
    validatorNominations,
    parachainInteractions,
    accountAge: accountAgeData.age,
    identityVerified,
    uniqueRecipients,
    oldestTransaction: accountAgeData.oldestTransaction,
    scoreBreakdown,
    score,
  };
}

export default {
  scanPolkadotActivity,
  isValidPolkadotAddress,
};
