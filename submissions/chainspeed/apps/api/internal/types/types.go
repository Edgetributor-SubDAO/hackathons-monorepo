// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - DOMAIN TYPES
//                    Core Types Matching TypeScript Definitions
// ═══════════════════════════════════════════════════════════════════════════

package types

import "time"

// ChainFamily represents the blockchain family
type ChainFamily string

const (
	ChainFamilySubstrate ChainFamily = "substrate"
	ChainFamilyStellar   ChainFamily = "stellar"
)

// TestMode represents the type of test
type TestMode string

const (
	TestModeNetworkBenchmark TestMode = "network-benchmark"
	TestModeNodeDiagnostic   TestMode = "node-diagnostic"
)

// Region identifiers
type Region string

const (
	RegionUSEast Region = "us-east"
	RegionEUWest Region = "eu-west"
	RegionAPAC   Region = "apac"
)

// TestPhase for progress tracking
type TestPhase string

const (
	TestPhaseIdle       TestPhase = "idle"
	TestPhaseConnecting TestPhase = "connecting"
	TestPhaseMeasuring  TestPhase = "measuring"
	TestPhaseComplete   TestPhase = "complete"
	TestPhaseError      TestPhase = "error"
)

// ═══════════════════════════════════════════════════════════════════════════
//                    GENERIC METRICS (Chain-Agnostic)
// ═══════════════════════════════════════════════════════════════════════════

// GenericMetrics contains chain-agnostic performance metrics
type GenericMetrics struct {
	// RPC latency 50th percentile in milliseconds
	RPCLatencyP50 float64 `json:"rpcLatencyP50"`
	// RPC latency 95th percentile in milliseconds
	RPCLatencyP95 float64 `json:"rpcLatencyP95"`
	// Average block time in seconds
	BlockTime float64 `json:"blockTime"`
	// Time to finality in seconds
	FinalityTime float64 `json:"finalityTime"`
	// Transactions per second throughput
	TxThroughput float64 `json:"txThroughput"`
	// Error rate as a decimal (0.0 - 1.0)
	ErrorRate float64 `json:"errorRate"`
}

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN SPEED SCORES (Normalized 0-100)
// ═══════════════════════════════════════════════════════════════════════════

// ChainSpeedScores contains normalized scores
type ChainSpeedScores struct {
	// Overall composite score (0-100)
	Overall float64 `json:"overall"`
	// Latency score (0-100)
	Latency float64 `json:"latency"`
	// Throughput score (0-100)
	Throughput float64 `json:"throughput"`
	// Finality score (0-100)
	Finality float64 `json:"finality"`
	// Reliability score (0-100)
	Reliability float64 `json:"reliability"`
}

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN-SPECIFIC METRICS
// ═══════════════════════════════════════════════════════════════════════════

// PolkadotSpecificMetrics contains Polkadot/Substrate specific metrics
type PolkadotSpecificMetrics struct {
	// XCM message success rate (0.0 - 1.0)
	XCMSuccessRate float64 `json:"xcmSuccessRate"`
	// Average XCM execution time in ms
	XCMExecutionTime float64 `json:"xcmExecutionTime"`
	// GRANDPA finality lag in blocks
	GrandpaFinalityLag int `json:"grandpaFinalityLag"`
	// Number of active validators
	ActiveValidators int `json:"activeValidators"`
	// Slashing events in last 24 hours
	SlashingEvents24h int `json:"slashingEvents24h"`
	// Number of active parachains
	ParachainCount int `json:"parachainCount"`
}

// StellarSpecificMetrics contains Stellar specific metrics
type StellarSpecificMetrics struct {
	// Ledger close time in seconds
	LedgerCloseTime float64 `json:"ledgerCloseTime"`
	// Ledger close time variance in seconds
	LedgerCloseVariance float64 `json:"ledgerCloseVariance"`
	// Number of Soroban contract invocations (recent)
	SorobanInvocations int `json:"sorobanInvocations"`
	// Soroban invocation success rate (0.0 - 1.0)
	SorobanSuccessRate float64 `json:"sorobanSuccessRate"`
	// Path payment success rate (0.0 - 1.0)
	PathPaymentSuccess float64 `json:"pathPaymentSuccess"`
	// Average hops in path payments
	PathPaymentAvgHops float64 `json:"pathPaymentAvgHops"`
}

