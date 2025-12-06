//! A collection of node-specific RPC methods for Spacewalk Parachain

#![warn(missing_docs)]

use std::sync::Arc;
use jsonrpsee::RpcModule;
use sc_rpc_api::DenyUnsafe;
use sc_transaction_pool_api::TransactionPool;
use sp_api::ProvideRuntimeApi;
use sp_arithmetic::FixedU128;
use sp_block_builder::BlockBuilder;
use sp_blockchain::{Error as BlockChainError, HeaderBackend, HeaderMetadata};
use sp_core::H256;

use primitives::{
	issue::IssueRequest, redeem::RedeemRequest, replace::ReplaceRequest, AccountId, Balance, Block,
	BlockNumber, CurrencyId, VaultId,
};

use spacewalk_parachain_runtime::RuntimeApi;

/// Full client dependencies.
pub struct FullDeps<C, P> {
	/// The client instance to use.
	pub client: Arc<C>,
	/// Transaction pool instance.
	pub pool: Arc<P>,
	/// Whether to deny unsafe calls
	pub deny_unsafe: DenyUnsafe,
}

/// Instantiate all full RPC extensions.
pub fn create_full<C, P>(
	deps: FullDeps<C, P>,
) -> Result<RpcModule<()>, Box<dyn std::error::Error + Send + Sync>>
where
	C: ProvideRuntimeApi<Block>,
	C: HeaderBackend<Block> + HeaderMetadata<Block, Error = BlockChainError> + 'static,
	C: Send + Sync + 'static,
	C::Api: substrate_frame_rpc_system::AccountNonceApi<Block, AccountId, BlockNumber>,
	C::Api: pallet_transaction_payment_rpc::TransactionPaymentRuntimeApi<Block, Balance>,
	C::Api: module_issue_rpc::IssueRuntimeApi<
		Block,
		AccountId,
		H256,
		IssueRequest<AccountId, BlockNumber, Balance, CurrencyId>,
	>,
	C::Api: module_redeem_rpc::RedeemRuntimeApi<
		Block,
		AccountId,
		H256,
		RedeemRequest<AccountId, BlockNumber, Balance, CurrencyId>,
	>,
	C::Api: module_vault_registry_rpc::VaultRegistryRuntimeApi<
		Block,
		VaultId<AccountId, CurrencyId>,
		Balance,
		FixedU128,
		CurrencyId,
		AccountId,
	>,
	C::Api: BlockBuilder<Block>,
	P: TransactionPool + 'static,
	C::Api: module_replace_rpc::ReplaceRuntimeApi<
		Block,
		AccountId,
		H256,
		ReplaceRequest<AccountId, BlockNumber, Balance, CurrencyId>,
	>,
	C::Api: module_oracle_rpc::OracleRuntimeApi<Block, Balance, CurrencyId>,
{
	use module_issue_rpc::{Issue, IssueApiServer};
	use module_oracle_rpc::{Oracle, OracleApiServer};
	use module_redeem_rpc::{Redeem, RedeemApiServer};
	use module_replace_rpc::{Replace, ReplaceApiServer};
	use module_vault_registry_rpc::{VaultRegistry, VaultRegistryApiServer};
	use pallet_transaction_payment_rpc::{TransactionPayment, TransactionPaymentApiServer};
	use substrate_frame_rpc_system::{System, SystemApiServer};

	let mut module = RpcModule::new(());
	let FullDeps { client, pool, deny_unsafe } = deps;

	module.merge(System::new(client.clone(), pool.clone(), deny_unsafe).into_rpc())?;
	module.merge(TransactionPayment::new(client.clone()).into_rpc())?;
	module.merge(Issue::new(client.clone()).into_rpc())?;
	module.merge(Redeem::new(client.clone()).into_rpc())?;
	module.merge(Replace::new(client.clone()).into_rpc())?;
	module.merge(Oracle::new(client.clone()).into_rpc())?;
	module.merge(VaultRegistry::new(client).into_rpc())?;

	Ok(module)
}

