import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import nacl from "tweetnacl";
import { createHash } from "crypto";
import {
  PaymentAuth,
  X402FlashClientConfig,
  X402PaymentPayload,
} from "./types.js";

export class X402FlashClient {
  private server: SorobanRpc.Server;
  private keypair: Keypair;
  private contractId: string;
  private networkPassphrase: string;

  constructor(config: X402FlashClientConfig) {
    this.server = new SorobanRpc.Server(config.rpcUrl);
    this.keypair = Keypair.fromSecret(config.secretKey);
    this.contractId = config.contractId;
    this.networkPassphrase = config.networkPassphrase;
  }

  /**
   * Open payment channel with escrow
   */
  async openEscrow(
    server: string,
    token: string,
    amount: string,
    ttlSeconds: number
  ): Promise<string> {
    try {
      const account = await this.server.getAccount(this.keypair.publicKey());

      const contract = new Contract(this.contractId);

      // Build initial transaction
      let tx = new TransactionBuilder(account, {
        fee: "100000", // Increased fee for Soroban
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "open_escrow",
            nativeToScVal(Address.fromString(this.keypair.publicKey()), {
              type: "address",
            }),
            nativeToScVal(Address.fromString(server), { type: "address" }),
            nativeToScVal(Address.fromString(token), { type: "address" }),
            nativeToScVal(BigInt(amount), { type: "i128" }),
            nativeToScVal(ttlSeconds, { type: "u64" })
          )
        )
        .setTimeout(60) // Increased timeout
        .build();

      // Simulate transaction to get resource requirements
      console.log("🔄 Simulating transaction...");
      const simulated = await this.server.simulateTransaction(tx);

      console.log("📊 Simulation completed");

      if (!SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const error = simulated.error || "Unknown simulation error";
        console.error("❌ Contract simulation failed:", error);
        throw new Error(
          `Contract simulation failed: ${error}. Contract may not exist, not be initialized, or parameters are incorrect.`
        );
      }

      // Assemble transaction with simulation results
      console.log("🔧 Assembling transaction with simulation results...");
      let preparedTx;
      try {
        preparedTx = SorobanRpc.assembleTransaction(tx, simulated).build();
        console.log("✅ Transaction assembled successfully");
      } catch (assembleError) {
        console.error("❌ Assembly error details:", {
          error: assembleError,
          message:
            assembleError instanceof Error ? assembleError.message : "Unknown",
          stack:
            assembleError instanceof Error ? assembleError.stack : undefined,
        });

        // If assembly fails, it might be an issue with auth or footprint
        // Try to provide more context
        throw new Error(
          `Failed to assemble transaction with simulation results. This usually means the contract invocation returned unexpected data. Error: ${assembleError instanceof Error ? assembleError.message : "Unknown error"}`
        );
      }

      // Sign the prepared transaction
      console.log("✍️ Signing transaction...");
      preparedTx.sign(this.keypair);

      // Send transaction
      console.log("📤 Sending transaction to network...");
      const response = await this.server.sendTransaction(preparedTx);
      console.log("📨 Transaction sent, hash:", response.hash);

      // Wait for confirmation with increased timeout
      console.log("⏳ Waiting for transaction confirmation...");
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds

      while (attempts < maxAttempts) {
        try {
          const txResponse = await this.server.getTransaction(response.hash);

          if (
            txResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS
          ) {
            console.log("✅ Transaction confirmed successfully!");
            return response.hash;
          } else if (
            txResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED
          ) {
            console.error("❌ Transaction failed:", txResponse);
            throw new Error(
              `Transaction failed. Check: https://stellar.expert/explorer/testnet/tx/${response.hash}`
            );
          } else if (
            txResponse.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND
          ) {
            throw new Error(
              `Unexpected transaction status. Check: https://stellar.expert/explorer/testnet/tx/${response.hash}`
            );
          }

          // NOT_FOUND - continue polling
        } catch (error) {
          // XDR parsing errors are a known issue with stellar-sdk
          // Check transaction status via raw RPC call
          if (
            error instanceof Error &&
            error.message.includes("Bad union switch")
          ) {
            console.log("⚠️ XDR parsing error, checking via raw RPC...");
            try {
              const rawResponse = await fetch(
                this.server.serverURL.toString(),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getTransaction",
                    params: { hash: response.hash },
                  }),
                }
              );
              const data: any = await rawResponse.json();

              if (data.result?.status === "SUCCESS") {
                console.log("✅ Transaction confirmed (via raw RPC)!");
                return response.hash;
              } else if (data.result?.status === "FAILED") {
                throw new Error(
                  `Transaction failed. View: https://stellar.expert/explorer/testnet/tx/${response.hash}`
                );
              } else if (data.result?.status !== "NOT_FOUND") {
                throw new Error(
                  `Unexpected status: ${data.result?.status}. View: https://stellar.expert/explorer/testnet/tx/${response.hash}`
                );
              }
              // NOT_FOUND - continue polling
            } catch (rpcError) {
              console.error("Raw RPC check failed:", rpcError);
              if (attempts >= maxAttempts - 1) {
                throw new Error(
                  `Could not confirm transaction status. View: https://stellar.expert/explorer/testnet/tx/${response.hash}`
                );
              }
            }
          } else if (attempts >= maxAttempts - 1) {
            throw error;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      throw new Error(
        `Transaction timeout after 60 seconds. Check: https://stellar.expert/explorer/testnet/tx/${response.hash}`
      );
    } catch (error) {
      console.error("❌ Failed to open escrow:", error);
      if (error instanceof Error) {
        if (error.message.includes("insufficient_balance")) {
          throw new Error("Insufficient balance for escrow");
        }
        if (error.message.includes("channel_already_exists")) {
          throw new Error("Payment channel already exists with this server");
        }
      }
      throw error;
    }
  }

