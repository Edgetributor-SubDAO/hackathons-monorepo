// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - BENCHMARK ENGINE
//                    Core Benchmarking Logic
// ═══════════════════════════════════════════════════════════════════════════

package benchmark

import (
	"context"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/chainspeed/api/internal/chains"
	"github.com/chainspeed/api/internal/types"
	"github.com/chainspeed/api/internal/websocket"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"golang.org/x/sync/errgroup"
)

// Engine orchestrates blockchain benchmarks
type Engine struct {
	hub     *websocket.Hub
	running map[string]context.CancelFunc
	mu      sync.RWMutex
}

// NewEngine creates a new benchmark engine
func NewEngine(hub *websocket.Hub) *Engine {
	return &Engine{
		hub:     hub,
		running: make(map[string]context.CancelFunc),
	}
}

// StartTest initiates a new benchmark test
func (e *Engine) StartTest(req types.StartTestRequest) (*types.StartTestResponse, error) {
	testID := uuid.New().String()

	log.Info().
		Str("testId", testID).
		Str("mode", string(req.Mode)).
		Strs("chains", req.Chains).
		Msg("Starting benchmark test")

	// Create cancellable context
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)

	e.mu.Lock()
	e.running[testID] = cancel
	e.mu.Unlock()

	// Run tests in background
	go e.runTests(ctx, testID, req)

	return &types.StartTestResponse{
		TestID: testID,
		Status: "started",
	}, nil
}

// StopTest cancels a running test
func (e *Engine) StopTest(testID string) {
	e.mu.RLock()
	cancel, exists := e.running[testID]
	e.mu.RUnlock()

	if exists {
		cancel()
		e.mu.Lock()
		delete(e.running, testID)
		e.mu.Unlock()
	}
}

// runTests executes the benchmark tests
func (e *Engine) runTests(ctx context.Context, testID string, req types.StartTestRequest) {
	defer func() {
		e.mu.Lock()
		delete(e.running, testID)
		e.mu.Unlock()
	}()

	results := make([]types.ChainSpeedResult, 0, len(req.Chains))
	resultsMu := sync.Mutex{}

	g, gctx := errgroup.WithContext(ctx)

	for _, chainID := range req.Chains {
		chainID := chainID // capture loop variable

		g.Go(func() error {
			result, err := e.benchmarkChain(gctx, testID, chainID, req)
			if err != nil {
				log.Error().Err(err).Str("chainId", chainID).Msg("Benchmark failed")
				e.sendError(req.SocketID, testID, chainID, err.Error())
				return nil // Don't fail entire test group
			}

			resultsMu.Lock()
			results = append(results, *result)
			resultsMu.Unlock()

			// Send individual result
			e.sendResult(req.SocketID, testID, *result)
			return nil
		})
	}

	// Wait for all benchmarks
	_ = g.Wait()

	// Determine winner
	winner := e.determineWinner(results)

	// Send completion event
	e.sendComplete(req.SocketID, testID, winner, results)
}

// benchmarkChain runs benchmark for a single chain
func (e *Engine) benchmarkChain(ctx context.Context, testID, chainID string, req types.StartTestRequest) (*types.ChainSpeedResult, error) {
	chainConfig := types.GetChainConfig(chainID)
	if chainConfig == nil {
		return nil, fmt.Errorf("unsupported chain: %s", chainID)
	}

	// Determine RPC endpoint
	rpcEndpoint := chainConfig.DefaultRPC
	source := "default"
	if req.UserRPC != "" && req.SelectedChain == chainID {
		rpcEndpoint = req.UserRPC
		source = "user"
	}

	// Send initial progress
	e.sendProgress(req.SocketID, testID, chainID, 0, types.TestPhaseConnecting, "Connecting to RPC...")

	// Get the appropriate chain tester
	var tester chains.ChainTester
	switch chainConfig.Family {
	case types.ChainFamilySubstrate:
		tester = chains.NewPolkadotTester(rpcEndpoint)
	case types.ChainFamilyStellar:
		tester = chains.NewStellarTester(rpcEndpoint)
	default:
		return nil, fmt.Errorf("unsupported chain family: %s", chainConfig.Family)
	}

	// Phase 1: Connect (0-10%)
	e.sendProgress(req.SocketID, testID, chainID, 5, types.TestPhaseConnecting, "Establishing connection...")
	if err := tester.Connect(ctx); err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}
	defer tester.Close()

	e.sendProgress(req.SocketID, testID, chainID, 10, types.TestPhaseConnecting, "Connected successfully")

	// Phase 2: Measure latency (10-40%)
	e.sendProgress(req.SocketID, testID, chainID, 15, types.TestPhaseMeasuring, "Measuring RPC latency...")
	latencies, err := tester.MeasureLatency(ctx, 20, func(progress int) {
		pct := 15 + int(float64(progress)/100*25)
		e.sendProgress(req.SocketID, testID, chainID, float64(pct), types.TestPhaseMeasuring,
			fmt.Sprintf("Latency samples: %d/20", progress/5))
	})
	if err != nil {
		return nil, fmt.Errorf("latency measurement failed: %w", err)
	}

	// Phase 3: Get chain info (40-60%)
	e.sendProgress(req.SocketID, testID, chainID, 45, types.TestPhaseMeasuring, "Fetching chain info...")
	chainInfo, err := tester.GetChainInfo(ctx)
	if err != nil {
		return nil, fmt.Errorf("chain info fetch failed: %w", err)
	}
	e.sendProgress(req.SocketID, testID, chainID, 60, types.TestPhaseMeasuring, "Chain info retrieved")

	// Phase 4: Get specific metrics (60-80%)
	e.sendProgress(req.SocketID, testID, chainID, 65, types.TestPhaseMeasuring, "Collecting chain-specific metrics...")
	specificMetrics, err := tester.GetSpecificMetrics(ctx)
	if err != nil {
		log.Warn().Err(err).Str("chainId", chainID).Msg("Specific metrics fetch failed, using defaults")
	}
	e.sendProgress(req.SocketID, testID, chainID, 80, types.TestPhaseMeasuring, "Metrics collected")

	// Phase 5: Calculate scores (80-100%)
	e.sendProgress(req.SocketID, testID, chainID, 85, types.TestPhaseMeasuring, "Calculating scores...")

	// Calculate percentiles
	p50, p95 := calculatePercentiles(latencies)

	// Build generic metrics
	generic := types.GenericMetrics{
		RPCLatencyP50: p50,
		RPCLatencyP95: p95,
		BlockTime:     chainInfo.BlockTime,
		FinalityTime:  chainInfo.FinalityTime,
		TxThroughput:  chainInfo.TxThroughput,
		ErrorRate:     0.0, // Calculate from failed requests
	}

	// Calculate scores
	scores := calculateScores(generic)

	e.sendProgress(req.SocketID, testID, chainID, 100, types.TestPhaseComplete, "Complete")

	return &types.ChainSpeedResult{
		TestID:      testID,
		Mode:        req.Mode,
		ChainID:     chainID,
		ChainFamily: chainConfig.Family,
		Timestamp:   time.Now(),
		Region:      types.RegionUSEast, // TODO: detect actual region
		Generic:     generic,
		Scores:      scores,
		Specific:    specificMetrics,
		Meta: types.ResultMeta{
			RPCEndpoint:   rpcEndpoint,
			Source:        source,
			ClientVersion: "1.0.0",
		},
	}, nil
}

