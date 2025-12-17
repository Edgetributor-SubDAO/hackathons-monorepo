# Neon Arena

**Tagline**: Play Epic Games. Win Real Rewards. Earn in Crypto.

## 📋 Project Overview

**Project Name**: Neon Arena

**Description**: 
Neon Arena is a high-speed, cyberpunk-themed arcade shooter built to bridge the gap between casual gaming and Web3. It solves the problem of complex user onboarding in blockchain games by offering a seamless "play-first" experience. Players compete in "Target Blitz" mode to climb an on-chain leaderboard and win weekly crypto prize pools. Built for the Polkadot ecosystem (Moonbeam) and integrated with Stellar, it demonstrates how cross-chain UX can be smooth and rewarding.

## 👥 Team Information

**Team Name**: Neon Arena Team

**Team Members**:
- **Suhail Afnan** ([@suhailafnan](https://github.com/suhailafnan))
- **Hilmi KT**
- **Anandhu P**

## 🛠️ Technologies Used

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, TypeScript
- **Blockchain**: Polkadot (Moonbase Alpha Parachain), Stellar (Freighter Wallet)
- **Smart Contracts**: Solidity (Hardhat)
- **Tools**: Ethers.js, Polkadot.js extensions

## 🏗️ Architecture

The application is a Next.js web app.
1. **Frontend**: Handles game logic (Canvas API) and user interaction.
2. **Smart Contract**: `GameLeaderboard.sol` on Moonbase Alpha stores player stats, high scores, and weekly leaderboard rankings.
3. **Wallet Integration**: Supports MetaMask (EVM) for Moonbeam and Freighter for Stellar.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or Polkadot.js Extension (configured for Moonbase Alpha)
- Freighter Wallet (optional for Stellar features)

### Installation

```bash
# Clone the repository
git clone https://github.com/suhailafnan/neon-arena.git
cd neon-arena

# Install dependencies
cd frontend
npm install
# (Optional) Install contract dependencies
cd ../contracts
npm install
```

### Configuration

1. Create a `.env.local` file in the `frontend` directory:
   ```bash
   cp .env.local.example .env.local
   ```
2. Add your environment variables (Contract address is pre-configured):
   ```
   NEXT_PUBLIC_LEADERBOARD_CONTRACT=0x9B24B5f503A27dB53AB17B371C7C58A94103C051
   ```

### Running the Project

```bash
# Run Frontend
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to play.

## 📱 Features

1. **Fast-Paced Arcade Gameplay**: Responsive "Target Blitz" shooter game.
2. **On-Chain Leaderboard**: verifiable high scores stored on Moonbase Alpha.
3. **Multi-Wallet Support**: Connect with MetaMask (Moonbeam) or Freighter (Stellar).
4. **Weekly Resets**: Leaderboard resets weekly to keep competition fresh.

## 🎯 Use Cases

- **Casual Gamers**: Play a fun game and earn crypto without high barriers to entry.
- **Web3 Onboarding**: Serves as an educational funnel to get users their first wallet and tokens.
- **Competitive Esports**: Weekly tournaments with transparent, smart-contract managed payouts.

## 🔗 Links & Resources

- **Smart Contract (Moonbase Alpha)**: `0x9B24B5f503A27dB53AB17B371C7C58A94103C051`
  - [View on Moonscan](https://moonbase.moonscan.io/address/0x9B24B5f503A27dB53AB17B371C7C58A94103C051)

## 📸 Screenshots

*(Add your screenshots here)*

## 🧪 Testing

```bash
# Run contract tests
cd contracts
npx hardhat test
```

## � Challenges & Solutions

- **Challenge**: Handling wallet connection states across different chains (EVM vs Substrate vs Stellar).
  - **Solution**: Abstracted wallet logic into a unified service layer handling different providers.
- **Challenge**: Latency in on-chain updates.
  - **Solution**: Implemented optimistic UI updates and auto-refresh triggers to show leaderboard changes immediately after transaction confirmation.

## � Future Improvements

1. **NFT Skins**: Mint game assets as NFTs on Moonbeam.
2. **Staking**: Stake DEV/GLMR to enter high-stakes arenas.
3. **Cross-Chain Messaging**: Unified score state across Polkadot and Stellar using XCM.

## 📄 License

MIT License

## 🙏 Acknowledgments

Built for **Stellar x Polkadot Hackerhouse BLR** 🎉