  /**
   * Create and sign payment authorization
   */
  async createPaymentAuth(
    server: string,
    token: string,
    amount: string,
    deadline: number
  ): Promise<{ auth: PaymentAuth; signature: string; publicKey: string }> {
    try {
      // Get current nonce
      const nonce = await this.getCurrentNonce();

      const auth: PaymentAuth = {
        settlementContract: this.contractId,
        client: this.keypair.publicKey(),
        server,
        token,
        amount,
        nonce,
        deadline,
      };

      // Create message to sign
      const message = this.serializeAuth(auth);

      // For Ed25519 signing, we just sign the message directly (no need to hash first)
      // tweetnacl expects a 64-byte secret key (32 bytes seed + 32 bytes public key)
      const secretKey = new Uint8Array(64);
      secretKey.set(this.keypair.rawSecretKey());
      secretKey.set(this.keypair.rawPublicKey(), 32);

      const signature = nacl.sign.detached(Buffer.from(message), secretKey);

      return {
        auth,
        signature: Buffer.from(signature).toString("hex"),
        publicKey: this.keypair.publicKey(),
      };
    } catch (error) {
      console.error("Error creating payment authorization:", error);
      throw new Error(
        `Failed to create payment auth: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Serialize payment auth for signing
   */
  private serializeAuth(auth: PaymentAuth): string {
    return JSON.stringify({
      settlementContract: auth.settlementContract,
      client: auth.client,
      server: auth.server,
      token: auth.token,
      amount: auth.amount,
      nonce: auth.nonce,
      deadline: auth.deadline,
    });
  }

  /**
   * Get current nonce for client
   */
  private async getCurrentNonce(): Promise<number> {
    const contract = new Contract(this.contractId);
    const account = await this.server.getAccount(this.keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          "get_nonce",
          nativeToScVal(Address.fromString(this.keypair.publicKey()), {
            type: "address",
          })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await this.server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        // Parse u64 result from ScVal
        return Number(result.u64?.() || 0n);
      }
    }

    // Fallback to 0 if query fails
    return 0;
  }

  /**
   * Wrap fetch with x402-flash payment handling
   * Automatically handles 402 responses and retries with payment
   */
  wrapFetch(fetchFn: typeof fetch = fetch): typeof fetch {
    return async (input: Request | URL | string, init?: RequestInit) => {
      try {
        // First attempt without payment
        const firstResponse = await fetchFn(input, init);

        if (firstResponse.status !== 402) {
          return firstResponse;
        }

        // Parse payment requirements
        const paymentReq: any = await firstResponse.json();

        if (
          !paymentReq.accepts ||
          !Array.isArray(paymentReq.accepts) ||
          paymentReq.accepts.length === 0
        ) {
          throw new Error(
            "Invalid payment requirements: no payment schemes accepted"
          );
        }

        const requirement = paymentReq.accepts[0];

        // Validate x402 version
        if (paymentReq.x402Version !== 1) {
          throw new Error(
            `Unsupported x402 version: ${paymentReq.x402Version}`
          );
        }

        // Check if flash scheme is supported
        if (requirement.scheme !== "flash") {
          throw new Error(
            `Flash scheme not supported. Server requires: ${requirement.scheme}`
          );
        }

        // Validate required fields
        if (
          !requirement.payTo ||
          !requirement.asset ||
          !requirement.maxAmountRequired
        ) {
          throw new Error("Incomplete payment requirements from server");
        }

        // Create payment authorization
        const deadline =
          Math.floor(Date.now() / 1000) + (requirement.maxTimeoutSeconds || 60);
        const { auth, signature, publicKey } = await this.createPaymentAuth(
          requirement.payTo,
          requirement.asset,
          requirement.maxAmountRequired,
          deadline
        );

        // Create X-Payment header (x402 standard format)
        const paymentPayload: X402PaymentPayload = {
          x402Version: 1,
          scheme: "flash",
          network: requirement.network,
          payload: {
            auth,
            signature,
            publicKey,
          },
        };

        const paymentHeader = Buffer.from(
          JSON.stringify(paymentPayload)
        ).toString("base64");

        // Retry with payment
        const headers = new Headers(init?.headers);
        headers.set("X-Payment", paymentHeader);

        const paidResponse = await fetchFn(input, { ...init, headers });

        // Check for payment response header
        const paymentResponseHeader =
          paidResponse.headers.get("X-Payment-Response");
        if (paymentResponseHeader) {
          try {
            const paymentResponse = JSON.parse(
              Buffer.from(paymentResponseHeader, "base64").toString("utf-8")
            );
            if (paymentResponse.success) {
              console.log(`✅ Payment accepted: ${auth.amount} stroops`);
            }
          } catch (e) {
            console.warn("Could not parse payment response header");
          }
        }

        return paidResponse;
      } catch (error) {
        console.error("❌ Payment fetch error:", error);
        throw error;
      }
    };
  }

  /**
   * Close channel and withdraw escrow
   */
  async closeEscrow(server: string): Promise<string> {
    try {
      const account = await this.server.getAccount(this.keypair.publicKey());

      const contract = new Contract(this.contractId);

      const tx = new TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "client_close_escrow",
            nativeToScVal(Address.fromString(this.keypair.publicKey()), {
              type: "address",
            }),
            nativeToScVal(Address.fromString(server), { type: "address" })
          )
        )
        .setTimeout(30)
        .build();

      tx.sign(this.keypair);

      const response = await this.server.sendTransaction(tx);
      console.log(`✅ Escrow closed, funds returned`);
      return response.hash;
    } catch (error) {
      console.error("❌ Failed to close escrow:", error);
      if (
        error instanceof Error &&
        error.message.includes("channel_not_found")
      ) {
        throw new Error("No active channel found with this server");
      }
      throw error;
    }
  }

  /**
   * Get current escrow balance
   */
  async getEscrowBalance(server: string): Promise<string> {
    try {
      const contract = new Contract(this.contractId);

      const account = await this.server.getAccount(this.keypair.publicKey());

      const tx = new TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            "current_escrow",
            nativeToScVal(Address.fromString(this.keypair.publicKey()), {
              type: "address",
            }),
            nativeToScVal(Address.fromString(server), { type: "address" })
          )
        )
        .setTimeout(30)
        .build();

      const simulated = await this.server.simulateTransaction(tx);

      if (SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        // Parse i128 result
        return result?.toString() || "0";
      }

      return "0";
    } catch (error) {
      console.error("Error fetching escrow balance:", error);
      return "0";
    }
  }
}
