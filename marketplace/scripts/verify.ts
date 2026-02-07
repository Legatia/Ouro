/**
 * Contract Verification Script
 *
 * Verifies deployed contract on Basescan
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network base-sepolia
 *   npx hardhat run scripts/verify.ts --network base-mainnet
 */

import { run, network } from "hardhat";

// USDC addresses
const USDC_ADDRESSES: Record<string, string> = {
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "base-mainnet": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

async function main() {
  // Get contract address from env or command line
  const contractAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Please set MARKETPLACE_CONTRACT_ADDRESS environment variable");
    console.error("   or provide contract address as argument");
    process.exit(1);
  }

  const usdcAddress = USDC_ADDRESSES[network.name];
  const treasuryAddress = process.env.MARKETPLACE_TREASURY_ADDRESS;

  if (!treasuryAddress) {
    console.error("❌ Please set MARKETPLACE_TREASURY_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("\n🔍 Verifying contract on", network.name);
  console.log("📍 Contract Address:", contractAddress);
  console.log("💵 USDC Address:", usdcAddress);
  console.log("🏦 Treasury Address:", treasuryAddress);
  console.log("\n⏳ Submitting to Basescan...\n");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [usdcAddress, treasuryAddress],
    });

    console.log("\n✅ Contract verified successfully!");
    console.log("🔗 View on Basescan:", getBlockExplorerUrl(network.name, contractAddress));
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract already verified!");
      console.log("🔗 View on Basescan:", getBlockExplorerUrl(network.name, contractAddress));
    } else {
      console.error("\n❌ Verification failed:", error.message);
      process.exit(1);
    }
  }
}

function getBlockExplorerUrl(networkName: string, address: string): string {
  if (networkName === "base-sepolia") {
    return `https://sepolia.basescan.org/address/${address}`;
  } else if (networkName === "base-mainnet") {
    return `https://basescan.org/address/${address}`;
  }
  return "";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
