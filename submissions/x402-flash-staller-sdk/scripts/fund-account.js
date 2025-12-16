#!/usr/bin/env node

/**
 * Fund Stellar testnet accounts via Friendbot
 * Usage: node scripts/fund-account.js <PUBLIC_KEY>
 */

const ACCOUNT =
  process.argv[2] || "GD46GUR2PNF25R3ODWLOLM2VUD23CBWU25VBNKPPXSP2ETL6QBE2IFDM";

async function fundAccount() {
  console.log("💰 Funding account:", ACCOUNT);

  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${ACCOUNT}`
    );

    if (response.ok) {
      console.log("✅ Account funded successfully!");
      console.log(
        "🔗 View at: https://stellar.expert/explorer/testnet/account/" + ACCOUNT
      );

      // Wait a moment then check balance
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const accountResponse = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${ACCOUNT}`
      );

      if (accountResponse.ok) {
        const data = await accountResponse.json();
        const xlmBalance = data.balances.find((b) => b.asset_type === "native");
        const balance = xlmBalance?.balance || "0";
        console.log(`💼 Current balance: ${balance} XLM`);
      }
    } else {
      const errorText = await response.text();
      console.error("❌ Funding failed:", errorText);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fundAccount();
