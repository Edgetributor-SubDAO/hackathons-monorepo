'use client';

import { ethers, BrowserProvider, Contract } from 'ethers';

// Moonbase Alpha (Moonbeam Testnet) Configuration
export const MOONBASE_CONFIG = {
    chainId: '0x507', // 1287 in hex
    chainName: 'Moonbase Alpha',
    nativeCurrency: {
        name: 'DEV',
        symbol: 'DEV',
        decimals: 18,
    },
    rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
    blockExplorerUrls: ['https://moonbase.moonscan.io/'],
};

// Contract ABI - only the functions we need
export const LEADERBOARD_ABI = [
    // Read functions
    "function getWeeklyLeaderboard(uint256 _limit) view returns (tuple(address player, uint256 score, uint256 timestamp, string gameType)[])",
    "function getAllTimeLeaderboard(uint256 _limit) view returns (tuple(address player, uint256 score, uint256 timestamp, string gameType)[])",
    "function getPlayerStats(address _player) view returns (tuple(uint256 highScore, uint256 totalGamesPlayed, uint256 totalScore, uint256 lastPlayed, bool isRegistered))",
    "function getWeeklyRank(address _player) view returns (uint256)",
    "function getTotalPlayers() view returns (uint256)",
    "function isWeekEnded() view returns (bool)",
    "function getWeekTimeRemaining() view returns (uint256)",
    "function weeklyPrizePool() view returns (uint256)",

    // Write functions
    "function registerPlayer()",
    "function submitScore(uint256 _score, string calldata _gameType)",

    // Events
    "event ScoreSubmitted(address indexed player, uint256 score, string gameType, uint256 timestamp)",
    "event PlayerRegistered(address indexed player, uint256 timestamp)",
];

// Contract address - will be updated after deployment
// For now, this is a placeholder
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEADERBOARD_CONTRACT || '';

export interface PlayerScore {
    player: string;
    score: bigint;
    timestamp: bigint;
    gameType: string;
}

export interface PlayerStats {
    highScore: bigint;
    totalGamesPlayed: bigint;
    totalScore: bigint;
    lastPlayed: bigint;
    isRegistered: boolean;
}

class LeaderboardService {
    private provider: BrowserProvider | null = null;
    private contract: Contract | null = null;
    private readOnlyContract: Contract | null = null;

    // Initialize read-only provider for fetching data without wallet
    private getReadOnlyProvider() {
        return new ethers.JsonRpcProvider(MOONBASE_CONFIG.rpcUrls[0]);
    }

    private getReadOnlyContract() {
        if (!CONTRACT_ADDRESS) return null;
        if (!this.readOnlyContract) {
            const provider = this.getReadOnlyProvider();
            this.readOnlyContract = new Contract(CONTRACT_ADDRESS, LEADERBOARD_ABI, provider);
        }
        return this.readOnlyContract;
    }

    // Get ethereum provider - handles late injection by wallets
    private getEthereumProvider(): any {
        if (typeof window === 'undefined') return null;

        // Check for ethereum object (MetaMask, Brave, etc)
        if (window.ethereum) {
            return window.ethereum;
        }

        // Fallback: check if it's available as a property
        if ((window as any).web3?.currentProvider) {
            return (window as any).web3.currentProvider;
        }

        return null;
    }

    // Check if any EVM wallet is installed
    isMetaMaskInstalled(): boolean {
        return this.getEthereumProvider() !== null;
    }