// ChainSpecificMetrics is an interface for chain-specific data
type ChainSpecificMetrics interface{}

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN SPEED RESULT
// ═══════════════════════════════════════════════════════════════════════════

// ResultMeta contains metadata about the test
type ResultMeta struct {
	RPCEndpoint   string `json:"rpcEndpoint"`
	Source        string `json:"source"` // "default" or "user"
	ClientVersion string `json:"clientVersion,omitempty"`
}

// ChainSpeedResult is the complete test result
type ChainSpeedResult struct {
	TestID      string               `json:"testId"`
	Mode        TestMode             `json:"mode"`
	ChainID     string               `json:"chainId"`
	ChainFamily ChainFamily          `json:"chainFamily"`
	Timestamp   time.Time            `json:"timestamp"`
	Region      Region               `json:"region"`
	Generic     GenericMetrics       `json:"generic"`
	Scores      ChainSpeedScores     `json:"scores"`
	Specific    ChainSpecificMetrics `json:"specific"`
	Meta        ResultMeta           `json:"meta"`
}

// ═══════════════════════════════════════════════════════════════════════════
//                    API TYPES
// ═══════════════════════════════════════════════════════════════════════════

// StartTestRequest is the request to start a new test
type StartTestRequest struct {
	Mode          TestMode `json:"mode"`
	Chains        []string `json:"chains"`
	SocketID      string   `json:"socketId,omitempty"`
	UserRPC       string   `json:"userRpc,omitempty"`
	SelectedChain string   `json:"selectedChain,omitempty"`
}

// StartTestResponse is the response after starting a test
type StartTestResponse struct {
	TestID  string `json:"testId"`
	Status  string `json:"status"` // "started" or "error"
	Message string `json:"message,omitempty"`
}

// ═══════════════════════════════════════════════════════════════════════════
//                    WEBSOCKET EVENTS
// ═══════════════════════════════════════════════════════════════════════════

// TestProgressEvent is sent during test execution
type TestProgressEvent struct {
	Type     string    `json:"type"` // "test:progress"
	TestID   string    `json:"testId"`
	ChainID  string    `json:"chainId"`
	Progress float64   `json:"progress"` // 0-100
	Phase    TestPhase `json:"phase"`
	Message  string    `json:"message,omitempty"`
}

// TestResultEvent is sent when a chain test completes
type TestResultEvent struct {
	Type    string           `json:"type"` // "test:result"
	TestID  string           `json:"testId"`
	Payload ChainSpeedResult `json:"payload"`
}

// TestCompleteEvent is sent when all tests complete
type TestCompleteEvent struct {
	Type    string             `json:"type"` // "test:complete"
	TestID  string             `json:"testId"`
	Winner  string             `json:"winner"`
	Results []ChainSpeedResult `json:"results"`
}

// TestErrorEvent is sent on error
type TestErrorEvent struct {
	Type    string `json:"type"` // "test:error"
	TestID  string `json:"testId"`
	ChainID string `json:"chainId,omitempty"`
	Error   string `json:"error"`
}

// ═══════════════════════════════════════════════════════════════════════════
//                    CHAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// ChainConfig defines a supported blockchain
type ChainConfig struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Family      ChainFamily `json:"family"`
	Logo        string      `json:"logo"`
	Color       string      `json:"color"`
	DefaultRPC  string      `json:"defaultRpc"`
	Description string      `json:"description"`
}

// SupportedChains lists all chains we can benchmark
var SupportedChains = []ChainConfig{
	{
		ID:          "polkadot",
		Name:        "Polkadot",
		Family:      ChainFamilySubstrate,
		Logo:        "/logos/polkadot.svg",
		Color:       "#E6007A",
		DefaultRPC:  "wss://rpc.polkadot.io",
		Description: "Heterogeneous multi-chain protocol",
	},
	{
		ID:          "stellar",
		Name:        "Stellar",
		Family:      ChainFamilyStellar,
		Logo:        "/logos/stellar.svg",
		Color:       "#7C3AED",
		DefaultRPC:  "https://horizon.stellar.org",
		Description: "Open network for storing and moving money",
	},
}

// GetChainConfig returns config for a chain ID
func GetChainConfig(chainID string) *ChainConfig {
	for _, chain := range SupportedChains {
		if chain.ID == chainID {
			return &chain
		}
	}
	return nil
}
