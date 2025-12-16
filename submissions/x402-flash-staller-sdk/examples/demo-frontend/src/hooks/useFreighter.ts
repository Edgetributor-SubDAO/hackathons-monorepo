import { useState, useEffect } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  loading: boolean;
  error: string | null;
}

export function useFreighter() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      setWallet((prev) => ({ ...prev, loading: true, error: null }));

      // Check if Freighter is installed using the API
      const result = await isConnected();

      if (!result.isConnected) {
        setWallet({
          connected: false,
          publicKey: null,
          loading: false,
          error: "Freighter wallet not installed",
        });
        return;
      }

      // Freighter is installed, but user must explicitly click connect button
      console.log("✅ Freighter detected and available");
      setWallet({
        connected: false,
        publicKey: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      // If isConnected throws, Freighter is likely not installed
      console.log("⚠️  Freighter not detected:", error.message);
      setWallet({
        connected: false,
        publicKey: null,
        loading: false,
        error:
          "Freighter wallet not installed. Install from https://www.freighter.app/",
      });
    }
  }

  async function connect() {
    try {
      setWallet((prev) => ({ ...prev, loading: true, error: null }));

      // Check if Freighter is installed
      const checkResult = await isConnected();
      if (!checkResult.isConnected) {
        throw new Error(
          "Freighter wallet not found. Please install it from https://www.freighter.app/"
        );
      }

      console.log("🔑 Requesting access to Freighter wallet...");

      // Request access - this will prompt user for permission and return address
      const accessResult = await requestAccess();

      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      if (!accessResult.address) {
        throw new Error(
          "No address returned from Freighter. User may have denied access."
        );
      }

      setWallet({
        connected: true,
        publicKey: accessResult.address,
        loading: false,
        error: null,
      });

      console.log("✅ Freighter connected:", accessResult.address);
      return accessResult.address;
    } catch (error: any) {
      console.error("❌ Freighter connection failed:", error);
      const errorMessage =
        error.message || error.toString() || "Failed to connect wallet";

      setWallet({
        connected: false,
        publicKey: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  function disconnect() {
    setWallet({
      connected: false,
      publicKey: null,
      loading: false,
      error: null,
    });
  }

  return {
    ...wallet,
    connect,
    disconnect,
    refresh: checkConnection,
  };
}
