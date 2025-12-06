"""
Smart Contract 2: Token Transfer Calculator
Calculate token transfers and balances
"""

def transfer_tokens(sender_balance, transfer_amount):
    """
    Calculate new balance after transfer
    Returns remaining balance after transfer
    """
    return sender_balance - transfer_amount

def calculate_total(total_supply, burned_tokens):
    """
    Calculate circulating supply after token burn
    Returns remaining supply
    """
    return total_supply - burned_tokens

def main():
    print("Token Transfer Calculator")
    print("Use transfer_tokens to calculate balance after transfer")
    print("Use calculate_total to track token supply")

if __name__ == "__main__":
    main()

