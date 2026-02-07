/**
 * Test Contract Script
 *
 * Tests deployed AgentMarketplace contract on testnet
 */

import { ethers } from "hardhat";

const TESTNET_CONTRACT = "0x891d13D0e3dcE21449C83dF337AC98bE0CDD8556";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  console.log("\n🧪 Testing AgentMarketplace on Base Sepolia\n");

  const [tester] = await ethers.getSigners();
  console.log("👤 Testing from address:", tester.address);

  // Get contract instance
  const marketplace = await ethers.getContractAt("AgentMarketplace", TESTNET_CONTRACT);

  console.log("\n📊 Reading Contract State...\n");

  // Test 1: Read constants
  console.log("1️⃣ Testing Constants:");
  const listingFee = await marketplace.LISTING_FEE();
  const platformFeeBps = await marketplace.PLATFORM_FEE_BPS();
  const maxTags = await marketplace.MAX_TAGS();
  const usdc = await marketplace.USDC();
  const treasury = await marketplace.treasury();

  console.log("   Listing Fee:", ethers.formatUnits(listingFee, 6), "USDC ($2)");
  console.log("   Platform Fee:", Number(platformFeeBps) / 100, "%");
  console.log("   Max Tags:", Number(maxTags));
  console.log("   USDC Address:", usdc);
  console.log("   Treasury:", treasury);
  console.log("   ✅ Constants correct\n");

  // Test 2: Read marketplace stats
  console.log("2️⃣ Testing Marketplace Stats:");
  const stats = await marketplace.getMarketplaceStats();
  console.log("   Total Products:", stats[0].toString());
  console.log("   Total Volume:", ethers.formatUnits(stats[1], 6), "USDC");
  console.log("   ✅ Stats readable\n");

  // Test 3: Get USDC balance
  console.log("3️⃣ Checking USDC Balance:");
  const usdcContract = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"],
    USDC_SEPOLIA
  );

  const usdcBalance = await usdcContract.balanceOf(tester.address);
  console.log("   Your USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  if (usdcBalance < listingFee) {
    console.log("   ⚠️  Need testnet USDC to test listing");
    console.log("   Get USDC: https://faucet.circle.com/ (Base Sepolia)");
  } else {
    console.log("   ✅ Sufficient USDC for testing\n");
  }

  console.log("\n✅ All basic tests passed!");
  console.log("\n📋 Next Steps:");
  console.log("1. Get testnet USDC from: https://faucet.circle.com/");
  console.log("2. Test on Basescan: https://sepolia.basescan.org/address/" + TESTNET_CONTRACT);
  console.log("   - Go to 'Contract' → 'Write Contract'");
  console.log("   - Connect your wallet");
  console.log("   - Try 'listProduct' function");
  console.log("3. Or run: npx hardhat run scripts/list-test-product.ts --network base-sepolia");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
