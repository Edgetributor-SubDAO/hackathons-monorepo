# 🎨 Remix-Style WASM UI

A beautiful web-based IDE for deploying and executing Python code as WASM on the blockchain, similar to Remix IDE.

## Features

- 📝 **Code Editor**: Syntax-highlighted Python editor with CodeMirror
- 🚀 **One-Click Deployment**: Deploy Python code to WASM + IPFS + Blockchain
- ⚡ **Function Execution**: Execute Python functions directly from the UI
- 📋 **Contract Management**: View contract address, IPFS hash, and network info
- 📜 **Activity Logs**: Real-time logs of all operations
- 🎯 **Remix-Style UI**: Familiar interface inspired by Remix IDE

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file (optional, you can also enter private key in the UI):

```bash
PRIVATE_KEY=your_private_key_here
WEB3_STORAGE_TOKEN=your_web3_storage_token  # Optional, for IPFS
```

### 3. Start the Server

```bash
python app.py
```

### 4. Open in Browser

Navigate to: **http://localhost:5000**

## Usage

### Writing Code

1. Write your Python code in the editor
2. Click **💾 Save** to save to `main.py`
3. Click **🔍 Extract Functions** to see available functions

### Deploying

1. Click **🚀 Deploy to Blockchain**
2. Enter your private key (or leave empty to use `.env`)
3. Wait for deployment to complete
4. View contract address and IPFS hash

### Executing Functions

1. Go to the **⚡ Execute** tab
2. Select a function from the dropdown
3. Enter arguments (comma-separated)
4. Click **▶️ Execute**
5. View results in real-time

### Viewing Contract Info

1. Go to the **📋 Contract** tab
2. View contract address, IPFS hash, and network
3. See all available functions
4. Click **🔄 Refresh** to update info

## Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save code
- `Ctrl/Cmd + Enter`: Deploy contract
- `Enter` (in function args): Execute function

## Architecture

```
Frontend (HTML/CSS/JS)
    ↓
Flask API (app.py)
    ↓
Deploy Script (deploy_wasm.py)
    ↓
Blockchain + IPFS
```

## API Endpoints

- `GET /api/load-code` - Load code from main.py
- `POST /api/save-code` - Save code to main.py
- `POST /api/extract-functions` - Extract functions from code
- `POST /api/deploy` - Deploy to blockchain
- `GET /api/load-deployment` - Load deployment info
- `GET /api/contract-info` - Get contract info from blockchain
- `GET /api/get-functions` - Get available functions
- `POST /api/execute` - Execute a function

## Troubleshooting

### "Failed to connect to blockchain"
- Check your internet connection
- Verify Moonbase Alpha RPC is accessible

### "Insufficient balance"
- Get test tokens from https://faucet.moonbeam.network/

### "No IPFS service configured"
- Set up WEB3_STORAGE_TOKEN in `.env`
- Or install local IPFS: `brew install ipfs`

### Functions not showing
- Make sure you've deployed the contract
- Check that functions are not named `main` or `__main__`

## Next Steps

- Add support for multiple networks
- Add contract verification
- Add WASM file viewer
- Add transaction history
- Add function parameter validation

Enjoy coding! 🚀

