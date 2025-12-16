#![no_std]

mod auth;
mod storage;
mod types;

use soroban_sdk::{
    contract, contractimpl, token, Address, BytesN, Env, String,
};
use soroban_sdk::xdr::ToXdr;  // Import ToXdr trait

use auth::AuthValidator;
use storage::Storage;
use types::{Channel, ChannelState, PaymentAuth, Settlement, X402Error};

#[contract]
pub struct X402FlashContract;

#[contractimpl]
impl X402FlashContract {
    /// Initialize contract with admin
    pub fn initialize(env: Env, admin: Address) {
        Storage::set_admin(&env, &admin);
    }

    /// Open payment channel with escrow
    pub fn open_escrow(
        env: Env,
        client: Address,
        server: Address,
        token: Address,
        amount: i128,
        ttl_seconds: u64,
    ) -> Result<(), X402Error> {
        // Require client authorization
        client.require_auth();

        // Check if paused
        if Storage::is_paused(&env) {
            return Err(X402Error::ContractPaused);
        }

        // Validate inputs
        if amount <= 0 {
            return Err(X402Error::InvalidAmount);
        }

        // Check channel doesn't exist
        if let Some(existing) = Storage::get_channel(&env, &client, &server) {
            if existing.state != ChannelState::None && existing.state != ChannelState::Closed {
                return Err(X402Error::ChannelAlreadyExists);
            }
        }

        // Transfer tokens to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &amount);

        // Create channel
        let channel = Channel {
            escrow_balance: amount,
            token: token.clone(),
            opened_at: env.ledger().timestamp(),
            last_activity_at: env.ledger().timestamp(),
            ttl_seconds,
            state: ChannelState::Open,
            closed_by: None,
            pending_settlements: 0,
        };

        Storage::set_channel(&env, &client, &server, &channel);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "channel_opened"), &client, &server),
            (token, amount, ttl_seconds),
        );

        Ok(())
    }

    /// Settle a payment from escrow
    pub fn settle_payment(
        env: Env,
        client: Address,
        server: Address,
        auth: PaymentAuth,
        signature: BytesN<64>,
        client_pubkey: BytesN<32>,
    ) -> Result<(), X402Error> {
        // Require server authorization
        server.require_auth();

        // Check if paused
        if Storage::is_paused(&env) {
            return Err(X402Error::ContractPaused);
        }

        // Get channel
        let mut channel = Storage::get_channel(&env, &client, &server)
            .ok_or(X402Error::ChannelNotOpen)?;

        // Check channel state
        if channel.state != ChannelState::Open {
            return Err(X402Error::ChannelNotOpen);
        }

        // Check TTL
        if env.ledger().timestamp() > channel.last_activity_at + channel.ttl_seconds {
            channel.state = ChannelState::PendingClose;
            Storage::set_channel(&env, &client, &server, &channel);
            return Err(X402Error::ChannelNotOpen);
        }

        // Validate authorization
        AuthValidator::validate_auth(&env, &auth, &server)?;

        // Verify signature
        AuthValidator::verify_payment_signature(&env, &auth, &signature, &client_pubkey)?;

        // Check nonce
        let expected_nonce = Storage::get_client_nonce(&env, &client);
        if auth.nonce != expected_nonce {
            return Err(X402Error::InvalidNonce);
        }

        if Storage::has_used_nonce(&env, &client, &server, auth.nonce) {
            return Err(X402Error::NonceAlreadyUsed);
        }

        // Check minimum payment
        let min_payment = Storage::get_minimum_payment(&env, &auth.token);
        if auth.amount < min_payment {
            return Err(X402Error::InvalidAmount);
        }

        // Rate limiting: check last settlement
        let history = Storage::get_settlement_history(&env, &client, &server);
        if history.len() > 0 {
            let last = history.get(history.len() - 1).unwrap();
            if env.ledger().timestamp() < last.timestamp + 1 {
                return Err(X402Error::RateLimitExceeded);
            }
        }

        // Check escrow balance
        if channel.escrow_balance < auth.amount {
            return Err(X402Error::InsufficientEscrow);
        }

        // Mark nonce as used
        Storage::mark_nonce_used(&env, &client, &server, auth.nonce);
        Storage::increment_client_nonce(&env, &client);

        // Update channel
        channel.escrow_balance -= auth.amount;
        channel.last_activity_at = env.ledger().timestamp();
        channel.pending_settlements += 1;

        // Transfer payment to server
        let token_client = token::Client::new(&env, &channel.token);
        token_client.transfer(&env.current_contract_address(), &server, &auth.amount);

        channel.pending_settlements -= 1;
        Storage::set_channel(&env, &client, &server, &channel);

        // Record settlement
        let settlement = Settlement {
            amount: auth.amount,
            timestamp: env.ledger().timestamp(),
            auth_hash: env.crypto().sha256(&auth.server.to_xdr(&env)).into(),  // Convert Hash to BytesN
        };
        Storage::add_settlement(&env, &client, &server, settlement);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "payment_settled"), &client, &server),
            auth.amount,
        );

        Ok(())
    }

    /// Close channel and refund escrow to client
    pub fn client_close_escrow(
        env: Env,
        client: Address,
        server: Address,
    ) -> Result<(), X402Error> {
        client.require_auth();

        if Storage::is_paused(&env) {
            return Err(X402Error::ContractPaused);
        }

        let mut channel = Storage::get_channel(&env, &client, &server)
            .ok_or(X402Error::ChannelNotOpen)?;

        if channel.state != ChannelState::Open && channel.state != ChannelState::PendingClose {
            return Err(X402Error::ChannelNotOpen);
        }

        if channel.pending_settlements > 0 {
            return Err(X402Error::PendingSettlements);
        }

        // Refund escrow
        if channel.escrow_balance > 0 {
            let token_client = token::Client::new(&env, &channel.token);
            token_client.transfer(
                &env.current_contract_address(),
                &client,
                &channel.escrow_balance,
            );
        }

        // Close channel
        channel.state = ChannelState::Closed;
        channel.escrow_balance = 0;
        Storage::set_channel(&env, &client, &server, &channel);

        env.events().publish(
            (String::from_str(&env, "channel_closed"), &client, &server),
            String::from_str(&env, "client"),
        );

        Ok(())
    }

    /// View current escrow balance
    pub fn current_escrow(env: Env, client: Address, server: Address) -> i128 {
        Storage::get_channel(&env, &client, &server)
            .map(|c| c.escrow_balance)
            .unwrap_or(0)
    }

    /// Get current nonce for client
    pub fn get_nonce(env: Env, client: Address) -> u64 {
        Storage::get_client_nonce(&env, &client)
    }

    /// Admin: Set minimum payment for token
    pub fn set_minimum_payment(env: Env, token: Address, amount: i128) -> Result<(), X402Error> {
        let admin = Storage::get_admin(&env);
        admin.require_auth();

        Storage::set_minimum_payment(&env, &token, amount);
        Ok(())
    }

    /// Admin: Pause contract
    pub fn pause(env: Env) -> Result<(), X402Error> {
        let admin = Storage::get_admin(&env);
        admin.require_auth();

        Storage::set_paused(&env, true);
        Ok(())
    }

    /// Admin: Unpause contract
    pub fn unpause(env: Env) -> Result<(), X402Error> {
        let admin = Storage::get_admin(&env);
        admin.require_auth();

        Storage::set_paused(&env, false);
        Ok(())
    }

    /// Emergency withdrawal when paused
    pub fn emergency_withdraw(
        env: Env,
        client: Address,
        server: Address,
    ) -> Result<(), X402Error> {
        client.require_auth();

        if !Storage::is_paused(&env) {
            return Err(X402Error::Unauthorized);
        }

        let mut channel = Storage::get_channel(&env, &client, &server)
            .ok_or(X402Error::ChannelNotOpen)?;

        if channel.escrow_balance > 0 {
            let token_client = token::Client::new(&env, &channel.token);
            token_client.transfer(
                &env.current_contract_address(),
                &client,
                &channel.escrow_balance,
            );

            channel.escrow_balance = 0;
            channel.state = ChannelState::Closed;
            Storage::set_channel(&env, &client, &server, &channel);
        }

        Ok(())
    }
}

#[cfg(test)]
mod test;
