import express from "express";
import cors from "cors";
import { paymentMiddleware } from "@x402-flash/stellar-sdk";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import http from "http";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["CONTRACT_ID", "SERVER_SECRET_KEY", "PAYMENT_ADDRESS"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error("\n📋 Setup instructions:");
  console.error("   1. Copy .env.example to .env");
  console.error(
    "   2. Generate keys: stellar keys generate server --network testnet"
  );
  console.error(
    "   3. Fund account: stellar keys fund server --network testnet"
  );
  console.error("   4. Deploy contract and update CONTRACT_ID\n");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

// Metrics storage for demo
interface Metric {
  id: string;
  timestamp: number;
  method: "flash" | "standard";
  latency: number;
  endpoint: string;
  status: "success" | "failed";
  amount?: string;
}

const metrics: Metric[] = [];
const MAX_METRICS = 100;

// WebSocket connections for live updates
const clients = new Set<any>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("📡 WebSocket client connected");

  // Send recent metrics
  ws.send(
    JSON.stringify({
      type: "metrics",
      data: metrics.slice(-20),
    })
  );

  ws.on("close", () => {
    clients.delete(ws);
    console.log("📡 WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

function broadcastMetric(metric: Metric) {
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  const message = JSON.stringify({ type: "metric", data: metric });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      try {
        client.send(message);
      } catch (error) {
        console.error("Error sending to client:", error);
      }
    }
  });
}

// Configure x402-flash middleware
const payment = paymentMiddleware(
  {
    rpcUrl:
      process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE ||
      "Test SDF Network ; September 2015",
    contractId: process.env.CONTRACT_ID!,
    secretKey: process.env.SERVER_SECRET_KEY!,
    paymentAddress: process.env.PAYMENT_ADDRESS!,
  },
  {
    // Weather API - 10,000 stroops (0.001 XLM)
    "GET /api/weather": {
      price: "10000",
      token: process.env.TOKEN_ADDRESS || "native",
      network: "stellar-testnet",
      config: {
        description: "Current weather data",
        mimeType: "application/json",
        maxTimeoutSeconds: 60,
      },
    },

    // Market Data - 50,000 stroops (0.005 XLM)
    "GET /api/market": {
      price: "50000",
      token: process.env.TOKEN_ADDRESS || "native",
      network: "stellar-testnet",
      config: {
        description: "Real-time market data",
        mimeType: "application/json",
        maxTimeoutSeconds: 60,
      },
    },

    // Premium Analytics - 100,000 stroops (0.01 XLM)
    "GET /api/analytics": {
      price: "100000",
      token: process.env.TOKEN_ADDRESS || "native",
      network: "stellar-testnet",
      config: {
        description: "Premium analytics and insights",
        mimeType: "application/json",
        maxTimeoutSeconds: 60,
      },
    },

    // AI Query - 200,000 stroops (0.02 XLM)
    "POST /api/ai/query": {
      price: "200000",
      token: process.env.TOKEN_ADDRESS || "native",
      network: "stellar-testnet",
      config: {
        description: "AI-powered query processing",
        mimeType: "application/json",
        maxTimeoutSeconds: 120,
      },
    },
  }
);

// Apply payment middleware to protected routes
app.use("/api", payment);

// Health check (free)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: Date.now(),
    server: "x402-flash-demo",
    network: "stellar-testnet",
  });
});

// Info endpoint (free)
app.get("/info", (req, res) => {
  res.json({
    name: "x402-Flash Demo API",
    version: "1.0.0",
    description: "Micropayments on Stellar using x402-flash protocol",
    endpoints: [
      {
        path: "/api/weather",
        price: "10,000 stroops (0.001 XLM)",
        description: "Current weather data",
      },
      {
        path: "/api/market",
        price: "50,000 stroops (0.005 XLM)",
        description: "Real-time market data",
      },
      {
        path: "/api/analytics",
        price: "100,000 stroops (0.01 XLM)",
        description: "Premium analytics",
      },
      {
        path: "/api/ai/query",
        price: "200,000 stroops (0.02 XLM)",
        description: "AI-powered queries",
      },
    ],
    paymentAddress: process.env.PAYMENT_ADDRESS,
    network: "stellar-testnet",
  });
});

// Metrics endpoint (free)
app.get("/metrics", (req, res) => {
  const recentMetrics = metrics.slice(-50);
  const summary = {
    total: metrics.length,
    successful: metrics.filter((m) => m.status === "success").length,
    failed: metrics.filter((m) => m.status === "failed").length,
    avgLatency:
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length
        : 0,
    recent: recentMetrics,
  };
  res.json(summary);
});

