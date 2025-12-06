# API Integration with Smart Contracts

## How It Works

**Important:** Smart contracts on EVM chains **cannot directly make HTTP API calls**. They run in an isolated environment. However, you can use **oracle patterns** to bring external data on-chain.

## Architecture

```
External API → Oracle Service (Off-chain) → Smart Contract (On-chain)
```

1. **Off-chain Oracle Service** (`oracle_client.py`) fetches data from APIs
2. **Oracle updates the contract** with the external data
3. **Contract stores and processes** the data on-chain

## Example Contracts

### contract6_price_oracle.py
Price oracle that stores and processes external price data.

**Functions:**
- `update_price(current_price, price_change)` - Update with API data
- `calculate_price_impact(base_price, impact_percentage)` - Calculate market impact
- `apply_exchange_rate(amount, exchange_rate)` - Currency conversion

### contract7_api_data_processor.py
Process external API data on-chain.

**Functions:**
- `process_api_response(data_value, multiplier)` - Process API data
- `aggregate_api_data(data_point_1, data_point_2)` - Aggregate multiple data points
- `calculate_api_delta(new_value, old_value)` - Calculate changes

## Setup

### 1. Deploy the Contract

```bash
sdk-deploy-contract samples/contract6_price_oracle.py
```

### 2. Run Oracle Client (Off-chain)

The oracle client fetches data from external APIs and updates your contract:

```bash
# Make sure you're in the project root
cd /path/to/polkadot-hackathon

# Install requests if needed
pip install requests

# Run the oracle client
python3 samples/oracle_client.py
```

## How to Use

### Manual Update (One-time)

```bash
# 1. Deploy contract
sdk-deploy-contract samples/contract6_price_oracle.py

# 2. Run oracle to fetch API data and update contract
python3 samples/oracle_client.py
```

### Automated Updates (Cron Job)

Set up a cron job to run the oracle periodically:

```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * cd /path/to/polkadot-hackathon && /usr/bin/python3 samples/oracle_client.py >> /tmp/oracle.log 2>&1
```

## Customizing the Oracle

Edit `samples/oracle_client.py` to:

1. **Change API endpoint:**
   ```python
   def fetch_price_from_api(symbol='ETH'):
       url = "https://your-api.com/endpoint"
       response = requests.get(url)
       # Parse and return data
   ```

2. **Use different contract function:**
   ```python
   # Instead of update_price, use your function
   contract.functions.your_function(param1, param2).build_transaction(...)
   ```

3. **Add multiple data sources:**
   ```python
   def fetch_multiple_apis():
       price = fetch_price_from_api('ETH')
       volume = fetch_volume_from_api('ETH')
       return price, volume
   ```

## Example Workflow

```bash
# Step 1: Deploy contract
$ sdk-deploy-contract samples/contract6_price_oracle.py
✅ Contract deployed at: 0x1234...

# Step 2: Run oracle (fetches API and updates contract)
$ python3 samples/oracle_client.py
📡 Fetching API data...
📊 Current value: 0
📊 API value: 250000  (ETH price: $2500.00)
📊 Delta: 250000
✅ Contract updated with API data!
📊 New contract value: 250000

# Step 3: Interact with updated contract
$ sdk-interact
# Select function to use the updated price data
```

## Real-World Use Cases

### 1. Price Feeds
- Fetch cryptocurrency prices from CoinGecko, CoinMarketCap
- Update DeFi protocols with current prices
- Trigger actions based on price thresholds

### 2. Weather Data
- Fetch weather data for insurance contracts
- Trigger payouts based on weather conditions
- Agricultural insurance based on rainfall

### 3. Sports Scores
- Fetch sports scores for prediction markets
- Settle bets automatically based on results
- Fantasy sports contracts

### 4. Random Numbers
- Fetch from random.org or similar
- Use for gaming, lottery, or random selection
- Provably fair randomness

## Limitations

1. **Trust in Oracle:** The oracle service is trusted - it controls what data goes on-chain
2. **Centralization:** Single oracle = single point of failure
3. **Cost:** Each update requires a transaction (gas fees)

## Solutions

### Use Decentralized Oracles
- **Chainlink:** Industry standard for decentralized oracles
- **Band Protocol:** Multi-chain oracle network
- **API3:** Decentralized API network

### Multiple Oracles
- Aggregate data from multiple sources
- Use median/average of multiple oracles
- Reduce single point of failure

## Example: Chainlink Integration

For production, use Chainlink oracles:

```solidity
// In your Solidity contract (advanced)
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface internal priceFeed;
    
    function getLatestPrice() public view returns (int) {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}
```

## Next Steps

1. Deploy `contract6_price_oracle.py`
2. Customize `oracle_client.py` for your API
3. Set up automated updates (cron job)
4. For production, consider Chainlink oracles

