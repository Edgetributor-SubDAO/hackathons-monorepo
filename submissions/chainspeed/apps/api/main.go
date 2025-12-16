// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED API - MAIN ENTRY POINT
//                    "Ookla for Web3" Backend Server
// ═══════════════════════════════════════════════════════════════════════════

package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/chainspeed/api/internal/api"
	"github.com/chainspeed/api/internal/benchmark"
	"github.com/chainspeed/api/internal/config"
	"github.com/chainspeed/api/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load .env file
	_ = godotenv.Load()

	// Setup zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	// Load configuration
	cfg := config.Load()

	log.Info().
		Str("port", cfg.Port).
		Str("environment", cfg.Environment).
		Msg("🚀 Starting ChainSpeed API Server")

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize benchmark engine
	engine := benchmark.NewEngine(hub)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:       "ChainSpeed API",
		ServerHeader:  "ChainSpeed",
		ReadTimeout:   30 * time.Second,
		WriteTimeout:  30 * time.Second,
		IdleTimeout:   120 * time.Second,
		BodyLimit:     4 * 1024 * 1024, // 4MB
		Concurrency:   256 * 1024,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} | ${path}\n",
		TimeFormat: "15:04:05",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     "GET,POST,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Setup routes
	api.SetupRoutes(app, engine, hub)

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Info().Msg("Gracefully shutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		
		// Close WebSocket connections
		hub.Shutdown()
		
		// Shutdown Fiber
		_ = app.ShutdownWithContext(ctx)
	}()

	// Start server
	addr := ":" + cfg.Port
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
