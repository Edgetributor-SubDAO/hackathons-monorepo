"""
Sample 5: Comprehensive Calculator
Multiple mathematical operations in one contract
"""

def add_numbers(a, b):
    """Add two numbers"""
    return a + b

def subtract_numbers(a, b):
    """Subtract b from a"""
    return a - b

def multiply_numbers(a, b):
    """Multiply two numbers"""
    return a * b

def divide_numbers(a, b):
    """Divide a by b"""
    return a / b

def main():
    print("Comprehensive Calculator")
    print(f"25 + 17 = {add_numbers(25, 17)}")
    print(f"25 - 17 = {subtract_numbers(25, 17)}")
    print(f"25 * 17 = {multiply_numbers(25, 17)}")
    print(f"25 / 5 = {divide_numbers(25, 5)}")

if __name__ == "__main__":
    main()