// Protected endpoints

// Weather API
app.get("/api/weather", (req, res) => {
  const startTime = Date.now();

  const weatherData = {
    temperature: Math.round(15 + Math.random() * 15),
    condition: ["Sunny", "Cloudy", "Rainy", "Windy"][
      Math.floor(Math.random() * 4)
    ],
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round(5 + Math.random() * 20),
    location: "San Francisco",
    timestamp: Date.now(),
  };

  const metric: Metric = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    method: "flash",
    latency: Date.now() - startTime,
    endpoint: "/api/weather",
    status: "success",
    amount: "10000",
  };

  broadcastMetric(metric);

  res.json(weatherData);
});

// Market Data API
app.get("/api/market", (req, res) => {
  const startTime = Date.now();

  const marketData = {
    assets: [
      {
        symbol: "BTC",
        price: 95000 + Math.random() * 5000,
        change24h: (Math.random() - 0.5) * 10,
      },
      {
        symbol: "ETH",
        price: 3500 + Math.random() * 500,
        change24h: (Math.random() - 0.5) * 10,
      },
      {
        symbol: "XLM",
        price: 0.1 + Math.random() * 0.05,
        change24h: (Math.random() - 0.5) * 15,
      },
      { symbol: "USDC", price: 1.0, change24h: 0 },
    ],
    volume24h: Math.round(1000000000 + Math.random() * 500000000),
    timestamp: Date.now(),
  };

  const metric: Metric = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    method: "flash",
    latency: Date.now() - startTime,
    endpoint: "/api/market",
    status: "success",
    amount: "50000",
  };

  broadcastMetric(metric);

  res.json(marketData);
});

// Analytics API
app.get("/api/analytics", (req, res) => {
  const startTime = Date.now();

  const analyticsData = {
    summary: {
      totalUsers: Math.round(10000 + Math.random() * 5000),
      activeUsers: Math.round(2000 + Math.random() * 1000),
      revenue: Math.round(50000 + Math.random() * 20000),
      growth: (Math.random() * 30).toFixed(2) + "%",
    },
    trends: [
      { date: "2024-12-01", value: 100 + Math.random() * 50 },
      { date: "2024-12-02", value: 110 + Math.random() * 50 },
      { date: "2024-12-03", value: 120 + Math.random() * 50 },
      { date: "2024-12-04", value: 115 + Math.random() * 50 },
      { date: "2024-12-05", value: 125 + Math.random() * 50 },
    ],
    timestamp: Date.now(),
  };

  const metric: Metric = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    method: "flash",
    latency: Date.now() - startTime,
    endpoint: "/api/analytics",
    status: "success",
    amount: "100000",
  };

  broadcastMetric(metric);

  res.json(analyticsData);
});

// AI Query API
app.post("/api/ai/query", (req, res) => {
  const startTime = Date.now();
  const { query } = req.body;

  // Simulate AI processing
  setTimeout(() => {
    const aiResponse = {
      query: query || "No query provided",
      response: `AI Analysis: This is a simulated response to "${query || "your query"}". In a real implementation, this would connect to an AI model.`,
      confidence: Math.random(),
      processingTime: Date.now() - startTime,
      timestamp: Date.now(),
    };

    const metric: Metric = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      method: "flash",
      latency: Date.now() - startTime,
      endpoint: "/api/ai/query",
      status: "success",
      amount: "200000",
    };

    broadcastMetric(metric);

    res.json(aiResponse);
  }, 500); // Simulate processing delay
});

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Error:", err);

    const metric: Metric = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      method: "flash",
      latency: 0,
      endpoint: req.path,
      status: "failed",
    };

    broadcastMetric(metric);

    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("\n🚀 x402-Flash Demo API Server");
  console.log("================================");
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Payment Address: ${process.env.PAYMENT_ADDRESS}`);
  console.log(`📦 Contract: ${process.env.CONTRACT_ID}`);
  console.log(`🌐 Network: stellar-testnet`);
  console.log("\n📡 Endpoints:");
  console.log("  GET  /health              - Free (health check)");
  console.log("  GET  /info                - Free (API info)");
  console.log("  GET  /metrics             - Free (metrics)");
  console.log("  GET  /api/weather         - 10,000 stroops");
  console.log("  GET  /api/market          - 50,000 stroops");
  console.log("  GET  /api/analytics       - 100,000 stroops");
  console.log("  POST /api/ai/query        - 200,000 stroops");
  console.log("\n⚡ Ready for payments!\n");
});
