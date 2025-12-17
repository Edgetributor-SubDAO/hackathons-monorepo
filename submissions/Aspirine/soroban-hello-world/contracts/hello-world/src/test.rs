#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    
    assert_eq!(client.get_voting_threshold(), 66);
    assert_eq!(client.get_proposal_count(), 0);
    assert_eq!(client.get_treasury_balance(), 0);
}

#[test]
#[should_panic(expected = "DAO already initialized")]
fn test_initialize_twice() {
    let env = Env::default();
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital); // Should panic
}

#[test]
fn test_add_member() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let member = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    client.add_member(&admin, &member);
    
    assert!(client.is_member(&member));
}

#[test]
fn test_add_funds() {
    let env = Env::default();
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    client.add_funds(&1000);
    
    assert_eq!(client.get_treasury_balance(), 1000);
    
    client.add_funds(&500);
    assert_eq!(client.get_treasury_balance(), 1500);
}

#[test]
fn test_submit_proposal() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "John Doe"),
        &String::from_str(&env, "Emergency heart surgery required"),
        &5000,
    );
    
    assert_eq!(proposal_id, 1);
    assert_eq!(client.get_proposal_count(), 1);
    
    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.id, 1);
    assert_eq!(proposal.amount_requested, 5000);
    assert_eq!(proposal.votes_for, 0);
    assert_eq!(proposal.votes_against, 0);
}

#[test]
fn test_voting_and_approval() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    
    // Initialize DAO with 66% threshold
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    
    // Add members
    client.add_member(&admin, &member1);
    client.add_member(&admin, &member2);
    client.add_member(&admin, &member3);
    
    // Submit proposal
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "Jane Smith"),
        &String::from_str(&env, "Cancer treatment needed"),
        &10000,
    );
    
    // Members vote - 2 for, 1 against (66% approval)
    client.vote(&member1, &proposal_id, &true);
    client.vote(&member2, &proposal_id, &true);
    client.vote(&member3, &proposal_id, &false);
    
    // Finalize the voting
    client.finalize_proposal(&proposal_id);
    
    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.votes_for, 2);
    assert_eq!(proposal.votes_against, 1);
    
    // Should be approved since 66% voted yes
    match proposal.status {
        ProposalStatus::Approved => {},
        _ => panic!("Proposal should be approved"),
    }
}

#[test]
fn test_voting_and_rejection() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    client.add_member(&admin, &member1);
    client.add_member(&admin, &member2);
    client.add_member(&admin, &member3);
    
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "Test Patient"),
        &String::from_str(&env, "Test case"),
        &5000,
    );
    
    // 1 for, 2 against (33% approval, less than 66% threshold)
    client.vote(&member1, &proposal_id, &true);
    client.vote(&member2, &proposal_id, &false);
    client.vote(&member3, &proposal_id, &false);
    
    // Finalize the voting
    client.finalize_proposal(&proposal_id);
    
    let proposal = client.get_proposal(&proposal_id);
    
    match proposal.status {
        ProposalStatus::Rejected => {},
        _ => panic!("Proposal should be rejected"),
    }
}

#[test]
#[should_panic(expected = "Already voted on this proposal")]
fn test_double_voting() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    let member = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    client.add_member(&admin, &member);
    
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Test"),
        &1000,
    );
    
    client.vote(&member, &proposal_id, &true);
    client.vote(&member, &proposal_id, &true); // Should panic
}

#[test]
fn test_execute_proposal() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    client.add_funds(&20000);
    
    client.add_member(&admin, &member1);
    client.add_member(&admin, &member2);
    client.add_member(&admin, &member3);
    
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "Emergency Patient"),
        &String::from_str(&env, "Urgent surgery"),
        &10000,
    );
    
    // Vote to approve
    client.vote(&member1, &proposal_id, &true);
    client.vote(&member2, &proposal_id, &true);
    client.vote(&member3, &proposal_id, &false);
    
    // Finalize the voting
    client.finalize_proposal(&proposal_id);
    
    // Execute proposal
    client.execute_proposal(&proposal_id);
    
    // Check treasury was deducted
    assert_eq!(client.get_treasury_balance(), 10000);
    
    // Check proposal is marked as executed
    let proposal = client.get_proposal(&proposal_id);
    match proposal.status {
        ProposalStatus::Executed => {},
        _ => panic!("Proposal should be executed"),
    }
}

#[test]
#[should_panic(expected = "Insufficient funds in treasury")]
fn test_execute_without_funds() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    client.add_funds(&1000); // Not enough funds
    
    client.add_member(&admin, &member1);
    client.add_member(&admin, &member2);
    client.add_member(&admin, &member3);
    
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "Patient"),
        &String::from_str(&env, "Treatment"),
        &5000,
    );
    
    client.vote(&member1, &proposal_id, &true);
    client.vote(&member2, &proposal_id, &true);
    client.vote(&member3, &proposal_id, &false);
    
    // Finalize the voting
    client.finalize_proposal(&proposal_id);
    
    client.execute_proposal(&proposal_id); // Should panic
}

