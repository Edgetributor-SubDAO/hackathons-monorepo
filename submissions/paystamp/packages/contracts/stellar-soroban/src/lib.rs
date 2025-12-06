#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, BytesN, Env, Symbol, Vec,
};

// Contract Data Keys
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const PAUSED_KEY: Symbol = symbol_short!("PAUSED");
const SERVICE_PREFIX: Symbol = symbol_short!("SVC");

// Event Topics
const PAYMENT_RECEIVED: Symbol = symbol_short!("PAYMENT_RECEIVED");

// Service Configuration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ServiceConfig {
    pub service_id: Symbol,
    pub min_amount: u64,
    pub max_amount: u64,
    pub currency: Symbol,
    pub is_active: bool,
}

// Payment Record
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub user: Address,
    pub service_id: Symbol,
    pub amount: u64,
    pub currency: Symbol,
    pub timestamp: u64,
    pub payment_hash: BytesN<32>,
}

#[contract]
pub struct PayStampContract;

#[contractimpl]
impl PayStampContract {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        // Check if already initialized
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Contract already initialized");
        }

        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&PAUSED_KEY, &false);
    }

    /// Check if the contract is paused
    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get::<_, bool>(&PAUSED_KEY)
            .unwrap_or(false)
    }

    /// Pause the contract (admin only)
    pub fn pause(env: Env) {
        Self::check_admin(&env);
        env.storage().instance().set(&PAUSED_KEY, &true);
    }

    /// Unpause the contract (admin only)
    pub fn unpause(env: Env) {
        Self::check_admin(&env);
        env.storage().instance().set(&PAUSED_KEY, &false);
    }

    /// Register a new service (admin only)
    pub fn register_service(
        env: Env,
        service_id: Symbol,
        min_amount: u64,
        max_amount: u64,
        currency: Symbol,
    ) {
        Self::check_admin(&env);
        Self::check_not_paused(&env);

        if min_amount == 0 {
            panic!("min_amount must be greater than 0");
        }
        if max_amount < min_amount {
            panic!("max_amount must be greater than or equal to min_amount");
        }

        let config = ServiceConfig {
            service_id: service_id.clone(),
            min_amount,
            max_amount,
            currency,
            is_active: true,
        };

        let key = (SERVICE_PREFIX, service_id);
        env.storage().instance().set(&key, &config);
    }

    /// Update service configuration (admin only)
    pub fn update_service(
        env: Env,
        service_id: Symbol,
        min_amount: Option<u64>,
        max_amount: Option<u64>,
        currency: Option<Symbol>,
        is_active: Option<bool>,
    ) {
        Self::check_admin(&env);
        Self::check_not_paused(&env);

        let key = (SERVICE_PREFIX, service_id.clone());
        let mut config: ServiceConfig = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic!("Service not found"));

        if let Some(min) = min_amount {
            if min == 0 {
                panic!("min_amount must be greater than 0");
            }
            config.min_amount = min;
        }

        if let Some(max) = max_amount {
            if max < config.min_amount {
                panic!("max_amount must be greater than or equal to min_amount");
            }
            config.max_amount = max;
        }

        if let Some(curr) = currency {
            config.currency = curr;
        }

        if let Some(active) = is_active {
            config.is_active = active;
        }

        env.storage().instance().set(&key, &config);
    }

    /// Receive a payment and emit an event
    pub fn receive_payment(
        env: Env,
        user: Address,
        service_id: Symbol,
        amount: u64,
        currency: Symbol,
        payment_hash: BytesN<32>,
    ) {
        Self::check_not_paused(&env);

        // Validate service exists and is active
        let key = (SERVICE_PREFIX, service_id.clone());
        let config: ServiceConfig = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| panic!("Service not found"));

        if !config.is_active {
            panic!("Service is not active");
        }

        // Validate currency matches
        if config.currency != currency {
            panic!("Currency mismatch");
        }

        // Validate amount
        if amount < config.min_amount {
            panic!("Amount below minimum");
        }
        if amount > config.max_amount {
            panic!("Amount above maximum");
        }

        // Check if payment already exists
        let payment_key = (symbol_short!("PAY"), user.clone(), service_id.clone(), payment_hash);
        if env.storage().instance().has(&payment_key) {
            panic!("Payment already processed");
        }

        // Get current timestamp (ledger sequence as proxy)
        let timestamp = env.ledger().timestamp();

        // Store payment record
        let payment = Payment {
            user: user.clone(),
            service_id: service_id.clone(),
            amount,
            currency: currency.clone(),
            timestamp,
            payment_hash: payment_hash.clone(),
        };

        env.storage().instance().set(&payment_key, &payment);

        // Emit PAYMENT_RECEIVED event
        let event_data = vec![
            &env,
            user.to_val(),
            service_id.to_val(),
            amount.into(),
            currency.to_val(),
            timestamp.into(),
            payment_hash.to_val(),
        ];

        env.events().publish(
            (PAYMENT_RECEIVED, symbol_short!("payment")),
            event_data,
        );
    }

    /// Check if a payment exists
    pub fn payment_exists(
        env: Env,
        user: Address,
        service_id: Symbol,
        payment_hash: BytesN<32>,
    ) -> bool {
        let payment_key = (symbol_short!("PAY"), user, service_id, payment_hash);
        env.storage().instance().has(&payment_key)
    }

    /// Get payment details
    pub fn get_payment(
        env: Env,
        user: Address,
        service_id: Symbol,
        payment_hash: BytesN<32>,
    ) -> Option<Payment> {
        let payment_key = (symbol_short!("PAY"), user, service_id, payment_hash);
        env.storage().instance().get(&payment_key)
    }

    /// Get service configuration
    pub fn get_service(env: Env, service_id: Symbol) -> Option<ServiceConfig> {
        let key = (SERVICE_PREFIX, service_id);
        env.storage().instance().get(&key)
    }

    /// Get admin address
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&ADMIN_KEY)
    }

    // Internal helper functions

    fn check_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        let caller = env.invoker();
        if caller != admin {
            panic!("Unauthorized: admin only");
        }
    }

    fn check_not_paused(env: &Env) {
        if Self::is_paused(env.clone()) {
            panic!("Contract is paused");
        }
    }
}

#[cfg(test)]
mod test;

