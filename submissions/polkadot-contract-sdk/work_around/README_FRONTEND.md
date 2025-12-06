# Python Smart Contract IDE - Frontend

A Remix-like web interface for deploying Python smart contracts to Kusama testnet!

## Features

- 🐍 **Python Code Editor** - Monaco editor with syntax highlighting
- 📤 **File Upload** - Upload your Python files directly
- 🚀 **One-Click Deploy** - Deploy your Python code as smart contracts
- 🔌 **Interactive Interface** - Call functions and view results
- 📜 **Terminal Logs** - Real-time deployment and interaction logs
- 🎨 **Remix-like UI** - Familiar interface similar to Remix IDE

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Server

```bash
python app.py
```

### 3. Open in Browser

Navigate to: **http://localhost:5001**

## How to Use

### Step 1: Write Your Python Code

In the editor, write your Python functions:

```python
def add_numbers(a, b):
    return a + b

def multiply(x, y):
    return x * y
```

### Step 2: Save Your File

Click the **💾 Save** button to save your code.

### Step 3: Get Functions

Click **📋 Get Functions** to see what functions will be deployed.

### Step 4: Deploy

1. Enter your private key (for testnet)
2. Click **🚀 Deploy Contract**
3. Wait for deployment confirmation

### Step 5: Interact

Once deployed, you'll see:
- Contract address
- Function call forms
- View function buttons

Call your functions and see results in real-time!

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  Header: Python Smart Contract IDE              │
├──────────────┬──────────────────────────────────┤
│              │  Compile & Deploy                │
│  File        │  - Private Key Input             │
│  Explorer    │  - Get Functions Button          │
│              │  - Deploy Button                  │
│  ┌────────┐  │  - Deployment Status            │
│  │ Editor │  │                                  │
│  │        │  ├──────────────────────────────────┤
│  │        │  │  Interact                        │
│  │        │  │  - Contract Address              │
│  │        │  │  - Function Call Forms            │
│  │        │  │  - View Functions               │
│  └────────┘  ├──────────────────────────────────┤
│              │  Terminal                        │
│              │  - Deployment Logs                │
│              │  - Interaction Logs              │
└──────────────┴──────────────────────────────────┘
```

## Features Explained

### Code Editor
- Monaco editor (same as VS Code)
- Python syntax highlighting
- Auto-save capability
- File upload support

### Deployment Panel
- Private key input (secure, not stored)
- Function discovery
- Real-time deployment status
- Error handling

### Interaction Panel
- Dynamic function forms (based on your Python code)
- Parameter input fields
- Transaction execution
- Result display
- View-only functions

### Terminal
- Real-time logs
- Success/error indicators
- Timestamped entries
- Clear logs button

## Security Notes

⚠️ **Important:**
- Private keys are **never stored** on the server
- Private keys are only sent during deployment/interaction
- Use testnet private keys only
- Never commit private keys to Git

## API Endpoints

The frontend communicates with the backend via REST API:

- `GET /api/read-file` - Read main.py
- `POST /api/save-file` - Save main.py
- `GET /api/get-functions` - Extract functions from main.py
- `POST /api/deploy` - Deploy contract
- `GET /api/get-deployment` - Get deployment info
- `POST /api/call-function` - Call a function
- `POST /api/view-function` - Call a view function

## Troubleshooting

### Port Already in Use
The app uses port 5001 by default (to avoid macOS AirPlay conflict on port 5000).
If 5001 is also in use, change it in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)  # Use any available port
```

### CORS Errors
Flask-CORS is already configured. If issues persist, check browser console.

### Deployment Fails
- Check you have testnet tokens
- Verify private key is correct
- Check terminal logs for detailed errors

### Functions Not Showing
- Make sure functions are not named `main` or `__main__`
- Functions should have 2 parameters (currently)
- Save file before getting functions

## Next Steps

1. **Customize UI** - Edit `frontend/style.css`
2. **Add Features** - Extend `app.py` with new endpoints
3. **Deploy to Production** - Use a production WSGI server

## Comparison with Remix

| Feature | Remix | This IDE |
|---------|-------|----------|
| Language | Solidity | Python |
| Editor | Monaco | Monaco ✅ |
| Deploy | Yes | Yes ✅ |
| Interact | Yes | Yes ✅ |
| File Upload | Yes | Yes ✅ |
| Terminal | Yes | Yes ✅ |

Enjoy deploying Python smart contracts! 🚀

