// src/components/FetchWalletInfo.tsx
import React, { useState, useEffect } from "react";
import { Horizon } from "@stellar/stellar-sdk";
const { Server } = Horizon;

interface WalletInfo {
  address: string;
  sequenceNumber: string;
  balances: { asset: string; balance: string }[];
  numSubEntries: number;
  lastLedger: number;
}

const server = new Server("https://horizon-testnet.stellar.org");

declare global {
  interface Window {
    albedo?: any;
  }
}

const FetchWalletInfo: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to Albedo
  const connectAlbedo = async () => {
    console.log("Albedo wallet button clicked.");
    console.log(window.albedo);
    if (!window.albedo) {
      setError("Albedo wallet is not available. Install from albedo.link.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await window.albedo.publicKey({
        network: "testnet",
        require_existing: true,
      });

      setWalletAddress(result.pubkey); // ALWAYS G.....56 chars
    } catch (err) {
      console.error(err);
      setError("Failed to connect Albedo wallet.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet info from Stellar testnet
  const fetchWalletInfo = async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      setError(null);

      const account = await server.loadAccount(walletAddress);

      const balances = account.balances.map((b) => ({
        asset: b.asset_type === "native" ? "XLM" : b.asset_code,
        balance: b.balance,
      }));

      setWalletInfo({
        address: walletAddress,
        sequenceNumber: account.sequence,
        balances,
        numSubEntries: account.subentry_count,
        lastLedger: account.last_modified_ledger,
      });
    } catch (err) {
      console.error(err);
      setError(
        "Failed to fetch wallet info. Ensure account exists on testnet."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) fetchWalletInfo();
  }, [walletAddress]);

  // Load Albedo script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://albedo.link/albedo-intent-latest.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  if (!walletAddress) {
    return (
      <div className="p-4 space-y-3">
        <h3 className="font-medium">Connect your Stellar Wallet</h3>
        <button onClick={connectAlbedo} className="btn-primary">
          Connect with Albedo
        </button>
      </div>
    );
  }

  if (loading && !walletInfo) return <p>Loading wallet info…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Wallet Information</h2>

      <p>
        <strong>Address:</strong> {walletInfo?.address}
      </p>
      <p>
        <strong>Sequence Number:</strong> {walletInfo?.sequenceNumber}
      </p>
      <p>
        <strong>Sub-Entries:</strong> {walletInfo?.numSubEntries}
      </p>
      <p>
        <strong>Last Ledger:</strong> {walletInfo?.lastLedger}
      </p>

      <div>
        <strong>Balances:</strong>
        <ul className="list-disc pl-6">
          {walletInfo?.balances.map((b) => (
            <li key={b.asset}>
              {b.balance} {b.asset}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-x-2">
        <button onClick={fetchWalletInfo} className="btn-primary">
          Refresh
        </button>
        <button
          onClick={() => {
            setWalletAddress("");
            setWalletInfo(null);
          }}
          className="btn-secondary"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default FetchWalletInfo;
