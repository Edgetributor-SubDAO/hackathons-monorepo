# x402-flash Payments MCP Server

> Model Context Protocol server for instant payments on Stellar using x402-flash

Enable AI assistants like Claude to make micropayments, open payment channels, call paid AI agents, and more!

## 🚀 Quick Start

### 1. Installation

```bash
cd packages/mcp-server
npm install
```

### 2. Setup Wallet

```bash
npx tsx scripts/setup-wallet.ts
```

This will:
- Generate a new Stellar keypair
- Fund it from Friendbot (testnet)
- Create `.env` file

### 3. Update Configuration

Edit `.env` and add your contract ID:
```
X402_CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
```

### 4. Build

```bash
npm run build
```

### 5. Configure Claude Desktop

Edit Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add:
```json
{
  "mcpServers": {
    "x402-payments": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/packages/mcp-server/dist/index.js"],
      "env": {
        "STELLAR_RPC_URL": "https://soroban-testnet.stellar.org",
        "STELLAR_NETWORK": "Test SDF Network ; September 2015",
        "X402_CONTRACT_ID": "YOUR_CONTRACT_ID",
        "WALLET_SECRET_KEY": "YOUR_SECRET_KEY"
      }
    }
  }
}
```

### 6. Restart Claude Desktop

Your MCP server is now active!

---

## 🛠️ Available Tools

### 1. **open_channel**
Open a payment channel with an AI agent

```
Args:
- server: Stellar address of the agent
- token: Token contract address
- amount: Amount in stroops
- ttl: Time-to-live in seconds (default: 86400)
```

### 2. **close_channel**
Close channel and withdraw remaining balance

```
Args:
- server: Stellar address of the agent
```

### 3. **check_balance**
Check wallet or channel balance

```
Args:
- type: "wallet" or "channel"
- server: (optional) Server address for channel balance
```

### 4. **call_agent**
Call a paid AI agent with automatic payment

```
Args:
- endpoint: Agent endpoint URL
- capability: Agent capability (e.g., "text_generation")
- input: Input for the agent
- parameters: (optional) Additional parameters
```

### 5. **list_agents**
Discover available AI agents

```
Args:
- capability: (optional) Filter by capability
- maxPrice: (optional) Maximum price
- tags: (optional) Filter by tags
```

### 6. **get_transaction**
Get Stellar transaction details

```
Args:
- hash: Transaction hash
```

---

## 💬 Usage Examples

### With Claude

**Example 1: Check Balance**
```
"What's my Stellar wallet balance?"
```

**Example 2: Open Channel**
```
"Open a payment channel with 1 XLM to agent at GBXXXX... using token CBXXXX..."
```

**Example 3: Call Agent**
```
"Call the code assistant at https://agent.example.com to write a Python function"
```

**Example 4: Discover Agents**
```
"Find me all chatbot agents under $0.01 per call"
```

---

## 📚 Resources

### stellar://wallet
Access your Stellar wallet information

Returns:
```json
{
  "publicKey": "GXXXX...",
  "balance": "100.0000000 XLM",
  "network": "Test SDF Network ; September 2015"
}
```

---

## 📖 Prompts

### payment_guide
Learn how to make payments with x402-flash

### agent_discovery
Learn how to find and call AI agents

---

## 🔧 Development

### Watch Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

---

## 🌟 Features

✅ **Instant Payments** - <100ms via x402-flash  
✅ **Payment Channels** - Open once, pay many times  
✅ **AI Agent Integration** - Call any x402-compatible agent  
✅ **Agent Discovery** - Find agents by capability, price, tags  
✅ **Claude Integration** - Works seamlessly with Claude Desktop  
✅ **Type Safe** - Full TypeScript support  
✅ **Stellar Native** - Built on Stellar Soroban  

---

## 📝 License

MIT

---

**Built with ❤️ on Stellar Soroban**
