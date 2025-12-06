# Quick Explanation: How main.py Becomes a Smart Contract

## The Simple Answer

**Your `main.py` file is deployed directly as a smart contract.**

When you run `python deploy_contract.py`:
1. It reads your Python functions from `main.py`
2. Automatically converts them to blockchain-compatible code (in memory)
3. Compiles and deploys to Kusama testnet
4. Your Python functions are now smart contract functions!

## What You See vs. What Happens

### What You See:
```bash
$ python deploy_contract.py
📖 Reading main.py...
✅ Found 1 function(s) in main.py
🔨 Preparing main.py for deployment...
🚀 Deploying main.py to Moonbase Alpha...
✅ main.py deployed at: 0x...
```

### What Happens Under the Hood:
1. Python AST parser extracts your functions
2. Converts Python → Solidity (internally)
3. Compiles Solidity → EVM bytecode
4. Deploys bytecode to blockchain

**You only write Python, but it runs as a smart contract!**

## Example

**Your code (`main.py`):**
```python
def add_numbers(a, b):
    return a + b
```

**What gets deployed:**
- A smart contract with `add_numbers(a, b)` function
- Callable from anywhere on the blockchain
- Stores results and emits events
- Full smart contract functionality

## Key Points

✅ Write Python, not Solidity  
✅ Automatic conversion (you don't see it)  
✅ Deploys to real blockchain (Kusama testnet)  
✅ Your functions work as smart contracts  

## One-Liner Explanation

> "Your Python code is automatically converted to Solidity and deployed to the blockchain - you only write Python, but it runs as a smart contract!"

