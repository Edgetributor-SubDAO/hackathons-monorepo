import OpenAI from "openai";
import type {
  StellarActivity,
  PolkadotActivity,
  AIInsights,
  ReputationProfile,
  ScoreBreakdown,
} from "../types/index.js";

// ============================================
// AI Engine Service
// ============================================

// Initialize OpenAI client (optional - will use mock if not configured)
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Calculate score breakdown from activity data
 */
export function calculateScoreBreakdown(
  stellar: StellarActivity,
  polkadot: PolkadotActivity
): ScoreBreakdown {
  return {
    // Transaction consistency (0-200) - based on Stellar activity
    transactionConsistency: Math.min(
      200,
      Math.floor(stellar.transactionCount / 5) + Math.floor(stellar.paymentCount / 3)
    ),

    // Governance participation (0-250) - based on Polkadot voting
    governanceParticipation: Math.min(250, polkadot.governanceVotes * 15),

    // Staking behavior (0-200) - based on Polkadot staking
    stakingBehavior: Math.min(
      200,
      Math.floor(Math.log10(polkadot.stakingAmount + 1) * 30) +
        polkadot.validatorNominations * 10
    ),

    // Liquidity provision (0-150) - based on Stellar LP activity
    liquidityProvision: Math.min(
      150,
      Math.floor(Math.log10(stellar.liquidityProvided + 1) * 25) +
        Math.floor(stellar.totalVolume / 1000)
    ),

    // Account age (0-100) - combined from both chains
    accountAge: Math.min(100, Math.floor((stellar.accountAge + polkadot.accountAge) / 14)),

    // Asset diversity (0-100) - based on Stellar assets + Polkadot interactions
    assetDiversity: Math.min(
      100,
      stellar.assetDiversity * 8 + polkadot.parachainInteractions * 5
    ),
  };
}

/**
 * Determine reputation profile based on activity patterns
 */
export function determineProfile(
  stellar: StellarActivity,
  polkadot: PolkadotActivity
): ReputationProfile {
  const totalScore = stellar.score + polkadot.score;

  // Newcomer if very low activity
  if (totalScore < 50) {
    return "Newcomer";
  }

  // Calculate dominant activity type
  const tradingScore = stellar.transactionCount * 2 + stellar.totalVolume / 100;
  const governanceScore = polkadot.governanceVotes * 20;
  const stakingScore = polkadot.stakingAmount / 10 + polkadot.validatorNominations * 10;
  const lpScore = stellar.liquidityProvided / 10;

  const scores = {
    Trader: tradingScore,
    Governor: governanceScore,
    Staker: stakingScore,
    "Liquidity Provider": lpScore,
  };

  // Find the highest scoring profile
  const maxScore = Math.max(...Object.values(scores));
  const threshold = maxScore * 0.7; // Must be 30% higher than others to be dominant

  // Check if any profile is clearly dominant
  const dominantProfiles = Object.entries(scores).filter(([, score]) => score >= threshold);

  if (dominantProfiles.length === 1) {
    return dominantProfiles[0][0] as ReputationProfile;
  }

  // Multiple high scores = Balanced profile
  return "Balanced";
}

/**
 * Generate AI insights using OpenAI (or mock data if not configured)
 */
export async function generateAIInsights(
  stellar: StellarActivity,
  polkadot: PolkadotActivity,
  overallScore: number,
  breakdown: ScoreBreakdown
): Promise<AIInsights> {
  const profile = determineProfile(stellar, polkadot);

  // If OpenAI is not configured, return mock insights
  if (!openai) {
    return generateMockInsights(stellar, polkadot, profile, overallScore);
  }

  try {
    const prompt = buildAIPrompt(stellar, polkadot, overallScore, breakdown, profile);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a blockchain reputation analyst. Analyze cross-chain activity and provide insights about a user's Web3 reputation. Be concise and specific.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response) {
      return parseAIResponse(response, profile);
    }
  } catch (error) {
    console.error("[AI Engine] Error generating insights:", error);
  }

  // Fallback to mock insights on error
  return generateMockInsights(stellar, polkadot, profile, overallScore);
}

/**
 * Build prompt for AI analysis
 */
function buildAIPrompt(
  stellar: StellarActivity,
  polkadot: PolkadotActivity,
  overallScore: number,
  breakdown: ScoreBreakdown,
  profile: ReputationProfile
): string {
  return `
Analyze this cross-chain Web3 user activity and provide insights:

**Overall Score:** ${overallScore}/1000
**Profile Type:** ${profile}

**Stellar Activity (Score: ${stellar.score}/500):**
- Transactions: ${stellar.transactionCount}
- Total Volume: ${stellar.totalVolume.toFixed(2)} XLM
- Unique Recipients: ${stellar.uniqueRecipients}
- Payments: ${stellar.paymentCount}
- Assets Held: ${stellar.assetDiversity}
- Account Age: ${stellar.accountAge} days
- Score Breakdown:
  - Volume: ${stellar.scoreBreakdown.volumeScore}/100
  - Unique Recipients: ${stellar.scoreBreakdown.uniqueRecipientsScore}/100
  - Frequency: ${stellar.scoreBreakdown.frequencyScore}/100
  - Account Age: ${stellar.scoreBreakdown.accountAgeScore}/100
  - Diversity: ${stellar.scoreBreakdown.diversityScore}/100

**Polkadot Activity (Score: ${polkadot.score}/500):**
- Governance Votes: ${polkadot.governanceVotes}
- Staking Amount: ${polkadot.stakingAmount.toFixed(2)} DOT
- Validator Nominations: ${polkadot.validatorNominations}
- Unique Recipients: ${polkadot.uniqueRecipients}
- Identity Verified: ${polkadot.identityVerified ? "Yes" : "No"}
- Account Age: ${polkadot.accountAge} days
- Score Breakdown:
  - Volume: ${polkadot.scoreBreakdown.volumeScore}/100
  - Unique Recipients: ${polkadot.scoreBreakdown.uniqueRecipientsScore}/100
  - Frequency: ${polkadot.scoreBreakdown.frequencyScore}/100
  - Account Age: ${polkadot.scoreBreakdown.accountAgeScore}/100
  - Diversity: ${polkadot.scoreBreakdown.diversityScore}/100

**Legacy Breakdown (for compatibility):**
- Transaction Consistency: ${breakdown.transactionConsistency}/200
- Governance Participation: ${breakdown.governanceParticipation}/250
- Staking Behavior: ${breakdown.stakingBehavior}/200
- Liquidity Provision: ${breakdown.liquidityProvision}/150
- Account Age: ${breakdown.accountAge}/100
- Asset Diversity: ${breakdown.assetDiversity}/100

Provide:
1. A one-sentence summary of this user's reputation
2. 2-3 key strengths
3. 2-3 recommendations to improve their score
4. Any red flags (if none, say "None")

Format your response as JSON:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "recommendations": ["...", "..."],
  "redFlags": ["..."] or []
}
`;
}

