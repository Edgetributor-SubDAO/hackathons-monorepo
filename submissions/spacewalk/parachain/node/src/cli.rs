use sc_cli::RunCmd;
use clap::Parser;

/// Export the genesis state of the parachain.
#[derive(Debug, Parser)]
pub struct ExportGenesisStateCmd {
	/// Specify the chain spec (one of dev, local, or a path to a chain spec file).
	#[arg(long, value_name = "CHAIN_SPEC")]
	pub chain: Option<String>,

	/// Output file name or stdout if unspecified.
	#[arg(value_name = "OUTPUT")]
	pub output: Option<String>,
}

/// Export the genesis wasm of the parachain.
#[derive(Debug, Parser)]
pub struct ExportGenesisWasmCmd {
	/// Specify the chain spec (one of dev, local, or a path to a chain spec file).
	#[arg(long, value_name = "CHAIN_SPEC")]
	pub chain: Option<String>,

	/// Output file name or stdout if unspecified.
	#[arg(value_name = "OUTPUT")]
	pub output: Option<String>,
}

#[derive(Debug, Parser)]
pub struct Cli {
	#[command(subcommand)]
	pub subcommand: Option<Subcommand>,

	#[clap(flatten)]
	pub run: RunCmd,
}

#[derive(Debug, clap::Subcommand)]
#[allow(clippy::large_enum_variant)]
pub enum Subcommand {
	/// Key management cli utilities
	#[command(subcommand)]
	Key(sc_cli::KeySubcommand),

	/// Build a chain specification.
	BuildSpec(sc_cli::BuildSpecCmd),

	/// Validate blocks.
	CheckBlock(sc_cli::CheckBlockCmd),

	/// Export blocks.
	ExportBlocks(sc_cli::ExportBlocksCmd),

	/// Export the state of a given block into a chain spec.
	ExportState(sc_cli::ExportStateCmd),

	/// Export the genesis state of the parachain.
	ExportGenesisState(ExportGenesisStateCmd),

	/// Export the genesis wasm of the parachain.
	ExportGenesisWasm(ExportGenesisWasmCmd),

	/// Import blocks.
	ImportBlocks(sc_cli::ImportBlocksCmd),

	/// Remove the whole chain.
	PurgeChain(sc_cli::PurgeChainCmd),

	/// Revert the chain to a previous state.
	Revert(sc_cli::RevertCmd),

	/// Sub-commands concerned with benchmarking.
	#[command(subcommand)]
	Benchmark(frame_benchmarking_cli::BenchmarkCmd),

	/// Try some command against runtime state.
	#[cfg(feature = "try-runtime")]
	TryRuntime(try_runtime_cli::TryRuntimeCmd),

	/// Try some command against runtime state. Note: `try-runtime` feature must be enabled.
	#[cfg(not(feature = "try-runtime"))]
	TryRuntime,

	/// Db meta columns information.
	ChainInfo(sc_cli::ChainInfoCmd),
}

