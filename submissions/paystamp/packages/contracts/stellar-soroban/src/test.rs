#![cfg(test)]

use super::*;
use soroban_sdk::{
    symbol_short, testutils::Address as _, Address, BytesN, Env,
};

fn create_contract(e: &Env) -> Address {
    let contract_id = e.register_contract(None, PayStampContract);
    contract_id
}

fn create_admin(e: &Env) -> Address {
    Address::generate(e)
}

fn create_user(e: &Env) -> Address {
    Address::generate(e)
}

#[test]
fn test_initialize() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let stored_admin = client.get_admin();
    assert_eq!(stored_admin, Some(admin));
    assert_eq!(client.is_paused(), false);
}

#[test]
#[should_panic(expected = "Contract already initialized")]
fn test_initialize_twice() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
fn test_pause_unpause() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    assert_eq!(client.is_paused(), false);
    client.pause();
    assert_eq!(client.is_paused(), true);
    client.unpause();
    assert_eq!(client.is_paused(), false);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_pause_unauthorized() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let non_admin = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    // Try to pause as non-admin
    let non_admin_client = PayStampContractClient::new(&e, &contract_id);
    non_admin_client.pause();
}

#[test]
fn test_register_service() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64; // 0.1 XLM (in stroops)
    let max_amount = 10_000_000u64; // 1 XLM
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    let config = client.get_service(&service_id);
    assert!(config.is_some());
    let config = config.unwrap();
    assert_eq!(config.service_id, service_id);
    assert_eq!(config.min_amount, min_amount);
    assert_eq!(config.max_amount, max_amount);
    assert_eq!(config.currency, currency);
    assert_eq!(config.is_active, true);
}

#[test]
#[should_panic(expected = "min_amount must be greater than 0")]
fn test_register_service_invalid_min() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    client.register_service(
        &symbol_short!("test"),
        &0u64,
        &10_000_000u64,
        &symbol_short!("XLM"),
    );
}

#[test]
#[should_panic(expected = "max_amount must be greater than or equal to min_amount")]
fn test_register_service_invalid_max() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    client.register_service(
        &symbol_short!("test"),
        &10_000_000u64,
        &1_000_000u64,
        &symbol_short!("XLM"),
    );
}

#[test]
fn test_receive_payment() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let user = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64;
    let max_amount = 10_000_000u64;
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    let amount = 5_000_000u64; // 0.5 XLM
    let payment_hash = BytesN::from_array(&e, &[0u8; 32]);

    client.receive_payment(&user, &service_id, &amount, &currency, &payment_hash);

    let exists = client.payment_exists(&user, &service_id, &payment_hash);
    assert_eq!(exists, true);

    let payment = client.get_payment(&user, &service_id, &payment_hash);
    assert!(payment.is_some());
    let payment = payment.unwrap();
    assert_eq!(payment.user, user);
    assert_eq!(payment.service_id, service_id);
    assert_eq!(payment.amount, amount);
    assert_eq!(payment.currency, currency);
}

#[test]
#[should_panic(expected = "Service not found")]
fn test_receive_payment_service_not_found() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let user = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("nonexistent");
    let amount = 5_000_000u64;
    let currency = symbol_short!("XLM");
    let payment_hash = BytesN::from_array(&e, &[0u8; 32]);

    client.receive_payment(&user, &service_id, &amount, &currency, &payment_hash);
}

#[test]
#[should_panic(expected = "Amount below minimum")]
fn test_receive_payment_below_minimum() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let user = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64;
    let max_amount = 10_000_000u64;
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    let amount = 500_000u64; // Below minimum
    let payment_hash = BytesN::from_array(&e, &[0u8; 32]);

    client.receive_payment(&user, &service_id, &amount, &currency, &payment_hash);
}

#[test]
#[should_panic(expected = "Amount above maximum")]
fn test_receive_payment_above_maximum() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let user = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64;
    let max_amount = 10_000_000u64;
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    let amount = 15_000_000u64; // Above maximum
    let payment_hash = BytesN::from_array(&e, &[0u8; 32]);

    client.receive_payment(&user, &service_id, &amount, &currency, &payment_hash);
}

#[test]
#[should_panic(expected = "Currency mismatch")]
fn test_receive_payment_wrong_currency() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let user = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64;
    let max_amount = 10_000_000u64;
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    let amount = 5_000_000u64;
    let wrong_currency = symbol_short!("USDC");
    let payment_hash = BytesN::from_array(&e, &[0u8; 32]);

    client.receive_payment(&user, &service_id, &amount, &wrong_currency, &payment_hash);
}

#[test]
#[should_panic(expected = "Payment already processed")]
fn test_receive_payment_duplicate() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);
    let user = create_user(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64;
    let max_amount = 10_000_000u64;
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    let amount = 5_000_000u64;
    let payment_hash = BytesN::from_array(&e, &[0u8; 32]);

    client.receive_payment(&user, &service_id, &amount, &currency, &payment_hash);
    // Try to process the same payment again
    client.receive_payment(&user, &service_id, &amount, &currency, &payment_hash);
}

#[test]
fn test_update_service() {
    let e = Env::default();
    let contract_id = create_contract(&e);
    let admin = create_admin(&e);

    let client = PayStampContractClient::new(&e, &contract_id);
    client.initialize(&admin);

    let service_id = symbol_short!("analytics");
    let min_amount = 1_000_000u64;
    let max_amount = 10_000_000u64;
    let currency = symbol_short!("XLM");

    client.register_service(&service_id, &min_amount, &max_amount, &currency);

    // Update service to inactive
    client.update_service(&service_id, &None, &None, &None, &Some(false));

    let config = client.get_service(&service_id).unwrap();
    assert_eq!(config.is_active, false);

    // Update min_amount
    let new_min = 2_000_000u64;
    client.update_service(&service_id, &Some(new_min), &None, &None, &None);

    let config = client.get_service(&service_id).unwrap();
    assert_eq!(config.min_amount, new_min);
}

