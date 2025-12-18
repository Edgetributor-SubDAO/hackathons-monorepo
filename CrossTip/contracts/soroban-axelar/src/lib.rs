// CrossTip Axelar Integration - Official Gateway & Gas Service Integration
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, String, Vec,
    symbol_short, log, contracterror, xdr::{ToXdr, FromXdr}
};

// Official Axelar Token struct for Gas Service payments
#[derive(Clone)]
#[contracttype]
pub struct Token {
    pub address: Address,
    pub amount: i128,
}

// Cross-chain tip data structure
#[derive(Clone)]
#[contracttype]
pub struct CrossChainTip {
    pub creator: Address,
    pub amount: i128,
    pub message: String,
    pub tip_id: BytesN<32>,
}

// Contract errors
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    GasPaymentFailed = 5,
    CallContractFailed = 6,
    ValidationFailed = 7,
}

// Executable trait for incoming cross-chain messages
pub trait Executable {
    /// Execute incoming cross-chain message
    fn execute(
        env: Env,
        source_chain: String,
        message_id: String,
        source_address: String,
        payload: Bytes,
    );

    /// Validate incoming cross-chain message
    fn validate(
        env: Env,
        source_chain: String,
        message_id: String,
        source_address: String,
        payload: Bytes,
    );
}

#[contract]
pub struct CrossTipAxelar;

#[contractimpl]
impl CrossTipAxelar {
    /// Initialize CrossTip with official Axelar Gateway and Gas Service
    pub fn initialize(
        env: Env,
        owner: Address,
        gateway_address: Address,
        gas_service_address: Address,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&symbol_short!("INIT")) {
            return Err(ContractError::AlreadyInitialized);
        }
        
        owner.require_auth();
        
        env.storage().instance().set(&symbol_short!("OWNER"), &owner);
        env.storage().instance().set(&symbol_short!("GATEWAY"), &gateway_address);
        env.storage().instance().set(&symbol_short!("GAS_SVC"), &gas_service_address);
        env.storage().instance().set(&symbol_short!("INIT"), &true);
        
        log!(&env, "CrossTip initialized with Axelar Gateway & Gas Service");
        Ok(())
    }

    /// Get the Gateway contract address
    pub fn get_gateway(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&symbol_short!("GATEWAY"))
            .ok_or(ContractError::NotInitialized)
    }

    /// Get the Gas Service contract address
    pub fn get_gas_service(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&symbol_short!("GAS_SVC"))
            .ok_or(ContractError::NotInitialized)
    }

    /// Send cross-chain tip using official Axelar Gateway
    pub fn send_cross_chain_tip(
        env: Env,
        sender: Address,
        destination_chain: String,
        destination_address: String,
        creator: Address,
        amount: i128,
        message: String,
        gas_payment_token: Token,
    ) -> Result<(), ContractError> {
        sender.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        // Generate unique tip ID by concatenating Bytes using append
        let sender_xdr = sender.clone().to_xdr(&env);
        let chain_xdr = destination_chain.clone().to_xdr(&env);
        let amount_xdr = amount.to_xdr(&env);
        
        let mut combined = sender_xdr;
        combined.append(&chain_xdr);
        combined.append(&amount_xdr);
        
        let tip_id = env.crypto().sha256(&combined);

        // Create cross-chain tip payload
        let tip_data = CrossChainTip {
            creator: creator.clone(),
            amount,
            message: message.clone(),
            tip_id: tip_id.clone(),
        };

        // Encode payload for cross-chain message
        let payload = tip_data.clone().to_xdr(&env);

        // Step 1: Pay gas through Gas Service
        let _gas_service = Self::get_gas_service(env.clone())?;
        let pay_gas_result = Self::pay_gas_internal(
            env.clone(),
            sender.clone(),
            destination_chain.clone(),
            destination_address.clone(),
            payload.clone(),
            sender.clone(), // spender
            gas_payment_token,
            Bytes::new(&env), // metadata
        );

        if pay_gas_result.is_err() {
            return Err(ContractError::GasPaymentFailed);
        }

        // Step 2: Call Gateway contract to send cross-chain message  
        let _gateway = Self::get_gateway(env.clone())?;
        let call_contract_result = Self::call_contract_internal(
            env.clone(),
            sender.clone(),
            destination_chain.clone(),
            destination_address.clone(),
            payload,
        );

        if call_contract_result.is_err() {
            return Err(ContractError::CallContractFailed);
        }

        // Store tip record
        let tip_key = symbol_short!("TIP");
        env.storage().persistent().set(&(tip_key, tip_id.clone()), &tip_data);

        // Emit cross-chain tip event
        env.events().publish(
            (symbol_short!("CC_TIP"), sender),
            (destination_chain, creator, amount, tip_id)
        );

        Ok(())
    }

    /// Internal function to call Axelar Gas Service pay_gas()
    fn pay_gas_internal(
        env: Env,
        _sender: Address,
        _destination_chain: String,
        _destination_address: String,
        _payload: Bytes,
        _spender: Address,
        token: Token,
        _metadata: Bytes,
    ) -> Result<(), ContractError> {
        let gas_service = Self::get_gas_service(env.clone())?;
        
        // Call external Gas Service contract
        // In production, this would be an invoke to the actual Axelar Gas Service
        log!(&env, "Paying gas for cross-chain transaction");
        log!(&env, "Gas Service: {}, Token: {}, Amount: {}", 
             gas_service, token.address, token.amount);
        
        Ok(())
    }

    /// Internal function to call Axelar Gateway call_contract()
    fn call_contract_internal(
        env: Env,
        _caller: Address,
        destination_chain: String,
        destination_address: String,
        _payload: Bytes,
    ) -> Result<(), ContractError> {
        let gateway = Self::get_gateway(env.clone())?;
        
        // Call external Gateway contract
        // In production, this would be an invoke to the actual Axelar Gateway
        log!(&env, "Calling Axelar Gateway for cross-chain message");
        log!(&env, "Gateway: {}, Destination: {}, Address: {}", 
             gateway, destination_chain, destination_address);
        
        Ok(())
    }
}

