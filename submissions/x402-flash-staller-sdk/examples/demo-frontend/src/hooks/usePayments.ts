import { useState, useEffect, useCallback } from "react";
import { X402FlashClient } from "@x402-flash/stellar-sdk";
import { Keypair } from "@stellar/stellar-sdk";
import { ensureAccountFunded } from "../utils/stellar";

export interface Channel {
  id: string;
  balance: string;
  nonce: number;
  active: boolean;
}

export interface PaymentState {
  channel: Channel | null;
  loading: boolean;
  error: string | null;
  metrics: {
    totalPaid: string;
    requestCount: number;
    avgLatency: number;
  };
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || "";
const RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";
const NATIVE_TOKEN_ADDRESS =
  import.meta.env.VITE_NATIVE_TOKEN_ADDRESS ||
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"; // Native XLM on testnet

export function usePayments(
  publicKey: string | null,
  secretKey: string | null
) {
  const [state, setState] = useState<PaymentState>({
    channel: null,
    loading: false,
    error: null,
    metrics: {
      totalPaid: "0",
      requestCount: 0,
      avgLatency: 0,
    },
  });

  const [client, setClient] = useState<X402FlashClient | null>(null);

  useEffect(() => {
    if (publicKey && secretKey) {
      console.log("💼 Initializing X402FlashClient...");
      console.log("   Public Key:", publicKey);
      console.log("   Contract ID:", CONTRACT_ID);
      console.log("   RPC URL:", RPC_URL);

      try {
        const newClient = new X402FlashClient({
          rpcUrl: RPC_URL,
          networkPassphrase: NETWORK_PASSPHRASE,
          contractId: CONTRACT_ID,
          secretKey,
        });
        setClient(newClient);
        console.log("✅ X402FlashClient initialized");
      } catch (error) {
        console.error("❌ Failed to initialize client:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize payment client",
        }));
      }
    } else {
      if (client) {
        console.log("⚠️  Clearing client (wallet disconnected)");
      }
      setClient(null);
      setState((prev) => ({ ...prev, channel: null }));
    }
  }, [publicKey, secretKey]);

  const openChannel = useCallback(
    async (amount: string) => {
      console.log("📤 Opening payment channel...");
      console.log("   Amount:", amount, "stroops");

      if (!client) {
        const error =
          "Payment client not initialized. Please connect your wallet first.";
        console.error("❌", error);
        throw new Error(error);
      }

      if (!publicKey) {
        const error = "No wallet connected. Please connect Freighter wallet.";
        console.error("❌", error);
        throw new Error(error);
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Get the client's account from the secret key
        const clientKeypair = Keypair.fromSecret(secretKey!);
        const clientPublicKey = clientKeypair.publicKey();

        console.log("🔑 Client account:", clientPublicKey);
        console.log("🔍 Ensuring client account is funded...");

        // Fund the session account if needed
        try {
          await ensureAccountFunded(clientPublicKey, "testnet");
          console.log("✅ Client account ready");
        } catch (fundError: any) {
          console.error("❌ Failed to fund client account:", fundError);
          throw new Error(
            `Account funding failed: ${fundError.message}. Please fund ${clientPublicKey} manually at https://laboratory.stellar.org/#account-creator?network=test`
          );
        }

        // Get server payment address from API
        console.log("   Fetching server info from:", `${API_URL}/info`);
        const infoResponse = await fetch(`${API_URL}/info`);
        const info = await infoResponse.json();
        console.log("   Server info received:", info);

        const serverAddress = info.paymentAddress;

        if (!serverAddress) {
          throw new Error("Server payment address not found");
        }

        console.log("   Server address:", serverAddress);

        // Also check server account (helpful for debugging)
        console.log("🔍 Checking server account...");
        try {
          await ensureAccountFunded(serverAddress, "testnet");
        } catch (error) {
          console.warn("⚠️  Could not verify server account:", error);
          // Continue anyway - server might already be funded
        }

        // Open escrow: server, token (native XLM), amount, ttl
        console.log("   Opening escrow with:");
        console.log("     Server:", serverAddress);
        console.log("     Token:", NATIVE_TOKEN_ADDRESS, "(native XLM)");
        console.log("     Amount:", amount, "stroops");
        console.log("     TTL: 3600 seconds");

        const txHash = await client.openEscrow(
          serverAddress,
          NATIVE_TOKEN_ADDRESS, // Native XLM token contract address
          amount,
          3600 // 1 hour TTL
        );

        console.log("✅ Escrow opened! Transaction hash:", txHash);
        console.log(
          "🔗 View on Stellar Expert:",
          `https://stellar.expert/explorer/testnet/tx/${txHash}`
        );

        setState((prev) => ({
          ...prev,
          channel: {
            id: txHash,
            balance: amount,
            nonce: 0,
            active: true,
          },
          loading: false,
          error: null,
        }));

        return { id: txHash, balance: amount, nonce: 0, active: true };
      } catch (error: any) {
        console.error("❌ Failed to open channel:", error);

        let errorMessage = error.message || "Failed to open channel";

        // Provide helpful error messages
        if (error.message?.includes("Account not found")) {
          errorMessage =
            "Account needs funding. Please wait while we fund it automatically...";
        } else if (error.message?.includes("channel_already_exists")) {
          errorMessage =
            "Channel already exists with this server. Close it first or use existing channel.";
        } else if (error.message?.includes("insufficient_balance")) {
          errorMessage = "Insufficient XLM balance. Please fund your account.";
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        throw new Error(errorMessage);
      }
    },
    [client, publicKey]
  );

  const closeChannel = useCallback(async () => {
    if (!client || !state.channel) {
      throw new Error("No active channel");
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Get server address from API
      const infoResponse = await fetch(`${API_URL}/info`);
      const info = await infoResponse.json();
      const serverAddress = info.paymentAddress;

      if (!serverAddress) {
        throw new Error("Server payment address not found");
      }

      await client.closeEscrow(serverAddress);

      setState((prev) => ({
        ...prev,
        channel: null,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to close channel",
      }));
      throw error;
    }
  }, [client, state.channel]);

  const makeRequest = useCallback(
    async (endpoint: string, options?: RequestInit): Promise<Response> => {
      if (!client || !state.channel) {
        throw new Error("No active channel");
      }

      try {
        const startTime = Date.now();
        const url = `${API_URL}${endpoint}`;

        // wrapFetch returns a fetch function that handles payments
        const paymentFetch = client.wrapFetch();
        const response = await paymentFetch(url, options);

        const latency = Date.now() - startTime;

        // Update metrics
        setState((prev) => {
          const newCount = prev.metrics.requestCount + 1;
          const newAvg =
            (prev.metrics.avgLatency * prev.metrics.requestCount + latency) /
            newCount;

          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              requestCount: newCount,
              avgLatency: Math.round(newAvg),
            },
          };
        });

        return response;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Request failed",
        }));
        throw error;
      }
    },
    [client, state.channel]
  );

  return {
    ...state,
    client,
    openChannel,
    closeChannel,
    makeRequest,
  };
}
