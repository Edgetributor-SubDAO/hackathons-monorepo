"""
Smart Contract 4: Staking Rewards Calculator
Calculate staking rewards and yields
"""

def calculate_rewards(staked_amount, reward_rate):
    """
    Calculate staking rewards
    reward_rate is in basis points (e.g., 500 = 5%)
    Returns reward amount
    """
    return staked_amount * reward_rate

def compound_rewards(principal, interest):
    """
    Calculate compound interest/rewards
    Returns new total after adding interest
    """
    return principal + interest

def calculate_yield(total_staked, total_rewards):
    """
    Calculate yield percentage
    Returns yield amount
    """
    return total_rewards / total_staked

def main():
    print("Staking Rewards Calculator")
    print("Use calculate_rewards to compute staking rewards")
    print("Use compound_rewards for compound interest")
    print("Use calculate_yield to calculate yield percentage")

if __name__ == "__main__":
    main()

