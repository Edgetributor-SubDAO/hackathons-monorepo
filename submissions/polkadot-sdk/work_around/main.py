"""
Smart Contract 9: HTTP API Caller (Client-Side WASM)
This contract uses WASM + IPFS deployment
HTTP calls happen CLIENT-SIDE, not on-chain
"""

import requests

def fetch_weather_api(latitude, longitude):
    """
    Fetch weather data from Open-Meteo API
    This runs CLIENT-SIDE in WASM, not on-chain!
    Returns temperature (scaled by 10 for integer storage)
    """
    api_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m"
    
    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        temperature = data.get('current', {}).get('temperature_2m', 0)
        # Return as integer (multiply by 10 to preserve decimals)
        return int(temperature * 10)
    except Exception as e:
        print(f"API Error: {e}")
        return 0

def process_api_data(api_value, multiplier):
    """
    Process data from API call
    Returns processed value
    """
    return api_value * multiplier

def aggregate_api_results(result1, result2):
    """
    Aggregate multiple API call results
    Returns combined result
    """
    return result1 + result2

def main():
    print("HTTP API Contract (Client-Side WASM)")
    print("HTTP calls happen CLIENT-SIDE, not on-chain")
    print("Deploy using: python deploy_wasm.py")

if __name__ == "__main__":
    main()

