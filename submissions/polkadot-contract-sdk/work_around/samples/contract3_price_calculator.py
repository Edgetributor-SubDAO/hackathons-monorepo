"""
Smart Contract 3: Price Calculator
Calculate prices, fees, and discounts for marketplace
"""

def calculate_price(base_price, quantity):
    """
    Calculate total price for quantity of items
    Returns total cost
    """
    return base_price * quantity

def apply_discount(original_price, discount_amount):
    """
    Apply discount to original price
    Returns final price after discount
    """
    return original_price - discount_amount

def calculate_fee(transaction_amount, fee_percentage):
    """
    Calculate fee on transaction
    fee_percentage should be in basis points (e.g., 250 = 2.5%)
    Returns fee amount
    """
    return transaction_amount * fee_percentage

def main():
    print("Price Calculator")
    print("Use calculate_price for total cost")
    print("Use apply_discount for discounted prices")
    print("Use calculate_fee for transaction fees")

if __name__ == "__main__":
    main()

