use spacewalk_parachain_runtime::{
	AccountId, AuraConfig, BalancesConfig, FeeConfig, FieldLength, GrandpaConfig, IssueConfig,
	NominationConfig, OracleConfig, Organization, RedeemConfig, ReplaceConfig,
	RuntimeGenesisConfig, SecurityConfig, Signature, StatusCode, StellarRelayConfig, SudoConfig,
	TokensConfig, Validator, VaultRegistryConfig, DAYS, WASM_BINARY,
};
use std::convert::TryFrom;

use frame_support::BoundedVec;
use sc_service::ChainType;
use sp_arithmetic::{FixedPointNumber, FixedU128};
use sp_consensus_aura::sr25519::AuthorityId as AuraId;
use sp_consensus_grandpa::{AuthorityId as GrandpaId, AuthorityWeight as GrandpaWeight};
use sp_core::{sr25519, Pair, Public};
use sp_runtime::traits::{IdentifyAccount, Verify};

use primitives::{oracle::Key, CurrencyId, VaultCurrencyPair};
use serde_json::{map::Map, Value};

pub type ChainSpec = sc_service::GenericChainSpec<RuntimeGenesisConfig>;

/// Helper function to generate a crypto pair from seed
pub fn get_from_seed<TPublic: Public>(seed: &str) -> <TPublic::Pair as Pair>::Public {
	TPublic::Pair::from_string(&format!("//{}", seed), None)
		.expect("static values are valid; qed")
		.public()
}

// For mainnet USDC issued by centre.io
const WRAPPED_CURRENCY_ID_STELLAR_MAINNET: CurrencyId = CurrencyId::AlphaNum4(
	*b"USDC",
	[
		59, 153, 17, 56, 14, 254, 152, 139, 160, 168, 144, 14, 177, 207, 228, 79, 54, 111, 125,
		190, 148, 107, 237, 7, 114, 64, 247, 246, 36, 223, 21, 197,
	],
);

// For Testnet USDC issued by
const WRAPPED_CURRENCY_ID_STELLAR_TESTNET: CurrencyId = CurrencyId::AlphaNum4(
	*b"USDC",
	[
		20, 209, 150, 49, 176, 55, 23, 217, 171, 154, 54, 110, 16, 50, 30, 226, 102, 231, 46, 199,
		108, 171, 97, 144, 240, 161, 51, 109, 72, 34, 159, 139,
	],
);

const MXN_CURRENCY_ID: CurrencyId = CurrencyId::AlphaNum4(
	*b"MXN\0",
	[
		20, 209, 150, 49, 176, 55, 23, 217, 171, 154, 54, 110, 16, 50, 30, 226, 102, 231, 46, 199,
		108, 171, 97, 144, 240, 161, 51, 109, 72, 34, 159, 139,
	],
);

/// Generate an Aura authority key.
pub fn authority_keys_from_seed(s: &str) -> (AuraId, GrandpaId) {
	(get_from_seed::<AuraId>(s), get_from_seed::<GrandpaId>(s))
}

type AccountPublic = <Signature as Verify>::Signer;

/// Helper function to generate an account ID from seed
pub fn get_account_id_from_seed<TPublic: Public>(seed: &str) -> AccountId
where
	AccountPublic: From<<TPublic::Pair as Pair>::Public>,
{
	AccountPublic::from(get_from_seed::<TPublic>(seed)).into_account()
}

fn get_properties() -> Map<String, Value> {
	let mut properties = Map::new();
	properties.insert("ss58Format".into(), spacewalk_parachain_runtime::SS58Prefix::get().into());
	properties
}

pub fn development_config() -> Result<ChainSpec, String> {
	Ok(ChainSpec::builder(
		WASM_BINARY.ok_or("Development wasm binary not available")?,
		Default::default(),
	)
	.with_name("Spacewalk Development")
	.with_id("spacewalk_dev")
	.with_chain_type(ChainType::Development)
	.with_properties(get_properties())
	.with_genesis_config_patch(genesis(
		get_account_id_from_seed::<sr25519::Public>("Alice"),
		vec![authority_keys_from_seed("Alice")],
		vec![
			get_account_id_from_seed::<sr25519::Public>("Alice"),
			get_account_id_from_seed::<sr25519::Public>("Bob"),
			get_account_id_from_seed::<sr25519::Public>("Charlie"),
			get_account_id_from_seed::<sr25519::Public>("Dave"),
			get_account_id_from_seed::<sr25519::Public>("Eve"),
			get_account_id_from_seed::<sr25519::Public>("Ferdie"),
			get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
			get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
			get_account_id_from_seed::<sr25519::Public>("Charlie//stash"),
			get_account_id_from_seed::<sr25519::Public>("Dave//stash"),
			get_account_id_from_seed::<sr25519::Public>("Eve//stash"),
			get_account_id_from_seed::<sr25519::Public>("Ferdie//stash"),
		],
		vec![get_account_id_from_seed::<sr25519::Public>("Bob")],
		false,
		false,
	))
	.build())
}

fn default_pair(currency_id: CurrencyId, is_public_network: bool) -> VaultCurrencyPair<CurrencyId> {
	let wrapped = if is_public_network {
		WRAPPED_CURRENCY_ID_STELLAR_MAINNET
	} else {
		WRAPPED_CURRENCY_ID_STELLAR_TESTNET
	};
	VaultCurrencyPair { collateral: currency_id, wrapped }
}

// Used to create bounded vecs for genesis config
// Does not return a result but panics because the genesis config is hardcoded
fn create_bounded_vec(input: &str) -> BoundedVec<u8, FieldLength> {
	let bounded_vec =
		BoundedVec::try_from(input.as_bytes().to_vec()).expect("Failed to create bounded vec");

	bounded_vec
}

