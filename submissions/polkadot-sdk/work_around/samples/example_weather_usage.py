"""
Example: How to use Weather API with Smart Contracts

This shows the pattern - you CAN'T put API calls directly in the contract,
but you CAN use an oracle to feed API data to your contract.
"""

# ❌ THIS WON'T WORK IN A SMART CONTRACT:
# Smart contracts cannot make HTTP requests directly
# 
# def api_call():
#     api_url = "https://api.open-meteo.com/v1/forecast?..."
#     response = requests.get(api_url)  # ❌ Not possible in smart contracts
#     data = response.json()
#     return data

# ✅ INSTEAD, USE THIS PATTERN:

# Step 1: Create a contract that can STORE weather data
def update_temperature(current_temp, new_temp):
    """
    This function runs ON-CHAIN
    It receives data that was fetched OFF-CHAIN by the oracle
    """
    return current_temp + (new_temp - current_temp)

def calculate_temperature_change(old_temp, new_temp):
    """Calculate temperature change"""
    return new_temp - old_temp

# Step 2: Run the oracle OFF-CHAIN (weather_oracle.py)
# The oracle:
# - Fetches data from Open-Meteo API
# - Calls update_temperature() on your contract
# - Updates the contract with the API data

def main():
    print("Weather Smart Contract Example")
    print("\n❌ You CANNOT do this in a smart contract:")
    print("   - requests.get() - HTTP calls don't work")
    print("   - Any external API calls")
    print("\n✅ You CAN do this:")
    print("   1. Deploy this contract")
    print("   2. Run weather_oracle.py (off-chain)")
    print("   3. Oracle fetches API data and updates contract")
    print("\nSee WEATHER_SETUP.md for full instructions!")

if __name__ == "__main__":
    main()

