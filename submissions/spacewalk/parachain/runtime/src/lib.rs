#![cfg_attr(not(feature = "std"), no_std)]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]

#[cfg(feature = "runtime-benchmarks")]
#[macro_use]
extern crate frame_benchmarking;

use codec::Encode;
pub use dia_oracle::dia::*;
use frame_support::{
	construct_runtime,
	genesis_builder_helper::{build_config, create_default_config},
	parameter_types,
	traits::{ConstU128, ConstU32, ConstU64, ConstU8, Contains},
	weights::{constants::WEIGHT_REF_TIME_PER_SECOND, ConstantMultiplier, IdentityFee, Weight},
	PalletId,
};
pub use frame_system::Call as SystemCall;
use orml_currencies::BasicCurrencyAdapter;
use orml_traits::{currency::MutationHooks, parameter_type_with_key};
pub use pallet_balances::Call as BalancesCall;
use pallet_grandpa::{
	fg_primitives, AuthorityId as GrandpaId, AuthorityList as GrandpaAuthorityList,
};
pub use pallet_timestamp::Call as TimestampCall;
use sp_api::impl_runtime_apis;
use sp_consensus_aura::sr25519::AuthorityId as AuraId;
use sp_core::{ConstBool, OpaqueMetadata, H256};
use sp_runtime::{
	create_runtime_str, generic, impl_opaque_keys,
	traits::{
		AccountIdConversion, AccountIdLookup, BlakeTwo256, Block as BlockT, Convert, NumberFor,
		Zero,
	},
	transaction_validity::{TransactionSource, TransactionValidity},
	ApplyExtrinsicResult, DispatchError, FixedPointNumber, Perbill, Perquintill,
	SaturatedConversion,
};
use sp_std::{marker::PhantomData, prelude::*};
#[cfg(feature = "std")]
use sp_version::NativeVersion;
use sp_version::RuntimeVersion;

// Parachain-specific imports
// TODO: Uncomment when parachain pallets are enabled
// use cumulus_pallet_parachain_system::RelayNumberStrictlyIncreases;
// use cumulus_primitives_core::ParaId;
// use cumulus_primitives_utility::ParentAsUmp;
// TODO: Uncomment when XCM is fully configured
// use xcm::latest::prelude::*;

use currency::Amount;
pub use issue::{Event as IssueEvent, IssueRequest};
pub use module_oracle_rpc_runtime_api::BalanceWrapper;
pub use nomination::Event as NominationEvent;
use oracle::dia::{DiaOracleAdapter, NativeCurrencyKey, XCMCurrencyConversion};
pub use primitives::{
	self, AccountId, Balance, BlockNumber, CurrencyId, Hash, Moment, Nonce, Signature,
	SignedFixedPoint, SignedInner, UnsignedFixedPoint, UnsignedInner,
};
pub use redeem::{Event as RedeemEvent, RedeemRequest};
pub use replace::{Event as ReplaceEvent, ReplaceRequest};
pub use security::StatusCode;
pub use stellar_relay::traits::{FieldLength, Organization, Validator};

type VaultId = primitives::VaultId<AccountId, CurrencyId>;

// Make the WASM binary available.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

impl_opaque_keys! {
	pub struct SessionKeys {
		pub aura: Aura,
		pub grandpa: Grandpa,
	}
}

pub const UNITS: Balance = 10_000_000_000;
pub const CENTS: Balance = UNITS / 100; // 100_000_000
pub const MILLICENTS: Balance = CENTS / 1_000; // 100_000

// These time units are defined in number of blocks.
pub const MINUTES: BlockNumber = 60_000 / (MILLISECS_PER_BLOCK as BlockNumber);
pub const HOURS: BlockNumber = MINUTES * 60;
pub const DAYS: BlockNumber = HOURS * 24;
pub const WEEKS: BlockNumber = DAYS * 7;
pub const YEARS: BlockNumber = DAYS * 365;

/// This runtime version.
#[sp_version::runtime_version]
pub const VERSION: RuntimeVersion = RuntimeVersion {
	spec_name: create_runtime_str!("spacewalk-parachain"),
	impl_name: create_runtime_str!("spacewalk-parachain"),
	authoring_version: 1,
	spec_version: 1,
	impl_version: 1,
	transaction_version: 1,
	apis: sp_version::create_apis_vec!([]),
	state_version: 0,
};

pub const MILLISECS_PER_BLOCK: u64 = 6000;
pub const SLOT_DURATION: u64 = MILLISECS_PER_BLOCK;

// Parachain ID - TODO: Set this to your assigned parachain ID
pub const PARA_ID: u32 = 2000;

pub struct BlockNumberToBalance;

impl Convert<BlockNumber, Balance> for BlockNumberToBalance {
	fn convert(a: BlockNumber) -> Balance {
		a.into()
	}
}

/// The version information used to identify this runtime when compiled natively.
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
	NativeVersion { runtime_version: VERSION, can_author_with: Default::default() }
}

const NORMAL_DISPATCH_RATIO: Perbill = Perbill::from_percent(75);

parameter_types! {
	pub const Version: RuntimeVersion = VERSION;
	pub const BlockHashCount: BlockNumber = 250;
	/// We allow for 2 seconds of compute with a 6 second average block time.
	pub BlockWeights: frame_system::limits::BlockWeights =
		frame_system::limits::BlockWeights::with_sensible_defaults(
			(2u64 * Weight::from_parts(WEIGHT_REF_TIME_PER_SECOND,0)).set_proof_size(u64::MAX),
			NORMAL_DISPATCH_RATIO,
		);
	pub BlockLength: frame_system::limits::BlockLength = frame_system::limits::BlockLength
		::max_with_normal_ratio(5 * 1024 * 1024, NORMAL_DISPATCH_RATIO);
	pub const SS58Prefix: u8 = 42;
}

