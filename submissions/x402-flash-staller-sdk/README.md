# x402-Flash SDK - Stellar x Polkadot Hackerhouse BLR Submission

## 🎯 Project Name
**x402-Flash SDK** - Micropayment Infrastructure for Stellar Soroban with AI Agent Monetization

## 👥 Team Information
- **Team Member**: Aditya Kumar ([@AdityaKumar41](https://github.com/AdityaKumar41))

## 📝 Project Description

x402-Flash SDK is a comprehensive micropayment infrastructure built on Stellar Soroban that enables instant, low-cost transactions for AI agent monetization. The project bridges the gap between AI services and blockchain payments, making it practical and economically viable to charge for individual AI API calls.

### Key Features:
- ⚡ **Ultra-fast Payments**: < 100ms payment latency (50x faster than standard blockchain transactions)
- 🤖 **AI Agent Monetization**: Built-in support for charging per AI API call
- 🔐 **Secure Escrow System**: Soroban smart contract-based settlement
- 📦 **Complete TypeScript SDK**: Easy integration for developers
- 🎨 **Interactive Demo**: Full-stack example with React frontend
- 🔌 **MCP Server Integration**: Model Context Protocol support for AI agents

## 🛠 Technologies Used

### Blockchain & Smart Contracts
- **Stellar Soroban**: Smart contract platform for escrow and settlement
- **Rust**: Smart contract development
- **Stellar SDK**: Blockchain interaction

### Backend
- **TypeScript/Node.js**: SDK and server implementation
- **Express**: API server framework

### Frontend
- **React**: User interface
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **Freighter Wallet**: Stellar wallet integration

### AI Integration
- **OpenAI API**: AI service integration
- **Model Context Protocol (MCP)**: AI agent framework

## 🚀 How to Setup and Run

### Prerequisites
- Node.js >= 18
- Rust & Cargo
- Stellar CLI: `cargo install --locked stellar-cli --features opt`
- Freighter wallet extension (for demo)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/AdityaKumar41/flash-stellar-x402.git
   cd x402-flash-staller-sdk
   npm install
   ```

2. **Build Contracts**
   ```bash
   cd contracts/x402-flash-settlement
   cargo build --target wasm32-unknown-unknown --release
   ```

3. **Build SDK**
   ```bash
   cd ../../sdk/typescript
   npm run build
   ```

4. **Run Interactive Demo** (One-command setup)
   ```bash
   npm run setup:demo && npm run start:demo
   ```

   This will:
   - Deploy smart contracts to Stellar testnet
   - Start the API server (port 3001)
   - Launch the React frontend (port 5173)

5. **Access Demo**
   - Open http://localhost:5173
   - Connect your Freighter wallet
   - Try the payment channel demo
   - Run speed tests

### Alternative: Manual Setup

```bash
# Deploy contracts
npm run deploy

# Start API server
cd examples/demo-api-server
npm install && npm run dev

# Start frontend (in new terminal)
cd examples/demo-frontend
npm install && npm run dev
```

### Testing the SDK

```bash
cd sdk/typescript
npm run build
node test-sdk.mjs
```

### AI Agent Monetization Demo

```bash
cd examples/sdk-monetization-demo
npm install
npx tsx test-direct.ts "Your message here"
```

## 🎬 Demo Links

- **Live Demo**: [Video/Screen Recording Link - Add if available]
- **GitHub Repository**: https://github.com/AdityaKumar41/flash-stellar-x402
- **Documentation**: See `/docs` folder in repository

### Demo Features:
1. **Payment Channel Lifecycle**:
   - Open channel with escrow
   - Make instant payments
   - Close and settle on-chain

2. **Speed Test**:
   - Compare x402-flash vs traditional payments
   - Real-time metrics display
   - Visual performance comparison

3. **AI Agent Integration**:
   - Pay-per-API-call model
   - Automatic micropayment handling
   - OpenAI integration example

## 📊 Project Phases

### ✅ Phase 1 - Core Infrastructure (Completed)
- Soroban smart contracts for escrow and settlement
- TypeScript SDK for client/server interactions
- Basic payment channel implementation

### ✅ Phase 2 - AI Agent Monetization (Completed)
- Agent server for providing AI services
- Client SDK with automatic payment handling
- OpenAI integration
- SDK monetization demo

### ✅ Phase 3 - MCP Server (Completed)
- Model Context Protocol server implementation
- Integration with AI development tools
- Advanced marketplace features

## 🏗 Architecture Highlights

### Smart Contract Layer
- **Escrow Management**: Secure fund locking
- **Settlement Logic**: Fair dispute resolution
- **Time-based Controls**: Automatic expiry handling

### SDK Layer
- **AgentServer**: Service provider interface
- **AgentClient**: Consumer interface with auto-payments
- **Payment Channels**: Off-chain optimized transactions

### Integration Layer
- **MCP Server**: AI agent framework integration
- **OpenAI Wrapper**: Monetized AI API calls
- **Demo Applications**: Full-stack examples

## 💡 Innovation & Impact

1. **Micropayments Made Practical**: Enables economically viable per-API-call pricing
2. **AI Monetization**: New business models for AI services
3. **Developer-Friendly**: Simple SDK abstracts blockchain complexity
4. **Stellar Ecosystem**: Showcases Soroban's capabilities for real-world use cases

## 📈 Future Enhancements

- Multi-party channels
- Cross-chain bridges
- Advanced marketplace features
- Token-based payments
- Analytics dashboard
- Mobile SDK

## 📄 License

MIT License - see LICENSE file

## 🔗 Additional Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Getting Started Guide](./docs/GETTING_STARTED.md)
- [API Reference](./sdk/typescript/API_REFERENCE.md)
- [Demo Implementation Details](./DEMO_IMPLEMENTATION.md)

## 📞 Contact

- **GitHub**: [@AdityaKumar41](https://github.com/AdityaKumar41)
- **Project Issues**: https://github.com/AdityaKumar41/flash-stellar-x402/issues

---

**Built with ❤️ for Stellar x Polkadot Hackerhouse BLR**
