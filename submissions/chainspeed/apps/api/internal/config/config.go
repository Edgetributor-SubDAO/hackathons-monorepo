// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

package config

import (
	"fmt"
	"os"
)

// Config holds all application configuration
type Config struct {
	// Server settings
	Port        string
	Environment string
	CORSOrigins string

	// Chain RPC endpoints
	PolkadotRPC string
	StellarRPC  string

	// Test settings
	TestTimeout     int // seconds
	SampleCount     int
	ConcurrentTests int
}

// Load reads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "3001"),
		Environment:     getEnv("ENVIRONMENT", "development"),
		CORSOrigins:     getEnv("CORS_ORIGINS", "*"),
		PolkadotRPC:     getEnv("POLKADOT_RPC", "wss://rpc.polkadot.io"),
		StellarRPC:      getEnv("STELLAR_RPC", "https://horizon.stellar.org"),
		TestTimeout:     getEnvInt("TEST_TIMEOUT", 60),
		SampleCount:     getEnvInt("SAMPLE_COUNT", 20),
		ConcurrentTests: getEnvInt("CONCURRENT_TESTS", 5),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		var result int
		_, err := fmt.Sscanf(value, "%d", &result)
		if err == nil {
			return result
		}
	}
	return fallback
}