impl frame_system::Config for Runtime {
	type Block = Block;
	type BaseCallFilter = frame_support::traits::Everything;
	type BlockWeights = BlockWeights;
	type BlockLength = BlockLength;
	/// The ubiquitous origin type.
	type RuntimeOrigin = RuntimeOrigin;
	/// The aggregated dispatch type that is available for extrinsics.
	type RuntimeCall = RuntimeCall;
	/// The index type for storing how many extrinsics an account has signed.
	type Nonce = Nonce;
	/// The type for hashing blocks and tries.
	type Hash = Hash;
	/// The hashing algorithm used.
	type Hashing = BlakeTwo256;
	/// The identifier used to distinguish between accounts.
	type AccountId = AccountId;
	/// The lookup mechanism to get account ID from whatever is passed in dispatchers.
	type Lookup = AccountIdLookup<AccountId, ()>;
	/// The ubiquitous event type.
	type RuntimeEvent = RuntimeEvent;
	/// Maximum number of block number to block hash mappings to keep (oldest pruned first).
	type BlockHashCount = BlockHashCount;
	type DbWeight = ();
	/// Runtime version.
	type Version = Version;
	/// Converts a module to an index of this module in the runtime.
	type PalletInfo = PalletInfo;
	type AccountData = pallet_balances::AccountData<Balance>;
	type OnNewAccount = ();
	type OnKilledAccount = ();
	type SystemWeightInfo = ();
	type SS58Prefix = SS58Prefix;
	type OnSetCode = ();
	type MaxConsumers = frame_support::traits::ConstU32<16>;
	type RuntimeTask = RuntimeTask;
}

parameter_types! {
	pub const MaxAuthorities: u32 = 32;
}

impl pallet_aura::Config for Runtime {
	type AuthorityId = AuraId;
	type DisabledValidators = ();
	type MaxAuthorities = MaxAuthorities;
	type AllowMultipleBlocksPerSlot = ConstBool<false>;
}

impl pallet_grandpa::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type KeyOwnerProof = sp_core::Void;
	type WeightInfo = ();
	type MaxAuthorities = MaxAuthorities;
	type MaxSetIdSessionEntries = ConstU64<0>;
	type EquivocationReportSystem = ();
	type MaxNominators = ConstU32<1000>;
}

parameter_types! {
	pub const MinimumPeriod: u64 = SLOT_DURATION / 2;
}

impl pallet_timestamp::Config for Runtime {
	/// A timestamp: milliseconds since the unix epoch.
	type Moment = Moment;
	type OnTimestampSet = ();
	type MinimumPeriod = MinimumPeriod;
	type WeightInfo = ();
}

const NATIVE_CURRENCY_ID: CurrencyId = CurrencyId::Native;
const PARENT_CURRENCY_ID: CurrencyId = CurrencyId::XCM(0);

parameter_types! {
	pub const GetNativeCurrencyId: CurrencyId = NATIVE_CURRENCY_ID;
	pub const GetRelayChainCurrencyId: CurrencyId = PARENT_CURRENCY_ID;
	pub const TransactionByteFee: Balance = MILLICENTS;
}

impl pallet_transaction_payment::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type OnChargeTransaction = pallet_transaction_payment::CurrencyAdapter<Balances, ()>;
	type OperationalFeeMultiplier = ConstU8<5>;
	type WeightToFee = IdentityFee<Balance>;
	type LengthToFee = ConstantMultiplier<Balance, TransactionByteFee>;
	type FeeMultiplierUpdate = ();
}

impl pallet_sudo::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type RuntimeCall = RuntimeCall;
	type WeightInfo = ();
}

// Pallet accounts
parameter_types! {
	pub const FeePalletId: PalletId = PalletId(*b"mod/fees");
	pub const VaultRegistryPalletId: PalletId = PalletId(*b"mod/vreg");
}

parameter_types! {
	// 5EYCAe5i8QbRr5WN1PvaAVqPbfXsqazk9ocaxuzcTjgXPM1e
	pub FeeAccount: AccountId = FeePalletId::get().into_account_truncating();
	// 5EYCAe5i8QbRra1jndPz1WAuf1q1KHQNfu2cW1EXJ231emTd
	pub VaultRegistryAccount: AccountId = VaultRegistryPalletId::get().into_account_truncating();
}

pub fn get_all_module_accounts() -> Vec<AccountId> {
	vec![FeeAccount::get(), VaultRegistryAccount::get()]
}

parameter_types! {
	pub const MaxLocks: u32 = 50;
}

parameter_type_with_key! {
	pub ExistentialDeposits: |_currency_id: CurrencyId| -> Balance {
		Zero::zero()
	};
}

pub struct CurrencyHooks<T>(PhantomData<T>);
impl<T: orml_tokens::Config> MutationHooks<T::AccountId, T::CurrencyId, T::Balance>
	for CurrencyHooks<T>
{
	type OnDust = orml_tokens::BurnDust<T>;
	type OnSlash = ();
	type PreDeposit = ();
	type PostDeposit = ();
	type PreTransfer = ();
	type PostTransfer = ();
	type OnNewTokenAccount = ();
	type OnKilledTokenAccount = ();
}

impl orml_tokens::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type Balance = Balance;
	type Amount = primitives::Amount;
	type CurrencyId = CurrencyId;
	type WeightInfo = ();
	type ExistentialDeposits = ExistentialDeposits;
	type CurrencyHooks = CurrencyHooks<Runtime>;
	type MaxLocks = MaxLocks;
	type MaxReserves = ();
	type ReserveIdentifier = [u8; 8];
	type DustRemovalWhitelist = DustRemovalWhitelist;
}

