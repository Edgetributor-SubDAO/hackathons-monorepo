// src/services/reputation.ts
import {
  Address,
  Contract,
  Networks,
  TransactionBuilder,
  xdr,
  scValToNative,
  nativeToScVal,
  Horizon,
  rpc,
} from "@stellar/stellar-sdk";
import albedo from "@albedo-link/intent";

// Soroban RPC server for testnet
const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org", {
  allowHttp: true,
});

// Horizon server for account info
const horizonServer = new Horizon.Server(
  "https://horizon-testnet.stellar.org",
  { allowHttp: true }
);

// Deployed contract ID on testnet
const CONTRACT_ID = "CDUTJKXOOVPWI6BZZDJDUMZUDBLP2VRBYPLJGF35UK52LKWM6CZXHJNX";

const NETWORK_PASSPHRASE = Networks.TESTNET;

/**
 * Load account details from Horizon
 */
async function getAccount(publicKey: string) {
  return await horizonServer.loadAccount(publicKey);
}

/**
 * Build, prepare, and sign a transaction using Albedo
 */
async function buildAndSignTransaction(
  sourceAccount: string,
  contract: Contract,
  method: string,
  args: xdr.ScVal[]
) {
  try {
    console.log("🔨 Building transaction...");
    const account = await getAccount(sourceAccount);

    const contractCall = contract.call(method, ...args);

    // Build initial transaction with higher fee for Soroban
    let transaction = new TransactionBuilder(account, {
      fee: "10000000", // 1 XLM fee for Soroban
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contractCall)
      .setTimeout(300)
      .build();

    console.log("🔍 Simulating transaction...");
    // Simulate transaction to get the footprint
    const simulateResponse = await rpcServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulateResponse)) {
      console.error("❌ Simulation error:", simulateResponse);
      throw new Error(
        `Simulation failed: ${simulateResponse.error?.message || JSON.stringify(simulateResponse.error)}`
      );
    }

    console.log("✅ Simulation successful");
    console.log("🔧 Preparing transaction...");
    
    // Prepare transaction with the footprint from simulation
    const preparedTx = await rpcServer.prepareTransaction(transaction);

    console.log("📝 Opening Albedo for signing...");
    
    // Sign transaction with Albedo
    const signedResult = await albedo.tx({
      xdr: preparedTx.toXDR(),
      network: "testnet",
      submit: false, // We'll submit it ourselves
    });

    console.log("✅ Transaction signed successfully");

    if (!signedResult.signed_envelope_xdr) {
      throw new Error("Transaction signing failed or was cancelled by user");
    }

    return signedResult.signed_envelope_xdr;
  } catch (error) {
    console.error("❌ Error in buildAndSignTransaction:", error);
    throw error;
  }
}

/**
 * Submit a signed transaction and wait for result
 */
async function submitTransaction(signedXdr: string) {
  try {
    console.log("📤 Submitting transaction to network...");
    const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const sendResponse = await rpcServer.sendTransaction(transaction);

    console.log("📬 Send response:", sendResponse.status);

    if (sendResponse.status === "ERROR") {
      console.error("❌ Transaction error:", sendResponse.errorResult);
      throw new Error(
        `Transaction failed: ${JSON.stringify(sendResponse.errorResult)}`
      );
    }

    // Wait for transaction to be confirmed
    if (sendResponse.status === "PENDING") {
      console.log("⏳ Waiting for confirmation...");
      let getResponse = await rpcServer.getTransaction(sendResponse.hash);
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      // Poll until we get a definitive result
      while (getResponse.status === "NOT_FOUND" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await rpcServer.getTransaction(sendResponse.hash);
        attempts++;
        console.log(`⏳ Polling attempt ${attempts}/${maxAttempts}...`);
      }

      if (getResponse.status === "SUCCESS") {
        console.log("✅ Transaction confirmed!");
        return {
          success: true,
          status: getResponse.status,
          hash: sendResponse.hash,
        };
      } else if (getResponse.status === "NOT_FOUND") {
        console.warn("⚠️ Transaction still pending after timeout");
        return {
          success: true,
          status: "PENDING",
          hash: sendResponse.hash,
        };
      } else {
        console.error("❌ Transaction failed:", getResponse.status);
        throw new Error(`Transaction failed: ${getResponse.status}`);
      }
    }

    console.log("✅ Transaction submitted successfully");
    return {
      success: true,
      status: sendResponse.status,
      hash: sendResponse.hash,
    };
  } catch (error) {
    console.error("❌ Error in submitTransaction:", error);
    throw error;
  }
}

/**
 * Reputation data structure returned from contract
 *//**
 * Reputation data structure returned from contract
 */
