"""
Smart Contract 1: Simple Voting System
Track votes for proposals or candidates
"""

def cast_vote(votes_for, votes_against):
    """
    Cast a vote - adds to for or against
    Returns total votes for the winning side
    """
    return votes_for + votes_against

def calculate_margin(votes_for, votes_against):
    """
    Calculate the margin between for and against votes
    Positive = for wins, Negative = against wins
    """
    return votes_for - votes_against

def main():
    print("Simple Voting System")
    print("Use cast_vote to record votes")
    print("Use calculate_margin to see the difference")

if __name__ == "__main__":
    main()

