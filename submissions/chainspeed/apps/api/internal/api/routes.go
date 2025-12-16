// ═══════════════════════════════════════════════════════════════════════════
//                    CHAINSPEED - API ROUTES
//                    HTTP and WebSocket Endpoints
// ═══════════════════════════════════════════════════════════════════════════

package api

import (
	"github.com/chainspeed/api/internal/benchmark"
	"github.com/chainspeed/api/internal/types"
	ws "github.com/chainspeed/api/internal/websocket"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes configures all API routes
func SetupRoutes(app *fiber.App, engine *benchmark.Engine, hub *ws.Hub) {
	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "chainspeed-api",
			"version": "1.0.0",
		})
	})

	// API v1 group
	v1 := app.Group("/api/v1")

	// Get supported chains
	v1.Get("/chains", func(c *fiber.Ctx) error {
		return c.JSON(types.SupportedChains)
	})

	// Start a new test
	v1.Post("/test/start", func(c *fiber.Ctx) error {
		var req types.StartTestRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Invalid request body",
				"details": err.Error(),
			})
		}

		// Validate request
		if len(req.Chains) == 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "At least one chain must be specified",
			})
		}

		// Validate chain IDs
		for _, chainID := range req.Chains {
			if types.GetChainConfig(chainID) == nil {
				return c.Status(400).JSON(fiber.Map{
					"error": "Unsupported chain: " + chainID,
				})
			}
		}

		// Start the test
		resp, err := engine.StartTest(req)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "Failed to start test",
				"details": err.Error(),
			})
		}

		return c.JSON(resp)
	})

	// WebSocket upgrade middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// WebSocket endpoint
	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		client := ws.NewClient(c, hub)
		hub.Register(client)

		// Send connection confirmation with client ID
		c.WriteJSON(fiber.Map{
			"type":     "connection",
			"socketId": client.ID,
		})

		// Start reader and writer
		go client.WritePump()
		client.ReadPump()
	}))
}
