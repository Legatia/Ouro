/**
 * Deployment Script - Ouro
 *
 * Deploys AgentMarketplace contract to Base L2
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base-sepolia
 *   npx hardhat run scripts/deploy.ts --network base-mainnet
 */

import { ethers, network } from "hardhat";

// USDC Contract Addresses on Base
const USDC_ADDRESSES: Record<string, string> = {
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
  "base-mainnet": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet USDC
};

async function main() {
  console.log("\n🚀 Deploying Ouro to", network.name, "\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying from address:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");

  const minBalance = network.name === "base-sepolia" ? "0.002" : "0.01";
  if (balance < ethers.parseEther(minBalance)) {
    console.error(`❌ Insufficient ETH balance. Need at least ${minBalance} ETH for deployment.`);
    process.exit(1);
  }

  // Get USDC address for this network
  const usdcAddress = USDC_ADDRESSES[network.name];
  if (!usdcAddress) {
    console.error("❌ No USDC address configured for network:", network.name);
    console.error("Available networks:", Object.keys(USDC_ADDRESSES));
    process.exit(1);
  }

  console.log("💵 USDC Address:", usdcAddress);

  // Treasury address (receives platform fees)
  const treasuryAddress = process.env.MARKETPLACE_TREASURY_ADDRESS || deployer.address;
  console.log("🏦 Treasury Address:", treasuryAddress);

  if (treasuryAddress === deployer.address) {
    console.warn("⚠️  WARNING: Using deployer address as treasury. Set MARKETPLACE_TREASURY_ADDRESS for production.");
  }

  console.log("\n⏳ Deploying Ouro contract...\n");

  // Deploy contract
  const marketplace = await ethers.deployContract("Ouro", [usdcAddress, treasuryAddress]);

  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();

  console.log("\n✅ AgentMarketplace deployed!");
  console.log("📍 Contract Address:", marketplaceAddress);
  console.log("🔗 Block Explorer:", getBlockExplorerUrl(network.name, marketplaceAddress));

  // Verify contract configuration
  console.log("\n🔍 Verifying contract configuration...\n");

  const listingFee = await marketplace.LISTING_FEE();
  const platformFeeBps = await marketplace.PLATFORM_FEE_BPS();
  const usdc = await marketplace.USDC();
  const treasury = await marketplace.treasury();

  console.log("Configuration:");
  console.log("  Listing Fee:", ethers.formatUnits(listingFee, 6), "USDC");
  console.log("  Platform Fee:", Number(platformFeeBps) / 100, "%");
  console.log("  USDC Address:", usdc);
  console.log("  Treasury:", treasury);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: marketplaceAddress,
    deployer: deployer.address,
    treasury: treasuryAddress,
    usdcAddress: usdcAddress,
    deployedAt: new Date().toISOString(),
    blockExplorer: getBlockExplorerUrl(network.name, marketplaceAddress),
    transactionHash: marketplace.deploymentTransaction()?.hash,
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Add to .env.local:");
  console.log(`   NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log("\n2. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network ${network.name} ${marketplaceAddress} "${usdcAddress}" "${treasuryAddress}"`);
  console.log("\n3. Test contract:");
  console.log("   - List a product");
  console.log("   - Purchase a product");
  console.log("   - Verify gas sponsorship works");
  console.log("\n");
}

function getBlockExplorerUrl(networkName: string, address: string): string {
  if (networkName === "base-sepolia") {
    return `https://sepolia.basescan.org/address/${address}`;
  } else if (networkName === "base-mainnet") {
    return `https://basescan.org/address/${address}`;
  }
  return "";
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
