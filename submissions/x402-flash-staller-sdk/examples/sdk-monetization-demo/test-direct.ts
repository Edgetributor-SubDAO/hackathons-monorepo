// Simple test without AgentClient wrapper
import { X402FlashClient } from "@x402-flash/stellar-sdk";
import { Keypair } from "@stellar/stellar-sdk";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const AGENT_SERVER_URL = "http://localhost:5001";
const userMessage = process.argv[2] || "Hello from direct test!";

console.log("\n🧪 Direct SDK Test (No AgentClient Wrapper)\n");
console.log("=".repeat(60));

const clientKeypair = Keypair.random();
console.log(`\n🔑 Client: ${clientKeypair.publicKey()}\n`);

const x402Client = new X402FlashClient({
  rpcUrl: process.env.RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase:
    process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  contractId:
    process.env.CONTRACT_ID ||
    "CA3U6I3JCEMQ6DCTWVIHBTPLA2C5BWQ5YLAGC7WFNHTD3ROKE7PUHPWH",
  secretKey: clientKeypair.secret(),
});

async function main() {
  try {
    // Fund
    console.log("💰 Funding...");
    await fetch(
      `https://friendbot.stellar.org?addr=${clientKeypair.publicKey()}`
    );
    await new Promise((r) => setTimeout(r, 3000));

    // Get metadata
    console.log("📊 Fetching metadata...");
    const metadata = (await fetch(`${AGENT_SERVER_URL}/metadata`).then((r) =>
      r.json()
    )) as {
      name: string;
      pricing: { basePrice: number };
    };
    console.log(`   Agent: ${metadata.name}`);
    console.log(`   Price: ${metadata.pricing.basePrice} stroops\n`);

    // Open channel
    const serverAddress =
      "GDUTKZYSPCITQVMC27AS4QLE5RSZ6MQOWFXDM23YVRKMQG55Q7HGNRT5";
    const token = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

    console.log("📡 Opening channel...");
    await x402Client.openEscrow(serverAddress, token, "10000", 3600);
    console.log("✅ Channel opened!\n");

    // Make paid request
    console.log("💬 Making paid request...");
    console.log(`📤 Input: ${userMessage}\n`);

    const paidFetch = x402Client.wrapFetch();
    const response = await paidFetch(`${AGENT_SERVER_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capability: "text_generation",
        input: userMessage,
        userId: clientKeypair.publicKey(),
      }),
    });

    const result = (await response.json()) as {
      output?: string;
      usage?: {
        inputTokens: number;
        outputTokens: number;
        computeTime: number;
        cost: number;
      };
    };
    console.log(`🤖 Response: ${result.output}\n`);

    if (result.usage) {
      console.log("📈 Usage:");
      console.log(
        `   Tokens: ${result.usage.inputTokens + result.usage.outputTokens}`
      );
      console.log(`   Time: ${result.usage.computeTime}ms`);
      console.log(`   Cost: ${result.usage.cost} stroops`);
    }

    console.log("\n✅ Direct SDK test successful!\n");
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();
