# ChainSpeed API

The Go backend for ChainSpeed - "Ookla for Web3" blockchain network benchmarking.

## Features

- **Real-time RPC Latency Testing**: Measure P50/P95 latency percentiles
- **Multi-Chain Support**: Polkadot/Substrate and Stellar networks
- **WebSocket Progress**: Real-time progress updates via WebSocket
- **Chain-Specific Metrics**: XCM stats, GRANDPA finality, Soroban invocations, etc.
- **Normalized Scoring**: 0-100 scores for latency, throughput, finality, reliability

## Architecture

```
apps/api/
├── main.go                    # Entry point
├── internal/
│   ├── api/
│   │   └── routes.go          # HTTP & WebSocket endpoints
│   ├── benchmark/
│   │   └── engine.go          # Benchmark orchestration
│   ├── chains/
│   │   ├── interface.go       # ChainTester interface
│   │   ├── polkadot.go        # Polkadot/Substrate tester
│   │   └── stellar.go         # Stellar tester
│   ├── config/
│   │   └── config.go          # Configuration
│   ├── types/
│   │   └── types.go           # Domain types
│   └── websocket/
│       └── hub.go             # WebSocket hub
```

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/chains` | List supported chains |
| POST | `/api/v1/test/start` | Start benchmark test |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws` | Real-time updates |

#### WebSocket Events

```json
// Connection established
{"type": "connection", "socketId": "uuid"}

// Progress update
{"type": "test:progress", "testId": "...", "chainId": "polkadot", "progress": 50, "phase": "measuring"}

// Individual result
{"type": "test:result", "testId": "...", "payload": {...}}

// Test complete
{"type": "test:complete", "testId": "...", "winner": "polkadot", "results": [...]}

// Error
{"type": "test:error", "testId": "...", "error": "message"}
```

## Running

```bash
# Development
cd apps/api
go mod tidy
go run main.go

# Build
go build -o chainspeed-api main.go
./chainspeed-api
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| ENVIRONMENT | development | Environment name |
| CORS_ORIGINS | * | Allowed CORS origins |
| POLKADOT_RPC | wss://rpc.polkadot.io | Polkadot RPC endpoint |
| STELLAR_RPC | https://horizon.stellar.org | Stellar Horizon URL |
| TEST_TIMEOUT | 60 | Test timeout in seconds |
| SAMPLE_COUNT | 20 | Latency samples to collect |

## Metrics Collected

### Generic Metrics (All Chains)
- RPC Latency P50/P95
- Block Time
- Finality Time
- TX Throughput
- Error Rate

### Polkadot Specific
- XCM Success Rate & Execution Time
- GRANDPA Finality Lag
- Active Validators
- Parachain Count

### Stellar Specific
- Ledger Close Time & Variance
- Soroban Invocations & Success Rate
- Path Payment Success & Avg Hops

## Scoring Algorithm

Scores are normalized 0-100:

| Metric | 100 Score | 0 Score |
|--------|-----------|---------|
| Latency | < 20ms | > 500ms |
| Throughput | > 10,000 TPS | < 100 TPS |
| Finality | < 2s | > 60s |
| Reliability | 0% errors | 10% errors |

**Overall Score** = 30% Latency + 25% Throughput + 25% Finality + 20% Reliability
