'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { leaderboardService } from '@/lib/leaderboard';
import Leaderboard from '@/components/Leaderboard';

export default function ArenaPage() {
    const router = useRouter();
    const { isConnected, email, walletType, polkadotAddress, stellarAddress, evmAddress, score, highScore, gamesPlayed, updateScore, disconnect } = useGameStore();

    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'submitting'>('ready');
    const [currentScore, setCurrentScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });

    // On-chain state
    const [onChainConnected, setOnChainConnected] = useState(false);
    const [onChainAddress, setOnChainAddress] = useState<string | null>(null);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'connecting' | 'submitting' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0); // Increment to refresh leaderboard

    // Redirect if not connected
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    // Game timer
    useEffect(() => {
        if (gameState !== 'playing') return;

        if (timeLeft <= 0) {
            setGameState('gameover');
            updateScore(currentScore);
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [gameState, timeLeft, currentScore, updateScore]);

    // Move target randomly
    const moveTarget = useCallback(() => {
        setTargetPosition({
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
        });
    }, []);

    const startGame = () => {
        setGameState('playing');
        setCurrentScore(0);
        setTimeLeft(30);
        setSubmitStatus('idle');
        setTxHash(null);
        setSubmitError(null);
        moveTarget();
    };

    const hitTarget = () => {
        if (gameState !== 'playing') return;
        setCurrentScore(s => s + 10);
        moveTarget();
    };

    const getDisplayAddress = () => {
        if (email) return email;
        const addr = polkadotAddress || stellarAddress || evmAddress;
        if (addr) return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
        return 'Guest';
    };

    const handleDisconnect = () => {
        disconnect();
        router.push('/');
    };

    // Connect to Moonbase Alpha for on-chain submission
    const connectForOnChain = async () => {
        try {
            setSubmitStatus('connecting');
            setSubmitError(null);

            if (!leaderboardService.isMetaMaskInstalled()) {
                throw new Error('Please install MetaMask to submit scores on-chain');
            }

            const address = await leaderboardService.connect();
            setOnChainAddress(address);
            setOnChainConnected(true);

            // Check if player is registered
            const stats = await leaderboardService.getPlayerStats(address);
            if (!stats?.isRegistered) {
                // Auto-register the player
                setSubmitStatus('submitting');
                await leaderboardService.registerPlayer();
            }

            setSubmitStatus('idle');
        } catch (error: any) {
            console.error('Failed to connect:', error);
            setSubmitError(error.message || 'Failed to connect wallet');
            setSubmitStatus('error');
        }
    };

    // Submit score on-chain
    const submitScoreOnChain = async () => {
        if (currentScore === 0) {
            setSubmitError('Score must be greater than 0');
            return;
        }

        try {
            setSubmitStatus('submitting');
            setSubmitError(null);

            if (!onChainConnected) {
                await connectForOnChain();
            }

            const hash = await leaderboardService.submitScore(currentScore, 'target_blitz');
            setTxHash(hash);
            setSubmitStatus('success');

            // Refresh leaderboard after successful submission
            setTimeout(() => {
                setLeaderboardRefresh(prev => prev + 1);
            }, 2000); // Wait 2 seconds for blockchain to update
        } catch (error: any) {
            console.error('Failed to submit score:', error);
            setSubmitError(error.message || 'Failed to submit score');
            setSubmitStatus('error');
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="bg-animated" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                            🎮 Neon Arena
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="card-glass px-4 py-2 text-sm">
                            <span className="text-slate-400">Playing as: </span>
                            <span className="text-cyan-400 font-medium">{getDisplayAddress()}</span>
                            {walletType && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                    {walletType}
                                </span>
                            )}
                        </div>

                        {/* On-chain status */}
                        {onChainConnected ? (
                            <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                🌙 Moonbase Connected
                            </div>
                        ) : (
                            <button
                                onClick={connectForOnChain}
                                disabled={submitStatus === 'connecting'}
                                className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                            >
                                {submitStatus === 'connecting' ? '...' : '🔗 Connect for On-Chain'}
                            </button>
                        )}

                        <button
                            onClick={handleDisconnect}
                            className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                </header>

                {/* Main Layout - Game + Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Game Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="stat-item">
                                <div className="stat-value text-cyan-400">{highScore}</div>
                                <div className="stat-label">High Score</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value text-green-400">{gamesPlayed}</div>
                                <div className="stat-label">Games Played</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value text-purple-400">#{Math.max(1, 100 - Math.floor(highScore / 10))}</div>
                                <div className="stat-label">Local Rank</div>
                            </div>
                        </div>

                        {/* Game Area */}
                        <div className="card-glass glow-cyan p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">🎯 Target Blitz</h2>
                                <div className="flex items-center gap-6">
                                    <div className="text-lg">
                                        <span className="text-slate-400">Score: </span>
                                        <span className="text-cyan-400 font-bold">{currentScore}</span>
                                    </div>
                                    {gameState === 'playing' && (
                                        <div className="text-lg">
                                            <span className="text-slate-400">Time: </span>
                                            <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                                                {timeLeft}s
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Game Canvas */}
                            <div
                                className="relative bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden"
                                style={{ height: '400px' }}
                            >
                                {gameState === 'ready' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-6xl mb-4">🎮</div>
                                        <h3 className="text-2xl font-bold mb-2">Ready to Play?</h3>
                                        <p className="text-slate-400 mb-6">Click targets as fast as you can in 30 seconds!</p>
                                        <button onClick={startGame} className="btn-primary">
                                            <span>🚀</span>
                                            <span>Start Game</span>
                                        </button>
                                    </div>
                                )}

                                {gameState === 'playing' && (
                                    <button
                                        onClick={hitTarget}
                                        className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 
                                                   shadow-lg shadow-purple-500/50 transform hover:scale-110 transition-transform
                                                   flex items-center justify-center text-2xl cursor-pointer animate-pulse"
                                        style={{
                                            left: `${targetPosition.x}%`,
                                            top: `${targetPosition.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        🎯
                                    </button>
                                )}

                                {(gameState === 'gameover' || gameState === 'submitting') && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                        <div className="text-6xl mb-4">🏆</div>
                                        <h3 className="text-3xl font-bold mb-2">Game Over!</h3>
                                        <p className="text-2xl text-cyan-400 font-bold mb-2">Score: {currentScore}</p>
                                        {currentScore > highScore - currentScore && (
                                            <p className="text-green-400 mb-4">🎉 New High Score!</p>
                                        )}

                                        {/* On-Chain Submission */}
                                        <div className="mb-6 text-center">
                                            {submitStatus === 'idle' && (
                                                <button
                                                    onClick={submitScoreOnChain}
                                                    disabled={currentScore === 0}
                                                    className="btn-secondary mb-2 disabled:opacity-50"
                                                >
                                                    <span>⛓️</span>
                                                    <span>Submit Score On-Chain</span>
                                                </button>
                                            )}

                                            {submitStatus === 'connecting' && (
                                                <div className="flex items-center gap-2 text-purple-400">
                                                    <div className="loading-spinner" />
                                                    <span>Connecting to Moonbase Alpha...</span>
                                                </div>
                                            )}

                                            {submitStatus === 'submitting' && (
                                                <div className="flex items-center gap-2 text-cyan-400">
                                                    <div className="loading-spinner" />
                                                    <span>Submitting to blockchain...</span>
                                                </div>
                                            )}

                                            {submitStatus === 'success' && txHash && (
                                                <div className="text-green-400">
                                                    <p className="mb-2">✅ Score submitted on-chain!</p>
                                                    <a
                                                        href={`https://moonbase.moonscan.io/tx/${txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                                                    >
                                                        View transaction →
                                                    </a>
                                                </div>
                                            )}

                                            {submitStatus === 'error' && submitError && (
                                                <div className="text-red-400 text-sm">
                                                    <p className="mb-2">❌ {submitError}</p>
                                                    <button
                                                        onClick={submitScoreOnChain}
                                                        className="text-cyan-400 hover:text-cyan-300"
                                                    >
                                                        Try Again
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            <button onClick={startGame} className="btn-primary">
                                                <span>🔄</span>
                                                <span>Play Again</span>
                                            </button>
                                            <button onClick={() => router.push('/')} className="btn-secondary">
                                                <span>🏠</span>
                                                <span>Home</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="mt-4 text-center text-sm text-slate-400">
                                <p>🎯 Click the targets to score points • 🏆 Top scorers win weekly crypto rewards!</p>
                            </div>

                            {/* Pro Mode Link */}
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => router.push('/game')}
                                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-4"
                                >
                                    🚀 Try Target Blitz Pro - Advanced mode with combos & levels!
                                </button>
                            </div>
                        </div>

                        {/* Rewards Info */}
                        <div className="card-glass p-6">
                            <h3 className="text-lg font-bold mb-4 text-center">💰 Weekly Prize Pool</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl mb-1">🥇</div>
                                    <div className="text-lg font-bold text-yellow-400">$15</div>
                                    <div className="text-xs text-slate-400">1st Place</div>
                                </div>
                                <div>
                                    <div className="text-2xl mb-1">🥈</div>
                                    <div className="text-lg font-bold text-slate-300">$10</div>
                                    <div className="text-xs text-slate-400">2nd Place</div>
                                </div>
                                <div>
                                    <div className="text-2xl mb-1">🥉</div>
                                    <div className="text-lg font-bold text-amber-600">$5</div>
                                    <div className="text-xs text-slate-400">3rd Place</div>
                                </div>
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-4">
                                Rewards paid in DEV (Moonbase) • Rankings update on-chain
                            </p>
                        </div>
                    </div>

                    {/* Leaderboard Column */}
                    <div className="space-y-6">
                        {/* Tab Buttons */}
                        <div className="flex bg-slate-800/50 rounded-xl p-1">
                            <button
                                onClick={() => setShowLeaderboard(false)}
                                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${!showLeaderboard
                                    ? 'bg-gradient-to-r from-cyan-500 to-green-500 text-black'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setShowLeaderboard(true)}
                                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${showLeaderboard
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                All-Time
                            </button>
                        </div>

                        {/* Leaderboard Component */}
                        <Leaderboard
                            type={showLeaderboard ? 'alltime' : 'weekly'}
                            limit={10}
                            refreshTrigger={leaderboardRefresh}
                        />

                        {/* How to Get Test Tokens */}
                        <div className="card-glass p-4">
                            <h4 className="font-bold text-sm mb-2">🚰 Need Test Tokens?</h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Get free DEV tokens for Moonbase Alpha to submit scores on-chain:
                            </p>
                            <a
                                href="https://faucet.moonbeam.network/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-2 px-4 bg-purple-500/20 text-purple-400 text-center rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                            >
                                🌙 Moonbeam Faucet →
                            </a>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                1. Add Moonbase Alpha to MetaMask<br />
                                2. Get free DEV tokens from faucet
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