pub struct DustRemovalWhitelist;
impl Contains<AccountId> for DustRemovalWhitelist {
	fn contains(a: &AccountId) -> bool {
		[].contains(a)
	}
}

impl orml_currencies::Config for Runtime {
	type MultiCurrency = Tokens;
	type NativeCurrency = BasicCurrencyAdapter<Runtime, Balances, primitives::Amount, BlockNumber>;
	type GetNativeCurrencyId = GetNativeCurrencyId;
	type WeightInfo = ();
}

/// Existential deposit.
pub const EXISTENTIAL_DEPOSIT: u128 = 500;

impl pallet_balances::Config for Runtime {
	type Balance = Balance;
	type DustRemoval = ();
	type RuntimeEvent = RuntimeEvent;
	type ExistentialDeposit = ConstU128<EXISTENTIAL_DEPOSIT>;
	type AccountStore = System;
	type WeightInfo = pallet_balances::weights::SubstrateWeight<Runtime>;
	type MaxLocks = MaxLocks;
	type MaxReserves = ();
	type ReserveIdentifier = [u8; 8];
	type FreezeIdentifier = ();
	type MaxFreezes = ();
	type MaxHolds = ConstU32<1>;
	type RuntimeHoldReason = RuntimeHoldReason;
	type RuntimeFreezeReason = RuntimeFreezeReason;
}

impl security::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = security::SubstrateWeight<Runtime>;
}

pub struct CurrencyConvert;
impl currency::CurrencyConversion<currency::Amount<Runtime>, CurrencyId> for CurrencyConvert {
	fn convert(
		amount: &currency::Amount<Runtime>,
		to: CurrencyId,
	) -> Result<currency::Amount<Runtime>, DispatchError> {
		oracle::Pallet::<Runtime>::convert(amount, to)
	}
}

impl currency::Config for Runtime {
	type SignedInner = SignedInner;
	type SignedFixedPoint = SignedFixedPoint;
	type UnsignedFixedPoint = UnsignedFixedPoint;
	type Balance = Balance;
	type GetRelayChainCurrencyId = GetRelayChainCurrencyId;
	type AssetConversion = primitives::AssetConversion;
	type BalanceConversion = primitives::BalanceConversion;
	type CurrencyConversion = CurrencyConvert;
	type AmountCompatibility = primitives::StellarCompatibility;
}

impl staking::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type SignedFixedPoint = SignedFixedPoint;
	type SignedInner = SignedInner;
	type CurrencyId = CurrencyId;
	type GetNativeCurrencyId = GetNativeCurrencyId;
	type MaxRewardCurrencies = MaxRewardCurrencies;
}

pub type OrganizationId = u128;

parameter_types! {
	pub const OrganizationLimit: u32 = 255;
	pub const ValidatorLimit: u32 = 255;
	pub const IsPublicNetwork: bool = false;
}

impl stellar_relay::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type OrganizationId = OrganizationId;
	type OrganizationLimit = OrganizationLimit;
	type ValidatorLimit = ValidatorLimit;
	type IsPublicNetwork = IsPublicNetwork;
	type WeightInfo = stellar_relay::SubstrateWeight<Runtime>;
}

impl vault_registry::Config for Runtime {
	type PalletId = VaultRegistryPalletId;
	type RuntimeEvent = RuntimeEvent;
	type Balance = Balance;
	type WeightInfo = vault_registry::SubstrateWeight<Runtime>;
	type GetGriefingCollateralCurrencyId = GetRelayChainCurrencyId;
}

impl<C> frame_system::offchain::SendTransactionTypes<C> for Runtime
where
	RuntimeCall: From<C>,
{
	type OverarchingCall = RuntimeCall;
	type Extrinsic = UncheckedExtrinsic;
}

impl dia_oracle::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type RuntimeCall = RuntimeCall;
	type AuthorityId = dia_oracle::crypto::DiaAuthId;
	type WeightInfo = dia_oracle::weights::DiaWeightInfo<Runtime>;
}

impl frame_system::offchain::SigningTypes for Runtime {
	type Public = <Signature as sp_runtime::traits::Verify>::Signer;
	type Signature = Signature;
}

impl<LocalCall> frame_system::offchain::CreateSignedTransaction<LocalCall> for Runtime
where
	RuntimeCall: From<LocalCall>,
{
	fn create_transaction<C: frame_system::offchain::AppCrypto<Self::Public, Self::Signature>>(
		call: RuntimeCall,
		public: <Signature as sp_runtime::traits::Verify>::Signer,
		account: AccountId,
		index: Nonce,
	) -> Option<(
		RuntimeCall,
		<UncheckedExtrinsic as sp_runtime::traits::Extrinsic>::SignaturePayload,
	)> {
		let period = BlockHashCount::get() as u64;
		let current_block = System::block_number().saturated_into::<u64>().saturating_sub(1);
		let tip = 0;
		let extra: SignedExtra = (
			frame_system::CheckSpecVersion::<Runtime>::new(),
			frame_system::CheckTxVersion::<Runtime>::new(),
			frame_system::CheckGenesis::<Runtime>::new(),
			frame_system::CheckEra::<Runtime>::from(generic::Era::mortal(period, current_block)),
			frame_system::CheckNonce::<Runtime>::from(index),
			frame_system::CheckWeight::<Runtime>::new(),
			pallet_transaction_payment::ChargeTransactionPayment::<Runtime>::from(tip),
		);

		let raw_payload = SignedPayload::new(call, extra).ok()?;
		let signature = raw_payload.using_encoded(|payload| C::sign(payload, public))?;
		let address = account;
		let (call, extra, _) = raw_payload.deconstruct();
		Some((call, (sp_runtime::MultiAddress::Id(address), signature, extra)))
	}
}

