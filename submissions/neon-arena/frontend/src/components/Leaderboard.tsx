'use client';

import { useState, useEffect } from 'react';
import { leaderboardService, PlayerScore, MOONBASE_CONFIG } from '@/lib/leaderboard';

interface LeaderboardProps {
    type?: 'weekly' | 'alltime';
    limit?: number;
    showTitle?: boolean;
    refreshTrigger?: number; // Increment this to force refresh
}

export default function Leaderboard({ type = 'weekly', limit = 10, showTitle = true, refreshTrigger = 0 }: LeaderboardProps) {
    const [scores, setScores] = useState<PlayerScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [prizePool, setPrizePool] = useState('0');
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        loadLeaderboard();

        // Refresh every 30 seconds
        const interval = setInterval(loadLeaderboard, 30000);
        return () => clearInterval(interval);
    }, [type, limit, refreshTrigger]); // Add refreshTrigger to dependencies

    // Countdown timer for weekly reset
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(t => Math.max(0, t - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const loadLeaderboard = async () => {
        if (!leaderboardService.isContractDeployed()) {
            setError('Contract not deployed yet');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [leaderboard, players, pool, remaining] = await Promise.all([
                type === 'weekly'
                    ? leaderboardService.getWeeklyLeaderboard(limit)
                    : leaderboardService.getAllTimeLeaderboard(limit),
                leaderboardService.getTotalPlayers(),
                leaderboardService.getWeeklyPrizePool(),
                leaderboardService.getWeekTimeRemaining(),
            ]);

            setScores(leaderboard);
            setTotalPlayers(players);
            setPrizePool(pool);
            setTimeRemaining(remaining);
        } catch (err: any) {
            console.error('Failed to load leaderboard:', err);
            setError('Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatTime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getRankEmoji = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return 'text-yellow-400';
            case 2: return 'text-slate-300';
            case 3: return 'text-amber-600';
            default: return 'text-slate-400';
        }
    };

    if (!leaderboardService.isContractDeployed()) {
        return (
            <div className="card-glass p-6">
                <h3 className="text-lg font-bold mb-4 text-center">
                    📊 {type === 'weekly' ? 'Weekly' : 'All-Time'} Leaderboard
                </h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔗</div>
                    <p className="text-slate-400 mb-2">Contract not deployed yet</p>
                    <p className="text-xs text-slate-500">
                        Deploy to Moonbase Alpha to enable on-chain leaderboard
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card-glass p-6">
            {showTitle && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                        📊 {type === 'weekly' ? 'Weekly' : 'All-Time'} Leaderboard
                    </h3>
                    {type === 'weekly' && timeRemaining > 0 && (
                        <div className="text-xs text-slate-400">
                            Resets in: <span className="text-cyan-400">{formatTime(timeRemaining)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-cyan-400 font-bold">{totalPlayers}</div>
                    <div className="text-slate-500">Players</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-green-400 font-bold">{scores.length}</div>
                    <div className="text-slate-500">Ranked</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-purple-400 font-bold">{parseFloat(prizePool).toFixed(2)} DEV</div>
                    <div className="text-slate-500">Prize Pool</div>
                </div>
            </div>

            {/* Chain Badge */}
            <div className="flex items-center justify-center gap-2 mb-4 text-xs">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    🌙 Moonbase Alpha
                </span>
                <a
                    href={MOONBASE_CONFIG.blockExplorerUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                    View on Explorer →
                </a>
            </div>

            {/* Leaderboard Table */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner" />
                </div>
            ) : error ? (
                <div className="text-center py-8 text-red-400">
                    <p>{error}</p>
                    <button
                        onClick={loadLeaderboard}
                        className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
                    >
                        Try Again
                    </button>
                </div>
            ) : scores.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">🎮</div>
                    <p className="text-slate-400">No scores yet!</p>
                    <p className="text-xs text-slate-500">Be the first to submit a score</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {scores.map((score, index) => (
                        <div
                            key={`${score.player}-${index}`}
                            className={`flex items-center justify-between p-3 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-slate-800/80 to-slate-800/40' : 'bg-slate-800/30'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${getRankColor(index + 1)}`}>
                                    {getRankEmoji(index + 1)}
                                </span>
                                <div>
                                    <div className="font-medium text-white">
                                        {formatAddress(score.player)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {score.gameType}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-cyan-400">
                                    {Number(score.score).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {new Date(Number(score.timestamp) * 1000).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            <button
                onClick={loadLeaderboard}
                disabled={loading}
                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
            >
                🔄 Refresh Leaderboard
            </button>
        </div>
    );
}