export interface SBTReputation {
  score: number;
  profile: string;
  stellar_address: string;
  minted_at: number;
  token_id: number;
}

/**
 * Fetch reputation from the contract (read-only simulation)
 */
export async function getReputation(
  userAddress: string
): Promise<SBTReputation | null> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const accountScVal = new Address(userAddress).toScVal();
    const account = await getAccount(userAddress);

    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_reputation", accountScVal))
      .setTimeout(30)
      .build();

    const simulateResponse = await rpcServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulateResponse)) {
      console.log("No reputation found for this address");
      return null;
    }

    if (!simulateResponse.result?.retval) {
      return null;
    }

    // Parse Option<ReputationData> - if None, return null
    const result = scValToNative(simulateResponse.result.retval);

    if (!result || result === null) {
      return null;
    }

    // Map the result to our interface
    return {
      score: Number(result.score),
      profile: String(result.profile),
      stellar_address: String(result.stellar_address),
      minted_at: Number(result.minted_at),
      token_id: Number(result.token_id),
    };
  } catch (err) {
    console.error("Error getting reputation:", err);
    return null;
  }
}

/**
 * Mint new SBT
 * Contract: mint_sbt(to: Address, score: u32, profile: String, stellar_address: String) -> Result<u64, Error>
 */
export async function mintSBT(
  userAddress: string,
  score: number,
  profile: string
): Promise<{ success: boolean; hash?: string; tokenId?: number }> {
  try {
    console.log("🎨 Starting mint process...", { userAddress, score, profile });
    
    // Validate score
    if (score < 0 || score > 1000 || !Number.isInteger(score)) {
      throw new Error("Score must be an integer between 0 and 1000");
    }

    const contract = new Contract(CONTRACT_ID);

    console.log("🔢 Building ScVal parameters...");
    // Build proper ScVal types
    const toScVal = new Address(userAddress).toScVal();
    const scoreScVal = nativeToScVal(score, { type: "u32" });
    const profileScVal = nativeToScVal(profile, { type: "string" });
    const stellarAddressScVal = nativeToScVal(userAddress, { type: "string" });

    console.log("✅ Parameters ready, building transaction...");
    const signedXdr = await buildAndSignTransaction(
      userAddress,
      contract,
      "mint_sbt",
      [toScVal, scoreScVal, profileScVal, stellarAddressScVal]
    );

    console.log("📤 Submitting transaction...");
    const result = await submitTransaction(signedXdr);
    console.log("✅ Mint successful!", result);
    return result;
  } catch (error) {
    console.error("❌ Error in mintSBT:", error);
    throw error;
  }
}

/**
 * Update score
 * Contract: update_score(caller: Address, new_score: u32) -> Result<(), Error>
 */
export async function updateScore(
  userAddress: string,
  newScore: number
): Promise<{ success: boolean; hash?: string }> {
  // Validate score
  if (newScore < 0 || newScore > 1000 || !Number.isInteger(newScore)) {
    throw new Error("Score must be an integer between 0 and 1000");
  }

  const contract = new Contract(CONTRACT_ID);

  const callerScVal = new Address(userAddress).toScVal();
  const scoreScVal = nativeToScVal(newScore, { type: "u32" });

  const signedXdr = await buildAndSignTransaction(
    userAddress,
    contract,
    "update_score",
    [callerScVal, scoreScVal]
  );

  return await submitTransaction(signedXdr);
}

/**
 * Verify ownership
 * Contract: verify_ownership(account: Address) -> bool
 */
export async function verifyOwnership(userAddress: string): Promise<boolean> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const accountScVal = new Address(userAddress).toScVal();
    const account = await getAccount(userAddress);

    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("verify_ownership", accountScVal))
      .setTimeout(30)
      .build();

    const simulateResponse = await rpcServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulateResponse)) {
      return false;
    }

    if (!simulateResponse.result?.retval) {
      return false;
    }

    return scValToNative(simulateResponse.result.retval) as boolean;
  } catch (err) {
    console.error("Error verifying ownership:", err);
    return false;
  }
}

/**
 * Get total supply
 * Contract: total_supply() -> u64
 */
export async function getTotalSupply(
  anyAddress: string
): Promise<number | null> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const account = await getAccount(anyAddress);

    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("total_supply"))
      .setTimeout(30)
      .build();

    const simulateResponse = await rpcServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulateResponse)) {
      return null;
    }

    if (!simulateResponse.result?.retval) {
      return null;
    }

    return Number(scValToNative(simulateResponse.result.retval));
  } catch (err) {
    console.error("Error getting total supply:", err);
    return null;
  }
}

// Legacy exports for backward compatibility
export const getCredential = getReputation;
export const mintCredential = mintSBT;
