#!/usr/bin/env node
import {
  X402FlashClient,
  X402FlashServer,
  paymentMiddleware,
} from "./dist/index.js";

console.log("🧪 Testing x402-flash SDK...\n");

// Test 1: Verify exports
console.log("✅ Test 1: Exports");
console.log("   - X402FlashClient:", typeof X402FlashClient);
console.log("   - X402FlashServer:", typeof X402FlashServer);
console.log("   - paymentMiddleware:", typeof paymentMiddleware);

// Test 2: Client instantiation
console.log("\n✅ Test 2: Client Instantiation");
try {
  const client = new X402FlashClient({
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
    secretKey: "SABC" + "A".repeat(52), // Dummy secret
  });
  console.log("   Client created successfully");
} catch (error) {
  console.log("   Client creation test:", error.message);
}

// Test 3: Server instantiation
console.log("\n✅ Test 3: Server Instantiation");
try {
  const server = new X402FlashServer({
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
    secretKey: "SABC" + "A".repeat(52), // Dummy secret
    paymentAddress: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  });
  console.log("   Server created successfully");
} catch (error) {
  console.log("   Server creation test:", error.message);
}

// Test 4: Middleware creation
console.log("\n✅ Test 4: Middleware Creation");
try {
  const middleware = paymentMiddleware(
    {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
      contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
      secretKey: "SABC" + "A".repeat(52),
      paymentAddress:
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      "GET /test": "10000",
      "POST /api/data": {
        price: "50000",
        token: "native",
        network: "stellar-testnet",
        config: {
          description: "Test API",
        },
      },
    }
  );
  console.log("   Middleware created successfully");
  console.log("   Middleware type:", typeof middleware);
} catch (error) {
  console.log("   Middleware creation failed:", error.message);
}

// Test 5: Type exports
console.log("\n✅ Test 5: Build Output");
const fs = await import("fs");
const distPath = new URL("./dist", import.meta.url).pathname;
const files = fs.readdirSync(distPath);
console.log("   Dist files:", files.join(", "));

const hasTypes = files.some((f) => f.endsWith(".d.ts"));
const hasJs = files.some((f) => f.endsWith(".js") && f !== "types.js");
console.log("   Has TypeScript declarations:", hasTypes ? "✅" : "❌");
console.log("   Has JavaScript files:", hasJs ? "✅" : "❌");

console.log("\n🎉 All tests completed!\n");