// Parachain Info - provides ParaId
// TODO: Uncomment once staging_parachain_info import is fixed
// impl pallet_parachain_info::Config for Runtime {}

// Parachain System Configuration - parameter_types can be before construct_runtime
parameter_types! {
	pub ReservedDmpWeight: Weight = Weight::from_parts(1_000_000_000_000, 0);
	pub ReservedXcmpWeight: Weight = Weight::from_parts(1_000_000_000_000, 0);
}

// NOTE: Parachain-specific impl blocks that reference types from construct_runtime!
// (like XcmpQueue, ParachainSystem, PolkadotXcm) must come AFTER construct_runtime!
// They are moved below after the construct_runtime! macro.

// Oracle configuration (copy from testnet runtime)
pub struct SpacewalkNativeCurrencyKey;

impl NativeCurrencyKey for SpacewalkNativeCurrencyKey {
	fn native_symbol() -> Vec<u8> {
		"LOCAL".as_bytes().to_vec()
	}

	fn native_chain() -> Vec<u8> {
		"LOCAL".as_bytes().to_vec()
	}
}

impl XCMCurrencyConversion for SpacewalkNativeCurrencyKey {
	fn convert_to_dia_currency_id(token_symbol: u8) -> Option<(Vec<u8>, Vec<u8>)> {
		let blockchain = vec![0u8];
		let symbol = vec![token_symbol];
		Some((blockchain, symbol))
	}

	fn convert_from_dia_currency_id(blockchain: Vec<u8>, symbol: Vec<u8>) -> Option<u8> {
		if blockchain.len() != 1 && blockchain[0] != 0 || symbol.len() != 1 {
			return None;
		}
		Some(symbol[0])
	}
}

cfg_if::cfg_if! {
	if #[cfg(feature = "testing-utils")] {
		type DataProviderImpl = DiaOracleAdapter<
			DiaOracleModule,
			UnsignedFixedPoint,
			Moment,
			oracle::dia::DiaOracleKeyConvertor<SpacewalkNativeCurrencyKey>,
			ConvertPrice,
			ConvertMoment,
		>;
	} else if #[cfg(feature = "runtime-benchmarks")] {
		use oracle::testing_utils::{
			MockConvertMoment, MockConvertPrice, MockDiaOracle, MockOracleKeyConvertor,
		};
		type DataProviderImpl = DiaOracleAdapter<
			MockDiaOracle,
			UnsignedFixedPoint,
			Moment,
			MockOracleKeyConvertor,
			MockConvertPrice,
			MockConvertMoment<Moment>,
		>;
	} else {
		type DataProviderImpl = DiaOracleAdapter<
			DiaOracleModule,
			UnsignedFixedPoint,
			Moment,
			oracle::dia::DiaOracleKeyConvertor<SpacewalkNativeCurrencyKey>,
			ConvertPrice,
			ConvertMoment,
		>;
	}
}

#[cfg(any(feature = "runtime-benchmarks", feature = "testing-utils"))]
use oracle::testing_utils::MockDataFeeder;
use primitives::DefaultDecimalsLookup;

impl oracle::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = oracle::SubstrateWeight<Runtime>;
	type DecimalsLookup = DefaultDecimalsLookup;
	type DataProvider = DataProviderImpl;

	#[cfg(any(feature = "runtime-benchmarks", feature = "testing-utils"))]
	type DataFeeder = MockDataFeeder<AccountId, Moment>;
}

impl issue::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type BlockNumberToBalance = BlockNumberToBalance;
	type WeightInfo = issue::SubstrateWeight<Runtime>;
}

impl redeem::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = redeem::SubstrateWeight<Runtime>;
}

impl replace::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = replace::SubstrateWeight<Runtime>;
}

parameter_types! {
	pub const MaxExpectedValue: UnsignedFixedPoint = UnsignedFixedPoint::from_inner(<UnsignedFixedPoint as FixedPointNumber>::DIV);
}

impl fee::Config for Runtime {
	type FeePalletId = FeePalletId;
	type WeightInfo = fee::SubstrateWeight<Runtime>;
	type SignedFixedPoint = SignedFixedPoint;
	type SignedInner = SignedInner;
	type UnsignedFixedPoint = UnsignedFixedPoint;
	type UnsignedInner = UnsignedInner;
	type VaultRewards = VaultRewards;
	type VaultStaking = VaultStaking;
	type OnSweep = currency::SweepFunds<Runtime, FeeAccount>;
	type MaxExpectedValue = MaxExpectedValue;
	type RewardDistribution = RewardDistribution;
}

impl nomination::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = nomination::SubstrateWeight<Runtime>;
}

impl clients_info::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = clients_info::SubstrateWeight<Runtime>;
	type MaxNameLength = ConstU32<255>;
	type MaxUriLength = ConstU32<255>;
}

parameter_types! {
	pub const DecayRate: Perquintill = Perquintill::from_percent(5);
	pub const MaxCurrencies: u32 = 10;
}

impl reward_distribution::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type WeightInfo = reward_distribution::SubstrateWeight<Runtime>;
	type Balance = Balance;
	type DecayInterval = ConstU32<100>;
	type DecayRate = DecayRate;
	type VaultRewards = VaultRewards;
	type MaxCurrencies = MaxCurrencies;
	type OracleApi = Oracle;
	type Balances = Balances;
	type VaultStaking = VaultStaking;
	type FeePalletId = FeePalletId;
}

parameter_types! {
	pub const MaxRewardCurrencies: u32 = 10;
}

impl pooled_rewards::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type SignedFixedPoint = SignedFixedPoint;
	type PoolId = CurrencyId;
	type PoolRewardsCurrencyId = CurrencyId;
	type StakeId = VaultId;
	type MaxRewardCurrencies = MaxRewardCurrencies;
}

