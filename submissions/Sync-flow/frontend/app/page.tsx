"use client";

import { useEffect, useMemo, useState } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { bridgeVaultAbi } from "../lib/bridgeVaultAbi";
import { bridgeVaultAddress, hardcodedPayoutDots } from "../lib/wagmiConfig";
import { MarketCard } from "./components/MarketCard";

const MIN_POLKADOT_CHARS = 10;

interface Item {
  id: string;
  name: string;
  description: string;
  priceEth: number;
}

const ITEMS: Item[] = [
  {
    id: "dot-hoodie",
    name: "Polkadot Hoodie",
    description: "Premium cotton hoodie with the pink DOT logo. Essential for conferences.",
    priceEth: 0.0001,
  },
  {
    id: "dot-sword",
    name: "Digital DOT Sword",
    description: "A legendary NFT sword for the Paseo Metaverse. Slay bugs in style.",
    priceEth: 0.0005,
  },
  {
    id: "paseo-pass",
    name: "Paseo Priority Pass",
    description: "Get VIP access to the next Polkadot hackathon. Limited supply.",
    priceEth: 0.0002,
  },
];

export default function Home() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [polkadotAddress, setPolkadotAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Price state for ETH/DOT conversion
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [dotPrice, setDotPrice] = useState<number | null>(null);

  // Fetch prices from CoinGecko (with fallback for rate limits)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polkadot&vs_currencies=usd"
        );
        if (!res.ok) {
          // API rate limited or error - use fallback prices
          console.warn("CoinGecko API unavailable, using fallback prices");
          setEthPrice(2500); // Fallback ETH price
          setDotPrice(7);    // Fallback DOT price
          return;
        }
        const data = await res.json();
        setEthPrice(data.ethereum?.usd || 2500);
        setDotPrice(data.polkadot?.usd || 7);
      } catch (err) {
        console.error("Failed to fetch prices, using fallbacks", err);
        // Use fallback prices on error
        setEthPrice(2500);
        setDotPrice(7);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 120000); // Increased to 2 min to avoid rate limits
    return () => clearInterval(interval);
  }, []);

  // Convert ETH price to DOT
  const ethToDot = (ethAmount: number): number | null => {
    if (!ethPrice || !dotPrice) return null;
    const usdValue = ethAmount * ethPrice;
    return usdValue / dotPrice;
  };

  const { address, chainId } = useAccount();
  const { connectors, connect, status: connectStatus, error: connectError } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const {
    data: hash,
    isPending: isWriting,
    error: writeError,
    writeContractAsync,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { data: feeBps } = useReadContract({
    address: bridgeVaultAddress,
    abi: bridgeVaultAbi,
    functionName: "feeBps",
  });

  // Price is determined by selected item
  const amountEth = selectedItem ? selectedItem.priceEth.toString() : "0";
  const amountFloat = Number(amountEth);

  const feePct = typeof feeBps === "bigint" ? Number(feeBps) / 10_000 : 0.01;

  const { estimatedNetEth, estimatedAssetPayout } = useMemo(() => {
    if (!selectedItem) {
      return { estimatedNetEth: 0, estimatedAssetPayout: 0 };
    }
    const net = amountFloat * (1 - feePct);
    return {
      estimatedNetEth: Math.max(net, 0),
      estimatedAssetPayout: hardcodedPayoutDots,
    };
  }, [amountFloat, selectedItem, feePct]);

  const isWrongNetwork = Boolean(
    address && chainId && chainId !== baseSepolia.id
  );

  async function handlePurchase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!address) {
      setFormError("Connect Coinbase Wallet first.");
      return;
    }

    if (isWrongNetwork && switchChain) {
      try {
        switchChain({ chainId: baseSepolia.id });
      } catch (error) {
        setFormError("Please switch to Base before depositing.");
      }
      return;
    }

    if (polkadotAddress.trim().length < MIN_POLKADOT_CHARS) {
      setFormError("Polkadot address looks too short.");
      return;
    }

    try {
      const value = parseEther(amountEth);
      await writeContractAsync({
        address: bridgeVaultAddress,
        abi: bridgeVaultAbi,
        functionName: "deposit",
        args: [polkadotAddress.trim()],
        value,
      });
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Failed to submit transaction.");
      }
    }
  }

  const connectedLabel = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  const coinbaseConnector = connectors.find((c) =>
    c.name.toLowerCase().includes("coinbase")
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-950 px-4 py-8 text-white">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
              Sync Flow
            </p>
            <h1 className="text-2xl font-bold">Polkadot Merch Store</h1>
          </div>

          <div className="flex items-center gap-4">
            {address ? (
              <div className="flex items-center gap-3 bg-black/30 rounded-full pl-4 pr-1 py-1 border border-white/5">
                <span className="text-sm font-medium text-zinc-300">{connectedLabel}</span>
                <button
                  onClick={() => disconnect()}
                  className="rounded-full bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                disabled={!coinbaseConnector || connectStatus === "pending"}
                onClick={() =>
                  connect({
                    connector: coinbaseConnector ?? connectors[0],
                  })
                }
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {connectStatus === "pending"
                  ? "Connecting…"
                  : "Connect Wallet"}
              </button>
            )}
            {connectError && (
              <span className="text-xs text-red-400 max-w-[150px] truncate">{connectError.message}</span>
            )}
          </div>
        </header>

        {/* Content Switcher */}
        {!selectedItem ? (
          // Item Store View
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-200">Featured Items</h2>
              <p className="text-zinc-500 text-sm">Buy exclusive items bridging ETH from Base.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ITEMS.map((item) => (
                <MarketCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  priceEth={item.priceEth}
                  priceDot={ethToDot(item.priceEth)}
                  colorClass="emerald"
                  actionLabel="Buy Now"
                  onAction={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </section>
        ) : (
          // Checkout View
          <div className="w-full max-w-2xl mx-auto animation-fade-in-up">
            <button
              onClick={() => setSelectedItem(null)}
              className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
            >
              ← Back to Store
            </button>

            <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur">
              <header className="mb-8 flex gap-6 items-start">
                <div className="h-24 w-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-4xl shrink-0">
                  {selectedItem.name.includes("Hoodie") ? "👕" : selectedItem.name.includes("Sword") ? "⚔️" : "🎫"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-tight">{selectedItem.name}</h2>
                  <p className="text-emerald-400 font-mono text-lg mt-1">
                    {ethToDot(selectedItem.priceEth)?.toFixed(4) ?? "..."} DOT
                    <span className="text-zinc-500 text-sm ml-2">({selectedItem.priceEth} ETH)</span>
                  </p>
                  <p className="text-zinc-400 text-sm mt-2">
                    To complete your purchase, deposit ETH. The bridge will process your payment and send <span className="text-white">PAS</span> (receipt token) to your Polkadot address.
                  </p>
                </div>
              </header>

              <form className="space-y-6" onSubmit={handlePurchase}>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Shipping Address (Polkadot / Paseo)
                  </label>
                  <input
                    type="text"
                    value={polkadotAddress}
                    onChange={(e) => setPolkadotAddress(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                    placeholder="14abc...your DOT address"
                  />
                  <p className="text-xs text-zinc-500">Your "item" (PAS tokens) will be sent here.</p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/20 p-5 space-y-3">
                  <div className="flex justify-between text-sm border-b border-white/5 pb-3 mb-2">
                    <span className="text-zinc-400">Item Price</span>
                    <span className="text-white font-medium">
                      {ethToDot(selectedItem.priceEth)?.toFixed(4) ?? "..."} DOT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Bridge fee</span>
                    <span className="text-zinc-200">{(feePct * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Net Payment</span>
                    <span className="text-emerald-400 font-medium">{estimatedNetEth.toFixed(4)} ETH</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Receipt</span>
                    <span className="text-sm font-bold text-white">
                      {estimatedAssetPayout} <span className="text-emerald-400">PAS</span>
                    </span>
                  </div>
                </div>

                {isWrongNetwork && (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-200 transition hover:bg-yellow-500/20"
                    onClick={() => switchChain?.({ chainId: baseSepolia.id })}
                    disabled={isSwitching}
                  >
                    {isSwitching ? "Switching…" : "Switch to Base Sepolia"}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isWriting || isWrongNetwork}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-4 text-lg font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                >
                  {isWriting ? "Processing Order…" : `Pay ${selectedItem.priceEth} ETH`}
                </button>

                {formError && (
                  <p className="text-center text-sm text-red-400 font-medium bg-red-900/10 py-2 rounded-lg">{formError}</p>
                )}
                {writeError && (
                  <p className="text-center text-sm text-red-400 font-medium bg-red-900/10 py-2 rounded-lg">{writeError.message}</p>
                )}
              </form>

              {(hash || isConfirmed) && (
                <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <p className="text-emerald-200 font-medium mb-2">
                    {isConfirmed ? "Order Confirmed! 🎉" : "Order Submitted"}
                  </p>
                  <p className="text-xs text-emerald-400/70 mb-3">Your item is on the way (check wallet balances).</p>
                  {hash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 underline"
                    >
                      View on Basescan
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
