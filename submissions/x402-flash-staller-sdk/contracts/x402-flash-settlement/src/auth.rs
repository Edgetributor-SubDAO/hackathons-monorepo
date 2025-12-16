use soroban_sdk::{Address, BytesN, Bytes, Env};
use soroban_sdk::xdr::ToXdr;  // Import ToXdr trait
use crate::types::{PaymentAuth, X402Error};

pub struct AuthValidator;

impl AuthValidator {
    /// Verify ED25519 signature for payment authorization
    pub fn verify_payment_signature(
        env: &Env,
        auth: &PaymentAuth,
        signature: &BytesN<64>,
        public_key: &BytesN<32>,
    ) -> Result<(), X402Error> {
        // Create the message to sign (EIP-712 style structured data)
        let message_hash = Self::create_payment_message(env, auth);
        
        // Convert BytesN<32> to Bytes for ed25519_verify
        let message_bytes = Bytes::from_array(env, &message_hash.to_array());
        
        // Verify ED25519 signature
        env.crypto().ed25519_verify(
            public_key,
            &message_bytes,  // Now using &Bytes
            signature,
        );
        
        Ok(())
    }

    /// Create EIP-712 style structured message
    fn create_payment_message(env: &Env, auth: &PaymentAuth) -> BytesN<32> {
        // For now, use a simple serialization approach
        // In production, you'd use a more robust serialization method
        let mut data = Bytes::new(env);
        
        // Serialize addresses and values (clone to avoid ownership issues)
        data.append(&auth.settlement_contract.clone().to_xdr(env));
        data.append(&auth.client.clone().to_xdr(env));
        data.append(&auth.server.clone().to_xdr(env));
        data.append(&auth.token.clone().to_xdr(env));
        
        // Append amount and nonce bytes
        data.append(&Bytes::from_array(env, &auth.amount.to_be_bytes()));
        data.append(&Bytes::from_array(env, &auth.nonce.to_be_bytes()));
        data.append(&Bytes::from_array(env, &auth.deadline.to_be_bytes()));
        
        env.crypto().sha256(&data).into()  // Convert Hash<32> to BytesN<32>
    }

    /// Validate payment authorization
    pub fn validate_auth(
        env: &Env,
        auth: &PaymentAuth,
        server: &Address,
    ) -> Result<(), X402Error> {
        // Check deadline
        if env.ledger().timestamp() > auth.deadline {
            return Err(X402Error::PaymentExpired);
        }

        // Check server matches
        if auth.server != *server {
            return Err(X402Error::Unauthorized);
        }

        // Check contract address
        if auth.settlement_contract != env.current_contract_address() {
            return Err(X402Error::Unauthorized);
        }

        // Check amount is positive
        if auth.amount <= 0 {
            return Err(X402Error::InvalidAmount);
        }

        Ok(())
    }
}