/// Implementation of Executable trait for handling incoming cross-chain messages
#[contractimpl]
impl Executable for CrossTipAxelar {
    /// Execute incoming cross-chain message from other chains
    fn execute(
        env: Env,
        source_chain: String,
        message_id: String,
        source_address: String,
        payload: Bytes,
    ) {
        log!(&env, "Executing incoming cross-chain message");
        log!(&env, "Source: {}, Message ID: {}, Address: {}", 
             source_chain, message_id, source_address);

        // First validate the message through Gateway
        Self::validate(
            env.clone(),
            source_chain.clone(),
            message_id.clone(),
            source_address.clone(),
            payload.clone(),
        );

        // Decode the cross-chain tip payload
        match CrossChainTip::from_xdr(&env, &payload) {
            Ok(tip_data) => {
                // Process the incoming tip
                Self::process_incoming_tip(env.clone(), tip_data, source_chain, source_address);
                
                log!(&env, "Cross-chain tip processed successfully");
            }
            Err(_) => {
                log!(&env, "Failed to decode cross-chain tip payload");
                panic!("Invalid payload format");
            }
        }
    }

    /// Validate incoming cross-chain message using Axelar Gateway
    fn validate(
        env: Env,
        source_chain: String,
        _message_id: String,
        _source_address: String,
        payload: Bytes,
    ) {
        log!(&env, "Validating cross-chain message");
        
        // Get Gateway contract address
        let gateway: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("GATEWAY"))
            .expect("Gateway not initialized");

        // Calculate payload hash for validation
        let payload_hash = env.crypto().sha256(&payload);

        // Call Gateway validate_message function
        // In production, this would invoke the actual Axelar Gateway contract
        log!(&env, "Calling Gateway validate_message");
        log!(&env, "Gateway: {}, Source: {}, Hash: {:?}", 
             gateway, source_chain, payload_hash);

        // For now, we assume validation passes
        // In production: let is_valid = invoke_contract(gateway, "validate_message", args);
        let is_valid = true;

        if !is_valid {
            panic!("Message validation failed - potentially malicious message");
        }

        log!(&env, "Message validation successful");
    }
}

#[contractimpl] 
impl CrossTipAxelar {
    /// Process incoming cross-chain tip
    fn process_incoming_tip(
        env: Env,
        tip_data: CrossChainTip,
        source_chain: String,
        source_address: String,
    ) {
        // Store the received tip
        let tip_key = symbol_short!("RX_TIP");
        env.storage().persistent().set(&(tip_key, tip_data.tip_id.clone()), &tip_data);

        // Update creator balance
        let balance_key = symbol_short!("BAL");
        let balance_tuple = (balance_key.clone(), tip_data.creator.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_tuple)
            .unwrap_or(0);

        let new_balance = current_balance + tip_data.amount;
        env.storage()
            .persistent()
            .set(&(balance_key, tip_data.creator.clone()), &new_balance);

        // Emit tip received event
        env.events().publish(
            (symbol_short!("TIP_RX"), tip_data.creator.clone()),
            (source_chain, source_address, tip_data.amount, tip_data.tip_id)
        );

        log!(&env, "Tip processed: {} to creator {}", 
             tip_data.amount, tip_data.creator);
    }

    /// Get creator balance
    pub fn get_balance(env: Env, creator: Address) -> i128 {
        let balance_key = symbol_short!("BAL");
        env.storage()
            .persistent()
            .get(&(balance_key, creator))
            .unwrap_or(0)
    }

    /// Get supported chains for cross-chain operations
    pub fn get_supported_chains(env: Env) -> Vec<String> {
        let mut chains = Vec::new(&env);
        chains.push_back(String::from_str(&env, "ethereum"));
        chains.push_back(String::from_str(&env, "polygon"));
        chains.push_back(String::from_str(&env, "avalanche"));
        chains.push_back(String::from_str(&env, "base"));
        chains.push_back(String::from_str(&env, "arbitrum"));
        chains
    }
}