// TODO: Add parachain system pallet configuration
// impl cumulus_pallet_parachain_system::Config for Runtime {
//     type RuntimeEvent = RuntimeEvent;
//     type OnSystemEvent = ();
//     type SelfParaId = parachain_info::Pallet<Runtime>;
//     type OutboundXcmpMessageSource = XcmpQueue;
//     type DmpMessageHandler = DmpQueue;
//     type ReservedDmpWeight = ReservedDmpWeight;
//     type XcmpMessageHandler = XcmpQueue;
//     type ReservedXcmpWeight = ReservedXcmpWeight;
//     type CheckAssociatedRelayNumber = RelayNumberStrictlyIncreases;
//     type ConsensusHook = cumulus_pallet_aura_ext::FixedVelocityConsensusHook<
//         Runtime,
//         RELAY_CHAIN_SLOT_DURATION_MILLIS,
//         BLOCK_PROCESSING_VELOCITY,
//         UNINCLUDED_SEGMENT_CAPACITY,
//     >;
//     type WeightInfo = cumulus_pallet_parachain_system::weights::SubstrateWeight<Runtime>;
// }

// TODO: Add XCMP queue configuration
// impl cumulus_pallet_xcmp_queue::Config for Runtime {
//     type RuntimeEvent = RuntimeEvent;
//     type XcmExecutor = XcmExecutor<XcmConfig>;
//     type ChannelInfo = ParachainSystem;
//     type VersionWrapper = PolkadotXcm;
//     type ExecuteOverweightOrigin = EnsureRoot<AccountId>;
//     type ControllerOrigin = EnsureRoot<AccountId>;
//     type ControllerOriginConverter = XcmOriginToTransactDispatchOrigin;
//     type WeightInfo = cumulus_pallet_xcmp_queue::weights::SubstrateWeight<Runtime>;
// }

// TODO: Add XCM configuration
// pub type XcmRouter = (
//     // Two routers - use UMP to communicate with the relay chain:
//     cumulus_primitives_utility::ParentAsUmp<ParachainSystem, ()>,
//     // ..and XCMP to communicate with other parachains.
//     XcmpQueue,
// );

construct_runtime! {
	pub enum Runtime
	{
		System: frame_system = 0,
		Timestamp: pallet_timestamp = 1,
		Aura: pallet_aura = 2,
		Grandpa: pallet_grandpa = 3,
		Sudo: pallet_sudo = 4,
		Tokens: orml_tokens = 5,
		Currencies: orml_currencies = 7,
		Balances: pallet_balances = 8,
		TransactionPayment: pallet_transaction_payment::{Pallet, Storage, Event<T>} = 9,

		StellarRelay: stellar_relay = 10,

		VaultRewards: pooled_rewards = 15,
		VaultStaking: staking = 16,

		Currency: currency = 17,

		Security: security = 19,
		VaultRegistry: vault_registry = 21,
		Oracle: oracle = 22,
		Issue: issue = 23,
		Redeem: redeem = 24,
		Replace: replace = 25,
		Fee: fee = 26,
		Nomination: nomination = 28,
		DiaOracleModule: dia_oracle = 29,
		ClientsInfo: clients_info = 30,
		RewardDistribution: reward_distribution = 31,

		// Parachain-specific pallets
		// TODO: Uncomment these once Config traits are properly implemented for v1.6.0
		// ParachainInfo: pallet_parachain_info = 11,
		// ParachainSystem: cumulus_pallet_parachain_system = 20,
		// XcmpQueue: cumulus_pallet_xcmp_queue = 32,
		// PolkadotXcm: pallet_xcm = 33,
	}
}

/// The address format for describing accounts.
pub type Address = sp_runtime::MultiAddress<AccountId, ()>;
/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;
/// A Block signed with a Justification
pub type SignedBlock = generic::SignedBlock<Block>;
/// BlockId type as expected by this runtime.
pub type BlockId = generic::BlockId<Block>;
/// The SignedExtension to the basic transaction logic.
pub type SignedExtra = (
	frame_system::CheckSpecVersion<Runtime>,
	frame_system::CheckTxVersion<Runtime>,
	frame_system::CheckGenesis<Runtime>,
	frame_system::CheckEra<Runtime>,
	frame_system::CheckNonce<Runtime>,
	frame_system::CheckWeight<Runtime>,
	pallet_transaction_payment::ChargeTransactionPayment<Runtime>,
);
/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic =
	generic::UncheckedExtrinsic<Address, RuntimeCall, Signature, SignedExtra>;
/// Extrinsic type that has already been checked.
pub type CheckedExtrinsic = generic::CheckedExtrinsic<AccountId, RuntimeCall, SignedExtra>;
pub type SignedPayload =
	generic::SignedPayload<RuntimeCall, SignedExtra>;

pub struct ConvertPrice;
impl Convert<u128, Option<UnsignedFixedPoint>> for ConvertPrice {
	fn convert(price: u128) -> Option<UnsignedFixedPoint> {
		Some(UnsignedFixedPoint::from_inner(price))
	}
}
pub struct ConvertMoment;
impl Convert<u64, Option<Moment>> for ConvertMoment {
	fn convert(moment: u64) -> Option<Moment> {
		// The provided moment is in seconds, but we need milliseconds
		Some(moment.saturating_mul(1000))
	}
}

// Parachain-specific configurations (must come after construct_runtime!)
// DMP Queue - handles downward messages from relay chain
// TODO: Fix MessageQueue type for v1.6.0
// pub type DmpQueue = cumulus_pallet_parachain_system::MessageQueue;

