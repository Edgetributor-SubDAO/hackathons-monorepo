# Aspirine - Emergency Fund Release DAO

## Stellar x Polkadot Hackerhouse BLR Submission

---

## 📋 Project Overview

### What It Does
Aspirine is a decentralized autonomous organization (DAO) built on Soroban that enables hospitals to request emergency medical funds and allows DAO members to vote on funding proposals. It creates a transparent, blockchain-based emergency medical funding platform that connects hospitals in need with DAO members who can collectively vote to approve critical funding for patients requiring urgent care.

### The Problem It Solves
- **Delayed Medical Funding**: Traditional medical funding processes are slow and bureaucratic, causing delays in critical care
- **Lack of Transparency**: Opaque funding decisions and unclear allocation of emergency medical resources
- **Limited Access**: Patients in emergencies often struggle to access immediate financial support
- **Trust Issues**: Donors and funders lack visibility into how emergency medical funds are utilized

### Key Features
- **Decentralized Governance**: Community-driven decision making through DAO voting
- **Transparent Funding**: All proposals and votes are recorded on the blockchain
- **Emergency Response**: Quick proposal submission and voting mechanism for urgent medical needs
- **Configurable Thresholds**: Flexible voting requirements (0-100% approval)
- **Treasury Management**: Secure fund management and transparent execution
- **Member Verification**: Only authorized DAO members can vote on proposals
- **Comprehensive Tracking**: Full proposal lifecycle from submission to execution

---

## 👥 Team Information

**Team Name:** Aspirine

**Team Members:**
- **Deepesh Singh Rathore** - [@deepesh-sr](https://github.com/deepesh-sr)
  - Role: Full-stack Developer & Smart Contract Engineer
  - Responsibilities: Smart contract development, frontend integration, wallet connectivity, deployment

---

## 🔧 Technical Details

### Technologies, Frameworks, and Tools Used

**Blockchain & Smart Contracts:**
- **Stellar Blockchain** - Testnet deployment
- **Soroban Smart Contracts** - Contract runtime environment
- **Rust** - Smart contract programming language
- **Soroban SDK v23.2.1** - Smart contract development framework
- **Stellar XDR v23.0.0** - Data serialization

**Frontend:**
- **Astro** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **Stellar Wallets Kit** - Wallet integration library
- **Freighter Wallet** - Stellar wallet for authentication

**Development Tools:**
- **Cargo** - Rust package manager and build system
- **Soroban CLI** - Command-line tools for deployment and testing
- **Node.js & npm** - JavaScript runtime and package management

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Astro)                      │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Connect Wallet │  │  Initialize  │  │  DAO Actions  │  │
│  │   Component     │  │  DAO Page    │  │   Interface   │  │
│  └────────┬────────┘  └──────┬───────┘  └───────┬───────┘  │
│           │                  │                   │           │
│           └──────────────────┴───────────────────┘           │
│                              │                               │
│                    ┌─────────▼──────────┐                    │
│                    │ Stellar Wallets Kit │                    │
│                    │  (Freighter Auth)   │                    │
│                    └─────────┬──────────┘                    │
└──────────────────────────────┼────────────────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Stellar Network    │
                    │      (Testnet)       │
                    └──────────┬───────────┘
                               │
              ┌────────────────▼─────────────────┐
              │    Soroban Smart Contract        │
              │  (Emergency Fund Release DAO)    │
              │                                  │
              │  ┌───────────────────────────┐  │
              │  │  Admin Functions          │  │
              │  │  - initialize            │  │
              │  │  - add_member            │  │
              │  │  - add_funds             │  │
              │  └───────────────────────────┘  │
              │                                  │
              │  ┌───────────────────────────┐  │
              │  │  Hospital Functions       │  │
              │  │  - submit_proposal        │  │
              │  └───────────────────────────┘  │
              │                                  │
              │  ┌───────────────────────────┐  │
              │  │  Member Functions         │  │
              │  │  - vote                   │  │
              │  │  - finalize_proposal      │  │
              │  │  - execute_proposal       │  │
              │  └───────────────────────────┘  │
              │                                  │
              │  ┌───────────────────────────┐  │
              │  │  Query Functions          │  │
              │  │  - get_proposal           │  │
              │  │  - get_treasury_balance   │  │
              │  │  - is_member              │  │
              │  └───────────────────────────┘  │
              └──────────────────────────────────┘
