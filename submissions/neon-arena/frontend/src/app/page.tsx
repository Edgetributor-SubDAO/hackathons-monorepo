'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { connectPolkadotWallet, connectStellarWallet } from '@/lib/wallets';
import Leaderboard from '@/components/Leaderboard';

export default function Home() {
  const router = useRouter();
  const { connectPolkadot, connectStellar, setEmail: storeSetEmail, isConnected } = useGameStore();

  const [email, setEmail] = useState('');
  const [connecting, setConnecting] = useState<null | 'polkadot' | 'stellar' | 'email'>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'wallet'>('email');

  // If already connected, redirect to arena (must be in useEffect to avoid render-time setState)
  useEffect(() => {
    if (isConnected) {
      router.push('/arena');
    }
  }, [isConnected, router]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConnecting('email');

    try {
      // Simulate wallet creation for email users
      await new Promise(resolve => setTimeout(resolve, 1200));
      storeSetEmail(email);
      router.push('/arena');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectPolkadot = async () => {
    setError(null);
    setConnecting('polkadot');
    try {
      const { address } = await connectPolkadotWallet();
      connectPolkadot(address);
      router.push('/arena');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to connect Polkadot wallet. Make sure you have Talisman, SubWallet, or Polkadot.js extension installed.');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectStellar = async () => {
    setError(null);
    setConnecting('stellar');
    try {
      const { address } = await connectStellarWallet();
      connectStellar(address);
      router.push('/arena');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to connect Stellar wallet. Make sure you have Freighter extension installed.');
    } finally {
      setConnecting(null);
    }
  };

  const handlePlayNow = () => {
    document.getElementById('signup-section')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="bg-animated" />

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full opacity-60" style={{ animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-40" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }} />
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-pink-400 rounded-full opacity-50" style={{ animation: 'float 6s ease-in-out infinite 1s' }} />
        <div className="absolute top-1/2 right-10 w-4 h-4 bg-green-400 rounded-full opacity-30" style={{ animation: 'float 4.5s ease-in-out infinite 0.3s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">

        {/* Hero Section */}
        <section className="text-center py-16 md:py-24">
          <div className="badge-floating">
            <span className="tagline">
              🎮 Web3 Gaming Revolution
            </span>
          </div>

          <h1 className="hero-title mb-4">
            NEON ARENA
          </h1>

          <p className="hero-subtitle max-w-2xl mx-auto mb-8">
            Play Epic Games. Win Real Rewards. Earn in Crypto.
          </p>

          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            Start your Web3 gaming journey with zero complexity.
            No seed phrases, no gas fees hassle – just pure gaming fun with real crypto rewards!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={handlePlayNow}
              className="btn-primary"
            >
              <span>🎮</span>
              <span>Play Game</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('wallet');
                document.getElementById('signup-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-secondary"
            >
              <span>🔗</span>
              <span>Connect Wallet</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="stat-item">
              <div className="stat-value">$30</div>
              <div className="stat-label">Weekly Prize Pool</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">2</div>
              <div className="stat-label">Blockchain Networks</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Entry Fees</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">∞</div>
              <div className="stat-label">Fun Guaranteed</div>
            </div>
          </div>
        </section>

        {/* On-Chain Leaderboard Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-4">
            🏆 On-Chain Leaderboard
          </h2>
          <p className="text-slate-400 text-center mb-8 max-w-xl mx-auto">
            Real scores, real players, all verified on the blockchain
          </p>
          <div className="max-w-2xl mx-auto">
            <Leaderboard type="weekly" limit={5} />
          </div>
        </section>

        {/* Signup Section */}
        <section id="signup-section" className="py-16">
          <div className="max-w-lg mx-auto">
            <div className="card-glass glow-purple">
              <h2 className="text-2xl font-bold text-center mb-2">
                🚀 Start Your Journey
              </h2>
              <p className="text-slate-400 text-center mb-6">
                Choose how you want to enter the arena
              </p>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Tab Switcher */}
              <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${activeTab === 'email'
                    ? 'bg-gradient-to-r from-cyan-500 to-green-500 text-black'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  📧 Email Signup
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${activeTab === 'wallet'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  🔗 Connect Wallet
                </button>
              </div>

              {/* Email Signup Form */}
              {activeTab === 'email' && (
                <div className="animate-in">
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-slate-300 font-medium">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        className="input-neon"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="gamer@example.com"
                        disabled={connecting !== null}
                      />
                      <p className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                        <span>✨</span>
                        We'll auto-create Polkadot + Stellar wallets for you!
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={connecting !== null}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connecting === 'email' ? (
                        <>
                          <span className="loading-spinner" />
                          <span>Creating Your Wallets...</span>
                        </>
                      ) : (
                        <>
                          <span>🎮</span>
                          <span>Create Wallet & Play Free</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> No seed phrase
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Instant setup
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> 100% free to play
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Real crypto rewards
                    </div>
                  </div>
                </div>
              )}

              {/* Connect Wallet Options */}
              {activeTab === 'wallet' && (
                <div className="space-y-3 animate-in">
                  <button
                    onClick={handleConnectPolkadot}
                    disabled={connecting !== null}
                    className="btn-wallet disabled:opacity-50"
                  >
                    <span className="text-2xl">🟣</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Polkadot.js / Talisman / SubWallet</div>
                      <div className="text-xs text-slate-400">Connect with Polkadot wallet extension</div>
                    </div>
                    {connecting === 'polkadot' ? (
                      <span className="loading-spinner" />
                    ) : (
                      <span className="text-slate-400">→</span>
                    )}
                  </button>

                  <button
                    onClick={handleConnectStellar}
                    disabled={connecting !== null}
                    className="btn-wallet disabled:opacity-50"
                  >
                    <span className="text-2xl">⭐</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Freighter</div>
                      <div className="text-xs text-slate-400">Connect with Stellar wallet extension</div>
                    </div>
                    {connecting === 'stellar' ? (
                      <span className="loading-spinner" />
                    ) : (
                      <span className="text-slate-400">→</span>
                    )}
                  </button>

                  <div className="divider">or start fresh</div>

                  <button
                    onClick={() => setActiveTab('email')}
                    className="w-full py-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    📧 Create wallet with email instead
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            From zero to earning in 3 simple steps
          </p>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-title">Sign Up</div>
              <div className="step-desc">
                Use email or connect your existing wallet. We handle the blockchain complexity.
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-title">Play Games</div>
              <div className="step-desc">
                Compete in our arcade-style games and climb the on-chain leaderboard.
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-title">Earn Crypto</div>
              <div className="step-desc">
                Win weekly prizes paid out in DOT or XLM. Your choice, your rewards!
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="card-glass">
            <h2 className="text-2xl font-bold text-center mb-8">
              ⚡ Why Neon Arena?
            </h2>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎮</div>
                <div>
                  <div className="font-semibold text-white">Play & Earn</div>
                  <div className="text-sm text-slate-400">Real crypto rewards for your skills</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <div>
                  <div className="font-semibold text-white">No Seed Phrases</div>
                  <div className="text-sm text-slate-400">Web2-friendly onboarding experience</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⛓️</div>
                <div>
                  <div className="font-semibold text-white">Multi-Chain</div>
                  <div className="text-sm text-slate-400">Polkadot + Stellar integration</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <div>
                  <div className="font-semibold text-white">On-Chain Leaderboard</div>
                  <div className="text-sm text-slate-400">Transparent, verifiable rankings</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <div>
                  <div className="font-semibold text-white">$30 Weekly Prize</div>
                  <div className="text-sm text-slate-400">Compete for real rewards</div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🆓</div>
                <div>
                  <div className="font-semibold text-white">Completely Free</div>
                  <div className="text-sm text-slate-400">No entry fees or hidden costs</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Crypto Partners */}
        <section className="py-8">
          <p className="text-center text-sm text-slate-500 mb-4">Powered by</p>
          <div className="crypto-row">
            <div className="crypto-icon">
              <span className="text-2xl">🟣</span>
              <span>Polkadot</span>
            </div>
            <div className="crypto-icon">
              <span className="text-2xl">⭐</span>
              <span>Stellar</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center border-t border-slate-800">
          <div className="footer-text">
            Built with ❤️ for Web2 → Web3 gamers •
            <span className="text-slate-500"> Hackathon MVP</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
              About
            </a>
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
              How to Play
            </a>
            <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
              Leaderboard
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
