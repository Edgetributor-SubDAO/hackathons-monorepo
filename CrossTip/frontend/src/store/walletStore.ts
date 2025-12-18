import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  stellarAddress: string | null;
  polkadotAddress: string | null;
  stellarConnected: boolean;
  polkadotConnected: boolean;
  setStellarAddress: (address: string | null) => void;
  setPolkadotAddress: (address: string | null) => void;
  setStellarConnected: (connected: boolean) => void;
  setPolkadotConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      stellarAddress: null,
      polkadotAddress: null,
      stellarConnected: false,
      polkadotConnected: false,
      setStellarAddress: (address) => set({ stellarAddress: address }),
      setPolkadotAddress: (address) => set({ polkadotAddress: address }),
      setStellarConnected: (connected) => set({ stellarConnected: connected }),
      setPolkadotConnected: (connected) => set({ polkadotConnected: connected }),
      reset: () => set({
        stellarAddress: null,
        polkadotAddress: null,
        stellarConnected: false,
        polkadotConnected: false,
      }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);
