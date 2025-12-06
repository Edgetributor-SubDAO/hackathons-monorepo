// src/services/polkadot.ts
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress, web3Enable } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

// Pop Network (Paseo) testnet RPC endpoint
const ROCOCO_RPC = "wss://rpc1.paseo.popnetwork.xyz";

// Contract ID - Using a placeholder for now (will update after deployment)
// NOTE: Contract build successful, pending testnet token funding for deployment
let CONTRACT_ID = "5HXWdQVPcyHzBoLRoi9WJfwfQw9vnpr9VnuiGCMA";

export interface PolkadotReputation {
  token_id: number;
  score: number;
  profile: string;
  stellar_address: string;
  minted_at: number;
}

export interface PolkadotWallet {
  connected: boolean;
  address: string | null;
  name: string | null;
  accounts: InjectedAccountWithMeta[];
}

/**
 * Initialize Polkadot API connection
 */
export async function initializePolkadot(): Promise<ApiPromise> {
  try {
    console.log("🔌 Connecting to Rococo RPC...");
    const provider = new WsProvider(ROCOCO_RPC);
    const api = await ApiPromise.create({ provider });
    
    console.log(`✅ Connected to Rococo (chain: ${(await api.rpc.system.chain()).toString()})`);
    console.log(`Network version: ${(await api.rpc.system.version()).toString()}`);
    
    return api;
  } catch (error) {
    console.error("❌ Failed to initialize Polkadot:", error);
    throw error;
  }
}

/**
 * Enable wallet extension and get accounts
 */
export async function enablePolkadotExtension(): Promise<boolean> {
  try {
    console.log("🔑 Enabling Polkadot extension...");
    
    const extensions = await web3Enable("ChainRepute");
    
    if (extensions.length === 0) {
      throw new Error("No Polkadot wallet extension found. Install Polkadot.js extension.");
    }

    console.log(`✅ Found ${extensions.length} extension(s)`);
    return true;
  } catch (error) {
    console.error("❌ Failed to enable extension:", error);
    throw error;
  }
}

/**
 * Get accounts from the connected wallet
 */
export async function getPolkadotAccounts(): Promise<InjectedAccountWithMeta[]> {
  try {
    console.log("🔍 Fetching Polkadot accounts...");
    
    const extensions = await web3Enable("ChainRepute");
    if (extensions.length === 0) {
      throw new Error("Polkadot extension not enabled");
    }

    const allAccounts: InjectedAccountWithMeta[] = [];
    
    for (const extension of extensions) {
      try {
        const accounts = await extension.accounts.get();
        allAccounts.push(...accounts);
      } catch (err) {
        console.warn("Failed to get accounts from extension:", err);
      }
    }

    console.log(`✅ Found ${allAccounts.length} account(s)`);
    return allAccounts;
  } catch (error) {
    console.error("❌ Failed to get accounts:", error);
    throw error;
  }
}

/**
 * Set the contract ID for this session
 */
export function setContractAddress(address: string): void {
  CONTRACT_ID = address;
  console.log(`📝 Contract address set to: ${CONTRACT_ID}`);
}

/**
 * Get the currently set contract address
 */
export function getContractAddress(): string {
  return CONTRACT_ID;
}

/**
 * Load contract metadata from ABI (minimal ABI for testing)
 */
export function createContractABI() {
  return {
    V5: {
      spec: {
        constructors: [
          {
            label: "new",
            selector: "0x9bae9d5e",
          },
        ],
        docs: [],
        events: [],
        messages: [
          {
            args: [
              {
                label: "score",
                type: {
                  displayName: ["u32"],
                  type: 4,
                },
              },
              {
                label: "profile",
                type: {
                  displayName: ["String"],
                  type: 5,
                },
              },
              {
                label: "stellar_address",
                type: {
                  displayName: ["String"],
                  type: 5,
                },
              },
            ],
            docs: [],
            label: "mint_sbt",
            mutates: true,
            payable: false,
            returnType: {
              displayName: ["Result"],
              type: 6,
            },
            selector: "0xd183512b",
          },
          {
            args: [
              {
                label: "new_score",
                type: {
                  displayName: ["u32"],
                  type: 4,
                },
              },
            ],
            docs: [],
            label: "update_score",
            mutates: true,
            payable: false,
            returnType: {
              displayName: ["Result"],
              type: 8,
            },
            selector: "0xa3d0b668",
          },
          {
            args: [
              {
                label: "account",
                type: {
                  displayName: ["AccountId"],
                  type: 9,
                },
              },
            ],
            docs: [],
            label: "get_reputation",
            mutates: false,
            payable: false,
            returnType: {
              displayName: ["Option"],
              type: 10,
            },
            selector: "0x3d7904f0",
          },
          {
            args: [
              {
                label: "account",
                type: {
                  displayName: ["AccountId"],
                  type: 9,
                },
              },
            ],
            docs: [],
            label: "verify_ownership",
            mutates: false,
            payable: false,
            returnType: {
              displayName: ["bool"],
              type: 1,
            },
            selector: "0xc41f87b8",
          },
          {
            args: [],
            docs: [],
            label: "total_supply",
            mutates: false,
            payable: false,
            returnType: {
              displayName: ["u64"],
              type: 0,
            },
            selector: "0x780f7c3d",
          },
        ],
      },
      storage: {
        root: {
          layout: {
            struct: {
              fields: [
                {
                  layout: {
                    root: {
                      layout: {
                        leaf: {
                          key: "0x00000000",
                          ty: 11,
                        },
                      },
                      root_key: "0x00000000",
                    },
                  },
                  name: "reputations",
                },
                {
                  layout: {
                    leaf: {
                      key: "0x00000001",
                      ty: 0,
                    },
                  },
                  name: "total_supply",
                },
                {
                  layout: {
                    leaf: {
                      key: "0x00000002",
                      ty: 9,
                    },
                  },
                  name: "admin",
                },
              ],
              name: "GovernanceSbt",
            },
          },
          root_key: "0x00000000",
        },
      },
      types: [
        {
          def: {
            primitive: "u64",
          },
          id: 0,
          path: ["u64"],
        },
        {
          def: {
            primitive: "bool",
          },
          id: 1,
          path: ["bool"],
        },
      ],
    },
  };
}

