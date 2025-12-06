"""
Smart Contract 5: Escrow Payment Calculator
Calculate escrow amounts, fees, and payouts
"""

def calculate_escrow_amount(purchase_price, escrow_fee):
    """
    Calculate total amount needed for escrow
    Returns total escrow amount
    """
    return purchase_price + escrow_fee

def release_escrow(escrow_amount, fee_deduction):
    """
    Calculate amount to release after fee deduction
    Returns payout amount
    """
    return escrow_amount - fee_deduction

def split_payment(total_amount, recipient_share):
    """
    Split payment between parties
    recipient_share is the percentage for recipient (e.g., 70 = 70%)
    Returns recipient's portion
    """
    return total_amount * recipient_share

def main():
    print("Escrow Payment Calculator")
    print("Use calculate_escrow_amount for total escrow")
    print("Use release_escrow to calculate payout")
    print("Use split_payment to divide payments")

if __name__ == "__main__":
    main()

