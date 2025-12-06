# Freelancer Platform


## 📋 Project Overview

**Project Name:** Freelancer Platform

**Tagline:** Decentralised freelancer platform

**Description:**
Instant, verified payments via stellar and reliable project tracking via polkadot

## 👥 Team Information

**Team Name:** Saheel Wagh

**Team Members:** Saheel Wagh
- [Saheel Wagh](https://github.com/saheelwagh) - Full stack development

## 🛠️ Technologies Used

- **Frontend:** Next js with vite
- **Blockchain:** Stellar and Polkadot
- **Smart Contracts:** Soroban ink


## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Freelancer Platform                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Web App)                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ Client Dashboard │  │Freelancer Dash.  │  │ Project Manager  │  │   │
│  │  │ - Create Project │  │ - Submit Work    │  │ - View Projects  │  │   │
│  │  │ - Fund Escrow    │  │ - Track Status   │  │ - Approve Work   │  │   │
│  │  │ - Release Funds  │  │ - View Payments  │  │ - Dispute Mgmt   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                     ↓                                    ↓                   │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │   Freighter Wallet (Stellar) │    │  SubWallet (Polkadot)            │  │
│  │   - Stellar Account          │    │  - Polkadot Account              │  │
│  │   - Sign Transactions        │    │  - Sign Transactions             │  │
│  └──────────────────────────────┘    └──────────────────────────────────┘  │
│                     ↓                                    ↓                   │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │  Stellar Blockchain          │    │  Polkadot Blockchain             │  │
│  │  (Soroban - Testnet)         │    │  (Ink! - Paseo Testnet)          │  │
│  │                              │    │                                  │  │
│  │  📦 Escrow Contract:         │    │  📦 ProjectRegistry:             │  │
│  │  • Fund Management           │    │  • Project Metadata              │  │
│  │  • Milestone Payments        │    │  • Deliverable Tracking          │  │
│  │  • Balance Tracking          │    │  • Approval Status               │  │
│  │  • Dispute Resolution        │    │  • Dispute Records               │  │
│  │                              │    │                                  │  │
│  │  Address:                    │    │  📦 MilestoneManager:            │  │
│  │  CCKCGYGFMTYRAHHNOVMBMGKAP   │    │  • Milestone Status Updates      │  │
│  │  6S4XSWL3TEJJH2D4JCZWBJRI    │    │  • Completion Tracking           │  │
│  │  ZBUXZII                     │    │                                  │  │
│  │                              │    │  Addresses:                      │  │
│  │                              │    │  Registry:                       │  │
│  │                              │    │  0x3d2a3b92321c0584c6666...     │  │
│  │                              │    │                                  │  │
│  │                              │    │  Manager:                        │  │
│  │                              │    │  0x122ef15591547d844930689...   │  │
│  └──────────────────────────────┘    └──────────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```



## 🚀 Getting Started

### Prerequisites

- Stellar cli
- Stellar and polkadot wallets


### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd freelance-platform

# Install dependencies
[Add installation commands]
pnpm install
```

### Configuration

[Describe any environment variables or configuration needed]

```bash
# Example
cp .env.example .env
# Edit .env with your configuration
```

### Running the Project

```bash
# fron end
pnpm dev


```

## 📱 Features

- [ ] Instant milestone based payments
- [ ] Verifiable trail on polkadot
- [ ] Less fees due to stellar usage

## 🎯 Use Cases

This platform can be used by freelancers and clients who wish to maintain a trustless flow of work and funds. Work proof can be generated from platforms like ipfs and gitub for dispute management

## 🔗 Links & Resources

- **Live Demo:** [URL if available]
- **Video Demo:** [Link to video walkthrough if available]
- **Smart Contract Addresses (with Chain name):** [If applicable]
  - Escrow (Stellar): `CCKCGYGFMTYRAHHNOVMBMGKAP6S4XSWL3TEJJH2D4JCZWBJRIZBUXZII`
  - Project Registry(Polkadot): `0x3d2a3b92321c0584c66661d43988fdf56540673`
  - Milestone Manager (Polkadot): `0x122ef15591547d844930689e5471c3a54dc173c9`
- **Documentation:** refer 'sprints' folder
- **Presentation:** [Link to pitch deck or presentation if available]

## 📸 Screenshots

[Add screenshots or GIFs of your project]

![Screenshot 1](path/to/screenshot1.png)
![Screenshot 2](path/to/screenshot2.png)

## 🧪 Testing

[Describe your testing approach]

```bash
# Run tests
[Add test commands]
```

## 🚧 Challenges & Solutions

Polkadot frontend integration is harder than stellar.

## 🔮 Future Improvements



- [ ] Complete the polkadot integration
- [ ] Dispute management
- [ ] Cross chain reputation score

## 📄 License

MIT

## 🙏 Acknowledgments

Edgetributor Subdao
---

**Built for Stellar x Polkadot Hackerhouse BLR** 🎉