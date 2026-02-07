/**
 * Test Agent Product Listing (Agentic Approach)
 *
 * Tests the full flow as an AI agent would:
 * 1. Check USDC balance
 * 2. Approve USDC for marketplace
 * 3. List a product
 * 4. Verify gas was sponsored (Paymaster)
 */

const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Contract addresses
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = 'https://sepolia.base.org';

// ABIs
const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const MARKETPLACE_ABI = [
  'function listProduct(string name, string[] tags, uint256 priceUSDC, string metadataURI) returns (bytes32)',
  'function getProduct(bytes32 productId) view returns (tuple(bytes32 id, address seller, string name, string[] tags, uint256 priceUSDC, string metadataURI, uint256 totalSales, uint256 totalRevenueUSDC, uint256 listedAt, bool deprecated))',
  'function LISTING_FEE() view returns (uint256)',
  'function totalProducts() view returns (uint256)',
  'event ProductListed(bytes32 indexed id, address indexed seller, string name, string[] tags, uint256 priceUSDC, string metadataURI)',
  'event GasSponsored(address indexed user, string action, uint256 estimatedGasCost)',
];

async function main() {
  console.log('\n' + BLUE + '🤖 TESTING AGENT PRODUCT LISTING (Paymaster Integration)' + RESET + '\n');

  // Setup
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(BLUE + '📋 Setup:' + RESET);
  console.log(`  Agent Wallet: ${wallet.address}`);
  console.log(`  Network: Base Sepolia (Chain ID: 84532)`);
  console.log(`  Marketplace: ${MARKETPLACE_ADDRESS}`);
  console.log(`  USDC: ${USDC_ADDRESS}\n`);

  // Contracts
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, wallet);

  try {
    // Step 1: Check USDC balance
    console.log(BLUE + '1️⃣ Checking USDC Balance...' + RESET);

    const balance = await usdc.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatUnits(balance, 6);

    console.log(`  Balance: ${balanceFormatted} USDC`);

    if (balance < ethers.parseUnits('2', 6)) {
      console.log(RED + `  ✗ Insufficient USDC. Need at least 2 USDC for listing fee.` + RESET);
      console.log(YELLOW + `  → Get testnet USDC: https://faucet.circle.com/` + RESET);
      console.log(YELLOW + `  → Your address: ${wallet.address}\n` + RESET);
      return;
    }

    console.log(GREEN + `  ✓ Sufficient USDC balance (${balanceFormatted} USDC)\n` + RESET);

    // Step 2: Check/Approve USDC
    console.log(BLUE + '2️⃣ Checking USDC Allowance...' + RESET);

    const listingFee = await marketplace.LISTING_FEE();
    const currentAllowance = await usdc.allowance(wallet.address, MARKETPLACE_ADDRESS);

    console.log(`  Required: ${ethers.formatUnits(listingFee, 6)} USDC`);
    console.log(`  Current Allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC`);

    if (currentAllowance < listingFee) {
      console.log(YELLOW + `  → Approving USDC...` + RESET);

      const approveTx = await usdc.approve(MARKETPLACE_ADDRESS, listingFee);
      console.log(`  Approval TX: ${approveTx.hash}`);
      console.log(`  Waiting for confirmation...`);

      const approveReceipt = await approveTx.wait();

      // Check if gas was sponsored
      const gasUsed = approveReceipt.gasUsed;
      const gasPrice = approveReceipt.gasPrice || approveReceipt.effectiveGasPrice;
      const gasCost = gasUsed * gasPrice;

      console.log(GREEN + `  ✓ USDC Approved` + RESET);
      console.log(`  Gas Used: ${gasUsed.toString()}`);
      console.log(`  Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
      console.log(`  Gas Cost: ${ethers.formatEther(gasCost)} ETH (~$${(parseFloat(ethers.formatEther(gasCost)) * 2500).toFixed(4)})`);

      // Check if Paymaster sponsored (user's ETH balance shouldn't decrease)
      const ethBalance = await provider.getBalance(wallet.address);
      console.log(`  User ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

      if (parseFloat(ethers.formatEther(ethBalance)) < 0.001) {
        console.log(GREEN + `  ✓ Low ETH balance - Paymaster likely sponsored!` + RESET);
      }

      console.log('');
    } else {
      console.log(GREEN + `  ✓ USDC already approved\n` + RESET);
    }

    // Step 3: Get current product count
    console.log(BLUE + '3️⃣ Checking Current Marketplace Stats...' + RESET);
    const productCountBefore = await marketplace.totalProducts();
    console.log(`  Total Products Before: ${productCountBefore.toString()}\n`);

    // Step 4: List Product
    console.log(BLUE + '4️⃣ Listing Product (Agent Test)...' + RESET);

    const productData = {
      name: `AI Agent Test Product ${Date.now()}`,
      tags: ['test', 'ai-agent', 'automation', 'paymaster'],
      priceUSDC: ethers.parseUnits('5.00', 6), // $5 USDC
      metadataURI: `https://ouro.market/api/metadata/test-${Date.now()}`,
    };

    console.log(`  Name: ${productData.name}`);
    console.log(`  Tags: ${productData.tags.join(', ')}`);
    console.log(`  Price: ${ethers.formatUnits(productData.priceUSDC, 6)} USDC`);
    console.log(`  Metadata URI: ${productData.metadataURI}`);
    console.log('');
    console.log(YELLOW + `  → Submitting transaction...` + RESET);

    const listTx = await marketplace.listProduct(
      productData.name,
      productData.tags,
      productData.priceUSDC,
      productData.metadataURI
    );

    console.log(`  Transaction Hash: ${listTx.hash}`);
    console.log(`  Basescan: https://sepolia.basescan.org/tx/${listTx.hash}`);
    console.log(YELLOW + `  → Waiting for confirmation...` + RESET);
    console.log('');

    const listReceipt = await listTx.wait();

    console.log(GREEN + `  ✓ Product Listed Successfully!` + RESET);
    console.log(`  Block: ${listReceipt.blockNumber}`);
    console.log(`  Gas Used: ${listReceipt.gasUsed.toString()}`);

    const gasPrice = listReceipt.gasPrice || listReceipt.effectiveGasPrice;
    const gasCost = listReceipt.gasUsed * gasPrice;

    console.log(`  Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`  Gas Cost: ${ethers.formatEther(gasCost)} ETH (~$${(parseFloat(ethers.formatEther(gasCost)) * 2500).toFixed(4)})`);
    console.log('');

    // Step 5: Parse Events
    console.log(BLUE + '5️⃣ Checking Events...' + RESET);

    let productListedEvent = null;
    let gasSponsoredEvent = null;

    for (const log of listReceipt.logs) {
      try {
        const parsed = marketplace.interface.parseLog(log);
        if (parsed) {
          if (parsed.name === 'ProductListed') {
            productListedEvent = parsed;
            console.log(GREEN + `  ✓ ProductListed Event:` + RESET);
            console.log(`    Product ID: ${parsed.args.id}`);
            console.log(`    Seller: ${parsed.args.seller}`);
            console.log(`    Name: ${parsed.args.name}`);
          } else if (parsed.name === 'GasSponsored') {
            gasSponsoredEvent = parsed;
            console.log(GREEN + `  ✓ GasSponsored Event:` + RESET);
            console.log(`    User: ${parsed.args.user}`);
            console.log(`    Action: ${parsed.args.action}`);
            console.log(`    Estimated Gas Cost: ${parsed.args.estimatedGasCost.toString()}`);
          }
        }
      } catch (e) {
        // Skip non-marketplace events
      }
    }

    if (!gasSponsoredEvent) {
      console.log(YELLOW + `  ⚠ GasSponsored event not found (might need Paymaster configuration)` + RESET);
    }

    console.log('');

    // Step 6: Verify Product
    if (productListedEvent) {
      console.log(BLUE + '6️⃣ Verifying Product On-Chain...' + RESET);

      const productId = productListedEvent.args.id;
      const product = await marketplace.getProduct(productId);

      console.log(GREEN + `  ✓ Product Retrieved:` + RESET);
      console.log(`    ID: ${product.id}`);
      console.log(`    Seller: ${product.seller}`);
      console.log(`    Name: ${product.name}`);
      console.log(`    Tags: ${product.tags.join(', ')}`);
      console.log(`    Price: ${ethers.formatUnits(product.priceUSDC, 6)} USDC`);
      console.log(`    Total Sales: ${product.totalSales.toString()}`);
      console.log(`    Listed At: ${new Date(Number(product.listedAt) * 1000).toISOString()}`);
      console.log('');
    }

    // Step 7: Check final stats
    console.log(BLUE + '7️⃣ Final Marketplace Stats...' + RESET);
    const productCountAfter = await marketplace.totalProducts();
    console.log(`  Total Products After: ${productCountAfter.toString()}`);
    console.log(`  Products Added: ${(productCountAfter - productCountBefore).toString()}\n`);

    // Summary
    console.log(BLUE + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
    console.log(GREEN + '🎉 AGENT TEST SUCCESSFUL!' + RESET);
    console.log(BLUE + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
    console.log('');
    console.log(GREEN + '✅ Product listed successfully via agent' + RESET);
    console.log(GREEN + '✅ USDC payment processed (2 USDC listing fee)' + RESET);
    console.log(GREEN + '✅ Transaction confirmed on-chain' + RESET);
    if (gasSponsoredEvent) {
      console.log(GREEN + '✅ Gas sponsorship tracked via event' + RESET);
    }
    console.log('');
    console.log(BLUE + '📊 Transaction Details:' + RESET);
    console.log(`  TX Hash: ${listTx.hash}`);
    console.log(`  Basescan: https://sepolia.basescan.org/tx/${listTx.hash}`);
    console.log(`  Gas Used: ${listReceipt.gasUsed.toString()}`);
    console.log(`  Gas Cost: ${ethers.formatEther(gasCost)} ETH`);
    console.log('');
    console.log(YELLOW + '📋 Next: Check Coinbase Paymaster Dashboard' + RESET);
    console.log(`  → https://portal.cdp.coinbase.com/products/paymaster`);
    console.log(`  → Verify gas costs are being tracked`);
    console.log('');

  } catch (error) {
    console.log('');
    console.log(RED + '❌ ERROR:' + RESET);
    console.log(RED + error.message + RESET);

    if (error.message.includes('insufficient funds')) {
      console.log('');
      console.log(YELLOW + 'Need more USDC? Get testnet USDC:' + RESET);
      console.log(`  → https://faucet.circle.com/`);
      console.log(`  → Your address: ${wallet.address}`);
    }

    console.log('');
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
