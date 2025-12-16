#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

fn create_token_contract<'a>(env: &Env, admin: &Address) -> token::StellarAssetClient<'a> {
    let contract_address = env.register_stellar_asset_contract_v2(admin.clone()).address();
    token::StellarAssetClient::new(env, &contract_address)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, X402FlashContract);
    let client = X402FlashContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    // Initialize contract
    client.initialize(&admin);

    // Verify admin is set (would need a getter function to test properly)
    // For now, test that it doesn't panic
}

#[test]
fn test_open_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, X402FlashContract);
    let client = X402FlashContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let server = Address::generate(&env);
    
    // Create and mint token
    let token = create_token_contract(&env, &admin);
    token.mint(&user, &10_000_000);

    // Initialize
    client.initialize(&admin);

    // Open escrow
    client.open_escrow(&user, &server, &token.address, &1_000_000, &3600);

    // Check escrow balance
    let balance = client.current_escrow(&user, &server);
    assert_eq!(balance, 1_000_000);
}

#[test]
fn test_close_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, X402FlashContract);
    let client = X402FlashContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let server = Address::generate(&env);
    
    // Create and mint token
    let token = create_token_contract(&env, &admin);
    token.mint(&user, &10_000_000);

    // Initialize and open
    client.initialize(&admin);
    client.open_escrow(&user, &server, &token.address, &1_000_000, &3600);

    // Close escrow
    client.client_close_escrow(&user, &server);

    // Balance should be 0
    let balance = client.current_escrow(&user, &server);
    assert_eq!(balance, 0);
}

#[test]
fn test_get_nonce() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, X402FlashContract);
    let client = X402FlashContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    // Initialize
    client.initialize(&admin);

    // Check initial nonce (should be 0)
    let nonce = client.get_nonce(&user);
    assert_eq!(nonce, 0);
}

// TODO: Add more comprehensive tests for settle_payment with signature verification
