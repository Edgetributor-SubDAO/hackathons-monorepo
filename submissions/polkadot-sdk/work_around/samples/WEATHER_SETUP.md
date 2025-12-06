# Weather API Smart Contract Setup

## How It Works

Smart contracts **cannot make HTTP API calls directly**. Instead, we use an **oracle pattern**:

1. **Off-chain Oracle** (`weather_oracle.py`) fetches data from Open-Meteo API
2. **Oracle updates the contract** with weather data
3. **Contract stores and processes** the weather data on-chain

## Quick Start

### Step 1: Deploy the Weather Contract

```bash
sdk-deploy-contract samples/contract8_weather_data.py
```

This creates `deployment.json` with your contract address.

### Step 2: Set Your Private Key

```bash
export PRIVATE_KEY='your_private_key_here'
```

### Step 3: Run the Weather Oracle

The oracle fetches weather data and updates your contract:

```bash
python3 samples/weather_oracle.py
```

## Example Output

```
🌤️  Weather Oracle - Open-Meteo API to Blockchain
============================================================

📍 Contract: 0x1234...

🌐 Fetching weather data from Open-Meteo API...
📍 Location: 52.52, 13.41
✅ Temperature: 15.3°C
✅ Wind Speed: 12.5 km/h

📊 Current contract temperature: 0.0°C
📊 New temperature from API: 15.3°C

📤 Updating contract with weather data...
⏳ Transaction hash: 0xabcd...
✅ Contract updated with weather data!
📊 New contract temperature: 15.3°C

✅ Weather data successfully updated on-chain!
```

## Interact with Weather Data

After updating, interact with your contract:

```bash
sdk-interact
```

Available functions:
- `update_temperature` - Update temperature
- `calculate_temperature_change` - Calculate temperature delta
- `process_wind_speed` - Process wind speed
- `calculate_weather_index` - Calculate comfort index

## Customize Location

Edit `weather_oracle.py` to change the location:

```python
# Change latitude and longitude
weather_data = fetch_weather_data(
    latitude=40.7128,  # New York
    longitude=-74.0060
)
```

Or make it dynamic:

```python
import sys

if len(sys.argv) >= 3:
    lat = float(sys.argv[1])
    lon = float(sys.argv[2])
    weather_data = fetch_weather_data(lat, lon)
else:
    weather_data = fetch_weather_data()  # Default: Berlin
```

Then run:
```bash
python3 samples/weather_oracle.py 40.7128 -74.0060  # New York
```

## Automate Updates

Set up a cron job to update weather data automatically:

```bash
# Edit crontab
crontab -e

# Update every 30 minutes
*/30 * * * * cd /path/to/polkadot-hackathon && /usr/bin/python3 samples/weather_oracle.py >> /tmp/weather_oracle.log 2>&1

# Update every hour
0 * * * * cd /path/to/polkadot-hackathon && /usr/bin/python3 samples/weather_oracle.py >> /tmp/weather_oracle.log 2>&1
```

## Use Cases

### 1. Weather Insurance
- Trigger payouts based on weather conditions
- Agricultural insurance for crops
- Event cancellation insurance

### 2. Weather-Based DeFi
- Interest rates based on weather
- Weather derivatives
- Climate risk assessment

### 3. IoT Integration
- Combine with IoT sensor data
- Verify sensor readings with API data
- Decentralized weather network

## Understanding the Flow

```
┌─────────────────┐
│  Open-Meteo    │
│      API       │
└────────┬───────┘
         │
         │ HTTP Request
         ▼
┌─────────────────┐
│ Weather Oracle  │  ← Runs off-chain
│ (Python Script) │
└────────┬───────┘
         │
         │ Blockchain Transaction
         ▼
┌─────────────────┐
│ Smart Contract  │  ← Stores data on-chain
│  (On-chain)     │
└─────────────────┘
```

## Troubleshooting

### "deployment.json not found"
Deploy the contract first:
```bash
sdk-deploy-contract samples/contract8_weather_data.py
```

### "PRIVATE_KEY not set"
```bash
export PRIVATE_KEY='your_private_key'
```

### API errors
- Check internet connection
- Verify Open-Meteo API is accessible
- Check API rate limits

### Contract update fails
- Ensure you have testnet tokens (DEV)
- Check gas prices
- Verify contract address is correct

## Next Steps

1. ✅ Deploy `contract8_weather_data.py`
2. ✅ Run `weather_oracle.py` to fetch and update
3. ✅ Set up automation (cron job)
4. 🔄 Customize for your use case
5. 🚀 Consider Chainlink for production

