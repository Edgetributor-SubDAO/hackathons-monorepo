// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - CORE TYPES
//                    "Ookla for Web3" Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

// Chain family identifiers
export type ChainFamily = 'substrate' | 'stellar';

// Test mode types
export type TestMode = 'network-benchmark' | 'node-diagnostic';

// Region identifiers
export type Region = 'us-east' | 'eu-west' | 'apac';

// Test phase for progress tracking
export type TestPhase = 'idle' | 'connecting' | 'measuring' | 'complete' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
//                    GENERIC METRICS (Chain-Agnostic)
// ═══════════════════════════════════════════════════════════════════════════

export interface GenericMetrics {
  /** RPC latency 50th percentile in milliseconds */
  rpcLatencyP50: number;
  /** RPC latency 95th percentile in milliseconds */
  rpcLatencyP95: number;
  /** Average block time in seconds */
  blockTime: number;
  /** Time to finality in seconds */
  finalityTime: number;
  /** Transactions per second throughput */
  txThroughput: number;
  /** Error rate as a decimal (0.0 - 1.0) */
  errorRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN SPEED SCORES (Normalized 0-100)
// ═══════════════════════════════════════════════════════════════════════════

export interface ChainSpeedScores {
  /** Overall composite score (0-100) */
  overall: number;
  /** Latency score (0-100) - lower latency = higher score */
  latency: number;
  /** Throughput score (0-100) - higher TPS = higher score */
  throughput: number;
  /** Finality score (0-100) - faster finality = higher score */
  finality: number;
  /** Reliability score (0-100) - lower error rate = higher score */
  reliability: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN-SPECIFIC METRICS
// ═══════════════════════════════════════════════════════════════════════════

/** Polkadot-specific metrics */
export interface PolkadotSpecificMetrics {
  /** XCM message success rate (0.0 - 1.0) */
  xcmSuccessRate: number;
  /** Average XCM execution time in ms */
  xcmExecutionTime: number;
  /** GRANDPA finality lag in blocks */
  grandpaFinalityLag: number;
  /** Number of active validators */
  activeValidators: number;
  /** Slashing events in last 24 hours */
  slashingEvents24h: number;
  /** Number of active parachains */
  parachainCount: number;
}

/** Stellar-specific metrics */
export interface StellarSpecificMetrics {
  /** Ledger close time in seconds */
  ledgerCloseTime: number;
  /** Ledger close time variance in seconds */
  ledgerCloseVariance: number;
  /** Number of Soroban contract invocations (recent) */
  sorobanInvocations: number;
  /** Soroban invocation success rate (0.0 - 1.0) */
  sorobanSuccessRate: number;
  /** Path payment success rate (0.0 - 1.0) */
  pathPaymentSuccess: number;
  /** Average hops in path payments */
  pathPaymentAvgHops: number;
}

// Union type for all specific metrics
export type ChainSpecificMetrics = PolkadotSpecificMetrics | StellarSpecificMetrics;

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN SPEED RESULT (Complete Test Result)
// ═══════════════════════════════════════════════════════════════════════════

export interface ChainSpeedResult<TSpecific extends ChainSpecificMetrics = ChainSpecificMetrics> {
  /** Unique test result ID */
  testId: string;
  /** Test mode (network benchmark or node diagnostic) */
  mode: TestMode;
  /** Chain identifier (e.g., 'polkadot', 'stellar') */
  chainId: string;
  /** Chain family for UI categorization */
  chainFamily: ChainFamily;
  /** ISO timestamp of test */
  timestamp: string;
  /** Region where test was conducted */
  region: Region;
  /** Generic metrics (comparable across chains) */
  generic: GenericMetrics;
  /** Normalized scores (0-100) */
  scores: ChainSpeedScores;
  /** Chain-specific metrics */
  specific: TSpecific;
  /** Metadata about the test */
  meta: {
    /** RPC endpoint used for testing */
    rpcEndpoint: string;
    /** Source of the RPC (default or user-provided) */
    source: 'default' | 'user';
    /** Client/SDK version if available */
    clientVersion?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//                    API TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Request to start a new test */
export interface StartTestRequest {
  mode: TestMode;
  chains: string[];
  socketId?: string;
  userRpc?: string;
  selectedChain?: string; // For node-diagnostic mode
}

/** Response from starting a test */
export interface StartTestResponse {
  testId: string;
  status: 'started' | 'error';
  message?: string;
}

/** Progress event sent via WebSocket */
export interface TestProgressEvent {
  type: 'test:progress';
  testId: string;
  chainId: string;
  progress: number; // 0-100
  phase: TestPhase;
  message?: string;
}

/** Result event sent via WebSocket */
export interface TestResultEvent {
  type: 'test:result';
  testId: string;
  payload: ChainSpeedResult;
}

/** Completion event sent via WebSocket */
export interface TestCompleteEvent {
  type: 'test:complete';
  testId: string;
  winner: string; // chainId
  results: ChainSpeedResult[];
}

/** Error event sent via WebSocket */
export interface TestErrorEvent {
  type: 'test:error';
  testId: string;
  chainId?: string;
  error: string;
}

// Union type for all WebSocket events
export type TestEvent = TestProgressEvent | TestResultEvent | TestCompleteEvent | TestErrorEvent;

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface ChainConfig {
  id: string;
  name: string;
  family: ChainFamily;
  logo: string;
  color: string;
  defaultRpc: string;
  description: string;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  chainId: string;
  chainName: string;
  chainFamily: ChainFamily;
  avgScore: number;
  testCount: number;
  lastUpdated: string;
  scores: {
    latency: number;
    throughput: number;
    finality: number;
    reliability: number;
  };
}
