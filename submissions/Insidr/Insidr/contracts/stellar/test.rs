#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MinimalTestContract);
    let client = MinimalTestContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.initialize(&owner);
    assert_eq!(client.get_count(), 0);
    
    let result = client.increment();
    assert_eq!(result, 1);
    assert_eq!(client.get_count(), 1);
}
