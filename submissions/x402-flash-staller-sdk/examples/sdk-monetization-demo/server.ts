// Server using AgentServer from @x402-ai/server package
import { AgentServer } from "@x402-ai/server";
import { EchoAgent } from "./agent.js";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../demo-api-server/.env" });

// Initialize agent
const agent = new EchoAgent();
await agent.initialize();

// Configure and start server
const config = {
  port: 5001,
  stellar: {
    rpcUrl: process.env.RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase:
      process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
    contractId:
      process.env.CONTRACT_ID ||
      "CA3U6I3JCEMQ6DCTWVIHBTPLA2C5BWQ5YLAGC7WFNHTD3ROKE7PUHPWH",
    secretKey:
      process.env.SERVER_SECRET_KEY ||
      "SCYHMGC6IGCVWHZEDGX55HIHCQAJLWWQYACPWXGHZ6DHQDFBCTLUNSHD",
    paymentAddress:
      process.env.SERVER_PUBLIC_KEY ||
      "GDUTKZYSPCITQVMC27AS4QLE5RSZ6MQOWFXDM23YVRKMQG55Q7HGNRT5",
  },
  cors: {
    origin: "*",
    credentials: true,
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100,
  },
};

console.log("\n🚀 Starting x402-AI Agent Server (SDK Demo)\n");
console.log("=".repeat(60));

const server = new AgentServer(agent, config);
server.start();

console.log("\n📋 Server Configuration:");
console.log(`   Port: ${config.port}`);
console.log(`   Contract: ${config.stellar.contractId}`);
console.log(`   Payment Address: ${config.stellar.paymentAddress}`);
console.log(`   Network: Stellar Testnet`);

console.log("\n🔗 Available Endpoints:");
console.log(`   GET  http://localhost:${config.port}/health`);
console.log(`   GET  http://localhost:${config.port}/metadata`);
console.log(
  `   POST http://localhost:${config.port}/execute (requires payment)`
);
console.log(
  `   POST http://localhost:${config.port}/stream (requires payment)`
);

console.log("\n💰 Pricing:");
console.log(`   ${agent.getMetadata().pricing.basePrice} stroops per request`);
console.log(`   Model: ${agent.getMetadata().pricing.model}`);

console.log("\n✨ Server is ready to accept paid AI requests!\n");
console.log("=".repeat(60));
console.log("\nPress Ctrl+C to stop the server\n");
