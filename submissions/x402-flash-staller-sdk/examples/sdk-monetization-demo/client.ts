// Client using AgentClient from @x402-ai/client package
import { AgentClient } from "@x402-ai/client";
import { Keypair } from "@stellar/stellar-sdk";
import { AgentCapability } from "@x402-ai/core";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const AGENT_SERVER_URL = "http://localhost:5001";

// Get message from command line or use default
const userMessage = process.argv[2] || "Hello, AI Agent!";

console.log("\n🤖 x402-AI Agent Client (SDK Demo)\n");
console.log("=".repeat(60));

// Generate client keypair
const clientKeypair = Keypair.random();
console.log(`\n🔑 Client Address: ${clientKeypair.publicKey()}`);
console.log("   (Generated for this demo)\n");

// Initialize client
const client = new AgentClient({
  stellar: {
    rpcUrl: process.env.RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase:
      process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
    contractId:
      process.env.CONTRACT_ID ||
      "CA3U6I3JCEMQ6DCTWVIHBTPLA2C5BWQ5YLAGC7WFNHTD3ROKE7PUHPWH",
    secretKey: clientKeypair.secret(),
  },
  autoOpenChannel: true,
  defaultEscrow: "10000", // 10 requests worth
});

async function main() {
  try {
    // Step 1: Fund client account
    console.log("💰 Funding client account via Friendbot...");
    const friendbotResponse = await fetch(
      `https://friendbot.stellar.org?addr=${clientKeypair.publicKey()}`
    );
    if (friendbotResponse.ok) {
      console.log("✅ Account funded successfully!");
    } else {
      console.log("⚠️  Friendbot may have rate limited. Continuing anyway...");
    }

    // Wait for account propagation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 2: Call agent with automatic payment handling
    console.log("\n📊 Fetching agent metadata...");
    const metadata = await client.getMetadata(AGENT_SERVER_URL);

    console.log(`\n🤖 Agent: ${metadata.name}`);
    console.log(`   Description: ${metadata.description}`);
    console.log(`   Version: ${metadata.version}`);
    console.log(`   Capabilities: ${metadata.capabilities.join(", ")}`);
    console.log(
      `   💰 Price: ${metadata.pricing.basePrice} stroops per request`
    );

    console.log("\n💬 Making AI request...\n");
    console.log(`📤 You: ${userMessage}\n`);

    // Make paid AI request (client handles payment channel automatically)
    const response = await client.call(AGENT_SERVER_URL, {
      capability: AgentCapability.TEXT_GENERATION,
      input: userMessage,
      userId: clientKeypair.publicKey(),
    });

    console.log(`🤖 Agent: ${response.output}\n`);

    // Show usage stats
    if (response.usage) {
      console.log("📈 Usage Statistics:");
      console.log(`   Input Tokens: ${response.usage.inputTokens}`);
      console.log(`   Output Tokens: ${response.usage.outputTokens}`);
      console.log(`   Compute Time: ${response.usage.computeTime}ms`);
      console.log(`   Cost: ${response.usage.cost} stroops`);
    }

    console.log("\n✅ Request completed successfully!");
    console.log("\n" + "=".repeat(60));
    console.log("\n💡 Key Features Demonstrated:");
    console.log("   ✓ BaseAgent extension (agent.ts)");
    console.log("   ✓ AgentServer integration (server.ts)");
    console.log("   ✓ AgentClient with auto-payments (client.ts)");
    console.log("   ✓ Micropayments via x402-flash");
    console.log("   ✓ Usage tracking and cost calculation");
    console.log("\n🎉 AI Agent Monetization Working!\n");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Make sure the server is running (npm run server)");
    console.log("   2. Check that the contract is deployed and initialized");
    console.log("   3. Ensure Friendbot funded the account");
    console.log("   4. Verify network connectivity\n");
    process.exit(1);
  }
}

main();
