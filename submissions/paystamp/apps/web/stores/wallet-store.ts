import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  // Stellar
  stellarAddress: string | null;
  stellarNetwork: 'testnet' | 'mainnet';
  isStellarConnected: boolean;

  // Polkadot
  polkadotAddress: string | null;
  polkadotNetwork: 'shibuya' | 'shiden' | 'astar';
  isPolkadotConnected: boolean;

  // Actions
  setStellarAddress: (address: string | null) => void;
  setPolkadotAddress: (address: string | null) => void;
  setStellarNetwork: (network: 'testnet' | 'mainnet') => void;
  setPolkadotNetwork: (network: 'shibuya' | 'shiden' | 'astar') => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      stellarAddress: null,
      stellarNetwork: 'testnet',
      isStellarConnected: false,
      polkadotAddress: null,
      polkadotNetwork: 'shibuya',
      isPolkadotConnected: false,

      setStellarAddress: (address) =>
        set({
          stellarAddress: address,
          isStellarConnected: !!address,
        }),

      setPolkadotAddress: (address) =>
        set({
          polkadotAddress: address,
          isPolkadotConnected: !!address,
        }),

      setStellarNetwork: (network) => set({ stellarNetwork: network }),
      setPolkadotNetwork: (network) => set({ polkadotNetwork: network }),

      disconnect: () =>
        set({
          stellarAddress: null,
          polkadotAddress: null,
          isStellarConnected: false,
          isPolkadotConnected: false,
        }),
    }),
    {
      name: 'paystamp-wallet-storage',
    }
  )
);