// XCM Configuration
pub type XcmOriginToTransactDispatchOrigin = (
	// Native converter for Relay-chain (Parent) location; will convert to a `Relay` origin when
	// recognized.
	xcm_builder::ParentAsSuperuser<RuntimeOrigin>,
);

// XCM Executor Configuration
// TODO: Implement full XCM config for v1.6.0
// This needs to implement staging_xcm_executor::Config with:
// - AssetTransactor (for handling asset transfers)
// - IsReserve (for identifying reserve locations)
// - IsTeleporter (for teleporting assets)
// - Barrier (for filtering XCM messages)
// - Weigher (for calculating XCM execution weights)
// For now, this is a placeholder
pub struct XcmConfig;

// TODO: XcmExecutor needs proper XcmConfig that implements staging_xcm_executor::Config
// pub type XcmExecutor = xcm_executor::XcmExecutor<XcmConfig>;

// XCM Router - routes XCM messages
// TODO: Uncomment once ParachainSystem and XcmpQueue types are available
/*
pub type XcmRouter = (
	// Two routers - use UMP to communicate with the relay chain:
	ParentAsUmp<ParachainSystem, ()>,
	// ..and XCMP to communicate with other parachains.
	XcmpQueue,
);
*/

// Parachain System Configuration
// TODO: Uncomment and fix once v1.6.0 API is confirmed
// The trait API has changed - DmpMessageHandler and ConsensusHook are not members
/*
impl cumulus_pallet_parachain_system::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type OnSystemEvent = ();
	type SelfParaId = pallet_parachain_info::Pallet<Runtime>;
	type OutboundXcmpMessageSource = XcmpQueue;
	type DmpQueue = DmpQueue;  // May have different name
	type ReservedDmpWeight = ReservedDmpWeight;
	type XcmpMessageHandler = XcmpQueue;
	type ReservedXcmpWeight = ReservedXcmpWeight;
	type CheckAssociatedRelayNumber = RelayNumberStrictlyIncreases;
	type WeightInfo = cumulus_pallet_parachain_system::weights::SubstrateWeight<Runtime>;
}
*/

// XCMP Queue Configuration
// TODO: Update for Polkadot SDK v1.6.0 - trait API has changed
// Check actual trait definition in cumulus_pallet_xcmp_queue::Config
// The following is a placeholder - needs to be updated based on actual v1.6.0 API
/*
impl cumulus_pallet_xcmp_queue::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type XcmExecutor = XcmExecutor;
	type ChannelInfo = ParachainSystem;
	type VersionWrapper = PolkadotXcm;
	type XcmpQueue = XcmpQueue;  // May have different name
	type MaxInboundSuspended = ...;  // Need to define
	type PriceForSiblingDelivery = ...;  // Need to define
	type ControllerOrigin = frame_system::EnsureRoot<AccountId>;
	type ControllerOriginConverter = XcmOriginToTransactDispatchOrigin;
	type WeightInfo = cumulus_pallet_xcmp_queue::weights::SubstrateWeight<Runtime>;
}
*/

// Polkadot XCM Configuration
// TODO: Update for Polkadot SDK v1.6.0 - trait API has changed
// Check actual trait definition in pallet_xcm::Config
// Missing required members: XcmTeleportFilter, XcmReserveTransferFilter
// The following is a placeholder - needs to be updated based on actual v1.6.0 API
/*
impl pallet_xcm::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type SendXcmOrigin = xcm_builder::EnsureXcmOrigin<RuntimeOrigin, ()>;
	type XcmRouter = XcmRouter;
	type ExecuteXcmOrigin = xcm_builder::EnsureXcmOrigin<RuntimeOrigin, ()>;
	type XcmExecuteFilter = frame_support::traits::Everything;
	type XcmExecutor = XcmExecutor;
	type Weigher = ();  // Need proper Weigher implementation
	type UniversalLocation = ();  // Need proper UniversalLocation
	type RuntimeOrigin = RuntimeOrigin;
	type RuntimeCall = RuntimeCall;
	const VERSION_DISCOVERY_QUEUE_SIZE: u32 = 100;
	type AdvertisedXcmVersion = ();
	type Currency = Balances;
	type CurrencyMatcher = ();
	type TrustedLockers = ();
	type SovereignAccountOf = ();
	type MaxLockers = ConstU32<8>;
	type WeightInfo = pallet_xcm::weights::SubstrateWeight<Runtime>;  // May have different path
	type AdminOrigin = frame_system::EnsureRoot<AccountId>;
	type MaxRemoteLockConsumers = ConstU32<0>;
	type RemoteLockConsumerIdentifier = ();
	type XcmTeleportFilter = frame_support::traits::Everything;  // Required in v1.6.0
	type XcmReserveTransferFilter = frame_support::traits::Everything;  // Required in v1.6.0
}
*/

// Executive: handles dispatch to the various modules.
pub type Executive = frame_executive::Executive<
	Runtime,
	Block,
	frame_system::ChainContext<Runtime>,
	Runtime,
	AllPalletsWithSystem,
>;

#[cfg(feature = "runtime-benchmarks")]
mod benches {
	define_benchmarks!(
		[clients_info, ClientsInfo]
		[frame_benchmarking, BaselineBench::<Runtime>]
		[frame_system, SystemBench::<Runtime>]
		[stellar_relay, StellarRelay]
		[issue, Issue]
		[fee, Fee]
		[oracle, Oracle]
		[redeem, Redeem]
		[replace, Replace]
		[vault_registry, VaultRegistry]
		[nomination, Nomination]
		[reward_distribution, RewardDistribution]
	);
}

