"""
Sample 2: Power and Exponentiation
Calculate powers and square roots
"""

def power_numbers(a, b):
    """Calculate a raised to the power of b"""
    return a ** b

def multiply_numbers(a, b):
    """Simple multiplication for testing"""
    return a * b

def main():
    print("Power Operations")
    print(f"2 ^ 8 = {power_numbers(2, 8)}")
    print(f"5 ^ 3 = {power_numbers(5, 3)}")
    print(f"10 * 4 = {multiply_numbers(10, 4)}")

if __name__ == "__main__":
    main()

