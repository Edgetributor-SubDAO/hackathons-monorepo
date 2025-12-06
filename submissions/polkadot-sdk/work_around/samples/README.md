# Smart Contract Samples

Practical smart contract examples for real-world blockchain use cases.

## Contract Examples

### 1. contract1_simple_voting.py
**Use Case:** Voting system for DAOs, proposals, or elections

**Functions:**
- `cast_vote(votes_for, votes_against)` - Record votes and get total
- `calculate_margin(votes_for, votes_against)` - Calculate vote difference

**Example Usage:**
```bash
sdk-deploy-contract samples/contract1_simple_voting.py
sdk-interact
# Select cast_vote, enter: 150 (for), 100 (against)
# Result: 250 (total votes)
```

---

### 2. contract2_token_transfer.py
**Use Case:** Token transfer and supply management

**Functions:**
- `transfer_tokens(sender_balance, transfer_amount)` - Calculate balance after transfer
- `calculate_total(total_supply, burned_tokens)` - Track token supply after burns

**Example Usage:**
```bash
sdk-deploy-contract samples/contract2_token_transfer.py
sdk-interact
# Select transfer_tokens, enter: 1000 (balance), 250 (transfer)
# Result: 750 (remaining balance)
```

---

### 3. contract3_price_calculator.py
**Use Case:** Marketplace pricing, fees, and discounts

**Functions:**
- `calculate_price(base_price, quantity)` - Calculate total price
- `apply_discount(original_price, discount_amount)` - Apply discount
- `calculate_fee(transaction_amount, fee_percentage)` - Calculate fees

**Example Usage:**
```bash
sdk-deploy-contract samples/contract3_price_calculator.py
sdk-interact
# Select calculate_price, enter: 10 (price), 5 (quantity)
# Result: 50 (total)
```

---

### 4. contract4_staking_rewards.py
**Use Case:** Staking rewards and yield calculations

**Functions:**
- `calculate_rewards(staked_amount, reward_rate)` - Calculate staking rewards
- `compound_rewards(principal, interest)` - Compound interest calculation
- `calculate_yield(total_staked, total_rewards)` - Calculate yield

**Example Usage:**
```bash
sdk-deploy-contract samples/contract4_staking_rewards.py
sdk-interact
# Select calculate_rewards, enter: 10000 (staked), 500 (5% = 500 basis points)
# Result: 500000 (rewards in basis points representation)
```

---

### 5. contract5_escrow_calculator.py
**Use Case:** Escrow payments and multi-party transactions

**Functions:**
- `calculate_escrow_amount(purchase_price, escrow_fee)` - Total escrow needed
- `release_escrow(escrow_amount, fee_deduction)` - Calculate payout
- `split_payment(total_amount, recipient_share)` - Split payments

**Example Usage:**
```bash
sdk-deploy-contract samples/contract5_escrow_calculator.py
sdk-interact
# Select calculate_escrow_amount, enter: 1000 (price), 50 (fee)
# Result: 1050 (total escrow)
```

## Quick Start

1. **Set your private key:**
   ```bash
   export PRIVATE_KEY='your_private_key'
   ```

2. **Deploy a contract:**
   ```bash
   sdk-deploy-contract samples/contract1_simple_voting.py
   ```

3. **Interact with it:**
   ```bash
   sdk-interact
   ```

4. **Select function and enter parameters** when prompted

## Real-World Use Cases

### Voting System (contract1)
- DAO governance voting
- Proposal approval tracking
- Election vote counting

### Token Management (contract2)
- Token transfer validation
- Supply tracking
- Burn mechanism calculations

### Marketplace (contract3)
- Product pricing
- Fee calculations
- Discount applications

### Staking (contract4)
- Reward calculations
- Yield farming
- Compound interest

### Escrow (contract5)
- Secure payments
- Multi-party transactions
- Fee management

## Notes

- All functions require exactly 2 integer parameters
- Results are stored in the contract's `lastResult` state
- Use `getLastResult()` to view the last calculation
- Use `getCalculationCount()` to see total operations performed
- Make sure you have testnet tokens (DEV) for Moonbase Alpha

## Testing Tips

1. **Start Simple:** Test with contract1 (voting) first
2. **Check Results:** Always verify results match expected calculations
3. **Multiple Calls:** Try calling different functions in sequence
4. **View State:** Use helper functions to check contract state

## Example Session

```bash
$ sdk-deploy-contract samples/contract1_simple_voting.py
✅ Contract deployed at: 0x1234...

$ sdk-interact
Available actions:
1. Call cast_vote(votes_for, votes_against)
2. Call calculate_margin(votes_for, votes_against)
3. Get last result
4. Get calculation count
5. Exit

Select an action (1-5): 1
Enter votes_for: 150
Enter votes_against: 100
📤 Calling cast_vote(150, 100)...
✅ Transaction confirmed!
📊 Result: 250
```
