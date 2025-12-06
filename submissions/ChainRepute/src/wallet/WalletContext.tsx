import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { getWallets, type Wallet, type WalletAccount } from "@talismn/connect-wallets";
import albedo from "@albedo-link/intent";

// ============================================
// Types & Interfaces
// ============================================

export interface StellarWallet {
  address: string | null;
  connected: boolean;
  walletName: string | null;
}

export interface PolkadotWallet {
  address: string | null;
  connected: boolean;
  name: string | null;
  account: WalletAccount | null;
  accounts: WalletAccount[];
  wallet: Wallet | null;
}

interface WalletContextType {
  // Stellar wallet state (via Albedo - FREE)
  stellar: StellarWallet;
  // Polkadot wallet state (via Talisman)
  polkadot: PolkadotWallet;
  // Loading states
  isConnectingStellar: boolean;
  isConnectingPolkadot: boolean;
  // Error states
  stellarError: string | null;
  polkadotError: string | null;
  // Available Polkadot wallets
  availableWallets: Wallet[];
  // Connection functions
  connectStellar: () => Promise<void>;
  connectPolkadot: (walletName?: string) => Promise<void>;
  disconnectStellar: () => void;
  disconnectPolkadot: () => void;
  disconnectAll: () => void;
  // Polkadot account selection
  selectPolkadotAccount: (account: WalletAccount) => void;
  // Helper to check if both wallets are connected
  areBothConnected: () => boolean;
  // Demo mode
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const defaultStellarWallet: StellarWallet = {
  address: null,
  connected: false,
  walletName: null,
};

const defaultPolkadotWallet: PolkadotWallet = {
  address: null,
  connected: false,
  name: null,
  account: null,
  accounts: [],
  wallet: null,
};

// Demo mode test addresses
const DEMO_STELLAR_ADDRESS = "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
const DEMO_POLKADOT_ADDRESS = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

export const WalletContext = createContext<WalletContextType>({
  stellar: defaultStellarWallet,
  polkadot: defaultPolkadotWallet,
  isConnectingStellar: false,
  isConnectingPolkadot: false,
  stellarError: null,
  polkadotError: null,
  availableWallets: [],
  connectStellar: async () => { },
  connectPolkadot: async () => { },
  disconnectStellar: () => { },
  disconnectPolkadot: () => { },
  disconnectAll: () => { },
  selectPolkadotAccount: () => { },
  areBothConnected: () => false,
  isDemoMode: false,
  enableDemoMode: () => { },
  disableDemoMode: () => { },
});

// ============================================
// Constants
// ============================================

const APP_NAME = "ChainRepute";
const STORAGE_KEYS = {
  POLKADOT_WALLET: "chainrepute_polkadot_wallet",
  POLKADOT_ADDRESS: "chainrepute_polkadot_address",
  STELLAR_ADDRESS: "chainrepute_stellar_address",
};

// ============================================
// Wallet Provider Component
// ============================================

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStellar, setDemoStellar] = useState<StellarWallet>(defaultStellarWallet);
  const [demoPolkadot, setDemoPolkadot] = useState<PolkadotWallet>(defaultPolkadotWallet);

  // Stellar state
  const [stellarWallet, setStellarWallet] = useState<StellarWallet>(defaultStellarWallet);
  const [isConnectingStellar, setIsConnectingStellar] = useState(false);
  const [stellarError, setStellarError] = useState<string | null>(null);

  // Polkadot state
  const [polkadot, setPolkadot] = useState<PolkadotWallet>(defaultPolkadotWallet);
  const [isConnectingPolkadot, setIsConnectingPolkadot] = useState(false);
  const [polkadotError, setPolkadotError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);

  // Derive actual states (demo or real)
  const stellar: StellarWallet = isDemoMode ? demoStellar : stellarWallet;
  const actualPolkadot = isDemoMode ? demoPolkadot : polkadot;

  // ============================================
  // Initialize available Polkadot wallets on mount
  // ============================================

  useEffect(() => {
    // Detect Polkadot wallets
    const wallets = getWallets();
    const installed = wallets.filter((w) => w.installed);
    setAvailableWallets(installed);
    console.log("[WalletContext] Available Polkadot wallets:", installed.map((w) => w.title));
  }, []);

  // ============================================
  // Auto-reconnect on mount
  // ============================================

  useEffect(() => {
    // Auto-reconnect Stellar (just restore from localStorage)
    const savedStellarAddress = localStorage.getItem(STORAGE_KEYS.STELLAR_ADDRESS);
    if (savedStellarAddress) {
      setStellarWallet({
        address: savedStellarAddress,
        connected: true,
        walletName: "Albedo",
      });
      console.log("[Stellar] Restored address:", savedStellarAddress);
    }

    // Auto-reconnect Polkadot
    const autoReconnectPolkadot = async () => {
      const savedWalletName = localStorage.getItem(STORAGE_KEYS.POLKADOT_WALLET);
      const savedAddress = localStorage.getItem(STORAGE_KEYS.POLKADOT_ADDRESS);

      if (savedWalletName && savedAddress) {
        try {
          const wallets = getWallets();
          const wallet = wallets.find(
            (w) => w.extensionName === savedWalletName && w.installed
          );
          if (wallet) {
            await wallet.enable(APP_NAME);
            wallet.subscribeAccounts((accounts) => {
              const savedAccount = accounts?.find((a) => a.address === savedAddress);
              if (savedAccount) {
                setPolkadot({
                  address: savedAccount.address,
                  connected: true,
                  name: savedAccount.name || wallet.title,
                  account: savedAccount,
                  accounts: accounts || [],
                  wallet,
                });
                console.log("[Polkadot] Auto-reconnected:", savedAccount.address);
              }
            });
          }
        } catch (err) {
          console.warn("[Polkadot] Auto-reconnect failed:", err);
          localStorage.removeItem(STORAGE_KEYS.POLKADOT_WALLET);
          localStorage.removeItem(STORAGE_KEYS.POLKADOT_ADDRESS);
        }
      }
    };

    autoReconnectPolkadot();
  }, []);

  // ============================================
  // Stellar Connection (via Albedo - FREE!)
  // ============================================

  const connectStellar = useCallback(async () => {
    console.log("[Stellar] Connecting via Albedo...");
    setIsConnectingStellar(true);
    setStellarError(null);

    try {
      // Request public key from Albedo (opens popup)
      const result = await albedo.publicKey({});

      if (!result.pubkey) {
        throw new Error("No public key returned from Albedo");
      }

      setStellarWallet({
        address: result.pubkey,
        connected: true,
        walletName: "Albedo",
      });

      // Save for auto-reconnect
      localStorage.setItem(STORAGE_KEYS.STELLAR_ADDRESS, result.pubkey);

      console.log("[Stellar] Connected via Albedo:", result.pubkey);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect Stellar wallet";
      console.error("[Stellar] Connection error:", message);
      setStellarError(message);
    } finally {
      setIsConnectingStellar(false);
    }
  }, []);

  const disconnectStellar = useCallback(() => {
    setStellarWallet(defaultStellarWallet);
    setStellarError(null);
    localStorage.removeItem(STORAGE_KEYS.STELLAR_ADDRESS);
    console.log("[Stellar] Disconnected");
  }, []);

  // ============================================
  // Polkadot Connection (via Talisman/SubWallet)
  // ============================================

  const connectPolkadot = useCallback(async (walletName?: string) => {
    console.log("[Polkadot] Starting connection...", walletName || "auto");
    setIsConnectingPolkadot(true);
    setPolkadotError(null);

    try {
      const wallets = getWallets();
      const installedWallets = wallets.filter((w) => w.installed);

      if (installedWallets.length === 0) {
        throw new Error(
          "No Polkadot wallet found. Please install Talisman, SubWallet, or Polkadot.js extension."
        );
      }

      let wallet: Wallet | undefined;

      if (walletName) {
        wallet = installedWallets.find((w) => w.extensionName === walletName);
        if (!wallet) {
          throw new Error(walletName + " wallet not found or not installed.");
        }
      } else {
        // Prefer Talisman, then SubWallet, then any other
        wallet = installedWallets.find((w) => w.extensionName === "talisman") ||
          installedWallets.find((w) => w.extensionName === "subwallet-js") ||
          installedWallets[0];
      }

      console.log("[Polkadot] Using wallet:", wallet.title);

      await wallet.enable(APP_NAME);

      return new Promise<void>((resolve, reject) => {
        wallet!.subscribeAccounts((accounts) => {
          if (!accounts || accounts.length === 0) {
            setPolkadotError("No accounts found in wallet. Please create an account first.");
            setIsConnectingPolkadot(false);
            reject(new Error("No accounts found"));
            return;
          }

          const firstAccount = accounts[0];

          setPolkadot({
            address: firstAccount.address,
            connected: true,
            name: firstAccount.name || wallet!.title,
            account: firstAccount,
            accounts,
            wallet: wallet!,
          });

          localStorage.setItem(STORAGE_KEYS.POLKADOT_WALLET, wallet!.extensionName);
          localStorage.setItem(STORAGE_KEYS.POLKADOT_ADDRESS, firstAccount.address);

          console.log("[Polkadot] Connected successfully:", firstAccount.address);
          setIsConnectingPolkadot(false);
          resolve();
        });
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect Polkadot wallet";
      console.error("[Polkadot] Connection error:", message);
      setPolkadotError(message);
      setPolkadot(defaultPolkadotWallet);
      setIsConnectingPolkadot(false);
    }
  }, []);

  const disconnectPolkadot = useCallback(() => {
    setPolkadot(defaultPolkadotWallet);
    setPolkadotError(null);
    localStorage.removeItem(STORAGE_KEYS.POLKADOT_WALLET);
    localStorage.removeItem(STORAGE_KEYS.POLKADOT_ADDRESS);
    console.log("[Polkadot] Disconnected");
  }, []);

  const selectPolkadotAccount = useCallback((account: WalletAccount) => {
    setPolkadot((prev) => ({
      ...prev,
      address: account.address,
      name: account.name || prev.wallet?.title || null,
      account,
    }));
    localStorage.setItem(STORAGE_KEYS.POLKADOT_ADDRESS, account.address);
    console.log("[Polkadot] Selected account:", account.address);
  }, []);

  // ============================================
  // Utility Functions
  // ============================================

  const disconnectAll = useCallback(() => {
    disconnectStellar();
    disconnectPolkadot();
    console.log("[Wallet] All wallets disconnected");
  }, [disconnectStellar, disconnectPolkadot]);

  const areBothConnected = useCallback(() => {
    return stellar.connected && actualPolkadot.connected;
  }, [stellar.connected, actualPolkadot.connected]);

  // ============================================
  // Demo Mode Functions
  // ============================================

  const enableDemoMode = useCallback(() => {
    console.log("[Demo] Enabling demo mode with test addresses");
    setDemoStellar({
      address: DEMO_STELLAR_ADDRESS,
      connected: true,
      walletName: "Demo Wallet",
    });
    setDemoPolkadot({
      address: DEMO_POLKADOT_ADDRESS,
      connected: true,
      name: "Demo Account",
      account: null,
      accounts: [],
      wallet: null,
    });
    setIsDemoMode(true);
  }, []);

  const disableDemoMode = useCallback(() => {
    console.log("[Demo] Disabling demo mode");
    setDemoStellar(defaultStellarWallet);
    setDemoPolkadot(defaultPolkadotWallet);
    setIsDemoMode(false);
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const value: WalletContextType = {
    stellar,
    polkadot: actualPolkadot,
    isConnectingStellar: isDemoMode ? false : isConnectingStellar,
    isConnectingPolkadot: isDemoMode ? false : isConnectingPolkadot,
    stellarError: isDemoMode ? null : stellarError,
    polkadotError: isDemoMode ? null : polkadotError,
    availableWallets,
    connectStellar,
    connectPolkadot,
    disconnectStellar,
    disconnectPolkadot,
    disconnectAll,
    selectPolkadotAccount,
    areBothConnected,
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

// ============================================
// Custom Hook
// ============================================

export const useWallet = () => useContext(WalletContext);

// ============================================
// Utility: Truncate Address for Display
// ============================================

export const truncateAddress = (
  address: string,
  startChars = 6,
  endChars = 4
): string => {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return address.slice(0, startChars) + "..." + address.slice(-endChars);
};
