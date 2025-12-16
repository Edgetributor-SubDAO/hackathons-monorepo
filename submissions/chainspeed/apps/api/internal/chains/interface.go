// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - CHAIN TESTER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

package chains

import (
	"context"

	"github.com/chainspeed/api/internal/types"
)

// ChainInfo contains basic chain information
type ChainInfo struct {
	BlockTime     float64 // Average block time in seconds
	FinalityTime  float64 // Time to finality in seconds
	TxThroughput  float64 // Current TPS
	CurrentBlock  uint64  // Current block height
	PeersCount    int     // Number of connected peers
}

// ChainTester defines the interface for testing any blockchain
type ChainTester interface {
	// Connect establishes connection to the chain
	Connect(ctx context.Context) error

	// Close closes the connection
	Close() error

	// MeasureLatency performs n latency measurements
	// progressCallback is called with 0-100 progress
	MeasureLatency(ctx context.Context, samples int, progressCallback func(int)) ([]float64, error)

	// GetChainInfo retrieves basic chain information
	GetChainInfo(ctx context.Context) (*ChainInfo, error)

	// GetSpecificMetrics retrieves chain-specific metrics
	GetSpecificMetrics(ctx context.Context) (types.ChainSpecificMetrics, error)
}