#[test]
fn test_complete_workflow() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    // Setup
    let admin = Address::generate(&env);
    let authorized_hospital = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    let member4 = Address::generate(&env);
    
    // Initialize DAO with authorized hospital
    client.initialize(&admin, &75, &authorized_hospital); // 75% threshold
    client.add_funds(&50000);
    
    // Add members
    client.add_member(&admin, &member1);
    client.add_member(&admin, &member2);
    client.add_member(&admin, &member3);
    client.add_member(&admin, &member4);
    
    // Authorized hospital submits proposal 1
    let proposal1 = client.submit_proposal(
        &authorized_hospital,
        &String::from_str(&env, "Alice Johnson"),
        &String::from_str(&env, "Heart transplant"),
        &15000,
    );
    
    // Authorized hospital submits proposal 2
    let proposal2 = client.submit_proposal(
        &authorized_hospital,
        &String::from_str(&env, "Bob Williams"),
        &String::from_str(&env, "Cancer treatment"),
        &12000,
    );
    
    assert_eq!(client.get_proposal_count(), 2);
    
    // Vote on proposal 1 - 3 yes, 1 no (75% approval)
    client.vote(&member1, &proposal1, &true);
    client.vote(&member2, &proposal1, &true);
    client.vote(&member3, &proposal1, &true);
    client.vote(&member4, &proposal1, &false);
    
    // Finalize proposal 1
    client.finalize_proposal(&proposal1);
    
    // Vote on proposal 2 - 2 yes, 2 no (50% approval, below threshold)
    client.vote(&member1, &proposal2, &true);
    client.vote(&member2, &proposal2, &true);
    client.vote(&member3, &proposal2, &false);
    client.vote(&member4, &proposal2, &false);
    
    // Finalize proposal 2
    client.finalize_proposal(&proposal2);
    
    // Execute approved proposal
    client.execute_proposal(&proposal1);
    
    assert_eq!(client.get_treasury_balance(), 35000); // 50000 - 15000
    
    let p1 = client.get_proposal(&proposal1);
    let p2 = client.get_proposal(&proposal2);
    
    match p1.status {
        ProposalStatus::Executed => {},
        _ => panic!("Proposal 1 should be executed"),
    }
    
    match p2.status {
        ProposalStatus::Rejected => {},
        _ => panic!("Proposal 2 should be rejected"),
    }
}

#[test]
fn test_mock_data_output() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(EmergencyFundDAO, ());
    let client = EmergencyFundDAOClient::new(&env, &contract_id);

    // Setup mock addresses
    let admin = Address::generate(&env);
    let hospital = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    
    // Initialize DAO with 66% threshold
    let hospital = Address::generate(&env);
    client.initialize(&admin, &66, &hospital);
    assert_eq!(client.get_voting_threshold(), 66);
    assert_eq!(client.get_treasury_balance(), 0);
    
    // Add funds to treasury
    client.add_funds(&100000);
    assert_eq!(client.get_treasury_balance(), 100000);
    
    // Add members to DAO
    client.add_member(&admin, &member1);
    client.add_member(&admin, &member2);
    client.add_member(&admin, &member3);
    assert!(client.is_member(&member1));
    assert!(client.is_member(&member2));
    assert!(client.is_member(&member3));
    
    // Hospital submits emergency proposal
    let proposal_id = client.submit_proposal(
        &hospital,
        &String::from_str(&env, "Sarah Martinez"),
        &String::from_str(&env, "Emergency: Acute heart failure requiring immediate bypass surgery. Patient is 45-year-old with no insurance."),
        &25000,
    );
    
    assert_eq!(proposal_id, 1);
    assert_eq!(client.get_proposal_count(), 1);
    
    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.id, 1);
    assert_eq!(proposal.patient_name, String::from_str(&env, "Sarah Martinez"));
    assert_eq!(proposal.amount_requested, 25000);
    assert_eq!(proposal.votes_for, 0);
    assert_eq!(proposal.votes_against, 0);
    
    // Members vote on proposal
    client.vote(&member1, &proposal_id, &true);  // Approve
    assert!(client.has_voted(&proposal_id, &member1));
    
    let proposal_v1 = client.get_proposal(&proposal_id);
    assert_eq!(proposal_v1.votes_for, 1);
    assert_eq!(proposal_v1.votes_against, 0);
    
    client.vote(&member2, &proposal_id, &true);  // Approve
    let proposal_v2 = client.get_proposal(&proposal_id);
    assert_eq!(proposal_v2.votes_for, 2);
    assert_eq!(proposal_v2.votes_against, 0);
    
    client.vote(&member3, &proposal_id, &false); // Reject
    let proposal_v3 = client.get_proposal(&proposal_id);
    assert_eq!(proposal_v3.votes_for, 2);
    assert_eq!(proposal_v3.votes_against, 1);
    
    // Calculate approval rate: 2/3 = 66.67% (meets 66% threshold)
    let total_votes = proposal_v3.votes_for + proposal_v3.votes_against;
    let approval_rate = (proposal_v3.votes_for * 100) / total_votes;
    assert_eq!(approval_rate, 66); // 66% approval
    
    // Finalize proposal
    client.finalize_proposal(&proposal_id);
    let finalized = client.get_proposal(&proposal_id);
    match finalized.status {
        ProposalStatus::Approved => {},
        _ => panic!("Should be approved"),
    }
    
    // Execute proposal and release funds
    let treasury_before = client.get_treasury_balance();
    assert_eq!(treasury_before, 100000);
    
    client.execute_proposal(&proposal_id);
    
    let treasury_after = client.get_treasury_balance();
    assert_eq!(treasury_after, 75000); // 100000 - 25000
    
    let executed = client.get_proposal(&proposal_id);
    match executed.status {
        ProposalStatus::Executed => {},
        _ => panic!("Should be executed"),
    }
    
    // Verify final state
    assert_eq!(client.get_proposal_count(), 1);
    assert_eq!(client.get_treasury_balance(), 75000);
    assert_eq!(client.get_voting_threshold(), 66);
}
