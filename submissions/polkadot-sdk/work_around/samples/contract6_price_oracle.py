"""
Smart Contract 6: Price Oracle
Store and calculate with external price data (fed by oracles/API)
"""

def update_price(current_price, price_change):
    """
    Update price based on external data from API/oracle
    price_change can be positive (increase) or negative (decrease)
    Returns new price
    """
    return current_price + price_change

def calculate_price_impact(base_price, impact_percentage):
    """
    Calculate price impact from external market data
    impact_percentage is in basis points (e.g., 100 = 1%)
    Returns adjusted price
    """
    return base_price * impact_percentage

def apply_exchange_rate(amount, exchange_rate):
    """
    Apply exchange rate from external API/oracle
    Returns converted amount
    """
    return amount * exchange_rate

def main():
    print("Price Oracle Contract")
    print("Use update_price to update with external data")
    print("Use calculate_price_impact for market impact")
    print("Use apply_exchange_rate for currency conversion")

if __name__ == "__main__":
    main()

