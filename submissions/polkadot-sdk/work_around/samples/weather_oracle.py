#!/usr/bin/env python3
"""
Weather Oracle - Fetches weather data from Open-Meteo API and updates smart contract
This runs off-chain and feeds weather data to your on-chain contract
"""

import os
import json
import requests
from web3 import Web3

# Try to load from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Moonbase Alpha RPC
MOONBASE_ALPHA_RPC = "https://rpc.api.moonbase.moonbeam.network"


def load_deployment(deployment_file='deployment.json'):
    """Load deployment information"""
    # Try current directory first
    if not os.path.exists(deployment_file):
        # Try parent directory
        parent_file = os.path.join('..', deployment_file)
        if os.path.exists(parent_file):
            deployment_file = parent_file
        else:
            raise FileNotFoundError(f"Error: {deployment_file} not found! Deploy the contract first.")
    
    with open(deployment_file, 'r') as f:
        deployment = json.load(f)
    
    return deployment['contract_address'], deployment['abi'], deployment.get('rpc_url', MOONBASE_ALPHA_RPC)


def fetch_weather_data(latitude=52.52, longitude=13.41):
    """
    Fetch weather data from Open-Meteo API
    Returns temperature and wind speed
    """
    api_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
    
    try:
        print(f"🌐 Fetching weather data from Open-Meteo API...")
        print(f"📍 Location: {latitude}, {longitude}")
        
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract current weather data
        current = data.get('current', {})
        temperature = current.get('temperature_2m', None)
        wind_speed = current.get('wind_speed_10m', None)
        
        if temperature is not None and wind_speed is not None:
            print(f"✅ Temperature: {temperature}°C")
            print(f"✅ Wind Speed: {wind_speed} km/h")
            return {
                'temperature': int(temperature * 10),  # Store as integer (tenths of degree)
                'wind_speed': int(wind_speed * 10),  # Store as integer (tenths of km/h)
                'raw_data': data
            }
        else:
            print("❌ Could not extract weather data from API response")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching weather data: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None


def update_contract_with_weather(contract_address, temperature, wind_speed):
    """
    Update smart contract with weather data from API
    """
    # Connect to network
    web3 = Web3(Web3.HTTPProvider(MOONBASE_ALPHA_RPC))
    if not web3.is_connected():
        raise ConnectionError("Failed to connect to network!")
    
    # Load contract
    contract_address, abi, rpc_url = load_deployment()
    contract = web3.eth.contract(address=contract_address, abi=abi)
    
    # Get account
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        print("\n❌ Error: PRIVATE_KEY environment variable not set!")
        print("\n💡 Set it using one of these methods:")
        print("   1. Export in terminal:")
        print("      export PRIVATE_KEY='your_private_key_here'")
        print("\n   2. Create a .env file in the project root:")
        print("      PRIVATE_KEY=your_private_key_here")
        print("\n   3. Run with inline variable:")
        print("      PRIVATE_KEY='your_key' python3 weather_oracle.py")
        raise ValueError("PRIVATE_KEY environment variable not set")
    
    account = web3.eth.account.from_key(private_key)
    
    # Get current temperature from contract (or use 0 if first update)
    try:
        current_temp = contract.functions.getLastResult().call()
    except:
        current_temp = 0
    
    print(f"\n📊 Current contract temperature: {current_temp / 10:.1f}°C")
    print(f"📊 New temperature from API: {temperature / 10:.1f}°C")
    
    # Calculate temperature change
    temp_change = temperature - current_temp
    
    try:
        # Get fresh nonce
        nonce = web3.eth.get_transaction_count(account.address, 'pending')
        
        # Update contract with temperature change
        print(f"\n📤 Updating contract with weather data...")
        txn = contract.functions.update_temperature(current_temp, temperature).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 100000,
            'gasPrice': web3.eth.gas_price,
            'chainId': web3.eth.chain_id
        })
        
        # Sign and send
        signed_txn = account.sign_transaction(txn)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"⏳ Transaction hash: {tx_hash.hex()}")
        
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"✅ Contract updated with weather data!")
        
        # Get updated result
        result = contract.functions.getLastResult().call()
        print(f"📊 New contract temperature: {result / 10:.1f}°C")
        
        return result
    except Exception as e:
        print(f"❌ Error updating contract: {e}")
        import traceback
        traceback.print_exc()
        raise


def main():
    """
    Weather oracle service that fetches data from Open-Meteo API and updates the contract
    """
    print("=" * 60)
    print("🌤️  Weather Oracle - Open-Meteo API to Blockchain")
    print("=" * 60)
    print()
    
    # Check if deployment.json exists
    deployment_file = 'deployment.json'
    if not os.path.exists(deployment_file):
        # Try looking in parent directory
        parent_deployment = os.path.join('..', 'deployment.json')
        if os.path.exists(parent_deployment):
            deployment_file = parent_deployment
        else:
            print("❌ Error: deployment.json not found!")
            print("\n💡 First deploy your weather contract:")
            print("   sdk-deploy-contract samples/contract8_weather_data.py")
            return
    
    # Load deployment
    try:
        contract_address, abi, rpc_url = load_deployment()
        print(f"📍 Contract: {contract_address}")
        print()
    except FileNotFoundError as e:
        print(f"❌ {e}")
        return
    
    # Fetch weather data from API
    weather_data = fetch_weather_data(latitude=52.52, longitude=13.41)
    
    if weather_data:
        # Update contract with temperature
        update_contract_with_weather(
            contract_address,
            weather_data['temperature'],
            weather_data['wind_speed']
        )
        
        print("\n" + "=" * 60)
        print("✅ Weather data successfully updated on-chain!")
        print("=" * 60)
        print("\n💡 To automate this, set up a cron job:")
        print("   */30 * * * * cd /path/to/project && python3 samples/weather_oracle.py")
    else:
        print("\n❌ Failed to fetch or update weather data")


if __name__ == "__main__":
    main()