// calculatePercentiles calculates P50 and P95 from latency samples
func calculatePercentiles(latencies []float64) (p50, p95 float64) {
	if len(latencies) == 0 {
		return 0, 0
	}

	sorted := make([]float64, len(latencies))
	copy(sorted, latencies)
	sort.Float64s(sorted)

	p50Index := int(float64(len(sorted)) * 0.50)
	p95Index := int(float64(len(sorted)) * 0.95)

	if p50Index >= len(sorted) {
		p50Index = len(sorted) - 1
	}
	if p95Index >= len(sorted) {
		p95Index = len(sorted) - 1
	}

	return sorted[p50Index], sorted[p95Index]
}

// calculateScores converts metrics to normalized 0-100 scores
func calculateScores(m types.GenericMetrics) types.ChainSpeedScores {
	// Latency score: <20ms = 100, >500ms = 0
	latencyScore := math.Max(0, math.Min(100, 100-((m.RPCLatencyP50-20)/(500-20))*100))

	// Throughput score: >10000 TPS = 100, <100 TPS = 0
	throughputScore := math.Max(0, math.Min(100, (m.TxThroughput/10000)*100))

	// Finality score: <2s = 100, >60s = 0
	finalityScore := math.Max(0, math.Min(100, 100-((m.FinalityTime-2)/(60-2))*100))

	// Reliability score: 0% error = 100, 10% error = 0
	reliabilityScore := math.Max(0, 100-(m.ErrorRate*1000))

	// Overall: weighted average
	overall := (latencyScore*0.30 + throughputScore*0.25 + finalityScore*0.25 + reliabilityScore*0.20)

	return types.ChainSpeedScores{
		Overall:     math.Round(overall*10) / 10,
		Latency:     math.Round(latencyScore*10) / 10,
		Throughput:  math.Round(throughputScore*10) / 10,
		Finality:    math.Round(finalityScore*10) / 10,
		Reliability: math.Round(reliabilityScore*10) / 10,
	}
}

// determineWinner finds the chain with highest overall score
func (e *Engine) determineWinner(results []types.ChainSpeedResult) string {
	if len(results) == 0 {
		return ""
	}

	winner := results[0].ChainID
	maxScore := results[0].Scores.Overall

	for _, r := range results[1:] {
		if r.Scores.Overall > maxScore {
			maxScore = r.Scores.Overall
			winner = r.ChainID
		}
	}

	return winner
}

// WebSocket event helpers
func (e *Engine) sendProgress(socketID, testID, chainID string, progress float64, phase types.TestPhase, message string) {
	event := types.TestProgressEvent{
		Type:     "test:progress",
		TestID:   testID,
		ChainID:  chainID,
		Progress: progress,
		Phase:    phase,
		Message:  message,
	}
	if socketID != "" {
		_ = e.hub.SendToClient(socketID, event)
	}
}

func (e *Engine) sendResult(socketID, testID string, result types.ChainSpeedResult) {
	event := types.TestResultEvent{
		Type:    "test:result",
		TestID:  testID,
		Payload: result,
	}
	if socketID != "" {
		_ = e.hub.SendToClient(socketID, event)
	}
}

func (e *Engine) sendComplete(socketID, testID, winner string, results []types.ChainSpeedResult) {
	event := types.TestCompleteEvent{
		Type:    "test:complete",
		TestID:  testID,
		Winner:  winner,
		Results: results,
	}
	if socketID != "" {
		_ = e.hub.SendToClient(socketID, event)
	}
}

func (e *Engine) sendError(socketID, testID, chainID, errMsg string) {
	event := types.TestErrorEvent{
		Type:    "test:error",
		TestID:  testID,
		ChainID: chainID,
		Error:   errMsg,
	}
	if socketID != "" {
		_ = e.hub.SendToClient(socketID, event)
	}
}
