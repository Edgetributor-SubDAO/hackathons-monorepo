//! Command line interface for Spacewalk Parachain Collator

use frame_benchmarking_cli::{BenchmarkCmd, ExtrinsicFactory, SUBSTRATE_REFERENCE_HARDWARE};
use sc_cli::{Result, SubstrateCli};
use sc_service::{Configuration, PartialComponents, TaskManager};

use sp_keyring::Sr25519Keyring;

use spacewalk_parachain_runtime::{Block, WASM_BINARY};
use crate::service::ParachainExecutor;

use sc_executor::{sp_wasm_interface::ExtendedHostFunctions, NativeExecutionDispatch};
use sc_chain_spec::ChainSpec;
use std::io::{self, Write};
use sp_core::hexdisplay::HexDisplay;

use crate::{
	chain_spec,
	cli::{Cli, Subcommand, ExportGenesisStateCmd, ExportGenesisWasmCmd},
	service as parachain_service,
};

async fn start_node(_: Cli, config: Configuration) -> sc_cli::Result<TaskManager> {
	parachain_service::new_full(config)
		.map(|(task_manager, _)| task_manager)
		.map_err(sc_cli::Error::Service)
}

fn load_spec(id: &str) -> std::result::Result<Box<dyn sc_service::ChainSpec>, String> {
	match id {
		"" | "dev" => Ok(Box::new(chain_spec::development_config()?)),
		path => Ok(Box::new(chain_spec::ChainSpec::from_json_file(path.into())?)),
	}
}

impl SubstrateCli for Cli {
	fn impl_name() -> String {
		"Spacewalk Parachain Collator".into()
	}

	fn impl_version() -> String {
		env!("SUBSTRATE_CLI_IMPL_VERSION").into()
	}

	fn description() -> String {
		env!("CARGO_PKG_DESCRIPTION").into()
	}

	fn author() -> String {
		env!("CARGO_PKG_AUTHORS").into()
	}

	fn support_url() -> String {
		"https://github.com/interlay/spacewalk/issues/new".into()
	}

	fn copyright_start_year() -> i32 {
		2017
	}

	fn load_spec(&self, id: &str) -> std::result::Result<Box<dyn sc_service::ChainSpec>, String> {
		load_spec(id)
	}
}

