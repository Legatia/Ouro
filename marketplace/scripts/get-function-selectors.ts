/**
 * Get Function Selectors for Coinbase Paymaster Allowlist
 *
 * This script calculates the 4-byte function selectors for all contract functions
 */

import { ethers } from 'hardhat';

async function main() {
  console.log('\n=== OURO CONTRACT FUNCTION SIGNATURES ===\n');

  const functionSignatures = [
    // Core user functions (need gas sponsorship)
    'listProduct(string,string[],uint256,string)',
    'purchase(bytes32)',
    'leaveReview(bytes32,uint8)',
    'deprecateProduct(bytes32)',

    // View functions (read-only, no gas)
    'getProduct(bytes32)',
    'getProductRating(bytes32)',
    'getProductPurchases(bytes32)',
    'hasUserPurchased(address,bytes32)',
    'getMarketplaceStats()',

    // Admin functions (owner only)
    'updateTreasury(address)',
    'emergencyWithdraw()',
  ];

  console.log('📋 ALL FUNCTIONS WITH SELECTORS:\n');

  const selectors: string[] = [];

  functionSignatures.forEach((sig) => {
    const selector = ethers.id(sig).slice(0, 10); // First 4 bytes (0x + 8 hex chars)
    selectors.push(selector);
    console.log(`${sig}`);
    console.log(`  → Selector: ${selector}\n`);
  });

  console.log('\n=== FOR COINBASE PAYMASTER ALLOWLIST ===\n');

  console.log('🎯 PRIMARY FUNCTIONS (User-Facing, Need Gas Sponsorship):\n');

  const primaryFunctions = [
    'listProduct(string,string[],uint256,string)',
    'purchase(bytes32)',
    'leaveReview(bytes32,uint8)',
  ];

  const primarySelectors: string[] = [];

  primaryFunctions.forEach((sig) => {
    const selector = ethers.id(sig).slice(0, 10);
    primarySelectors.push(selector);
    console.log(`Function: ${sig}`);
    console.log(`Selector: ${selector}\n`);
  });

  console.log('\n📝 COMMA-SEPARATED FORMAT:\n');
  console.log('Function Names:');
  console.log('listProduct, purchase, leaveReview\n');

  console.log('Function Selectors:');
  console.log(primarySelectors.join(', '));
  console.log('\n');

  console.log('Full Signatures:');
  console.log(primaryFunctions.join(', '));
  console.log('\n');

  console.log('\n🔧 OPTIONAL: Include deprecateProduct (seller function):\n');
  const deprecateSig = 'deprecateProduct(bytes32)';
  const deprecateSelector = ethers.id(deprecateSig).slice(0, 10);
  console.log(`Function: ${deprecateSig}`);
  console.log(`Selector: ${deprecateSelector}\n`);

  console.log('\n✅ RECOMMENDED FOR COINBASE:\n');
  console.log('Copy this to Coinbase Paymaster allowlist:\n');
  console.log('------------------------------------------');
  console.log('Function Signatures (with parameters):');
  console.log('listProduct(string,string[],uint256,string), purchase(bytes32), leaveReview(bytes32,uint8)');
  console.log('\n');
  console.log('Function Selectors (4-byte):');
  console.log(primarySelectors.join(', '));
  console.log('------------------------------------------\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
