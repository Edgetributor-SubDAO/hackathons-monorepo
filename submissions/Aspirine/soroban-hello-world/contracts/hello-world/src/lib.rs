#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Address, String};

// Data structures for the Emergency Fund Release DAO

#[derive(Clone)]
#[contracttype]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Executed,
}

#[derive(Clone)]
#[contracttype]
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

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    ProposalCount,
    Proposal(u64),
    Vote(u64, Address),       // (proposal_id, voter_address)
    VotingThreshold,
    Treasury,
    DAOMember(Address),
    AuthorizedHospital,       // Single authorized hospital address
}

#[contract]
pub struct EmergencyFundDAO;

#[contractimpl]
impl EmergencyFundDAO {
    /// Initialize the DAO with an admin, voting threshold, and authorized hospital
    /// voting_threshold: minimum percentage of votes needed to approve (0-100)
    /// authorized_hospital: the single hospital address allowed to submit proposals
    pub fn initialize(env: Env, admin: Address, voting_threshold: u32, authorized_hospital: Address) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("DAO already initialized");
        }
        
        // Validate threshold
        if voting_threshold > 100 {
            panic!("Voting threshold must be between 0 and 100");
        }
        
        // Store admin and settings
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VotingThreshold, &voting_threshold);
        env.storage().instance().set(&DataKey::ProposalCount, &0u64);
        env.storage().instance().set(&DataKey::Treasury, &0i128);
        env.storage().instance().set(&DataKey::AuthorizedHospital, &authorized_hospital);
    }
    
    /// Add a member to the DAO (only admin can do this)
    pub fn add_member(env: Env, admin: Address, member: Address) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can add members");
        }
        
        env.storage().instance().set(&DataKey::DAOMember(member.clone()), &true);
    }
    
    /// Add funds to the DAO treasury
    pub fn add_funds(env: Env, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut treasury: i128 = env.storage().instance().get(&DataKey::Treasury).unwrap_or(0);
        treasury += amount;
        env.storage().instance().set(&DataKey::Treasury, &treasury);
    }
    
    /// Submit a new proposal (only authorized hospital can do this)
    pub fn submit_proposal(
        env: Env,
        hospital: Address,
        patient_name: String,
        patient_details: String,
        amount_requested: i128,
    ) -> u64 {
        hospital.require_auth();
        
        // Check if hospital is authorized
        let authorized_hospital: Address = env.storage().instance()
            .get(&DataKey::AuthorizedHospital)
            .unwrap_or_else(|| panic!("Authorized hospital not set"));
        
        if hospital != authorized_hospital {
            panic!("Only the authorized hospital can submit proposals");
        }
        
        if amount_requested <= 0 {
            panic!("Amount must be positive");
        }
        
        // Get and increment proposal count
        let mut proposal_count: u64 = env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0);
        proposal_count += 1;
        
        // Create new proposal
        let proposal = Proposal {
            id: proposal_count,
            hospital: hospital.clone(),
            patient_name,
            patient_details,
            amount_requested,
            votes_for: 0,
            votes_against: 0,
            status: ProposalStatus::Active,
            created_at: env.ledger().timestamp(),
        };
        
        // Store proposal
        env.storage().instance().set(&DataKey::Proposal(proposal_count), &proposal);
        env.storage().instance().set(&DataKey::ProposalCount, &proposal_count);
        
        proposal_count
    }
    
    /// Vote on a proposal (only DAO members can vote)
    /// approve: true to vote for, false to vote against
    pub fn vote(env: Env, voter: Address, proposal_id: u64, approve: bool) {
        voter.require_auth();
        
        // Check if voter is a DAO member
        let is_member: bool = env.storage().instance().get(&DataKey::DAOMember(voter.clone())).unwrap_or(false);
        if !is_member {
            panic!("Only DAO members can vote");
        }
        
        // Check if already voted
        if env.storage().instance().has(&DataKey::Vote(proposal_id, voter.clone())) {
            panic!("Already voted on this proposal");
        }
        
        // Get proposal
        let mut proposal: Proposal = env.storage().instance()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("Proposal not found"));
        
        // Check if proposal is still active (not executed or permanently closed)
        match proposal.status {
            ProposalStatus::Active | ProposalStatus::Approved | ProposalStatus::Rejected => {},
            ProposalStatus::Executed => panic!("Proposal already executed"),
        }
        
        // Record vote
        if approve {
            proposal.votes_for += 1;
        } else {
            proposal.votes_against += 1;
        }
        
        // Store vote and updated proposal
        env.storage().instance().set(&DataKey::Vote(proposal_id, voter), &approve);
        env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
    }
    
    /// Finalize voting on a proposal to determine if it's approved or rejected
    pub fn finalize_proposal(env: Env, proposal_id: u64) {
        // Get proposal
        let mut proposal: Proposal = env.storage().instance()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("Proposal not found"));
        
        // Only active proposals can be finalized
        match proposal.status {
            ProposalStatus::Active => {},
            _ => panic!("Proposal is not active"),
        }
        
        // Check if voting threshold is met
        let voting_threshold: u32 = env.storage().instance().get(&DataKey::VotingThreshold).unwrap();
        let total_votes = proposal.votes_for + proposal.votes_against;
        
        if total_votes < 3 {
            panic!("Not enough votes to finalize (minimum 3 required)");
        }
        
        let approval_percentage = (proposal.votes_for * 100) / total_votes;
        
        // Determine final status
        if approval_percentage >= voting_threshold {
            proposal.status = ProposalStatus::Approved;
        } else {
            proposal.status = ProposalStatus::Rejected;
        }
        
        env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
    }
    
    /// Execute an approved proposal and release funds
    pub fn execute_proposal(env: Env, proposal_id: u64) {
        // Get proposal
        let mut proposal: Proposal = env.storage().instance()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("Proposal not found"));
        
        // Check if proposal is approved
        match proposal.status {
            ProposalStatus::Approved => {},
            ProposalStatus::Executed => panic!("Proposal already executed"),
            ProposalStatus::Rejected => panic!("Proposal was rejected"),
            ProposalStatus::Active => panic!("Proposal is still active, not enough votes"),
        }
        
        // Check if treasury has enough funds
        let mut treasury: i128 = env.storage().instance().get(&DataKey::Treasury).unwrap_or(0);
        if treasury < proposal.amount_requested {
            panic!("Insufficient funds in treasury");
        }
        
        // Deduct from treasury
        treasury -= proposal.amount_requested;
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        
        // Mark proposal as executed
        proposal.status = ProposalStatus::Executed;
        env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
        
        // NOTE: In a production system, this is where you would transfer actual tokens
        // from the DAO contract to proposal.hospital using a token contract.
        // For this MVP, we only track the balance changes.
    }
    
    /// Get proposal details by ID
    pub fn get_proposal(env: Env, proposal_id: u64) -> Proposal {
        env.storage().instance()
            .get(&DataKey::Proposal(proposal_id))
            .unwrap_or_else(|| panic!("Proposal not found"))
    }
    
    /// Get total number of proposals
    pub fn get_proposal_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0)
    }
    
    /// Get treasury balance
    pub fn get_treasury_balance(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Treasury).unwrap_or(0)
    }
    
    /// Check if an address is a DAO member
    pub fn is_member(env: Env, address: Address) -> bool {
        env.storage().instance().get(&DataKey::DAOMember(address)).unwrap_or(false)
    }
    
    /// Check if a voter has voted on a proposal
    pub fn has_voted(env: Env, proposal_id: u64, voter: Address) -> bool {
        env.storage().instance().has(&DataKey::Vote(proposal_id, voter))
    }
    
    /// Get voting threshold
    pub fn get_voting_threshold(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::VotingThreshold).unwrap_or(0)
    }
    
    /// Get authorized hospital address
    pub fn get_authorized_hospital(env: Env) -> Address {
        env.storage().instance()
            .get(&DataKey::AuthorizedHospital)
            .unwrap_or_else(|| panic!("Authorized hospital not set"))
    }
    
    /// Update authorized hospital (admin only)
    pub fn set_authorized_hospital(env: Env, admin: Address, new_hospital: Address) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can update authorized hospital");
        }
        
        env.storage().instance().set(&DataKey::AuthorizedHospital, &new_hospital);
    }
}

mod test;
