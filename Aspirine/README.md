# Emergency Fund Release DAO

A decentralized autonomous organization (DAO) built on Soroban that enables hospitals to request emergency medical funds and allows DAO members to vote on funding proposals.

# Contract Testnet Deolpoyed Link

https://stellar.expert/explorer/testnet/contract/CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4

## Overview

This smart contract implements a voting system where:
1. **Hospitals** can submit proposals for patients needing emergency medical funds
2. **DAO Members** can vote to approve or reject funding requests
3. **Approved proposals** can be executed to release funds from the DAO treasury

## Features

### Core Functionality

- **DAO Initialization**: Set up the DAO with an admin and voting threshold
- **Member Management**: Admin can add members who have voting rights
- **Treasury Management**: Track and manage DAO funds
- **Proposal Submission**: Hospitals submit detailed funding requests
- **Voting System**: Members vote on proposals with configurable thresholds
- **Proposal Execution**: Release funds for approved proposals

### Data Structures

#### Proposal
```rust
pub struct Proposal {
    pub id: u64,
    pub hospital: Address,
    pub patient_name: String,
    pub patient_details: String,
    pub amount_requested: i128,
    pub votes_for: u32,
    pub votes_against: u32,
    pub status: ProposalStatus,
    pub created_at: u64,
}
```

#### ProposalStatus
- **Active**: Proposal is open for voting
- **Approved**: Proposal has met the voting threshold
- **Rejected**: Proposal did not meet the threshold
- **Executed**: Funds have been released

## Contract Functions

### Admin Functions

#### `initialize(admin: Address, voting_threshold: u32)`
Initialize the DAO with an admin address and voting threshold percentage (0-100).

**Example**: `initialize(admin_address, 66)` - requires 66% approval

#### `add_member(admin: Address, member: Address)`
Add a new member to the DAO (admin only).

#### `add_funds(amount: i128)`
Add funds to the DAO treasury.

### Hospital Functions

#### `submit_proposal(hospital: Address, patient_name: String, patient_details: String, amount_requested: i128) -> u64`
Submit a new emergency funding proposal. Returns the proposal ID.

**Example**:
```rust
let proposal_id = client.submit_proposal(
    &hospital_address,
    &String::from_str(&env, "John Doe"),
    &String::from_str(&env, "Emergency heart surgery required"),
    &5000,
);
```

### Member Functions

#### `vote(voter: Address, proposal_id: u64, approve: bool)`
Vote on a proposal (members only). Each member can vote once per proposal.
- `approve: true` - Vote in favor
- `approve: false` - Vote against

#### `finalize_proposal(proposal_id: u64)`
Finalize voting on a proposal to determine if it's approved or rejected.
Requires minimum 3 votes.

### Execution Functions

#### `execute_proposal(proposal_id: u64)`
Execute an approved proposal and release funds from the treasury.

### Query Functions

#### `get_proposal(proposal_id: u64) -> Proposal`
Retrieve full details of a proposal.

#### `get_proposal_count() -> u64`
Get the total number of proposals submitted.

#### `get_treasury_balance() -> i128`
Get current balance of the DAO treasury.

#### `is_member(address: Address) -> bool`
Check if an address is a DAO member.

#### `has_voted(proposal_id: u64, voter: Address) -> bool`
Check if a member has voted on a specific proposal.

#### `get_voting_threshold() -> u32`
Get the voting threshold percentage.

## Workflow Example

### 1. Setup DAO
```rust
// Initialize with 75% approval threshold
client.initialize(&admin, &75);

// Add funds to treasury
client.add_funds(&50000);

// Add members
client.add_member(&admin, &member1);
client.add_member(&admin, &member2);
client.add_member(&admin, &member3);
client.add_member(&admin, &member4);
```

### 2. Hospital Submits Proposal
```rust
let proposal_id = client.submit_proposal(
    &hospital,
    &String::from_str(&env, "Alice Johnson"),
    &String::from_str(&env, "Heart transplant - urgent"),
    &15000,
);
```

### 3. Members Vote
```rust
client.vote(&member1, &proposal_id, &true);   // Approve
client.vote(&member2, &proposal_id, &true);   // Approve
client.vote(&member3, &proposal_id, &true);   // Approve
client.vote(&member4, &proposal_id, &false);  // Reject

// 75% approval (3 out of 4)
```

### 4. Finalize Voting
```rust
client.finalize_proposal(&proposal_id);
// Status changes to Approved
```

### 5. Execute Proposal
```rust
client.execute_proposal(&proposal_id);
// Funds released from treasury
// Status changes to Executed
```

## Testing

The contract includes comprehensive tests covering:

- ✅ DAO initialization
- ✅ Member management
- ✅ Treasury operations
- ✅ Proposal submission
- ✅ Voting mechanism
- ✅ Approval/rejection logic
- ✅ Proposal execution
- ✅ Error cases (double voting, insufficient funds, etc.)
- ✅ Complete end-to-end workflow

Run tests with:
```bash
cargo test
```

## Security Features

1. **Authentication**: All sensitive operations require caller authentication
2. **Authorization**: Admin-only functions for member management
3. **Vote Validation**: Members can only vote once per proposal
4. **Status Protection**: Executed proposals cannot be modified
5. **Fund Verification**: Execution fails if treasury has insufficient funds
6. **Threshold Enforcement**: Configurable voting threshold (0-100%)
7. **Minimum Votes**: Requires at least 3 votes before finalization

## Use Cases

- **Emergency Medical Funding**: Primary use case for urgent medical expenses
- **Disaster Relief**: Can be adapted for emergency disaster relief funds
- **Community Support**: General community emergency funding
- **Transparent Donations**: Donor-managed charitable distributions

## Future Enhancements

Potential improvements:
- Token integration for actual fund transfers
- Time-based voting deadlines
- Weighted voting based on stake
- Proposal amendments
- Emergency fast-track mechanism
- Multi-signature execution
- Proposal comments/discussion
- Historical analytics

## Development

Built with:
- **Soroban SDK v23.2.1**
- **Rust Edition 2021**
- **Stellar XDR v23.0.0**

## License

This is a demonstration smart contract for educational purposes.
