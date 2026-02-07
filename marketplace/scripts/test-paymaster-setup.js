/**
 * Test Coinbase Paymaster Setup
 *
 * Verifies:
 * 1. Environment variables configured
 * 2. Contract deployed and accessible
 * 3. Contract functions are correct
 * 4. Paymaster URL is valid
 */

const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function main() {
  console.log('\n' + BLUE + '🧪 TESTING COINBASE PAYMASTER SETUP' + RESET + '\n');

  let passedTests = 0;
  let failedTests = 0;

  // ============ Test 1: Environment Variables ============
  console.log(BLUE + '📋 Test 1: Environment Variables' + RESET);

  const requiredEnvVars = {
    'NEXT_PUBLIC_COINBASE_PAYMASTER_URL': process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_URL,
    'COINBASE_API_KEY': process.env.COINBASE_API_KEY,
    'COINBASE_API_SECRET': process.env.COINBASE_API_SECRET,
    'NEXT_PUBLIC_MARKETPLACE_ADDRESS': process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
    'NEXT_PUBLIC_CHAIN_ID': process.env.NEXT_PUBLIC_CHAIN_ID,
    'ADMIN_PRIVATE_KEY': process.env.ADMIN_PRIVATE_KEY,
  };

  let envTestPassed = true;

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === '' || value.includes('<') || value.includes('xxxxx')) {
      console.log(RED + `  ✗ ${key}: Missing or placeholder` + RESET);
      envTestPassed = false;
      failedTests++;
    } else {
      const displayValue = key.includes('PRIVATE_KEY') || key.includes('SECRET') || key.includes('API_KEY')
        ? value.substring(0, 10) + '...'
        : value;
      console.log(GREEN + `  ✓ ${key}: ${displayValue}` + RESET);
    }
  }

  if (envTestPassed) {
    console.log(GREEN + '  ✓ All environment variables configured\n' + RESET);
    passedTests++;
  } else {
    console.log(RED + '  ✗ Some environment variables missing\n' + RESET);
  }

  // ============ Test 2: Chain Configuration ============
  console.log(BLUE + '📋 Test 2: Chain Configuration' + RESET);

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId === '84532') {
    console.log(GREEN + '  ✓ Chain ID: 84532 (Base Sepolia - Testnet)' + RESET);
    console.log(GREEN + '  ✓ Network: Testnet' + RESET);
    passedTests++;
  } else if (chainId === '8453') {
    console.log(YELLOW + '  ⚠ Chain ID: 8453 (Base Mainnet)' + RESET);
    console.log(YELLOW + '  ⚠ Warning: Using mainnet (real money!)' + RESET);
    passedTests++;
  } else {
    console.log(RED + `  ✗ Invalid chain ID: ${chainId}` + RESET);
    failedTests++;
  }
  console.log('');

  // ============ Test 3: Contract Connection ============
  console.log(BLUE + '📋 Test 3: Contract Connection' + RESET);

  try {
    const rpcUrl = chainId === '84532'
      ? 'https://sepolia.base.org'
      : 'https://mainnet.base.org';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

    console.log(`  → Connecting to: ${rpcUrl}`);
    console.log(`  → Contract: ${contractAddress}`);

    // Check if contract exists
    const code = await provider.getCode(contractAddress);

    if (code === '0x') {
      console.log(RED + '  ✗ No contract found at this address' + RESET);
      failedTests++;
    } else {
      console.log(GREEN + '  ✓ Contract deployed and accessible' + RESET);
      console.log(GREEN + `  ✓ Contract bytecode size: ${(code.length - 2) / 2} bytes` + RESET);
      passedTests++;
    }
  } catch (error) {
    console.log(RED + `  ✗ Failed to connect: ${error.message}` + RESET);
    failedTests++;
  }
  console.log('');

  // ============ Test 4: Contract Functions ============
  console.log(BLUE + '📋 Test 4: Contract Functions' + RESET);

  try {
    const rpcUrl = chainId === '84532'
      ? 'https://sepolia.base.org'
      : 'https://mainnet.base.org';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

    const contractABI = [
      'function LISTING_FEE() view returns (uint256)',
      'function PLATFORM_FEE_BPS() view returns (uint256)',
      'function MAX_TAGS() view returns (uint256)',
      'function treasury() view returns (address)',
      'function totalProducts() view returns (uint256)',
      'function totalVolume() view returns (uint256)',
      'function getMarketplaceStats() view returns (uint256, uint256)',
      'function listProduct(string,string[],uint256,string) returns (bytes32)',
      'function purchase(bytes32)',
      'function leaveReview(bytes32,uint8)',
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Read constants
    const listingFee = await contract.LISTING_FEE();
    const platformFeeBps = await contract.PLATFORM_FEE_BPS();
    const maxTags = await contract.MAX_TAGS();
    const treasury = await contract.treasury();
    const stats = await contract.getMarketplaceStats();

    console.log(GREEN + '  ✓ Contract functions accessible' + RESET);
    console.log(GREEN + `  ✓ Listing Fee: ${ethers.formatUnits(listingFee, 6)} USDC` + RESET);
    console.log(GREEN + `  ✓ Platform Fee: ${Number(platformFeeBps) / 100}%` + RESET);
    console.log(GREEN + `  ✓ Max Tags: ${maxTags.toString()}` + RESET);
    console.log(GREEN + `  ✓ Treasury: ${treasury}` + RESET);
    console.log(GREEN + `  ✓ Total Products: ${stats[0].toString()}` + RESET);
    console.log(GREEN + `  ✓ Total Volume: ${ethers.formatUnits(stats[1], 6)} USDC` + RESET);
    passedTests++;
  } catch (error) {
    console.log(RED + `  ✗ Failed to read contract: ${error.message}` + RESET);
    failedTests++;
  }
  console.log('');

  // ============ Test 5: Paymaster URL Format ============
  console.log(BLUE + '📋 Test 5: Paymaster URL Format' + RESET);

  const paymasterUrl = process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_URL;

  if (paymasterUrl.startsWith('https://api.developer.coinbase.com/rpc/v1/base-sepolia/')) {
    console.log(GREEN + '  ✓ Paymaster URL format: Valid (Base Sepolia)' + RESET);
    console.log(GREEN + `  ✓ URL: ${paymasterUrl}` + RESET);
    passedTests++;
  } else if (paymasterUrl.startsWith('https://api.developer.coinbase.com/rpc/v1/base/')) {
    console.log(GREEN + '  ✓ Paymaster URL format: Valid (Base Mainnet)' + RESET);
    console.log(GREEN + `  ✓ URL: ${paymasterUrl}` + RESET);
    passedTests++;
  } else {
    console.log(RED + '  ✗ Invalid Paymaster URL format' + RESET);
    console.log(RED + `  ✗ Expected: https://api.developer.coinbase.com/rpc/v1/base-sepolia/...` + RESET);
    console.log(RED + `  ✗ Got: ${paymasterUrl}` + RESET);
    failedTests++;
  }
  console.log('');

  // ============ Test 6: Function Selectors ============
  console.log(BLUE + '📋 Test 6: Function Selectors for Allowlist' + RESET);

  const functions = [
    'listProduct(string,string[],uint256,string)',
    'purchase(bytes32)',
    'leaveReview(bytes32,uint8)',
  ];

  console.log(GREEN + '  ✓ Functions to allowlist:' + RESET);
  functions.forEach((sig) => {
    const selector = ethers.id(sig).slice(0, 10);
    console.log(GREEN + `    - ${sig}: ${selector}` + RESET);
  });
  passedTests++;
  console.log('');

  // ============ Test 7: USDC Address ============
  console.log(BLUE + '📋 Test 7: USDC Address Configuration' + RESET);

  const expectedUSDC = chainId === '84532'
    ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia
    : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet

  try {
    const rpcUrl = chainId === '84532'
      ? 'https://sepolia.base.org'
      : 'https://mainnet.base.org';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

    const contractABI = [
      'function USDC() view returns (address)',
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const usdcAddress = await contract.USDC();

    if (usdcAddress.toLowerCase() === expectedUSDC.toLowerCase()) {
      console.log(GREEN + `  ✓ USDC Address: ${usdcAddress}` + RESET);
      console.log(GREEN + `  ✓ Correct for ${chainId === '84532' ? 'Base Sepolia' : 'Base Mainnet'}` + RESET);
      passedTests++;
    } else {
      console.log(RED + `  ✗ Wrong USDC address` + RESET);
      console.log(RED + `  ✗ Expected: ${expectedUSDC}` + RESET);
      console.log(RED + `  ✗ Got: ${usdcAddress}` + RESET);
      failedTests++;
    }
  } catch (error) {
    console.log(RED + `  ✗ Failed to check USDC: ${error.message}` + RESET);
    failedTests++;
  }
  console.log('');

  // ============ Summary ============
  console.log(BLUE + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
  console.log(BLUE + '📊 TEST SUMMARY' + RESET);
  console.log(BLUE + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
  console.log('');
  console.log(GREEN + `✓ Passed: ${passedTests}` + RESET);
  console.log(failedTests > 0 ? RED + `✗ Failed: ${failedTests}` + RESET : `✗ Failed: 0`);
  console.log('');

  if (failedTests === 0) {
    console.log(GREEN + '🎉 ALL TESTS PASSED!' + RESET);
    console.log(GREEN + '✅ Your Coinbase Paymaster setup is ready for testing!' + RESET);
    console.log('');
    console.log(BLUE + 'Next Steps:' + RESET);
    console.log('1. Get testnet USDC: https://faucet.circle.com/');
    console.log('2. Open app: http://localhost:3001');
    console.log('3. Create Coinbase Smart Wallet');
    console.log('4. List a test product');
    console.log('5. Verify gas fees are $0.00');
    console.log('');
  } else {
    console.log(RED + '❌ SOME TESTS FAILED' + RESET);
    console.log(YELLOW + 'Please fix the issues above before testing.' + RESET);
    console.log('');
  }

  console.log(BLUE + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(RED + `\n❌ Test script failed: ${error.message}` + RESET);
    process.exit(1);
  });
