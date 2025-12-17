// Deploy script for GameLeaderboard contract
// Run with: npx hardhat run deploy.js --network moonbase

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Deploying GameLeaderboard contract...\n");

    // Check if private key is configured
    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === "your_private_key_here") {
        console.error("❌ ERROR: PRIVATE_KEY not configured!");
        console.error("\n📝 To fix thissss:");
        console.error("   1. Open the .env file in the contracts folder");
        console.error("   2. Replace 'your_private_key_here' with your MetaMask private key");
        console.error("   3. Get your private key: MetaMask → ⋮ → Account Details → Export Private Key");
        console.error("\n⚠️  Make sure you have DEV tokens from https://faucet.moonbeam.network/");
        process.exit(1);
    }

    // Get the deployer account
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        console.error("❌ ERROR: No wallet configured. Check your PRIVATE_KEY in .env");
        process.exit(1);
    }

    const [deployer] = signers;
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy the contract
    const GameLeaderboard = await ethers.getContractFactory("GameLeaderboard");
    const leaderboard = await GameLeaderboard.deploy();

    await leaderboard.waitForDeployment();
    const contractAddress = await leaderboard.getAddress();

    console.log("\n✅ GameLeaderboard deployed to:", contractAddress);
    console.log("\n📋 Contract Details:");
    console.log("   - Owner:", await leaderboard.owner());
    console.log("   - Max Leaderboard Size:", (await leaderboard.MAX_LEADERBOARD_SIZE()).toString());
    console.log("   - Week Duration: 7 days");

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: (await leaderboard.deploymentTransaction()).blockNumber,
    };

    console.log("\n📁 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

    // Verify instructions
    console.log("\n🔍 To verify on block explorer:");
    console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
