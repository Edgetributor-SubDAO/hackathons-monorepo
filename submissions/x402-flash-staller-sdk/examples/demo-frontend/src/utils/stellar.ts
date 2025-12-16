/**
 * Stellar utility functions for account management
 */

/**
 * Check if account exists and fund it via Friendbot if needed (testnet only)
 */
export async function ensureAccountFunded(
  publicKey: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<boolean> {
  if (network === "mainnet") {
    throw new Error("Cannot auto-fund on mainnet");
  }

  try {
    console.log("🔍 Checking account:", publicKey);

    // Check if account exists
    const response = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${publicKey}`
    );

    if (response.ok) {
      const data = await response.json();
      const xlmBalance = data.balances.find(
        (b: any) => b.asset_type === "native"
      );
      const balance = parseFloat(xlmBalance?.balance || "0");

      console.log(`✅ Account exists with ${balance} XLM`);

      // Warn if low balance
      if (balance < 10) {
        console.warn("⚠️  Low XLM balance, consider refunding");
      }

      return true;
    }

    if (response.status === 404) {
      console.log("🚀 Account not found, funding via Friendbot...");

      // Fund via Friendbot
      const fundResponse = await fetch(
        `https://friendbot.stellar.org?addr=${publicKey}`
      );

      if (!fundResponse.ok) {
        const errorText = await fundResponse.text();
        throw new Error(`Friendbot failed: ${errorText}`);
      }

      console.log("✅ Account funded successfully!");

      // Wait for account to be fully created
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify it was created
      const verifyResponse = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}`
      );

      if (verifyResponse.ok) {
        console.log("✅ Account verified");
        return true;
      } else {
        throw new Error("Account creation verification failed");
      }
    }

    throw new Error(`Unexpected response: ${response.status}`);
  } catch (error) {
    console.error("❌ Error funding account:", error);
    throw error;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  publicKey: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<string> {
  const horizonUrl =
    network === "testnet"
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

  try {
    const response = await fetch(`${horizonUrl}/accounts/${publicKey}`);

    if (!response.ok) {
      return "0";
    }

    const data = await response.json();
    const xlmBalance = data.balances.find(
      (b: any) => b.asset_type === "native"
    );

    return xlmBalance?.balance || "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
}