```

### Smart Contracts

**Main Contract: Emergency Fund Release DAO**
- **Contract Address (Testnet):** `CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4`
- **Explorer Link:** https://stellar.expert/explorer/testnet/contract/CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4

**Contract Workflow:**
1. **Hospitals** can submit proposals for patients needing emergency medical funds
2. **DAO Members** can vote to approve or reject funding requests
3. **Approved proposals** can be executed to release funds from the DAO treasury

**Key Components:**

*Admin Functions:*
- `initialize` - Set up DAO with admin and voting threshold
- `add_member` - Grant voting rights to new members
- `add_funds` - Add tokens to the DAO treasury

*Hospital Functions:*
- `submit_proposal` - Create emergency funding requests with patient details

*Member Functions:*
- `vote` - Cast approval or rejection votes on proposals
- `finalize_proposal` - Close voting and determine approval status
- `execute_proposal` - Release funds for approved proposals

*Query Functions:*
- `get_proposal` - Retrieve proposal details
- `get_treasury_balance` - Check available funds
- `is_member` - Verify voting rights
- `has_voted` - Check if member voted on a proposal
- `get_voting_threshold` - Get required approval percentage

---

## 🚀 Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

- **Rust** (latest stable version)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- **Soroban CLI**
  ```bash
  cargo install --locked soroban-cli
  ```
- **Node.js** (v18 or higher) and **npm**
  ```bash
  # Install via nvm (recommended)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  ```