fn genesis(
	root_key: AccountId,
	initial_authorities: Vec<(AuraId, GrandpaId)>,
	endowed_accounts: Vec<AccountId>,
	authorized_oracles: Vec<AccountId>,
	start_shutdown: bool,
	is_public_network: bool,
) -> serde_json::Value {
	let default_wrapped_currency = if is_public_network {
		WRAPPED_CURRENCY_ID_STELLAR_MAINNET
	} else {
		WRAPPED_CURRENCY_ID_STELLAR_TESTNET
	};

	// CRITICAL: Ensure GRANDPA authorities are non-empty with weight > 0
	let grandpa_authorities: Vec<(GrandpaId, GrandpaWeight)> = if initial_authorities.is_empty() {
		// Fallback: Use Alice as GRANDPA authority if no authorities provided
		vec![(get_from_seed::<GrandpaId>("Alice"), 1u64)]
	} else {
		// Use provided authorities with weight 1
		initial_authorities.iter().map(|x| (x.1.clone(), 1u64)).collect()
	};

	// Ensure at least one authority exists
	assert!(!grandpa_authorities.is_empty(), "GRANDPA authorities must be non-empty");
	assert!(
		grandpa_authorities.iter().all(|(_, weight)| *weight > 0),
		"All GRANDPA authority weights must be > 0"
	);

	let genesis_config = RuntimeGenesisConfig {
		system: spacewalk_parachain_runtime::SystemConfig { _config: Default::default() },
		aura: AuraConfig {
			authorities: if initial_authorities.is_empty() {
				vec![get_from_seed::<AuraId>("Alice")]
			} else {
				initial_authorities.iter().map(|x| x.0.clone()).collect()
			},
		},
		grandpa: GrandpaConfig {
			authorities: grandpa_authorities,
			..Default::default()
		},
		sudo: SudoConfig {
			// Assign network admin rights.
			key: Some(root_key.clone()),
		},
		balances: BalancesConfig {
			// Configure endowed accounts with initial balance of 1 << 60.
			balances: endowed_accounts.iter().cloned().map(|k| (k, 1 << 60)).collect(),
		},
		tokens: TokensConfig {
			// Configure the initial token supply for the native currency and USDC asset
			balances: endowed_accounts
				.iter()
				.flat_map(|k| {
					vec![
						(k.clone(), CurrencyId::Native, 1 << 60),
						(k.clone(), default_wrapped_currency, 1 << 60),
						(k.clone(), MXN_CURRENCY_ID, 1 << 60),
					]
				})
				.collect(),
		},
		stellar_relay: StellarRelayConfig {
			old_validators: vec![],
			old_organizations: vec![],
			validators: vec![],
			organizations: vec![],
			enactment_block_height: 0,
			_phantom: Default::default(),
		},
		security: SecurityConfig {
			initial_status: if start_shutdown { StatusCode::Shutdown } else { StatusCode::Running },
			_phantom: Default::default(),
		},
		vault_registry: VaultRegistryConfig {
			minimum_collateral_vault: vec![
				(CurrencyId::Native, 0),
				(default_wrapped_currency, 0),
				(MXN_CURRENCY_ID, 0),
			],
			punishment_delay: DAYS,
			secure_collateral_threshold: vec![
				(default_pair(CurrencyId::Native, is_public_network), FixedU128::checked_from_rational(160, 100).unwrap()),
			],
			premium_redeem_threshold: vec![
				(default_pair(CurrencyId::Native, is_public_network), FixedU128::checked_from_rational(140, 100).unwrap()),
			],
			liquidation_collateral_threshold: vec![
				(default_pair(CurrencyId::Native, is_public_network), FixedU128::checked_from_rational(120, 100).unwrap()),
			],
			system_collateral_ceiling: vec![
				(default_pair(CurrencyId::Native, is_public_network), 60_000 * 10u128.pow(12)),
			],
		},
		oracle: OracleConfig {
			max_delay: u32::MAX,
			oracle_keys: vec![
				Key::ExchangeRate(CurrencyId::Native),
				Key::ExchangeRate(default_wrapped_currency),
				Key::ExchangeRate(MXN_CURRENCY_ID),
			],
			_phantom: Default::default(),
		},
		issue: IssueConfig {
			issue_period: DAYS,
			issue_minimum_transfer_amount: 100_00000,
			limit_volume_amount: None,
			limit_volume_currency_id: CurrencyId::Native,
			current_volume_amount: 0u128,
			interval_length: (60u32 * 60 * 24),
			last_interval_index: 0u32,
		},
		redeem: RedeemConfig {
			redeem_period: DAYS,
			redeem_minimum_transfer_amount: 100_00000,
			limit_volume_amount: None,
			limit_volume_currency_id: CurrencyId::Native,
			current_volume_amount: 0u128,
			interval_length: (60u32 * 60 * 24),
			last_interval_index: 0u32,
		},
		replace: ReplaceConfig {
			replace_period: DAYS,
			replace_minimum_transfer_amount: 100_00000,
		},
		fee: FeeConfig {
			issue_fee: FixedU128::checked_from_rational(1, 1000).unwrap(),
			issue_griefing_collateral: FixedU128::checked_from_rational(5, 1000).unwrap(),
			redeem_fee: FixedU128::checked_from_rational(1, 1000).unwrap(),
			premium_redeem_fee: FixedU128::checked_from_rational(5, 100).unwrap(),
			punishment_fee: FixedU128::checked_from_rational(1, 10).unwrap(),
			replace_griefing_collateral: FixedU128::checked_from_rational(1, 10).unwrap(),
		},
		nomination: NominationConfig { is_nomination_enabled: false, ..Default::default() },
		..Default::default()
	};

	serde_json::to_value(genesis_config).expect("genesis config json encoding should work")
}
