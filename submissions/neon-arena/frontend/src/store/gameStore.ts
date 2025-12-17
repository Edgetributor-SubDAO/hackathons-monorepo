'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
    // User info
    email: string | null;
    walletType: 'email' | 'polkadot' | 'stellar' | 'metamask' | null;

    // Wallet addresses
    polkadotAddress: string | null;
    stellarAddress: string | null;
    evmAddress: string | null;

    // Game state
    score: number;
    highScore: number;
    gamesPlayed: number;

    // Connection status
    isConnected: boolean;

    // Actions
    setEmail: (email: string) => void;
    connectPolkadot: (address: string) => void;
    connectStellar: (address: string) => void;
    connectMetaMask: (address: string) => void;
    updateScore: (score: number) => void;
    disconnect: () => void;
}

export const useGameStore = create<WalletState>()(
    persist(
        (set, get) => ({
            // Initial state
            email: null,
            walletType: null,
            polkadotAddress: null,
            stellarAddress: null,
            evmAddress: null,
            score: 0,
            highScore: 0,
            gamesPlayed: 0,
            isConnected: false,

            // Actions
            setEmail: (email: string) => set({
                email,
                walletType: 'email',
                isConnected: true
            }),

            connectPolkadot: (address: string) => set({
                polkadotAddress: address,
                walletType: 'polkadot',
                isConnected: true
            }),

            connectStellar: (address: string) => set({
                stellarAddress: address,
                walletType: 'stellar',
                isConnected: true
            }),

            connectMetaMask: (address: string) => set({
                evmAddress: address,
                walletType: 'metamask',
                isConnected: true
            }),

            updateScore: (score: number) => {
                const state = get();
                set({
                    score,
                    highScore: Math.max(state.highScore, score),
                    gamesPlayed: state.gamesPlayed + 1
                });
            },

            disconnect: () => set({
                email: null,
                walletType: null,
                polkadotAddress: null,
                stellarAddress: null,
                evmAddress: null,
                isConnected: false,
            }),
        }),
        {
            name: 'neon-arena-storage',
        }
    )
);
