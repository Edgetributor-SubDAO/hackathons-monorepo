"""
Sample 3: Maximum and Minimum Operations
Find the larger or smaller of two numbers
"""

def max_numbers(a, b):
    """Return the maximum of two numbers"""
    if a > b:
        return a
    return b

def min_numbers(a, b):
    """Return the minimum of two numbers"""
    if a < b:
        return a
    return b

def main():
    print("Max and Min Operations")
    print(f"max(15, 8) = {max_numbers(15, 8)}")
    print(f"min(15, 8) = {min_numbers(15, 8)}")
    print(f"max(-5, -10) = {max_numbers(-5, -10)}")

if __name__ == "__main__":
    main()

