# How main.py Gets Deployed as a Smart Contract

## Simple Explanation (For Non-Technical Audience)

**Your `main.py` file is deployed directly as a smart contract on Kusama testnet.**

1. You write Python code in `main.py` (like `add_numbers(a, b)`)
2. You run `python deploy_contract.py`
3. Your Python code is automatically converted and deployed to the blockchain
4. Your functions are now available as smart contract functions on-chain

**That's it!** You don't need to write Solidity or Rust - just Python!

---

## Technical Explanation (For Developers)

### The Process

```
main.py (Python)
    ↓
deploy_contract.py reads and parses using Python AST
    ↓
Functions extracted (e.g., add_numbers, subtract_numbers)
    ↓
Automatic conversion to Solidity (happens in memory)
    ↓
Compiled to EVM bytecode
    ↓
Deployed to Moonbase Alpha (Kusama EVM testnet)
    ↓
✅ Your Python functions are now on-chain!
```

### Step-by-Step Breakdown

#### 1. **Reading main.py**
```python
# deploy_contract.py uses Python's AST (Abstract Syntax Tree) to parse main.py
tree = ast.parse(source_code)
# Extracts all function definitions
```

#### 2. **Function Extraction**
- Finds all `def function_name(...)` definitions
- Extracts function names and parameters
- Skips `main()` and `__main__` blocks (not needed on-chain)

#### 3. **Automatic Conversion**
Your Python function:
```python
def add_numbers(a, b):
    return a + b
```

Gets converted to Solidity (internally, not saved):
```solidity
function add_numbers(int256 a, int256 b) public returns (int256) {
    int256 result = a + b;
    lastResult = result;
    calculationCount++;
    emit CalculationPerformed(result);
    return result;
}
```

#### 4. **Compilation**
- Solidity code is compiled to EVM bytecode
- ABI (Application Binary Interface) is generated
- This happens automatically using `py-solc-x`

#### 5. **Deployment**
- Transaction is built, signed, and sent to Moonbase Alpha
- Contract address is returned
- Deployment info saved to `deployment.json`

### What Gets Added Automatically

The conversion adds smart contract features:

- **State Storage**: `lastResult`, `calculationCount`
- **Events**: `CalculationPerformed` event for each function call
- **View Functions**: `getLastResult()`, `getCalculationCount()`
- **Gas Optimization**: Proper gas estimation and limits

---

## How to Explain It to Others

### For Business/Non-Technical People

> "We've built a system that lets you write smart contracts in Python - the same language you use for regular programming. You just write your functions in `main.py`, run a deployment script, and your code is automatically converted and deployed to the Kusama blockchain. No need to learn Solidity or Rust!"

### For Developers

> "The deployment script uses Python's AST parser to extract functions from `main.py`, automatically converts them to Solidity equivalents, compiles to EVM bytecode, and deploys to Moonbase Alpha (Kusama's EVM-compatible testnet). The conversion happens in-memory, so you only see your Python code, but under the hood it's being compiled to blockchain-compatible bytecode."

### For Blockchain Developers

> "We've abstracted away the Solidity layer. The system parses Python AST, generates Solidity code programmatically, compiles using `py-solc-x`, and deploys via `web3.py` to Moonbase Alpha. The user only interacts with Python, but the contract runs as standard EVM bytecode on-chain."

---

## Key Points to Emphasize

1. ✅ **Python-first**: You write Python, not Solidity
2. ✅ **Automatic conversion**: Happens transparently
3. ✅ **No intermediate files**: Conversion is in-memory only
4. ✅ **Standard blockchain**: Deploys to real EVM-compatible chain
5. ✅ **Full functionality**: Your Python functions work as smart contracts

---

## Example: Your Current main.py

```python
def add_numbers(a, b):
    return a + b

def main():
    print(add_numbers(1, 2))
```

**What happens:**
- `add_numbers` → Deployed as smart contract function
- `main()` → Skipped (not needed on-chain)
- Result: `add_numbers(a, b)` is now callable on the blockchain!

---

## Architecture Diagram

```
┌─────────────┐
│   main.py   │  ← You write this
│  (Python)   │
└──────┬──────┘
       │
       │ deploy_contract.py reads
       ↓
┌──────────────────────┐
│  AST Parser          │  ← Extracts functions
│  (Python stdlib)     │
└──────┬───────────────┘
       │
       │ generate_solidity_contract()
       ↓
┌──────────────────────┐
│  Solidity Generator  │  ← Converts to Solidity
│  (In Memory)         │     (not saved to disk)
└──────┬───────────────┘
       │
       │ compile_source()
       ↓
┌──────────────────────┐
│  Solidity Compiler   │  ← Compiles to bytecode
│  (py-solc-x)         │
└──────┬───────────────┘
       │
       │ web3.py
       ↓
┌──────────────────────┐
│  Moonbase Alpha      │  ← Deployed here!
│  (Kusama Testnet)    │
└──────────────────────┘
```

---

## Comparison with Traditional Approach

### Traditional Way:
1. Write Solidity code
2. Compile Solidity
3. Deploy bytecode
4. Interact via web3

### Our Way:
1. Write Python code ✅
2. Run `python deploy_contract.py` ✅
3. Done! ✅

**You skip steps 1-3 of the traditional approach!**

---

## FAQ

**Q: Is this really Python on the blockchain?**  
A: Your Python code is converted to Solidity, which compiles to EVM bytecode. So it's Python → Solidity → Bytecode, but you only write Python.

**Q: Can I use all Python features?**  
A: Currently supports functions with basic operations. More complex features can be added to the converter.

**Q: Where is the contract deployed?**  
A: Moonbase Alpha (Kusama's EVM-compatible testnet). Can be changed to Moonriver (mainnet) or other EVM chains.

**Q: Is the Solidity code saved?**  
A: No, conversion happens in-memory only. Only `deployment.json` is saved for interaction.

**Q: How do I interact with my deployed contract?**  
A: Use `python interact.py` - it reads `deployment.json` and lets you call your functions.

---

## Summary

**In one sentence:** Your Python code in `main.py` is automatically converted to Solidity, compiled to EVM bytecode, and deployed to Kusama testnet - all while you only write Python!

