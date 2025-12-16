use soroban_sdk::{contracttype, contracterror, Address, BytesN};

#[derive(Clone, Copy, PartialEq)]
#[contracttype]
pub enum ChannelState {
    None,
    Open,
    PendingClose,
    Closed,
}

#[derive(Clone)]
#[contracttype]
pub struct Channel {
    pub escrow_balance: i128,
    pub token: Address,
    pub opened_at: u64,
    pub last_activity_at: u64,
    pub ttl_seconds: u64,
    pub state: ChannelState,
    pub closed_by: Option<Address>,
    pub pending_settlements: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct PaymentAuth {
    pub settlement_contract: Address,
    pub client: Address,
    pub server: Address,
    pub token: Address,
    pub amount: i128,
    pub nonce: u64,
    pub deadline: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct Settlement {
    pub amount: i128,
    pub timestamp: u64,
    pub auth_hash: BytesN<32>,
}

#[contracttype]
pub enum DataKey {
    Channel(Address, Address),           // (client, server)
    UsedNonce(Address, Address, u64),    // (client, server, nonce)
    ClientNonce(Address),                 // client
    SettlementHistory(Address, Address), // (client, server)
    MinimumPayment(Address),             // token
    Admin,
    Paused,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum X402Error {
    Unauthorized = 1,
    ChannelNotOpen = 2,
    InvalidSignature = 3,
    NonceAlreadyUsed = 4,
    PaymentExpired = 5,
    InsufficientEscrow = 6,
    InvalidAmount = 7,
    ContractPaused = 8,
    InvalidNonce = 9,
    RateLimitExceeded = 10,
    ChannelAlreadyExists = 11,
    PendingSettlements = 12,
}
