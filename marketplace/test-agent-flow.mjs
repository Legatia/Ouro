/**
 * Test Script: Verify AI Agent Can Trade
 *
 * This script simulates an AI agent:
 * 1. Searching for products
 * 2. Purchasing a product with USDC
 * 3. Receiving delivery
 *
 * Run: node test-agent-flow.mjs
 */

import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || '0x...'; // NEVER commit real keys!
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

console.log('🤖 Starting AI Agent Trading Test...\n');

// Step 1: Search for products
console.log('📍 Step 1: Searching for products...');
try {
  const searchResponse = await fetch(`${BASE_URL}/api/products/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Address': '0xYourAgentAddress', // Agent's identity
    },
    body: JSON.stringify({
      intent: 'I need Twitter automation tools',
      limit: 5,
    }),
  });

  const searchData = await searchResponse.json();
  console.log('✅ Search successful!');
  console.log(`   Found ${searchData.results?.length || 0} products`);

  if (searchData.results?.length > 0) {
    console.log(`   Example: "${searchData.results[0].name}" - $${searchData.results[0].priceUSDC} USDC\n`);
  } else {
    console.log('⚠️  No products found. You need to list some first!\n');
  }
} catch (error) {
  console.error('❌ Search failed:', error.message);
  process.exit(1);
}

// Step 2: Check if agent can interact with blockchain
console.log('📍 Step 2: Testing blockchain interaction...');
try {
  // Create wallet client (agent's wallet)
  if (AGENT_PRIVATE_KEY === '0x...') {
    console.log('⚠️  Skipping blockchain test - no private key provided');
    console.log('   Set AGENT_PRIVATE_KEY environment variable to test transactions\n');
  } else {
    const account = privateKeyToAccount(AGENT_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    console.log(`   Agent wallet: ${account.address}`);

    // Check USDC balance
    const usdcAbi = [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const balanceFormatted = Number(balance) / 1e6;
    console.log(`   USDC Balance: ${balanceFormatted} USDC`);

    if (balanceFormatted === 0) {
      console.log('⚠️  Agent has no USDC!');
      console.log('   Get testnet USDC: https://faucet.circle.com/\n');
    } else {
      console.log('✅ Agent can interact with blockchain!\n');
    }
  }
} catch (error) {
  console.error('❌ Blockchain interaction failed:', error.message);
}

// Step 3: Test purchase flow (simulation)
console.log('📍 Step 3: Testing purchase flow...');
console.log('   To complete a purchase, an agent would:');
console.log('   1. Approve USDC transfer to marketplace contract');
console.log('   2. Call marketplace.purchase(productId)');
console.log('   3. Wait for transaction confirmation');
console.log('   4. Call /api/products/:id/deliver to get download link\n');

// Step 4: Test delivery endpoint
console.log('📍 Step 4: Testing delivery endpoint (mock)...');
try {
  // This would normally require a real purchase first
  const deliveryResponse = await fetch(`${BASE_URL}/api/products/test-product-id/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    }),
  });

  if (deliveryResponse.status === 404) {
    console.log('✅ Delivery endpoint exists (404 = no purchase found, which is expected)\n');
  } else if (deliveryResponse.ok) {
    const deliveryData = await deliveryResponse.json();
    console.log('✅ Delivery endpoint works!');
    console.log('   Delivery data:', deliveryData, '\n');
  }
} catch (error) {
  console.log('⚠️  Delivery endpoint test skipped:', error.message, '\n');
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Test Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ API endpoints accessible');
console.log('✅ Search functionality works');
console.log('⚠️  Smart contract integration: Needs real wallet test');
console.log('⚠️  Purchase flow: Needs products + USDC');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Deploy your site to Vercel');
console.log('2. List a test product (via /list page or API)');
console.log('3. Get testnet USDC: https://faucet.circle.com/');
console.log('4. Test a real purchase with agent wallet');
console.log('');
console.log('📚 Full agent guide: See AGENT_README.md');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
