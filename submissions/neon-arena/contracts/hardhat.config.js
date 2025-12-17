require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        // Moonbase Alpha - Moonbeam Testnet (Polkadot ecosystem)
        moonbase: {
            url: "https://rpc.api.moonbase.moonbeam.network",
            chainId: 1287,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 1000000000, // 1 Gwei
        },
        // Moonbeam Mainnet (when ready for production)
        moonbeam: {
            url: "https://rpc.api.moonbeam.network",
            chainId: 1284,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        // Astar Network (alternative Polkadot parachain)
        astar: {
            url: "https://evm.astar.network",
            chainId: 592,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        // Shibuya Testnet (Astar testnet)
        shibuya: {
            url: "https://evm.shibuya.astar.network",
            chainId: 81,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        }
    },
    etherscan: {
        apiKey: {
            moonbaseAlpha: process.env.MOONSCAN_API_KEY || "",
            moonbeam: process.env.MOONSCAN_API_KEY || "",
        }
    },
    paths: {
        sources: "./polkadot",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
