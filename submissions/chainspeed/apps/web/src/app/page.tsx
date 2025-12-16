'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import gsap from 'gsap';
import {
    TestMode,
    ChainSpeedResult,
    TestProgressEvent,
    TestResultEvent,
    TestCompleteEvent,
    SUPPORTED_CHAINS,
} from '@chainspeed/shared';
import { startTest } from '@/lib/api';
import {
    getSocket,
    getSocketId,
    onProgress,
    onResult,
    onComplete,
    onError,
} from '@/lib/socket';

// 3D Components
import Scene3D from '@/components/Scene3D';
import HyperButton from '@/components/HyperButton';
import HoloCard from '@/components/HoloCard';

type Phase = 'idle' | 'testing' | 'complete';

interface ChainProgress {
    progress: number;
    phase: string;
    message: string;
}

export default function Home() {
    const [mode, setMode] = useState<TestMode>('network-benchmark');
    const [phase, setPhase] = useState<Phase>('idle');
    const [testId, setTestId] = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, ChainProgress>>({});
    const [results, setResults] = useState<ChainSpeedResult[]>([]);
    const [winner, setWinner] = useState<string | null>(null);
    const [userRpc, setUserRpc] = useState('');
    const [selectedChain, setSelectedChain] = useState('polkadot');
    const [error, setError] = useState<string | null>(null);

    // Animation state
    const [warpSpeed, setWarpSpeed] = useState(0); // 0 to 1
    const containerRef = useRef<HTMLDivElement>(null);

    // Use ref to track testId for event handlers (avoids stale closure issues)
    const testIdRef = useRef<string | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        testIdRef.current = testId;
    }, [testId]);

    // Initialize socket connection - runs once on mount
    useEffect(() => {
        const socket = getSocket();

        const unsubProgress = onProgress((event: TestProgressEvent) => {
            // Use ref to get current testId value
            if (event.testId === testIdRef.current) {
                setProgress(prev => ({
                    ...prev,
                    [event.chainId]: {
                        progress: event.progress,
                        phase: event.phase,
                        message: event.message || '',
                    },
                }));
            }
        });

        const unsubResult = onResult((event: TestResultEvent) => {
            // Use ref to get current testId value
            if (event.testId === testIdRef.current) {
                console.log('[UI] Received result for chain:', event.payload.chainId);
                setResults(prev => [...prev, event.payload]);
            }
        });

        const unsubComplete = onComplete((event: TestCompleteEvent) => {
            // Use ref to get current testId value
            if (event.testId === testIdRef.current) {
                console.log('[UI] Test complete, winner:', event.winner);
                setWinner(event.winner);
                setPhase('complete');

                // Slow down warp effect
                gsap.to({ val: 1 }, {
                    val: 0,
                    duration: 2,
                    ease: "power2.out",
                    onUpdate: function () { setWarpSpeed(this.targets()[0].val); }
                });
            }
        });

        const unsubError = onError((event) => {
            // Use ref to get current testId value
            if (event.testId === testIdRef.current) {
                setError(event.error);
                setPhase('idle');
                setWarpSpeed(0);
            }
        });

        return () => {
            unsubProgress();
            unsubResult();
            unsubComplete();
            unsubError();
        };
    }, []); // Empty dependency - only run once on mount

    const handleStartTest = async () => {
        try {
            // Animation: Engage Warp Drive
            gsap.to({ val: 0 }, {
                val: 1,
                duration: 3,
                ease: "power2.in",
                onUpdate: function () { setWarpSpeed(this.targets()[0].val); }
            });

            setPhase('testing');
            setResults([]);
            setWinner(null);
            setError(null);
            setProgress({});

            const testId = `demo-${Date.now()}`;
            testIdRef.current = testId;
            setTestId(testId);
            console.log('[UI] Demo test started with ID:', testId);

            const chains = mode === 'node-diagnostic'
                ? [selectedChain]
                : ['polkadot', 'stellar'];

            // Simulate progress updates
            for (let pct = 0; pct <= 100; pct += 10) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const newProgress: Record<string, ChainProgress> = {};
                chains.forEach(chainId => {
                    const phase = pct < 20 ? 'connecting' : pct < 80 ? 'measuring' : 'complete';
                    const messages: Record<string, string> = {
                        connecting: 'Connecting to RPC...',
                        measuring: 'Measuring latency...',
                        complete: 'Complete'
                    };
                    newProgress[chainId] = {
                        progress: pct,
                        phase,
                        message: messages[phase]
                    };
                });
                setProgress(newProgress);
            }

            // Demo results data
            const demoResults: ChainSpeedResult[] = [];

            if (chains.includes('polkadot')) {
                demoResults.push({
                    testId,
                    mode,
                    chainId: 'polkadot',
                    chainFamily: 'substrate',
                    timestamp: new Date().toISOString(),
                    region: 'us-east',
                    generic: {
                        rpcLatencyP50: 45,
                        rpcLatencyP95: 120,
                        blockTime: 6.0,
                        finalityTime: 12.5,
                        txThroughput: 1000,
                        errorRate: 0.001
                    },
                    scores: {
                        overall: 82.5,
                        latency: 85,
                        throughput: 75,
                        finality: 88,
                        reliability: 99
                    },
                    specific: {
                        xcmSuccessRate: 0.985,
                        xcmExecutionTime: 3200,
                        grandpaFinalityLag: 2,
                        activeValidators: 297,
                        slashingEvents24h: 0,
                        parachainCount: 48
                    },
                    meta: {
                        rpcEndpoint: 'wss://rpc.polkadot.io',
                        source: 'default',
                        clientVersion: '1.0.0'
                    }
                });
            }

            if (chains.includes('stellar')) {
                demoResults.push({
                    testId,
                    mode,
                    chainId: 'stellar',
                    chainFamily: 'stellar',
                    timestamp: new Date().toISOString(),
                    region: 'us-east',
                    generic: {
                        rpcLatencyP50: 32,
                        rpcLatencyP95: 85,
                        blockTime: 5.0,
                        finalityTime: 5.0,
                        txThroughput: 1500,
                        errorRate: 0.0005
                    },
                    scores: {
                        overall: 88.2,
                        latency: 92,
                        throughput: 80,
                        finality: 95,
                        reliability: 99.5
                    },
                    specific: {
                        ledgerCloseTime: 4.8,
                        ledgerCloseVariance: 0.3,
                        sorobanInvocations: 12500,
                        sorobanSuccessRate: 0.992,
                        pathPaymentSuccess: 0.978,
                        pathPaymentAvgHops: 2.3
                    },
                    meta: {
                        rpcEndpoint: 'https://horizon.stellar.org',
                        source: 'default',
                        clientVersion: '1.0.0'
                    }
                });
            }

            // Determine winner
            const winnerChain = demoResults.reduce((best, current) =>
                current.scores.overall > best.scores.overall ? current : best
            ).chainId;

            console.log('[UI] Demo results:', demoResults);
            console.log('[UI] Demo winner:', winnerChain);

            // Start slowing warp FIRST (before heavy state updates)
            gsap.to({ val: 1 }, {
                val: 0,
                duration: 2,
                ease: "power2.out",
                onUpdate: function () { setWarpSpeed(this.targets()[0].val); }
            });

            // Use requestAnimationFrame to stagger updates and prevent jank
            // This gives the browser a chance to paint between frames
            await new Promise<void>(resolve => {
                requestAnimationFrame(() => {
                    setResults(demoResults);
                    requestAnimationFrame(() => {
                        setWinner(winnerChain);
                        requestAnimationFrame(() => {
                            setPhase('complete');
                            resolve();
                        });
                    });
                });
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start test');
            setPhase('idle');
            setWarpSpeed(0);
        }
    };

    const handleReset = () => {
        setPhase('idle');
        testIdRef.current = null;
        setTestId(null);
        setResults([]);
        setWinner(null);
        setProgress({});
        setError(null);
        setWarpSpeed(0);
    };

    return (
        <main ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-primary-500/30">

            {/* 3D Background Layer */}
            <div className="absolute inset-0 z-0">
                <Scene3D speed={warpSpeed} phase={phase} />
            </div>

            {/* UI Overlay Layer */}
            <div className={clsx(
                "relative z-10 w-full h-full flex flex-col items-center p-4 overflow-y-auto",
                phase === 'complete' ? 'justify-start' : 'justify-center'
            )}>

                {/* Header - Animates to top-small in complete phase */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{
                        opacity: phase === 'testing' ? 0 : 1,
                        y: 0,
                        scale: phase === 'complete' ? 0.4 : 1,
                        transformOrigin: 'top center'
                    }}
                    transition={{ duration: 0.5 }}
                    className={clsx(
                        "absolute z-20 pointer-events-auto text-center transition-all duration-500",
                        phase === 'complete' ? "top-0" : "top-8 md:top-16"
                    )}
                >
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-1 relative inline-block">
                        <span className="absolute inset-0 blur-lg bg-gradient-to-r from-cyan-500 via-white to-fuchsia-500 opacity-50"></span>
                        <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                            CHAINSPEED
                        </span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-cyan-400/90 text-xs md:text-sm tracking-[0.3em] uppercase font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
                        Blockchain Network Analytics
                        <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_10px_#d946ef]"></span>
                    </div>
                </motion.div>

                {/* IDLE PHASE: Mode Switcher & HyperButton */}
                <AnimatePresence mode="wait">
                    {phase === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center gap-10 pointer-events-auto mt-48 w-full"
                        >
                            {/* Mode Switcher */}
                            <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                <button
                                    onClick={() => setMode('network-benchmark')}
                                    className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'network-benchmark'
                                        ? 'bg-primary-500 text-black shadow-[0_0_20px_rgba(14,165,233,0.5)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    BENCHMARK
                                </button>
                                <button
                                    onClick={() => setMode('node-diagnostic')}
                                    className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'node-diagnostic'
                                        ? 'bg-primary-500 text-black shadow-[0_0_20px_rgba(14,165,233,0.5)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    DIAGNOSTIC
                                </button>
                            </div>

                            {/* Node Diagnostic Inputs */}
                            <AnimatePresence mode="wait">
                                {mode === 'node-diagnostic' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full max-w-lg space-y-5 px-4"
                                    >
                                        {/* Chain Selector */}
                                        <div>
                                            <select
                                                value={selectedChain}
                                                onChange={(e) => setSelectedChain(e.target.value)}
                                                className="w-full bg-black/50 border-2 border-primary-500/30 rounded-lg px-4 py-3.5 text-white text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 backdrop-blur-md transition-all duration-200 hover:border-primary-500/50 cursor-pointer"
                                            >
                                                {SUPPORTED_CHAINS.map(chain => (
                                                    <option key={chain.id} value={chain.id} className="bg-gray-900">{chain.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* RPC Input */}
                                        <div>
                                            <input
                                                type="text"
                                                value={userRpc}
                                                onChange={(e) => setUserRpc(e.target.value)}
                                                placeholder="wss://your-node-endpoint..."
                                                className="w-full bg-black/50 border-2 border-primary-500/30 rounded-lg px-4 py-3.5 text-white text-base placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 backdrop-blur-md transition-all duration-200 hover:border-primary-500/50"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* The HyperButton */}
                            <HyperButton
                                onClick={handleStartTest}
                                disabled={mode === 'node-diagnostic' && !userRpc}
                            />

                            <p className="text-gray-500 text-xs tracking-widest uppercase animate-pulse">
                                {mode === 'node-diagnostic' && !userRpc ? 'Enter RPC to Initialize' : 'Click Sphere to Initialize'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TESTING PHASE: HUD Overlay */}
                <AnimatePresence>
                    {phase === 'testing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            {/* Central HUD Ring */}
                            <div className="absolute w-[500px] h-[500px] border border-primary-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute w-[450px] h-[450px] border border-primary-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-8">
                                {['polkadot', 'stellar'].map((chainId, i) => {
                                    if (mode === 'node-diagnostic' && chainId !== selectedChain) return null;
                                    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
                                    const chainProgress = progress[chainId] || { progress: 0, phase: 'connecting', message: 'Initializing...' };

                                    return (
                                        <div key={chainId} className={`flex flex-col ${i === 1 ? 'md:items-end md:text-right' : ''}`}>
                                            <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
                                                {chain?.name}
                                            </h2>
                                            <div className="text-primary-400 font-mono text-sm mb-4 h-6">
                                                {'>'} {chainProgress.message}
                                            </div>

                                            {/* Cyber Progress Bar */}
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-primary-500 shadow-[0_0_10px_#0ea5e9]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${chainProgress.progress}%` }}
                                                />
                                            </div>
                                            <div className="mt-2 font-mono text-xs text-gray-500">
                                                SYSTEM_INTEGRITY: {Math.round(chainProgress.progress)}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* COMPLETE PHASE: Results Grid */}
                <AnimatePresence>
                    {phase === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-6xl z-30 pointer-events-auto py-0 mt-6 pt-12"
                        >
                            {/* Winner Announcement - simplified animation */}
                            {winner && results.length > 1 && (
                                <motion.div
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                                    className="text-center mb-8"
                                >
                                    <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-3">
                                        {SUPPORTED_CHAINS.find(c => c.id === winner)?.name.toUpperCase()}
                                    </h2>
                                    <div className="inline-block px-6 py-2 bg-primary-500 text-black font-bold text-lg tracking-widest uppercase transform -skew-x-12 shadow-[0_0_20px_#0ea5e9]">
                                        Dominant Network
                                    </div>
                                </motion.div>
                            )}

                            {/* Cards Grid */}
                            <div className="grid md:grid-cols-2 gap-8 mb-8 px-4">
                                {results.map((result, index) => {
                                    const chain = SUPPORTED_CHAINS.find(c => c.id === result.chainId);
                                    const isLeft = index === 0;

                                    return (
                                        <div key={result.chainId} className="relative">
                                            {/* Simple CSS Chain Accent - no WebGL overhead */}
                                            <div
                                                className={`absolute ${isLeft ? '-left-4 -top-4' : '-right-4 -top-4'} w-24 h-24 opacity-20 pointer-events-none`}
                                                style={{
                                                    background: `radial-gradient(ellipse at ${isLeft ? 'right bottom' : 'left bottom'}, ${chain?.color || '#0ea5e9'} 0%, transparent 70%)`
                                                }}
                                            />

                                            {/* HoloCard */}
                                            <HoloCard
                                                result={result}
                                                isWinner={result.chainId === winner}
                                                index={index}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="flex justify-center gap-6 pb-12"
                            >
                                <button
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                >
                                    REBOOT SYSTEM
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                                    className="px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-colors backdrop-blur-md"
                                >
                                    SHARE DATA
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
