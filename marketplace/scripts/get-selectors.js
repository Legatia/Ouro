/**
 * Get Function Selectors for Coinbase Paymaster Allowlist
 */

const { keccak256, toUtf8Bytes } = require('ethers');

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

functionSignatures.forEach((sig) => {
  const selector = keccak256(toUtf8Bytes(sig)).slice(0, 10);
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

const primarySelectors = [];

primaryFunctions.forEach((sig) => {
  const selector = keccak256(toUtf8Bytes(sig)).slice(0, 10);
  primarySelectors.push(selector);
  console.log(`Function: ${sig}`);
  console.log(`Selector: ${selector}\n`);
});

console.log('\n📝 COMMA-SEPARATED FORMAT:\n');
console.log('Function Signatures (with parameters):');
console.log(primaryFunctions.join(', '));
console.log('\n');

console.log('Function Selectors (4-byte):');
console.log(primarySelectors.join(', '));
console.log('\n');

console.log('\n🔧 OPTIONAL: Include deprecateProduct (seller function):\n');
const deprecateSig = 'deprecateProduct(bytes32)';
const deprecateSelector = keccak256(toUtf8Bytes(deprecateSig)).slice(0, 10);
console.log(`Function: ${deprecateSig}`);
console.log(`Selector: ${deprecateSelector}\n`);

console.log('\n✅ RECOMMENDED FOR COINBASE:\n');
console.log('Copy this to Coinbase Paymaster allowlist:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 FUNCTION SIGNATURES (with parameters):\n');
console.log(primaryFunctions.join(', '));
console.log('\n');
console.log('🔢 FUNCTION SELECTORS (4-byte):\n');
console.log(primarySelectors.join(', '));
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
