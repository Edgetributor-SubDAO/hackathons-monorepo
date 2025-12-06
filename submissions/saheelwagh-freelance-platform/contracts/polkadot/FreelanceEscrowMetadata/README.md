# FreelanceEscrowMetadata Contract

Complete Polkadot metadata contract for PolkStellar freelance platform.

## Overview

This contract handles **all project metadata and workflow management** for PolkStellar:
- Project registration with full metadata (title, description, budget, deadline, etc.)
- Deliverable submission and tracking
- Milestone approval/rejection workflow
- Project status management
- Client and freelancer project lists

**Note:** Financial escrow is handled separately on Stellar (Soroban). This contract focuses purely on data and workflow.

## Features

### Write Operations
- `register_project()` - Create new project with metadata
- `submit_deliverable()` - Submit milestone deliverable
- `review_deliverable()` - Approve or reject deliverable
- `update_project_status()` - Change project status

### Read Operations
- `get_project()` - Get project by ID
- `get_deliverable()` - Get deliverable details
- `get_submitted_milestones()` - List submitted milestones
- `get_my_client_projects()` - Projects where caller is client
- `get_my_freelancer_projects()` - Projects where caller is freelancer
- `get_project_count()` - Total number of projects
- `get_milestone_status()` - Status of specific milestone

## Build Instructions

### Prerequisites
```bash
# Install cargo-contract
cargo install cargo-contract --force

# Verify installation
cargo contract --version
```

### Build Contract
```bash
cd contracts/polkadot/FreelanceEscrowMetadata

# Build for deployment
cargo contract build --release

# The compiled contract will be in:
# target/ink/freelance_escrow_metadata.contract
# target/ink/freelance_escrow_metadata.json (ABI)
```

### Run Tests
```bash
cargo test
```

## Deployment Instructions

### Option 1: Using Contracts UI (Recommended)

1. **Visit**: https://contracts-ui.substrate.io/

2. **Connect Network**:
   - Add custom network: `wss://testnet-passet-hub.polkadot.io`
   - Connect your SubWallet

3. **Upload Contract**:
   - Click "Add New Contract"
   - Upload `target/ink/freelance_escrow_metadata.contract`
   - Constructor: `new()`
   - Click "Deploy"

4. **Save Address**:
   - Copy the deployed contract address
   - Add to `frontend/.env`:
     ```
     VITE_POLKADOT_CONTRACT_ADDRESS=<your_contract_address>
     ```

### Option 2: Using pop-cli

```bash
# Deploy to Paseo testnet
pop up --url wss://testnet-passet-hub.polkadot.io

# Follow prompts:
# 1. Select the .contract file
# 2. Choose constructor: new()
# 3. Confirm deployment

# Save the contract address
```

## Integration with Frontend

After deployment:

1. **Copy ABI**:
   ```bash
   cp target/ink/freelance_escrow_metadata.json \
      ../../frontend/src/contracts/polkadot-abi.json
   ```

2. **Update .env**:
   ```env
   VITE_POLKADOT_CONTRACT_ADDRESS=<your_deployed_address>
   VITE_POLKADOT_RPC_URL=wss://testnet-passet-hub.polkadot.io
   ```

3. **Wire up hooks**:
   The `usePolkadotContracts.ts` hook is already structured to use these functions.
   Remove mock data and add real contract calls using `typink`.

## Contract Architecture

### Storage Layout
```
FreelanceEscrowMetadata {
    project_count: u64,
    projects: Mapping<u64, ProjectMetadata>,
    client_projects: Mapping<AccountId, Vec<u64>>,
    freelancer_projects: Mapping<AccountId, Vec<u64>>,
    deliverables: Mapping<(u64, u8), Deliverable>,
    submitted_milestones: Mapping<u64, Vec<u8>>,
}
```

### Data Structures

**ProjectMetadata**:
- project_id, title, description
- client, freelancer addresses
- budget, deadline, milestone_count
- status, created_at

**Deliverable**:
- project_id, milestone_id
- description, proof_url
- submitted_at, status
- reviewer_notes

**Enums**:
- `ProjectStatus`: Active | InProgress | Completed | Disputed | Cancelled
- `MilestoneStatus`: Pending | InReview | Approved | Rejected

## Usage Examples

### Register Project
```rust
contract.register_project(
    "Build Web App",
    "Create responsive web application",
    freelancer_address,
    5000, // budget in DOT (smallest unit)
    1704067200, // deadline timestamp
    3, // 3 milestones
)
```

### Submit Deliverable
```rust
contract.submit_deliverable(
    1, // project_id
    1, // milestone_id
    "Completed UI mockups",
    "ipfs://QmXyz123...",
)
```

### Review Deliverable
```rust
contract.review_deliverable(
    1, // project_id
    1, // milestone_id
    true, // approved
    Some("Great work!"),
)
```

## Events

The contract emits events for indexing:

- `ProjectRegistered` - New project created
- `DeliverableSubmitted` - Milestone submitted
- `DeliverableReviewed` - Approval/rejection

These can be indexed by a subquery or other indexer for analytics.

## Security Considerations

- **Authorization**: Only clients can review; only freelancers can submit
- **Validation**: Milestone IDs validated against project
- **No Double Submission**: Milestones can only be submitted once
- **Immutable Client**: Client address cannot be changed after creation

## Differences from Original Contracts

This new contract **replaces** both `ProjectRegistry` and `MilestoneManager` with:
- Combined storage for efficiency
- Full metadata support (not just counters)
- Complete CRUD operations
- Proper error handling
- Event emissions for all state changes
- Test coverage

## Next Steps

1. Build contract: `cargo contract build --release`
2. Deploy to Paseo testnet
3. Copy ABI to frontend
4. Update frontend hook to use real contract calls
5. Test end-to-end with SubWallet

## Support

If you encounter issues:
- Check contract is deployed correctly
- Verify RPC URL is accessible
- Ensure SubWallet is connected to Paseo testnet
- Check contract address in .env matches deployed address
