'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

interface Target {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    points: number;
    speed: number;
}

const COLORS = [
    'from-pink-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
];

export default function GamePage() {
    const router = useRouter();
    const { isConnected, updateScore, highScore } = useGameStore();
    const gameAreaRef = useRef<HTMLDivElement>(null);

    const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
    const [currentScore, setCurrentScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [level, setLevel] = useState(1);
    const [combo, setCombo] = useState(0);
    const [targets, setTargets] = useState<Target[]>([]);
    const [missedClicks, setMissedClicks] = useState(0);
    const [hitEffects, setHitEffects] = useState<{ id: number; x: number; y: number; points: number }[]>([]);

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
            endGame();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    // Spawn targets
    useEffect(() => {
        if (gameState !== 'playing') return;

        const spawnRate = Math.max(500, 1500 - (level * 100));

        const spawner = setInterval(() => {
            spawnTarget();
        }, spawnRate);

        return () => clearInterval(spawner);
    }, [gameState, level]);

    // Move targets
    useEffect(() => {
        if (gameState !== 'playing') return;

        const mover = setInterval(() => {
            setTargets(prev => prev.map(target => {
                const newY = target.y + target.speed;
                if (newY > 100) {
                    // Target escaped - reset combo
                    setCombo(0);
                    return null;
                }
                return { ...target, y: newY };
            }).filter(Boolean) as Target[]);
        }, 50);

        return () => clearInterval(mover);
    }, [gameState]);

    // Level up based on score
    useEffect(() => {
        const newLevel = Math.floor(currentScore / 500) + 1;
        if (newLevel > level && newLevel <= 10) {
            setLevel(newLevel);
        }
    }, [currentScore, level]);

    const spawnTarget = useCallback(() => {
        const id = Date.now() + Math.random();
        const size = Math.random() > 0.8 ? 40 : Math.random() > 0.5 ? 60 : 80;
        const points = size === 40 ? 30 : size === 60 ? 20 : 10;

        const newTarget: Target = {
            id,
            x: Math.random() * 80 + 10,
            y: 0,
            size,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            points,
            speed: 0.5 + (level * 0.1) + (Math.random() * 0.3),
        };

        setTargets(prev => [...prev, newTarget]);
    }, [level]);

    const hitTarget = (target: Target, e: React.MouseEvent) => {
        e.stopPropagation();

        const comboMultiplier = Math.min(combo + 1, 10);
        const points = target.points * comboMultiplier;

        setCurrentScore(s => s + points);
        setCombo(c => c + 1);
        setTargets(prev => prev.filter(t => t.id !== target.id));

        // Add hit effect
        const rect = gameAreaRef.current?.getBoundingClientRect();
        if (rect) {
            const effectX = (target.x / 100) * rect.width;
            const effectY = (target.y / 100) * rect.height;

            setHitEffects(prev => [...prev, { id: target.id, x: effectX, y: effectY, points }]);

            setTimeout(() => {
                setHitEffects(prev => prev.filter(h => h.id !== target.id));
            }, 500);
        }
    };

    const handleMiss = () => {
        if (gameState !== 'playing') return;
        setCombo(0);
        setMissedClicks(m => m + 1);
    };

    const startGame = () => {
        setGameState('playing');
        setCurrentScore(0);
        setTimeLeft(60);
        setLevel(1);
        setCombo(0);
        setTargets([]);
        setMissedClicks(0);
    };

    const endGame = () => {
        setGameState('gameover');
        updateScore(currentScore);
        setTargets([]);
    };

    const togglePause = () => {
        setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950">
            {/* Background */}
            <div className="bg-animated" />

            <div className="relative z-10 h-screen flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-sm">
                    <button
                        onClick={() => router.push('/arena')}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ← Back to Arena
                    </button>

                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                        🎯 Target Blitz Pro
                    </h1>

                    <div className="text-sm text-slate-400">
                        High Score: <span className="text-cyan-400 font-bold">{highScore}</span>
                    </div>
                </header>

                {/* Game Stats Bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-700">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{currentScore}</div>
                            <div className="text-xs text-slate-400">Score</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                                {timeLeft}s
                            </div>
                            <div className="text-xs text-slate-400">Time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">Lv.{level}</div>
                            <div className="text-xs text-slate-400">Level</div>
                        </div>
                    </div>

                    {combo > 1 && (
                        <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-bounce">
                            <span className="text-black font-bold">{combo}x COMBO!</span>
                        </div>
                    )}

                    {gameState === 'playing' && (
                        <button
                            onClick={togglePause}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            ⏸️ Pause
                        </button>
                    )}
                </div>

                {/* Game Area */}
                <div
                    ref={gameAreaRef}
                    className="flex-1 relative cursor-crosshair"
                    onClick={handleMiss}
                >
                    {/* Ready Screen */}
                    {gameState === 'ready' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="text-8xl mb-6">🎯</div>
                            <h2 className="text-4xl font-bold mb-4">Target Blitz Pro</h2>
                            <p className="text-slate-400 mb-2 max-w-md text-center">
                                Click targets before they escape! Smaller targets = more points.
                            </p>
                            <p className="text-cyan-400 mb-8">Build combos for multiplied scores!</p>

                            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                                <div className="card-glass p-4">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mb-2" />
                                    <div className="text-lg font-bold">Large</div>
                                    <div className="text-slate-400 text-sm">10 pts</div>
                                </div>
                                <div className="card-glass p-4">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 mb-2" />
                                    <div className="text-lg font-bold">Medium</div>
                                    <div className="text-slate-400 text-sm">20 pts</div>
                                </div>
                                <div className="card-glass p-4">
                                    <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-2" />
                                    <div className="text-lg font-bold">Small</div>
                                    <div className="text-slate-400 text-sm">30 pts</div>
                                </div>
                            </div>

                            <button onClick={startGame} className="btn-primary text-lg px-8 py-4">
                                <span>🚀</span>
                                <span>Start Game</span>
                            </button>
                        </div>
                    )}

                    {/* Paused Screen */}
                    {gameState === 'paused' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className="text-6xl mb-6">⏸️</div>
                            <h2 className="text-3xl font-bold mb-8">Paused</h2>
                            <div className="flex gap-4">
                                <button onClick={togglePause} className="btn-primary">
                                    <span>▶️</span>
                                    <span>Resume</span>
                                </button>
                                <button onClick={() => router.push('/arena')} className="btn-secondary">
                                    <span>🏠</span>
                                    <span>Quit</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className="text-8xl mb-6">🏆</div>
                            <h2 className="text-4xl font-bold mb-4">Game Over!</h2>

                            <div className="card-glass p-8 mb-8 text-center">
                                <div className="text-5xl font-bold text-cyan-400 mb-2">{currentScore}</div>
                                <div className="text-slate-400 mb-4">Final Score</div>

                                {currentScore > highScore - currentScore && (
                                    <div className="text-green-400 text-lg mb-4">🎉 New High Score!</div>
                                )}

                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div>
                                        <div className="text-xl font-bold text-purple-400">Lv.{level}</div>
                                        <div className="text-xs text-slate-400">Max Level</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-yellow-400">{combo}</div>
                                        <div className="text-xs text-slate-400">Best Combo</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-400">{missedClicks}</div>
                                        <div className="text-xs text-slate-400">Missed</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={startGame} className="btn-primary">
                                    <span>🔄</span>
                                    <span>Play Again</span>
                                </button>
                                <button onClick={() => router.push('/arena')} className="btn-secondary">
                                    <span>🏠</span>
                                    <span>Back to Arena</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Targets */}
                    {gameState === 'playing' && targets.map(target => (
                        <button
                            key={target.id}
                            onClick={(e) => hitTarget(target, e)}
                            className={`absolute rounded-full bg-gradient-to-r ${target.color} 
                         shadow-lg transform hover:scale-110 transition-transform
                         flex items-center justify-center cursor-pointer`}
                            style={{
                                width: `${target.size}px`,
                                height: `${target.size}px`,
                                left: `${target.x}%`,
                                top: `${target.y}%`,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: `0 0 20px rgba(255, 255, 255, 0.3)`,
                            }}
                        >
                            <span className="text-white font-bold text-sm">
                                {target.points}
                            </span>
                        </button>
                    ))}

                    {/* Hit Effects */}
                    {hitEffects.map(effect => (
                        <div
                            key={effect.id}
                            className="absolute pointer-events-none text-yellow-400 font-bold text-xl animate-ping"
                            style={{
                                left: effect.x,
                                top: effect.y,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            +{effect.points}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
