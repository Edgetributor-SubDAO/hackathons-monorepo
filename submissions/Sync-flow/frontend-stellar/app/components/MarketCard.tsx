"use client";

import React from "react";

interface MarketCardProps {
    id: string;
    name: string;
    description: string;
    priceEth: number;
    priceXlm?: number | null; // Optional XLM price for display
    onAction: () => void;
    actionLabel: string;
    colorClass: string;
}

export function MarketCard({
    id,
    name,
    description,
    priceEth,
    priceXlm,
    onAction,
    actionLabel,
    colorClass,
}: MarketCardProps) {
    // Display XLM price if available, otherwise show ETH
    const displayPrice = priceXlm != null
        ? `${priceXlm.toFixed(2)} XLM`
        : `${priceEth} ETH`;

    return (
        <div className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-${colorClass}-500/50 hover:shadow-2xl hover:shadow-${colorClass}-900/20`}>
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-${colorClass}-500/10 blur-3xl transition group-hover:bg-${colorClass}-500/20`} />

            <div className="relative flex flex-col h-full space-y-4">
                {/* Placeholder Image Area */}
                <div className={`w-full h-40 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-4xl shadow-inner group-hover:border-${colorClass}-500/30 transition`}>
                    {name.includes("Rocket") ? "🚀" : name.includes("Shield") ? "🛡️" : name.includes("Book") ? "📖" : "📦"}
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-white tracking-tight">{name}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${colorClass}-500/20 text-${colorClass}-300`}>
                            {displayPrice}
                        </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        onClick={onAction}
                        className={`w-full rounded-xl bg-${colorClass}-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-${colorClass}-400 active:scale-95 shadow-lg shadow-${colorClass}-900/20`}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