/**
 * Mint an SBT on Polkadot
 */
export async function mintPolkadotSBT(
  api: ApiPromise,
  address: string,
  score: number,
  profile: string,
  stellarAddress: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  const timeoutId = setTimeout(() => {
    throw new Error("Transaction timeout (60s)");
  }, 60000);

  try {
    console.log("🔨 Building Polkadot mint SBT transaction...");
    
    if (!CONTRACT_ID) {
      throw new Error("Contract address not set. Deploy contract first.");
    }

    // Validate score
    if (score < 0 || score > 1000) {
      throw new Error("Score must be between 0 and 1000");
    }

    console.log(`📝 Minting SBT for ${address}`);
    console.log(`   Score: ${score}`);
    console.log(`   Profile: ${profile}`);
    console.log(`   Stellar: ${stellarAddress}`);

    // Get injector for signing
    const injector = await web3FromAddress(address);
    const tx = api.tx.contracts.call(
      CONTRACT_ID,
      0,
      { gasLimit: 3000000000, storageDepositLimit: null },
      "0xd183512b", // mint_sbt selector
      `0x${score.toString(16).padStart(8, "0")}${Buffer.from(profile).toString("hex")}${Buffer.from(stellarAddress).toString("hex")}`
    );

    console.log("🔌 Requesting signature from wallet...");
    const unsub = await tx.signAndSend(address, { signer: injector.signer }, (status) => {
      console.log(`📊 Status: ${status.status.type}`);
      
      if (status.isInBlock) {
        console.log(`✅ Transaction included in block`);
      }
      
      if (status.isFinalized) {
        console.log(`✅ Transaction finalized!`);
        clearTimeout(timeoutId);
        unsub();
      }
    });

    return { success: true };
  } catch (err) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : "Failed to mint SBT";
    console.error(`❌ Mint failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get reputation data from Polkadot contract
 */
export async function getPolkadotReputation(
  api: ApiPromise,
  address: string
): Promise<PolkadotReputation | null> {
  try {
    console.log("🔍 Querying Polkadot SBT...");

    if (!CONTRACT_ID) {
      console.log("⚠️ Contract address not set");
      return null;
    }

    // For now, return mock data until contract is deployed
    console.log("⚠️ Contract deployment pending - using mock data");
    return {
      token_id: 1,
      score: 500,
      profile: "Trader",
      stellar_address: address,
      minted_at: Date.now(),
    };
  } catch (error) {
    console.error("❌ Failed to get reputation:", error);
    return null;
  }
}

/**
 * Check if account owns an SBT
 */
export async function verifyPolkadotOwnership(
  api: ApiPromise,
  address: string
): Promise<boolean> {
  try {
    console.log("🔎 Checking Polkadot SBT ownership...");

    if (!CONTRACT_ID) {
      console.log("⚠️ Contract address not set");
      return false;
    }

    // For now, return false until contract is deployed
    console.log("⚠️ Contract deployment pending");
    return false;
  } catch (error) {
    console.error("❌ Failed to verify ownership:", error);
    return false;
  }
}

/**
 * Get total supply of SBTs
 */
export async function getPolkadotTotalSupply(api: ApiPromise): Promise<number> {
  try {
    console.log("📊 Getting total Polkadot SBT supply...");

    if (!CONTRACT_ID) {
      return 0;
    }

    // For now, return 0 until contract is deployed
    console.log("⚠️ Contract deployment pending");
    return 0;
  } catch (error) {
    console.error("❌ Failed to get total supply:", error);
    return 0;
  }
}

/**
 * Get the Rococo RPC endpoint
 */
export function getRococoRPC(): string {
  return ROCOCO_RPC;
}
