"""
Sample 1: Basic Arithmetic Operations
Simple addition, subtraction, multiplication, and division
"""

def add_numbers(a, b):
    return a + b

def subtract_numbers(a, b):
    return a - b

def multiply_numbers(a, b):
    return a * b

def divide_numbers(a, b):
    return a / b

def main():
    print("Basic Arithmetic Operations")
    print(f"10 + 5 = {add_numbers(10, 5)}")
    print(f"10 - 5 = {subtract_numbers(10, 5)}")
    print(f"10 * 5 = {multiply_numbers(10, 5)}")
    print(f"10 / 5 = {divide_numbers(10, 5)}")

if __name__ == "__main__":
    main()