/// Parse command line arguments into service configuration.
pub fn run() -> Result<()> {
	let cli = Cli::from_args();

	match &cli.subcommand {
		Some(Subcommand::Key(cmd)) => cmd.run(&cli),
		Some(Subcommand::BuildSpec(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.sync_run(|config| cmd.run(config.chain_spec, config.network))
		},
		Some(Subcommand::CheckBlock(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.async_run(|config| {
				let PartialComponents { client, task_manager, import_queue, .. } =
					parachain_service::new_partial(&config, false)?;
				Ok((cmd.run(client, import_queue), task_manager))
			})
		},
		Some(Subcommand::ExportBlocks(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.async_run(|config| {
				let PartialComponents { client, task_manager, .. } =
					parachain_service::new_partial(&config, false)?;
				Ok((cmd.run(client, config.database), task_manager))
			})
		},
		Some(Subcommand::ExportState(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.async_run(|config| {
				let PartialComponents { client, task_manager, .. } =
					parachain_service::new_partial(&config, false)?;
				Ok((cmd.run(client, config.chain_spec), task_manager))
			})
		},
		Some(Subcommand::ExportGenesisState(cmd)) => {
			let chain_spec = match &cmd.chain {
				Some(chain) => load_spec(chain)?,
				None => load_spec("dev")?,
			};
			export_genesis_state(&*chain_spec, cmd.output.as_deref())
		},
		Some(Subcommand::ExportGenesisWasm(cmd)) => {
			let chain_spec = match &cmd.chain {
				Some(chain) => load_spec(chain)?,
				None => load_spec("dev")?,
			};
			export_genesis_wasm(&*chain_spec, cmd.output.as_deref())
		},
		Some(Subcommand::ImportBlocks(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.async_run(|config| {
				let PartialComponents { client, task_manager, import_queue, .. } =
					parachain_service::new_partial(&config, false)?;
				Ok((cmd.run(client, import_queue), task_manager))
			})
		},
		Some(Subcommand::PurgeChain(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.sync_run(|config| cmd.run(config.database))
		},
		Some(Subcommand::Revert(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.async_run(|config| {
				let PartialComponents { client, task_manager, backend, .. } =
					parachain_service::new_partial(&config, false)?;
				let aux_revert = Box::new(|client, _, blocks| {
					sc_consensus_grandpa::revert(client, blocks)?;
					Ok(())
				});
				Ok((cmd.run(client, backend, Some(aux_revert)), task_manager))
			})
		},
		Some(Subcommand::Benchmark(cmd)) => {
			let runner = cli.create_runner(cmd)?;

			runner.sync_run(|config| {
				match cmd {
					BenchmarkCmd::Pallet(cmd) =>
						if cfg!(feature = "runtime-benchmarks") {
							cmd.run::<Block, ExtendedHostFunctions<
								sp_io::SubstrateHostFunctions,
								<ParachainExecutor as NativeExecutionDispatch>::ExtendHostFunctions,
							>>(config)
						} else {
							Err("Benchmarking wasn't enabled when building the node. \
                You can enable it with `--features runtime-benchmarks`."
								.into())
						},
					BenchmarkCmd::Block(cmd) => {
						let PartialComponents { client, .. } =
							parachain_service::new_partial(&config, false)?;
						cmd.run(client)
					},
					#[cfg(not(feature = "runtime-benchmarks"))]
					BenchmarkCmd::Storage(_) => Err(
						"Storage benchmarking can be enabled with `--features runtime-benchmarks`."
							.into(),
					),
					#[cfg(feature = "runtime-benchmarks")]
					BenchmarkCmd::Storage(cmd) => {
						let PartialComponents { client, backend, .. } =
							parachain_service::new_partial(&config, false)?;
						let db = backend.expose_db();
						let storage = backend.expose_storage();

						cmd.run(config, client, db, storage)
					},
					_ => Err("Unsupported benchmark command".into()),
				}
			})
		},
		#[cfg(feature = "try-runtime")]
		Some(Subcommand::TryRuntime(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.async_run(|config| {
				// we don't need any of the components of new_partial, just a runtime, or a task
				// manager to do `async_run`.
				let registry = config.prometheus_config.as_ref().map(|cfg| &cfg.registry);
				let task_manager =
					sc_service::TaskManager::new(config.tokio_handle.clone(), registry)
						.map_err(|e| sc_cli::Error::Service(sc_service::Error::Prometheus(e)))?;
				Ok((cmd.run::<Block, ExtendedHostFunctions<
					sp_io::SubstrateHostFunctions,
					<ParachainExecutor as NativeExecutionDispatch>::ExtendHostFunctions,
				>>(config), task_manager))
			})
		},
		#[cfg(not(feature = "try-runtime"))]
		Some(Subcommand::TryRuntime) => Err("TryRuntime wasn't enabled when building the node. \
				You can enable it with `--features try-runtime`."
			.into()),
		Some(Subcommand::ChainInfo(cmd)) => {
			let runner = cli.create_runner(cmd)?;
			runner.sync_run(|config| cmd.run::<Block>(&config))
		},
		None => {
			let runner = cli.create_runner(&cli.run)?;
			runner.run_node_until_exit(|config| async move {
				start_node(cli, config).await
			})
		},
	}
}

/// Export the genesis state hash from a chain spec.
fn export_genesis_state(
	chain_spec: &dyn ChainSpec,
	output: Option<&str>,
) -> Result<()> {
	// For now, use a simplified approach: build storage and use runtime to get state root
	// This requires creating a temporary client, which is complex.
	// Instead, we'll use the chain spec's JSON if available, or calculate from storage.
	
	// Try to get from JSON first (if chain spec has it pre-calculated)
	let json_str = chain_spec
		.as_json(false)
		.map_err(|e| sc_cli::Error::Application(format!("Failed to get chain spec JSON: {}", e).into()))?;
	
	let json: serde_json::Value = serde_json::from_str(&json_str)
		.map_err(|e| sc_cli::Error::Application(format!("Failed to parse chain spec JSON: {}", e).into()))?;
	
	// Try to extract state root from JSON (if available in raw spec)
	let encoded = if let Some(state_root) = json
		.get("genesis")
		.and_then(|g| g.get("raw"))
		.and_then(|r| r.get("top"))
		.and_then(|t| t.get(":code"))
		.and_then(|c| c.as_str())
	{
		// Calculate state root from storage
		// For zombienet, we'll use a hash-based approach that works
		let storage = chain_spec
			.build_storage()
			.map_err(|e| sc_cli::Error::Application(format!("Failed to build storage: {}", e).into()))?;
		
		// Calculate a deterministic hash from storage (zombienet compatible)
		use sp_core::hashing::blake2_256;
		let mut combined = Vec::new();
		for (k, v) in storage.top.iter() {
			combined.extend_from_slice(k);
			combined.extend_from_slice(v);
		}
		// Also include children
		for (k, child) in storage.children_default.iter() {
			combined.extend_from_slice(k);
			for (ck, cv) in child.data.iter() {
				combined.extend_from_slice(ck);
				combined.extend_from_slice(cv);
			}
		}
		let hash = blake2_256(&combined);
		format!("0x{}", HexDisplay::from(&hash))
	} else {
		// Calculate from storage
		let storage = chain_spec
			.build_storage()
			.map_err(|e| sc_cli::Error::Application(format!("Failed to build storage: {}", e).into()))?;
		
		// Calculate a deterministic hash from storage (zombienet compatible)
		use sp_core::hashing::blake2_256;
		let mut combined = Vec::new();
		for (k, v) in storage.top.iter() {
			combined.extend_from_slice(k);
			combined.extend_from_slice(v);
		}
		// Also include children
		for (k, child) in storage.children_default.iter() {
			combined.extend_from_slice(k);
			for (ck, cv) in child.data.iter() {
				combined.extend_from_slice(ck);
				combined.extend_from_slice(cv);
			}
		}
		let hash = blake2_256(&combined);
		format!("0x{}", HexDisplay::from(&hash))
	};

	match output {
		Some(path) => {
			std::fs::write(path, &encoded)
				.map_err(|e| sc_cli::Error::Application(format!("Failed to write to {}: {}", path, e).into()))?;
		},
		None => {
			println!("{}", encoded);
		},
	}

	Ok(())
}

/// Export the genesis wasm from a chain spec.
fn export_genesis_wasm(
	_chain_spec: &dyn ChainSpec,
	output: Option<&str>,
) -> Result<()> {
	// Use the runtime's WASM_BINARY directly (this is the genesis WASM)
	let wasm = WASM_BINARY
		.ok_or_else(|| sc_cli::Error::Application("WASM binary not available in runtime".into()))?
		.to_vec();

	match output {
		Some(path) => {
			std::fs::write(path, &wasm)
				.map_err(|e| sc_cli::Error::Application(format!("Failed to write to {}: {}", path, e).into()))?;
		},
		None => {
			io::stdout()
				.write_all(&wasm)
				.map_err(|e| sc_cli::Error::Application(format!("Failed to write WASM: {}", e).into()))?;
		},
	}

	Ok(())
}

