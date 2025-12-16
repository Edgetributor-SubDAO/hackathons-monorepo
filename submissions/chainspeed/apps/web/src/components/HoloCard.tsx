'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ChainSpeedResult, SUPPORTED_CHAINS } from '@chainspeed/shared';

interface HoloCardProps {
    result: ChainSpeedResult;
    isWinner: boolean;
    index: number;
}

export default function HoloCard({ result, isWinner, index }: HoloCardProps) {
    const chain = SUPPORTED_CHAINS.find(c => c.id === result.chainId);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.15,
                duration: 0.5,
                ease: "easeOut" // Simpler than spring, less CPU
            }}
            style={{ willChange: 'transform, opacity' }} // GPU acceleration hint
            className={clsx(
                "relative overflow-hidden rounded-2xl p-[1px] group w-full max-w-md mx-auto",
                isWinner ? "z-10 scale-105 shadow-2xl shadow-primary-500/20 opacity-95" : "z-0 opacity-80 hover:opacity-95"
            )}
        >
            {/* Animated Border Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50 animate-spin-slow group-hover:opacity-100 transition-opacity duration-500" />

            {/* Glass Content - reduced backdrop-blur for performance */}
            <div className="relative h-full bg-black/90 backdrop-blur-sm rounded-2xl p-6 border border-white/10 group-hover:border-primary-500/30 transition-colors flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            style={{ backgroundColor: chain?.color }}
                        >
                            {chain?.name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl tracking-tight text-white">{chain?.name}</h3>
                            <p className="text-xs text-primary-400 uppercase tracking-widest">
                                {result.meta.source === 'user' ? 'Node Diagnostic' : 'Network Benchmark'}
                            </p>
                        </div>
                    </div>
                    {isWinner && (
                        <div className="px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/50 text-primary-300 text-xs font-bold uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.3)]">
                            Winner
                        </div>
                    )}
                </div>

                {/* Big Score */}
                <div className="flex items-end gap-2 mb-8 pb-6 border-b border-white/10">
                    <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter">
                        {result.scores.overall}
                    </span>
                    <div className="mb-4">
                        <span className="text-sm text-gray-400 font-mono block">CHAINSPEED SCORE</span>
                        <span className="text-xs text-primary-500 font-mono">/ 100</span>
                    </div>
                </div>

                {/* Generic Metrics Grid */}
                <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Core Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <MetricItem label="Latency P50" value={result.generic.rpcLatencyP50.toFixed(0)} unit="ms" score={result.scores.latency} />
                        <MetricItem label="Latency P95" value={result.generic.rpcLatencyP95.toFixed(0)} unit="ms" score={result.scores.latency * 0.9} />
                        <MetricItem label="Throughput" value={result.generic.txThroughput.toFixed(0)} unit="TPS" score={result.scores.throughput} />
                        <MetricItem label="Finality" value={result.generic.finalityTime.toFixed(1)} unit="s" score={result.scores.finality} />
                        <MetricItem label="Block Time" value={result.generic.blockTime.toFixed(1)} unit="s" score={80} />
                        <MetricItem label="Reliability" value={(100 - result.generic.errorRate * 100).toFixed(1)} unit="%" score={result.scores.reliability} />
                    </div>
                </div>

                {/* Chain Specific Data - Fixed Alignment with Grid */}
                <div className="mt-auto pt-4 border-t border-white/10 bg-white/5 -mx-6 -mb-6 p-6">
                    <h4 className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-3">
                        {result.chainFamily === 'substrate' ? 'Polkadot Network Data' : 'Stellar Network Data'}
                    </h4>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {result.chainFamily === 'substrate' ? (
                            <>
                                <DetailRow label="XCM Success" value={`${((result.specific as any).xcmSuccessRate * 100).toFixed(1)}%`} />
                                <DetailRow label="XCM Time" value={`${((result.specific as any).xcmExecutionTime / 1000).toFixed(2)}s`} />
                                <DetailRow label="GRANDPA Lag" value={`${(result.specific as any).grandpaFinalityLag} blocks`} />
                                <DetailRow label="Validators" value={(result.specific as any).activeValidators} />
                                <DetailRow label="Parachains" value={(result.specific as any).parachainCount} />
                                <DetailRow label="Slashing (24h)" value={(result.specific as any).slashingEvents24h} />
                            </>
                        ) : (
                            <>
                                <DetailRow label="Ledger Close" value={`${(result.specific as any).ledgerCloseTime.toFixed(2)}s`} />
                                <DetailRow label="Close Variance" value={`±${(result.specific as any).ledgerCloseVariance.toFixed(3)}s`} />
                                <DetailRow label="Soroban Ops" value={(result.specific as any).sorobanInvocations} />
                                <DetailRow label="Soroban Success" value={`${((result.specific as any).sorobanSuccessRate * 100).toFixed(1)}%`} />
                                <DetailRow label="Path Success" value={`${((result.specific as any).pathPaymentSuccess * 100).toFixed(1)}%`} />
                                <DetailRow label="Avg Hops" value={(result.specific as any).pathPaymentAvgHops.toFixed(1)} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MetricItem({ label, value, unit, score }: { label: string, value: string, unit: string, score: number }) {
    const colorClass = score > 80 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-black/40 rounded-lg p-3 border border-white/5 hover:border-primary-500/30 transition-colors group/item">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
                <div className="h-1 w-8 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colorClass} shadow-[0_0_5px_currentColor]`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>
            <div className="font-mono text-lg text-white group-hover/item:text-primary-400 transition-colors">
                {value}<span className="text-xs text-gray-500 ml-1">{unit}</span>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="grid grid-cols-[1fr_auto] items-center border-b border-white/5 pb-1 last:border-0">
            <span className="text-xs text-gray-400 truncate pr-2">{label}</span>
            <span className="text-sm font-mono text-white font-medium text-right">{value}</span>
        </div>
    );
}