- **Freighter Wallet** browser extension for Stellar
  - [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Aspirine
   ```

2. **Smart Contract Setup**
   ```bash
   cd soroban-hello-world/contracts/hello-world
   
   # Install dependencies and build the contract
   make build
   
   # Run tests to verify everything works
   make test
   ```

3. **Frontend Setup**
   ```bash
   cd ../../../aspirineFrontend
   
   # Install dependencies
   npm install
   ```

### How to Run the Project

**Running the Smart Contract Tests:**
```bash
cd soroban-hello-world/contracts/hello-world
cargo test
```

**Running the Frontend:**
```bash
cd aspirineFrontend
npm run dev
```

The frontend will be available at `http://localhost:4321`

**Building for Production:**
```bash
# Smart Contract
cd soroban-hello-world/contracts/hello-world
make build

# Frontend
cd aspirineFrontend
npm run build
```

### Environment Variables or Configuration Needed

**For Smart Contract Deployment:**

Create a `.env` file in `soroban-hello-world/contracts/hello-world/`:
```env
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ADMIN_SECRET_KEY=<your-stellar-secret-key>
```

**For Frontend:**

The frontend uses Freighter wallet for authentication, so no environment variables are required. However, ensure:
- Freighter wallet extension is installed
- Wallet is configured for Stellar Testnet
- You have testnet XLM for transaction fees (get from [Stellar Laboratory](https://laboratory.stellar.org/#account-creator))

**Manual Deployment (Optional):**
```bash
cd soroban-hello-world/contracts/hello-world

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hello_world.wasm \
  --source <YOUR_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

---

## 🎥 Demo & Links

### Live Demo URL
*Frontend deployment coming soon*

### Video Demo Link
*Video demonstration coming soon*

### Screenshots & Diagrams

**DAO Initialization Flow:**
```
Admin → Initialize DAO → Set Voting Threshold → Add Members → Add Treasury Funds
```

**Proposal Lifecycle:**
```
Hospital → Submit Proposal → Members Vote → Finalize Voting → Execute (if approved) → Funds Released
```

### Deployed Contract Addresses

- **Network:** Stellar Testnet
- **Contract ID:** `CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4`
- **Explorer:** https://stellar.expert/explorer/testnet/contract/CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4

---

## 📊 Core Functionality & Features

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

### Testing

The contract includes comprehensive test coverage:

- ✅ DAO initialization and configuration
- ✅ Member management and authorization
- ✅ Treasury operations and fund tracking
- ✅ Proposal submission and validation
- ✅ Voting mechanism and vote counting
- ✅ Approval/rejection logic with thresholds
- ✅ Proposal execution and fund distribution
- ✅ Error cases (double voting, insufficient funds, unauthorized access)
- ✅ Complete end-to-end workflow scenarios

**Run Tests:**
```bash
cd soroban-hello-world/contracts/hello-world
cargo test
```

### Security Features

1. **Authentication**: All sensitive operations require caller authentication
2. **Authorization**: Admin-only functions for member management
3. **Vote Validation**: Members can only vote once per proposal
4. **Status Protection**: Executed proposals cannot be modified
5. **Fund Verification**: Execution fails if treasury has insufficient funds
6. **Threshold Enforcement**: Configurable voting threshold (0-100%)
7. **Minimum Votes**: Requires at least 3 votes before finalization

---

## 📂 Repository Structure

```
Aspirine/
├── README.md                                # Project documentation
├── aspirineFrontend/                        # Frontend application
│   ├── astro.config.mjs                    # Astro configuration
│   ├── package.json                        # Frontend dependencies
│   ├── tsconfig.json                       # TypeScript config
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectWallet.astro        # Wallet connection UI
│   │   │   ├── InitializeDAO.astro        # DAO initialization
│   │   │   └── Welcome.astro               # Landing page component
│   │   ├── layouts/
│   │   │   └── Layout.astro               # Base layout
│   │   ├── pages/
│   │   │   ├── index.astro                # Home page
│   │   │   ├── dao.astro                  # DAO interface
│   │   │   └── debug.astro                # Debug utilities
│   │   └── stellar-wallets-kit.ts         # Wallet integration
│   └── public/
│       └── favicon.svg
├── soroban-hello-world/                     # Smart contract project
│   ├── Cargo.toml                          # Workspace configuration
│   ├── Cargo.lock                          # Dependency lock file
│   └── contracts/
│       └── hello-world/
│           ├── Cargo.toml                  # Contract dependencies
│           ├── Makefile                    # Build automation
│           ├── DAO_README.md              # Contract documentation
│           ├── MOCK_DATA.md               # Test data examples
│           ├── TEST_OUTPUT.md             # Test results
│           └── src/
│               ├── lib.rs                  # Main contract logic (900+ lines)
│               └── test.rs                 # Comprehensive test suite
└── target/                                  # Build artifacts
```

---

## 💡 Additional Information

### Challenges Faced

1. **Wallet Integration Complexity**
   - **Challenge:** Integrating Freighter wallet with Astro framework required custom TypeScript handling
   - **Solution:** Created custom wallet integration layer using Stellar Wallets Kit, documented in `FREIGHTER_DETECTION_FIX.md`

2. **Soroban SDK Learning Curve**
   - **Challenge:** Soroban smart contract development patterns differ significantly from Ethereum/Solidity
   - **Solution:** Extensive testing and iteration, comprehensive test suite to validate contract behavior

3. **State Management on Blockchain**
   - **Challenge:** Efficient storage and retrieval of proposal data, votes, and member lists
   - **Solution:** Utilized Soroban's storage primitives with optimized data structures

4. **Vote Counting Logic**
   - **Challenge:** Ensuring accurate vote tallying with configurable thresholds and preventing double voting
   - **Solution:** Implemented vote tracking per member per proposal with validation checks

5. **Frontend-Contract Communication**
   - **Challenge:** Seamless interaction between Astro frontend and Soroban contract
   - **Solution:** Built TypeScript wrappers for contract invocations with proper error handling

### Future Improvements

**Short-term Enhancements:**
- 🔄 Token integration for actual XLM/token fund transfers
- ⏰ Time-based voting deadlines for proposals
- 💬 Proposal comments and discussion threads
- 📧 Notification system for new proposals and voting results
- 📱 Mobile-responsive UI improvements

**Medium-term Enhancements:**
- 🏆 Weighted voting based on member stake or reputation
- ✏️ Proposal amendments before finalization
- 🚨 Emergency fast-track mechanism for critical cases
- 🔐 Multi-signature execution for high-value proposals
- 📊 Analytics dashboard for DAO metrics

**Long-term Vision:**
- 🌐 Multi-chain expansion (integration with Polkadot)
- 🤖 AI-powered proposal risk assessment
- 🏥 Hospital verification and credentialing system
- 📜 Integration with real-world medical records (privacy-preserving)
- 🌍 International medical emergency fund network
- 💰 Automated insurance claim processing
- 🔗 Partnership with medical institutions and NGOs

### Use Cases Beyond Emergency Medical Funding

- **Disaster Relief**: Rapid fund distribution for natural disasters
- **Community Support**: General emergency community funding
- **Transparent Donations**: Donor-managed charitable distributions
- **Educational Grants**: Community-voted scholarship programs
- **Research Funding**: Decentralized research grant allocation

### Lessons Learned

- **Blockchain Transparency**: The immutable nature of blockchain provides unparalleled transparency for fund allocation
- **Community Governance**: DAO mechanisms enable fair, democratic decision-making for critical financial decisions
- **Smart Contract Security**: Comprehensive testing and security measures are essential for financial applications
- **User Experience**: Wallet integration must be seamless to encourage adoption in real-world scenarios

### Project Context

This project was built during the **Stellar x Polkadot Hackerhouse in Bangalore (December 2025)**. The goal is to provide a transparent, decentralized solution for emergency medical funding, ensuring that critical healthcare needs can be addressed through community governance without bureaucratic delays.

The smart contract includes robust security features, comprehensive voting mechanisms, and thorough error handling to ensure safe and fair distribution of emergency funds. All code is open-source and ready for community auditing and improvement.

### Acknowledgments

- **Stellar Development Foundation** for the Soroban platform
- **Stellar x Polkadot Hackerhouse** organizers and mentors
- **Freighter Wallet** team for wallet infrastructure
- **Astro** team for the excellent web framework

---

## 📄 License

This is a demonstration smart contract built for the Stellar x Polkadot Hackerhouse BLR.

MIT License - feel free to use, modify, and distribute with attribution.

---

## 🔗 Links & Resources

- **Contract Explorer:** https://stellar.expert/explorer/testnet/contract/CBTSF6TETTKFJFBAP4LEARDV2LRON6T2V3ZCM75OKVWUMLVJT43M32Q4
- **Stellar Documentation:** https://developers.stellar.org/
- **Soroban Docs:** https://soroban.stellar.org/docs
- **Freighter Wallet:** https://www.freighter.app/

---

**Built with ❤️ for the Stellar x Polkadot Hackerhouse BLR**