    // Switch to Moonbase Alpha network
    async switchToMoonbase(): Promise<boolean> {
        const ethereum = this.getEthereumProvider();
        if (!ethereum) {
            throw new Error('No wallet found. Please install MetaMask.');
        }

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MOONBASE_CONFIG.chainId }],
            });
            return true;
        } catch (switchError: any) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
                try {
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [MOONBASE_CONFIG],
                    });
                    return true;
                } catch (addError) {
                    console.error('Failed to add Moonbase Alpha network:', addError);
                    throw addError;
                }
            }
            throw switchError;
        }
    }

    // Connect to MetaMask and get signer
    async connect(): Promise<string> {
        const ethereum = this.getEthereumProvider();
        if (!ethereum) {
            throw new Error('Please install MetaMask or another EVM wallet to submit scores on-chain');
        }

        try {
            // Switch to Moonbase Alpha
            await this.switchToMoonbase();

            // Request account access
            this.provider = new BrowserProvider(ethereum);
            const accounts = await this.provider.send('eth_requestAccounts', []);

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Get signer and create contract instance
            const signer = await this.provider.getSigner();

            if (CONTRACT_ADDRESS) {
                this.contract = new Contract(CONTRACT_ADDRESS, LEADERBOARD_ABI, signer);
            }

            return accounts[0];
        } catch (error: any) {
            // Handle user rejection gracefully
            if (error.code === 4001 || error.message?.includes('rejected')) {
                throw new Error('Wallet connection was cancelled. Please try again.');
            }
            throw error;
        }
    }

    // Get current connected address
    async getAddress(): Promise<string | null> {
        if (!this.provider) return null;
        try {
            const signer = await this.provider.getSigner();
            return await signer.getAddress();
        } catch {
            return null;
        }
    }

    // Register a new player on-chain
    async registerPlayer(): Promise<string> {
        if (!this.contract) {
            throw new Error('Contract not connected. Please connect your wallet first.');
        }

        const tx = await this.contract.registerPlayer();
        const receipt = await tx.wait();
        return receipt.hash;
    }

    // Submit a score on-chain
    async submitScore(score: number, gameType: string = 'target_blitz'): Promise<string> {
        if (!this.contract) {
            throw new Error('Contract not connected. Please connect your wallet first.');
        }

        const tx = await this.contract.submitScore(score, gameType);
        const receipt = await tx.wait();
        return receipt.hash;
    }

    // Get player stats
    async getPlayerStats(address: string): Promise<PlayerStats | null> {
        const contract = this.getReadOnlyContract();
        if (!contract) return null;

        try {
            const stats = await contract.getPlayerStats(address);
            return {
                highScore: stats[0],
                totalGamesPlayed: stats[1],
                totalScore: stats[2],
                lastPlayed: stats[3],
                isRegistered: stats[4],
            };
        } catch (error) {
            console.error('Failed to get player stats:', error);
            return null;
        }
    }

    // Get weekly leaderboard
    async getWeeklyLeaderboard(limit: number = 10): Promise<PlayerScore[]> {
        const contract = this.getReadOnlyContract();
        if (!contract) return [];

        try {
            const scores = await contract.getWeeklyLeaderboard(limit);
            return scores.map((s: any) => ({
                player: s.player,
                score: s.score,
                timestamp: s.timestamp,
                gameType: s.gameType,
            }));
        } catch (error) {
            console.error('Failed to get weekly leaderboard:', error);
            return [];
        }
    }

    // Get all-time leaderboard
    async getAllTimeLeaderboard(limit: number = 10): Promise<PlayerScore[]> {
        const contract = this.getReadOnlyContract();
        if (!contract) return [];

        try {
            const scores = await contract.getAllTimeLeaderboard(limit);
            return scores.map((s: any) => ({
                player: s.player,
                score: s.score,
                timestamp: s.timestamp,
                gameType: s.gameType,
            }));
        } catch (error) {
            console.error('Failed to get all-time leaderboard:', error);
            return [];
        }
    }

    // Get player's weekly rank
    async getWeeklyRank(address: string): Promise<number> {
        const contract = this.getReadOnlyContract();
        if (!contract) return 0;

        try {
            const rank = await contract.getWeeklyRank(address);
            return Number(rank);
        } catch (error) {
            console.error('Failed to get weekly rank:', error);
            return 0;
        }
    }

    // Get total registered players
    async getTotalPlayers(): Promise<number> {
        const contract = this.getReadOnlyContract();
        if (!contract) return 0;

        try {
            const total = await contract.getTotalPlayers();
            return Number(total);
        } catch (error) {
            console.error('Failed to get total players:', error);
            return 0;
        }
    }

    // Get weekly prize pool
    async getWeeklyPrizePool(): Promise<string> {
        const contract = this.getReadOnlyContract();
        if (!contract) return '0';

        try {
            const pool = await contract.weeklyPrizePool();
            return ethers.formatEther(pool);
        } catch (error) {
            console.error('Failed to get prize pool:', error);
            return '0';
        }
    }

    // Get time remaining in current week
    async getWeekTimeRemaining(): Promise<number> {
        const contract = this.getReadOnlyContract();
        if (!contract) return 0;

        try {
            const remaining = await contract.getWeekTimeRemaining();
            return Number(remaining);
        } catch (error) {
            console.error('Failed to get week time remaining:', error);
            return 0;
        }
    }

    // Check if contract is deployed
    isContractDeployed(): boolean {
        return CONTRACT_ADDRESS !== '';
    }
}

// Singleton instance
export const leaderboardService = new LeaderboardService();

// Add ethereum type to window
declare global {
    interface Window {
        ethereum?: any;
    }
}
