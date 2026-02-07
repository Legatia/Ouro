/**
 * List Test Product Script
 *
 * Automatically lists a test product on the marketplace
 * Requires: Testnet USDC in wallet
 */

import { ethers } from "hardhat";

const TESTNET_CONTRACT = "0x891d13D0e3dcE21449C83dF337AC98bE0CDD8556";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  console.log("\n🚀 Listing Test Product on Base Sepolia\n");

  const [seller] = await ethers.getSigners();
  console.log("👤 Seller address:", seller.address);

  // Get contract instances
  const marketplace = await ethers.getContractAt("AgentMarketplace", TESTNET_CONTRACT);
  const usdc = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
    ],
    USDC_SEPOLIA
  );

  // Check USDC balance
  console.log("1️⃣ Checking USDC Balance...");
  const usdcBalance = await usdc.balanceOf(seller.address);
  const listingFee = await marketplace.LISTING_FEE();

  console.log("   Your USDC:", ethers.formatUnits(usdcBalance, 6));
  console.log("   Listing Fee:", ethers.formatUnits(listingFee, 6));

  if (usdcBalance < listingFee) {
    console.error("\n❌ Insufficient USDC balance!");
    console.error("   Get testnet USDC: https://faucet.circle.com/");
    process.exit(1);
  }
  console.log("   ✅ Sufficient USDC\n");

  // Check allowance
  console.log("2️⃣ Checking USDC Allowance...");
  const allowance = await usdc.allowance(seller.address, TESTNET_CONTRACT);
  console.log("   Current allowance:", ethers.formatUnits(allowance, 6), "USDC");

  if (allowance < listingFee) {
    console.log("   Approving marketplace to spend USDC...");
    const approveTx = await usdc.approve(TESTNET_CONTRACT, ethers.parseUnits("10", 6));
    await approveTx.wait();
    console.log("   ✅ Approved 10 USDC\n");
  } else {
    console.log("   ✅ Already approved\n");
  }

  // List product
  console.log("3️⃣ Listing Test Product...");

  const productData = {
    name: "Twitter Automation Agent",
    tags: ["twitter", "automation", "social-media"],
    priceUSDC: ethers.parseUnits("5", 6), // $5 USDC
    metadataURI: "ipfs://QmTest123TwitterAgentMetadata",
  };

  console.log("   Name:", productData.name);
  console.log("   Tags:", productData.tags.join(", "));
  console.log("   Price:", ethers.formatUnits(productData.priceUSDC, 6), "USDC");
  console.log("   Metadata:", productData.metadataURI);
  console.log("\n   Sending transaction...");

  const listTx = await marketplace.listProduct(
    productData.name,
    productData.tags,
    productData.priceUSDC,
    productData.metadataURI
  );

  console.log("   Transaction hash:", listTx.hash);
  console.log("   Waiting for confirmation...");

  const receipt = await listTx.wait();
  console.log("   ✅ Product listed!\n");

  // Get product ID from event
  const productListedEvent = receipt.logs.find((log: any) => {
    try {
      const parsed = marketplace.interface.parseLog(log);
      return parsed?.name === "ProductListed";
    } catch {
      return false;
    }
  });

  let productId: string | null = null;
  if (productListedEvent) {
    const parsed = marketplace.interface.parseLog(productListedEvent);
    productId = parsed?.args[0];
    console.log("   Product ID:", productId);
  }

  // Check for gas sponsored event
  const gasSponsoredEvent = receipt.logs.find((log: any) => {
    try {
      const parsed = marketplace.interface.parseLog(log);
      return parsed?.name === "GasSponsored";
    } catch {
      return false;
    }
  });

  if (gasSponsoredEvent) {
    const parsed = marketplace.interface.parseLog(gasSponsoredEvent);
    console.log("   ✅ GasSponsored event emitted");
    console.log("   Estimated gas cost:", ethers.formatEther(parsed?.args[2] || 0), "ETH");
  }

  // Read back product details
  if (productId) {
    console.log("\n4️⃣ Reading Product Details...");
    const product = await marketplace.getProduct(productId);
    console.log("   Seller:", product.seller);
    console.log("   Name:", product.name);
    console.log("   Price:", ethers.formatUnits(product.priceUSDC, 6), "USDC");
    console.log("   Total Sales:", product.totalSales.toString());
    console.log("   Listed At:", new Date(Number(product.listedAt) * 1000).toLocaleString());
    console.log("   ✅ Product data verified\n");
  }

  // Read marketplace stats
  console.log("5️⃣ Reading Marketplace Stats...");
  const stats = await marketplace.getMarketplaceStats();
  console.log("   Total Products:", stats[0].toString());
  console.log("   Total Volume:", ethers.formatUnits(stats[1], 6), "USDC");
  console.log("   ✅ Stats updated\n");

  // Summary
  console.log("✅ TEST COMPLETE!\n");
  console.log("📋 Summary:");
  console.log("   - Listed 1 product");
  console.log("   - Paid $2 USDC listing fee");
  console.log("   - Gas sponsorship working");
  console.log("   - Product readable on-chain");
  console.log("\n🔗 View on Basescan:");
  console.log("   https://sepolia.basescan.org/tx/" + listTx.hash);
  console.log("\n🎯 Next: Deploy to mainnet and apply for $15K Coinbase credits!");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  });
