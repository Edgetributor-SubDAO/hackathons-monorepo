import { Router, type Request, type Response } from "express";
import { scanStellarActivity, isValidStellarAddress } from "../services/stellarScanner.js";
import { scanPolkadotActivity, isValidPolkadotAddress } from "../services/polkadotScanner.js";
import {
  generateAIInsights,
  calculateScoreBreakdown,
  calculateOverallScore,
} from "../services/aiEngine.js";
import type { ScanRequest, ScanResponse, ReputationData, StellarActivity, PolkadotActivity, ChainScoreBreakdown } from "../types/index.js";

// ============================================
// Demo Mode Elite Data
// ============================================

const DEMO_STELLAR_ADDRESS = "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
const DEMO_POLKADOT_ADDRESS = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

function createEliteDemoData(): ReputationData {
  const stellarBreakdown: ChainScoreBreakdown = {
    volumeScore: 95,
    uniqueRecipientsScore: 88,
    frequencyScore: 92,
    accountAgeScore: 98,
    diversityScore: 94,
  };

  const polkadotBreakdown: ChainScoreBreakdown = {
    volumeScore: 90,
    uniqueRecipientsScore: 85,
    frequencyScore: 88,
    accountAgeScore: 95,
    diversityScore: 87,
  };

  const stellarScore = Object.values(stellarBreakdown).reduce((a, b) => a + b, 0);
  const polkadotScore = Object.values(polkadotBreakdown).reduce((a, b) => a + b, 0);

  const stellarActivity: StellarActivity = {
    address: DEMO_STELLAR_ADDRESS,
    transactionCount: 1247,
    totalVolume: 52340,
    liquidityProvided: 8500,
    accountAge: 847,
    assetDiversity: 12,
    paymentCount: 892,
    uniqueRecipients: 203,
    oldestTransaction: "2022-03-15T00:00:00Z",
    scoreBreakdown: stellarBreakdown,
    score: stellarScore,
  };

  const polkadotActivity: PolkadotActivity = {
    address: DEMO_POLKADOT_ADDRESS,
    governanceVotes: 47,
    stakingAmount: 15420,
    stakingDuration: 523,
    validatorNominations: 16,
    parachainInteractions: 28,
    accountAge: 723,
    identityVerified: true,
    uniqueRecipients: 156,
    oldestTransaction: "2022-05-21T00:00:00Z",
    scoreBreakdown: polkadotBreakdown,
    score: polkadotScore,
  };

  return {
    overallScore: stellarScore + polkadotScore, // 912
    profile: "Balanced",
    stellar: stellarActivity,
    polkadot: polkadotActivity,
    breakdown: {
      transactionConsistency: 94,
      governanceParticipation: 89,
      stakingBehavior: 91,
      liquidityProvision: 85,
      accountAge: 96,
      assetDiversity: 90,
    },
    aiInsights: {
      profile: "Balanced",
      confidence: 95,
      summary: "An exemplary cross-chain power user with exceptional reputation across both Stellar and Polkadot ecosystems. This account demonstrates sophisticated DeFi engagement, consistent governance participation, and long-term staking commitment.",
      strengths: [
        "Elite Tier Status (912/1000)",
        "Cross-chain Pioneer",
        "DeFi Native with 52K+ XLM volume",
        "Active Governance Participant (47 votes)",
        "Diamond Hands Staker (15K+ DOT)",
        "Verified On-chain Identity",
        "High Diversity Score (12 assets)",
      ],
      recommendations: [
        "Maintain your elite status to keep exclusive perks",
        "Consider becoming a validator to maximize rewards",
        "Explore new parachain opportunities",
      ],
      redFlags: [],
    },
    timestamp: Date.now(),
  };
}

// ============================================
// Scan Router
// ============================================

export const scanRouter = Router();

/**
 * POST /api/scan
 * 
 * Scan blockchain activity on both Stellar and Polkadot chains,
 * calculate reputation score, and generate AI insights.
 */
scanRouter.post("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { stellarAddress, polkadotAddress } = req.body as ScanRequest;

    // ============================================
    // Input Validation
    // ============================================

    if (!stellarAddress || !polkadotAddress) {
      return res.status(400).json({
        success: false,
        error: "Both stellarAddress and polkadotAddress are required",
      } as ScanResponse);
    }

    // Validate Stellar address format
    if (!isValidStellarAddress(stellarAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Stellar address format. Must start with 'G' and be 56 characters.",
      } as ScanResponse);
    }

    // Validate Polkadot address format
    if (!isValidPolkadotAddress(polkadotAddress)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Polkadot address format. Must be a valid SS58 address.",
      } as ScanResponse);
    }

    console.log(`[Scan] Starting scan for:
    - Stellar: ${stellarAddress}
    - Polkadot: ${polkadotAddress}`);

    // ============================================
    // Demo Mode - Return Elite Data for Demo Addresses
    // ============================================

    const isDemoMode = 
      stellarAddress === DEMO_STELLAR_ADDRESS && 
      polkadotAddress === DEMO_POLKADOT_ADDRESS;

    if (isDemoMode) {
      console.log("[Scan] Demo mode detected - returning elite data");
      const demoData = createEliteDemoData();
      return res.json({
        success: true,
        data: demoData,
      } as ScanResponse);
    }

    // ============================================
    // Scan Both Chains in Parallel
    // ============================================

    const [stellarActivity, polkadotActivity] = await Promise.all([
      scanStellarActivity(stellarAddress),
      scanPolkadotActivity(polkadotAddress),
    ]);

    // ============================================
    // Calculate Scores and Breakdown
    // ============================================

    const overallScore = calculateOverallScore(
      stellarActivity.score,
      polkadotActivity.score
    );

    const breakdown = calculateScoreBreakdown(stellarActivity, polkadotActivity);

    // ============================================
    // Generate AI Insights
    // ============================================

    const aiInsights = await generateAIInsights(
      stellarActivity,
      polkadotActivity,
      overallScore,
      breakdown
    );

    // ============================================
    // Build Response
    // ============================================

    const reputationData: ReputationData = {
      overallScore,
      profile: aiInsights.profile,
      stellar: stellarActivity,
      polkadot: polkadotActivity,
      breakdown,
      aiInsights,
      timestamp: Date.now(),
    };

    const duration = Date.now() - startTime;
    console.log(`[Scan] Completed in ${duration}ms - Score: ${overallScore}/1000`);

    return res.json({
      success: true,
      data: reputationData,
    } as ScanResponse);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Scan] Error after ${duration}ms:`, error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Invalid")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        } as ScanResponse);
      }

      if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
        return res.status(504).json({
          success: false,
          error: "Request timed out. Please try again.",
        } as ScanResponse);
      }
    }

    return res.status(500).json({
      success: false,
      error: "Failed to scan blockchain activity. Please try again.",
    } as ScanResponse);
  }
});

/**
 * GET /api/scan/validate
 * 
 * Validate wallet addresses without performing a full scan
 */
scanRouter.get("/validate", (req: Request, res: Response) => {
  const { stellarAddress, polkadotAddress } = req.query;

  const validation = {
    stellar: {
      provided: !!stellarAddress,
      valid: typeof stellarAddress === "string" && isValidStellarAddress(stellarAddress),
    },
    polkadot: {
      provided: !!polkadotAddress,
      valid: typeof polkadotAddress === "string" && isValidPolkadotAddress(polkadotAddress),
    },
  };

  return res.json({
    success: true,
    validation,
    canScan: validation.stellar.valid && validation.polkadot.valid,
  });
});

export default scanRouter;