impl_runtime_apis! {
	impl sp_api::Core<Block> for Runtime {
		fn version() -> RuntimeVersion {
			VERSION
		}

		fn execute_block(block: Block) {
			Executive::execute_block(block)
		}

		fn initialize_block(header: &<Block as BlockT>::Header) {
			Executive::initialize_block(header)
		}
	}

	impl sp_api::Metadata<Block> for Runtime {
		fn metadata() -> OpaqueMetadata {
			OpaqueMetadata::new(Runtime::metadata().into())
		}

		fn metadata_at_version(version: u32) -> Option<OpaqueMetadata> {
			Runtime::metadata_at_version(version)
		}

		fn metadata_versions() -> sp_std::vec::Vec<u32> {
			Runtime::metadata_versions()
		}
	}

	impl sp_block_builder::BlockBuilder<Block> for Runtime {
		fn apply_extrinsic(extrinsic: <Block as BlockT>::Extrinsic) -> ApplyExtrinsicResult {
			Executive::apply_extrinsic(extrinsic)
		}

		fn finalize_block() -> <Block as BlockT>::Header {
			Executive::finalize_block()
		}

		fn inherent_extrinsics(data: sp_inherents::InherentData) -> Vec<<Block as BlockT>::Extrinsic> {
			data.create_extrinsics()
		}

		fn check_inherents(
			block: Block,
			data: sp_inherents::InherentData,
		) -> sp_inherents::CheckInherentsResult {
			data.check_extrinsics(&block)
		}
	}

	impl sp_transaction_pool::runtime_api::TaggedTransactionQueue<Block> for Runtime {
		fn validate_transaction(
			source: TransactionSource,
			tx: <Block as BlockT>::Extrinsic,
			block_hash: <Block as BlockT>::Hash,
		) -> TransactionValidity {
			Executive::validate_transaction(source, tx, block_hash)
		}
	}

	impl sp_offchain::OffchainWorkerApi<Block> for Runtime {
		fn offchain_worker(header: &<Block as BlockT>::Header) {
			Executive::offchain_worker(header)
		}
	}

	impl sp_session::SessionKeys<Block> for Runtime {
		fn decode_session_keys(
			encoded: Vec<u8>,
		) -> Option<Vec<(Vec<u8>, sp_core::crypto::KeyTypeId)>> {
			SessionKeys::decode_into_raw_public_keys(&encoded)
		}

		fn generate_session_keys(seed: Option<Vec<u8>>) -> Vec<u8> {
			SessionKeys::generate(seed)
		}
	}

	impl sp_consensus_aura::AuraApi<Block, AuraId> for Runtime {
		fn slot_duration() -> sp_consensus_aura::SlotDuration {
			sp_consensus_aura::SlotDuration::from_millis(SLOT_DURATION)
		}

		fn authorities() -> Vec<AuraId> {
			Aura::authorities().into_inner()
		}
	}

	impl fg_primitives::GrandpaApi<Block> for Runtime {
		fn grandpa_authorities() -> GrandpaAuthorityList {
			Grandpa::grandpa_authorities()
		}

		fn current_set_id() -> fg_primitives::SetId {
			Grandpa::current_set_id()
		}

		fn submit_report_equivocation_unsigned_extrinsic(
			_equivocation_proof: fg_primitives::EquivocationProof<
				<Block as BlockT>::Hash,
				NumberFor<Block>,
			>,
			_key_owner_proof: fg_primitives::OpaqueKeyOwnershipProof,
		) -> Option<()> {
			None
		}

		fn generate_key_ownership_proof(
			_set_id: fg_primitives::SetId,
			_authority_id: GrandpaId,
		) -> Option<fg_primitives::OpaqueKeyOwnershipProof> {
			// NOTE: this is the only implementation possible since we've
			// defined our key owner proof type as a bottom type (i.e. a type
			// with no values).
			None
		}
	}

	impl frame_system_rpc_runtime_api::AccountNonceApi<Block, AccountId, Nonce> for Runtime {
		fn account_nonce(account: AccountId) -> Nonce {
			System::account_nonce(account)
		}
	}

	impl pallet_transaction_payment_rpc_runtime_api::TransactionPaymentApi<Block, Balance> for Runtime {
		fn query_info(
			uxt: <Block as BlockT>::Extrinsic,
			len: u32,
		) -> pallet_transaction_payment_rpc_runtime_api::RuntimeDispatchInfo<Balance> {
			TransactionPayment::query_info(uxt, len)
		}

		fn query_fee_details(
			uxt: <Block as BlockT>::Extrinsic,
			len: u32,
		) -> pallet_transaction_payment_rpc_runtime_api::FeeDetails<Balance> {
			TransactionPayment::query_fee_details(uxt, len)
		}

		fn query_weight_to_fee(weight: Weight) -> Balance {
			TransactionPayment::weight_to_fee(weight)
		}

		fn query_length_to_fee(length: u32) -> Balance {
			TransactionPayment::length_to_fee(length)
		}
	}

	// TODO: Add parachain-specific runtime APIs
	// impl cumulus_primitives_core::CollectCollationInfo<Block> for Runtime {
	//     fn collect_collation_info(header: &<Block as BlockT>::Header) -> cumulus_primitives_core::CollationInfo {
	//         ParachainSystem::collect_collation_info(header)
	//     }
	// }

	// RPC APIs for Spacewalk pallets - matching testnet runtime exactly
	impl module_issue_rpc_runtime_api::IssueApi<
		Block,
		AccountId,
		H256,
		IssueRequest<AccountId, BlockNumber, Balance, CurrencyId>
	> for Runtime {
		fn get_issue_requests(account_id: AccountId) -> Vec<H256> {
			Issue::get_issue_requests_for_account(account_id)
		}

		fn get_vault_issue_requests(vault_id: AccountId) -> Vec<H256> {
			Issue::get_issue_requests_for_vault(vault_id)
		}
	}

	impl module_vault_registry_rpc_runtime_api::VaultRegistryApi<
		Block,
		VaultId,
		Balance,
		UnsignedFixedPoint,
		CurrencyId,
		AccountId,
	> for Runtime {
		fn get_vault_collateral(vault_id: VaultId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let result = VaultRegistry::compute_collateral(&vault_id)?;
			Ok(BalanceWrapper{amount:result.amount()})
		}

		fn get_vaults_by_account_id(account_id: AccountId) -> Result<Vec<VaultId>, DispatchError> {
			VaultRegistry::get_vaults_by_account_id(account_id)
		}

		fn get_vault_total_collateral(vault_id: VaultId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let result = VaultRegistry::get_backing_collateral(&vault_id)?;
			Ok(BalanceWrapper{amount:result.amount()})
		}

		fn get_premium_redeem_vaults() -> Result<Vec<(VaultId, BalanceWrapper<Balance>)>, DispatchError> {
			let result = VaultRegistry::get_premium_redeem_vaults()?;
			Ok(result.iter().map(|v| (v.0.clone(), BalanceWrapper{amount:v.1.amount()})).collect())
		}

		fn get_vaults_with_issuable_tokens() -> Result<Vec<(VaultId, BalanceWrapper<Balance>)>, DispatchError> {
			let result = VaultRegistry::get_vaults_with_issuable_tokens()?;
			Ok(result.into_iter().map(|v| (v.0, BalanceWrapper{amount:v.1.amount()})).collect())
		}

		fn get_vaults_with_redeemable_tokens() -> Result<Vec<(VaultId, BalanceWrapper<Balance>)>, DispatchError> {
			let result = VaultRegistry::get_vaults_with_redeemable_tokens()?;
			Ok(result.into_iter().map(|v| (v.0, BalanceWrapper{amount:v.1.amount()})).collect())
		}

		fn get_issuable_tokens_from_vault(vault: VaultId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let result = VaultRegistry::get_issuable_tokens_from_vault(&vault)?;
			Ok(BalanceWrapper{amount:result.amount()})
		}

		fn get_collateralization_from_vault(vault: VaultId, only_issued: bool) -> Result<UnsignedFixedPoint, DispatchError> {
			VaultRegistry::get_collateralization_from_vault(vault, only_issued)
		}

		fn get_collateralization_from_vault_and_collateral(vault: VaultId, collateral: BalanceWrapper<Balance>, only_issued: bool) -> Result<UnsignedFixedPoint, DispatchError> {
			let amount = Amount::new(collateral.amount, vault.collateral_currency());
			VaultRegistry::get_collateralization_from_vault_and_collateral(vault, &amount, only_issued)
		}

		fn get_required_collateral_for_wrapped(amount_wrapped: BalanceWrapper<Balance>, wrapped_currency_id: CurrencyId,  collateral_currency_id: CurrencyId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let amount_wrapped = Amount::new(amount_wrapped.amount, wrapped_currency_id);
			let result = VaultRegistry::get_required_collateral_for_wrapped(&amount_wrapped, collateral_currency_id)?;
			Ok(BalanceWrapper{amount:result.amount()})
		}

		fn get_required_collateral_for_vault(vault_id: VaultId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let result = VaultRegistry::get_required_collateral_for_vault(vault_id)?;
			Ok(BalanceWrapper{amount:result.amount()})
		}
	}

	impl module_redeem_rpc_runtime_api::RedeemApi<
		Block,
		AccountId,
		H256,
		RedeemRequest<AccountId, BlockNumber, Balance, CurrencyId>
	> for Runtime {
		fn get_redeem_requests(account_id: AccountId) -> Vec<H256> {
			Redeem::get_redeem_requests_for_account(account_id)
		}

		fn get_vault_redeem_requests(vault_account_id: AccountId) -> Vec<H256> {
			Redeem::get_redeem_requests_for_vault(vault_account_id)
		}
	}

	impl module_replace_rpc_runtime_api::ReplaceApi<
		Block,
		AccountId,
		H256,
		ReplaceRequest<AccountId, BlockNumber, Balance, CurrencyId>
	> for Runtime {
		fn get_old_vault_replace_requests(vault_id: AccountId) -> Vec<H256> {
			Replace::get_replace_requests_for_old_vault(vault_id)
		}

		fn get_new_vault_replace_requests(vault_id: AccountId) -> Vec<H256> {
			Replace::get_replace_requests_for_new_vault(vault_id)
		}
	}

	impl module_oracle_rpc_runtime_api::OracleApi<
		Block,
		Balance,
		CurrencyId
	> for Runtime {
		fn currency_to_usd(amount: BalanceWrapper<Balance>, currency_id: CurrencyId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let result = Oracle::currency_to_usd(amount.amount, currency_id)?;
			Ok(BalanceWrapper{amount:result})
		}

		fn usd_to_currency(amount: BalanceWrapper<Balance>, currency_id: CurrencyId) -> Result<BalanceWrapper<Balance>, DispatchError> {
			let result = Oracle::usd_to_currency(amount.amount, currency_id)?;
			Ok(BalanceWrapper{amount:result})
		}

		fn get_exchange_rate(currency_id: CurrencyId) -> Result<UnsignedFixedPoint, DispatchError> {
			let result = Oracle::get_exchange_rate(currency_id)?;
			Ok(result)
		}
	}

	impl sp_genesis_builder::GenesisBuilder<Block> for Runtime {
		fn create_default_config() -> Vec<u8> {
			create_default_config::<RuntimeGenesisConfig>()
		}

		fn build_config(config: Vec<u8>) -> sp_genesis_builder::Result {
			build_config::<RuntimeGenesisConfig>(config)
		}
	}

}
