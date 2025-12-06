"""
Sample 4: Modulo and Remainder Operations
Calculate remainders and modulo operations
"""

def modulo_numbers(a, b):
    """Calculate a modulo b (remainder)"""
    return a % b

def multiply_numbers(a, b):
    """Simple multiplication"""
    return a * b

def main():
    print("Modulo Operations")
    print(f"17 % 5 = {modulo_numbers(17, 5)}")
    print(f"20 % 3 = {modulo_numbers(20, 3)}")
    print(f"100 % 7 = {modulo_numbers(100, 7)}")
    print(f"10 * 3 = {multiply_numbers(10, 3)}")

if __name__ == "__main__":
    main()