/**
 * Parse AI response into structured insights
 */
function parseAIResponse(response: string, profile: ReputationProfile): AIInsights {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        profile,
        confidence: 85,
        summary: parsed.summary || "Analysis complete.",
        strengths: parsed.strengths || [],
        recommendations: parsed.recommendations || [],
        redFlags: parsed.redFlags || [],
      };
    }
  } catch (error) {
    console.error("[AI Engine] Error parsing AI response:", error);
  }

  // Return default structure if parsing fails
  return {
    profile,
    confidence: 70,
    summary: response.slice(0, 200),
    strengths: [],
    recommendations: [],
    redFlags: [],
  };
}

/**
 * Generate mock insights when OpenAI is not available
 */
function generateMockInsights(
  stellar: StellarActivity,
  polkadot: PolkadotActivity,
  profile: ReputationProfile,
  _overallScore: number
): AIInsights {
  const strengths: string[] = [];
  const recommendations: string[] = [];
  const redFlags: string[] = [];

  // Analyze Stellar activity
  if (stellar.transactionCount > 100) {
    strengths.push("High transaction activity on Stellar network");
  } else if (stellar.transactionCount < 10) {
    recommendations.push("Increase activity on Stellar to build payment reputation");
  }

  if (stellar.assetDiversity >= 5) {
    strengths.push("Diverse asset portfolio showing sophisticated DeFi usage");
  } else if (stellar.assetDiversity < 2) {
    recommendations.push("Diversify asset holdings on Stellar");
  }

  // Analyze Polkadot activity
  if (polkadot.governanceVotes >= 5) {
    strengths.push("Active governance participant on Polkadot");
  } else if (polkadot.governanceVotes === 0) {
    recommendations.push("Participate in Polkadot governance voting");
  }

  if (polkadot.stakingAmount >= 100) {
    strengths.push("Significant staking commitment on Polkadot");
  } else if (polkadot.stakingAmount === 0) {
    recommendations.push("Consider staking DOT to improve reputation");
  }

  if (polkadot.identityVerified) {
    strengths.push("Verified on-chain identity adds credibility");
  } else {
    recommendations.push("Set up verified on-chain identity on Polkadot");
  }

  // Check for red flags
  if (stellar.accountAge < 7 && polkadot.accountAge < 7) {
    redFlags.push("Very new accounts on both chains");
  }

  if (stellar.transactionCount === 0 && polkadot.governanceVotes === 0) {
    redFlags.push("Minimal on-chain activity detected");
  }

  // Generate summary based on profile
  let summary = "";
  switch (profile) {
    case "Trader":
      summary = `Active trader with ${stellar.transactionCount} Stellar transactions and ${stellar.totalVolume.toFixed(0)} XLM volume.`;
      break;
    case "Governor":
      summary = `Engaged governance participant with ${polkadot.governanceVotes} votes on Polkadot.`;
      break;
    case "Staker":
      summary = `Committed staker with ${polkadot.stakingAmount.toFixed(0)} DOT staked and ${polkadot.validatorNominations} nominations.`;
      break;
    case "Liquidity Provider":
      summary = `Active liquidity provider contributing to DeFi ecosystem stability.`;
      break;
    case "Balanced":
      summary = `Well-rounded Web3 user with diverse activity across both Stellar and Polkadot ecosystems.`;
      break;
    case "Newcomer":
      summary = `New to the ecosystem with room to grow reputation through increased activity.`;
      break;
  }

  // Calculate confidence based on data quality
  const dataPoints =
    (stellar.transactionCount > 0 ? 1 : 0) +
    (stellar.accountAge > 0 ? 1 : 0) +
    (polkadot.governanceVotes > 0 ? 1 : 0) +
    (polkadot.stakingAmount > 0 ? 1 : 0) +
    (polkadot.accountAge > 0 ? 1 : 0);
  
  const confidence = Math.min(95, 50 + dataPoints * 9);

  return {
    profile,
    confidence,
    summary,
    strengths: strengths.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    redFlags,
  };
}

/**
 * Calculate overall reputation score from Stellar and Polkadot scores
 * New scoring: Stellar (500 max) + Polkadot (500 max) = 1000 max
 */
export function calculateOverallScore(
  stellarScore: number,
  polkadotScore: number
): number {
  // Combined score out of 1000 (500 per chain)
  return Math.min(1000, stellarScore + polkadotScore);
}

export default {
  generateAIInsights,
  calculateScoreBreakdown,
  calculateOverallScore,
  determineProfile,
};
