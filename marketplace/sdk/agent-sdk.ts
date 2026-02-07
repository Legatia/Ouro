/**
 * Ouro SDK
 * Enables AI agents to autonomously discover, verify, and purchase capabilities.
 *
 * Key Features:
 * - Intent-based search ("I need to post to Twitter" → finds relevant products)
 * - On-chain verification before purchase (trustless)
 * - Automatic USDC approval and purchase (gas-free for agents)
 * - Machine-readable responses (JSON, no HTML)
 *
 * Installation:
 *   npm install @a2a-commerce/agent-sdk
 *
 * Usage:
 *   const agent = new OuroAgent({ walletAddress: '0x...' });
 *   const products = await agent.search({ intent: "post to twitter" });
 *   await agent.purchase(products[0].id);
 */

import { createPublicClient, createWalletClient, http, parseUnits, type Address, type Hash } from 'viem';
import { base } from 'viem/chains';

// ============ Types ============

export interface AgentConfig {
  walletAddress: Address;
  privateKey?: `0x${string}`; // Optional: for autonomous agents
  rpcUrl?: string;
  apiUrl?: string; // Marketplace API endpoint
}

export interface SearchParams {
  intent?: string; // Natural language: "I need to post to Twitter"
  tags?: string[]; // Specific tags: ["twitter", "automation"]
  maxPrice?: number; // Max price in USDC
  minRating?: number; // Min rating (0-5)
  sandboxTest?: boolean; // Only return products with sandbox
  complianceRisk?: ('low' | 'medium' | 'high')[];
  limit?: number;
}

export interface Product {
  id: string;
  chainProductId: `0x${string}`; // bytes32 from smart contract

  // Product info
  name: string;
  description: string;
  tags: string[];

  // Pricing
  priceUSDC: number;
  pricingModel: 'one_time' | 'subscription' | 'usage_based';

  // Seller
  sellerAddress: Address;
  sellerENS?: string;
  sellerTrustScore: number; // 0-1000

  // Stats (from on-chain)
  totalSales: number;
  avgRating: number;
  totalReviews: number;
  totalRevenue: number;

  // Metadata
  metadataURI: string; // Metadata URL or identifier
  sandboxAvailable: boolean;
  complianceRisk: 'low' | 'medium' | 'high';

  // Relevance (for search results)
  relevanceScore?: number; // 0-1, how well it matches intent
}

export interface PurchaseResult {
  success: boolean;
  txHash: Hash;
  productId: string;
  downloadUrl?: string; // URL to download capability
  apiKey?: string; // If product is an API key
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  onChainSales: number;
  onChainRating: number;
  onChainRevenue: number;
  sellerAddress: Address;
  discrepancies: string[]; // Any mismatches between on-chain and API data
}

// ============ Ouro SDK ============

export class OuroAgent {
  private config: AgentConfig;
  private publicClient: any;
  private walletClient?: any;

  private readonly MARKETPLACE_ADDRESS: Address = '0x...'; // Deployed contract address
  private readonly USDC_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC
  private readonly DEFAULT_API_URL = 'https://api.agentmarketplace.com';

  constructor(config: AgentConfig) {
    this.config = {
      ...config,
      rpcUrl: config.rpcUrl || 'https://mainnet.base.org',
      apiUrl: config.apiUrl || this.DEFAULT_API_URL,
    };

    // Create public client for reading blockchain
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(this.config.rpcUrl),
    });

    // Create wallet client if private key provided (for autonomous agents)
    if (config.privateKey) {
      this.walletClient = createWalletClient({
        chain: base,
        transport: http(this.config.rpcUrl),
        account: config.privateKey,
      });
    }
  }

  // ============ Search & Discovery ============

  /**
   * Search for products using natural language intent or tags
   *
   * Examples:
   *   - search({ intent: "I need to post to Twitter and schedule tweets" })
   *   - search({ tags: ["twitter", "automation"], maxPrice: 20 })
   *   - search({ intent: "crypto arbitrage", minRating: 4.0 })
   */
  async search(params: SearchParams): Promise<Product[]> {
    const response = await fetch(`${this.config.apiUrl}/api/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ouro-SDK/1.0',
      },
      body: JSON.stringify({
        intent: params.intent,
        tags: params.tags,
        maxPrice: params.maxPrice,
        minRating: params.minRating,
        sandboxTest: params.sandboxTest,
        complianceRisk: params.complianceRisk,
        limit: params.limit || 20,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  }

  /**
   * Get detailed information about a specific product
   */
  async getProduct(productId: string): Promise<Product> {
    const response = await fetch(`${this.config.apiUrl}/api/products/${productId}`, {
      headers: {
        'User-Agent': 'Ouro-SDK/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Browse products by tag
   */
  async browseByTag(tag: string, options?: { limit?: number; minRating?: number }): Promise<Product[]> {
    return this.search({
      tags: [tag],
      limit: options?.limit,
      minRating: options?.minRating,
    });
  }

  /**
   * Get trending products (most sales in last 7 days)
   */
  async getTrending(limit: number = 10): Promise<Product[]> {
    const response = await fetch(`${this.config.apiUrl}/api/products/trending?limit=${limit}`, {
      headers: {
        'User-Agent': 'Ouro-SDK/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trending: ${response.statusText}`);
    }

    const data = await response.json();
    return data.products;
  }

  // ============ Verification (Trustless) ============

  /**
   * Verify product data on-chain before purchase
   *
   * This ensures the API isn't lying about sales/ratings.
   * Agents should ALWAYS verify before making autonomous purchases.
   */
  async verifyProduct(productId: string): Promise<VerificationResult> {
    // Get product from API
    const apiProduct = await this.getProduct(productId);

    // Get product from on-chain
    const onChainProduct = await this.publicClient.readContract({
      address: this.MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getProduct',
      args: [apiProduct.chainProductId as `0x${string}`],
    });

    const [rating, reviewCount] = await this.publicClient.readContract({
      address: this.MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getProductRating',
      args: [apiProduct.chainProductId as `0x${string}`],
    });

    // Check for discrepancies
    const discrepancies: string[] = [];

    if (onChainProduct.totalSales !== BigInt(apiProduct.totalSales)) {
      discrepancies.push(`Sales mismatch: API says ${apiProduct.totalSales}, chain says ${onChainProduct.totalSales}`);
    }

    const onChainRating = Number(rating) / 100; // Convert from 470 → 4.7
    if (Math.abs(onChainRating - apiProduct.avgRating) > 0.1) {
      discrepancies.push(`Rating mismatch: API says ${apiProduct.avgRating}, chain says ${onChainRating}`);
    }

    if (onChainProduct.seller.toLowerCase() !== apiProduct.sellerAddress.toLowerCase()) {
      discrepancies.push(`Seller mismatch: API says ${apiProduct.sellerAddress}, chain says ${onChainProduct.seller}`);
    }

    return {
      verified: discrepancies.length === 0,
      onChainSales: Number(onChainProduct.totalSales),
      onChainRating,
      onChainRevenue: Number(onChainProduct.totalRevenueUSDC) / 1e6, // Convert from 6 decimals
      sellerAddress: onChainProduct.seller,
      discrepancies,
    };
  }

  // ============ Purchase ============

  /**
   * Purchase a product
   *
   * Steps:
   * 1. Verify product on-chain
   * 2. Approve USDC spending
   * 3. Execute purchase
   * 4. Return download URL or API key
   *
   * Note: Gas is sponsored by platform, agent only needs USDC
   */
  async purchase(productId: string, options?: { skipVerification?: boolean }): Promise<PurchaseResult> {
    if (!this.walletClient) {
      throw new Error('No wallet client configured. Provide privateKey in config for autonomous purchases.');
    }

    // Step 1: Verify product (unless skipped)
    if (!options?.skipVerification) {
      const verification = await this.verifyProduct(productId);
      if (!verification.verified) {
        return {
          success: false,
          txHash: '0x' as Hash,
          productId,
          error: `Verification failed: ${verification.discrepancies.join(', ')}`,
        };
      }
    }

    // Step 2: Get product details
    const product = await this.getProduct(productId);
    const priceInUSDC = parseUnits(product.priceUSDC.toString(), 6); // USDC has 6 decimals

    // Step 3: Approve USDC spending (gas sponsored)
    const approveTx = await this.walletClient.writeContract({
      address: this.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [this.MARKETPLACE_ADDRESS, priceInUSDC],
      chain: base,
      account: this.walletClient.account!,
    });

    // Wait for approval
    await this.publicClient.waitForTransactionReceipt({ hash: approveTx });

    // Step 4: Purchase (gas sponsored)
    const purchaseTx = await this.walletClient.writeContract({
      address: this.MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'purchase',
      args: [product.chainProductId as `0x${string}`],
      chain: base,
      account: this.walletClient.account!,
    });

    // Wait for purchase
    await this.publicClient.waitForTransactionReceipt({ hash: purchaseTx });

    // Step 5: Get download URL from API (backend verifies purchase on-chain)
    const deliveryResponse = await fetch(`${this.config.apiUrl}/api/products/${productId}/deliver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ouro-SDK/1.0',
      },
      body: JSON.stringify({
        buyerAddress: this.config.walletAddress,
        txHash: purchaseTx,
      }),
    });

    if (!deliveryResponse.ok) {
      return {
        success: false,
        txHash: purchaseTx,
        productId,
        error: 'Purchase succeeded but delivery failed. Contact support.',
      };
    }

    const delivery = await deliveryResponse.json();

    return {
      success: true,
      txHash: purchaseTx,
      productId,
      downloadUrl: delivery.downloadUrl,
      apiKey: delivery.apiKey,
    };
  }

  /**
   * Leave a review for a purchased product
   */
  async leaveReview(productId: string, rating: 1 | 2 | 3 | 4 | 5): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('No wallet client configured.');
    }

    const product = await this.getProduct(productId);

    const txHash = await this.walletClient.writeContract({
      address: this.MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'leaveReview',
      args: [product.chainProductId as `0x${string}`, rating],
      chain: base,
      account: this.walletClient.account!,
    });

    return txHash;
  }

  // ============ Utility Functions ============

  /**
   * Check agent's USDC balance
   */
  async getUSDCBalance(): Promise<number> {
    const balance = await this.publicClient.readContract({
      address: this.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [this.config.walletAddress],
    });

    return Number(balance) / 1e6; // Convert from 6 decimals
  }

  /**
   * Get purchase history for this agent
   */
  async getPurchaseHistory(): Promise<Product[]> {
    const response = await fetch(`${this.config.apiUrl}/api/agents/${this.config.walletAddress}/purchases`, {
      headers: {
        'User-Agent': 'Ouro-SDK/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.purchases;
  }

  // ============ x402 / First-Class Agent Features ============

  /**
   * Call a premium capability endpoint with x402 auto-payment logic.
   *
   * If the endpoint returns '402 Payment Required', the agent will
   * attempt to pay the requested USDC amount autonomously and retry.
   *
   * @param url The endpoint URL
   * @param options Fetch options
   * @returns The response data
   */
  async callPremiumEndpoint(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-agent-address': this.config.walletAddress,
      },
    });

    // 402: Payment Required (x402 standard)
    if (response.status === 402) {
      const paymentInfo = await response.json();
      console.log(`💰 x402 Payment Required for ${url}. Amount: ${paymentInfo.priceUSDC} USDC.`);

      if (!this.walletClient) {
        throw new Error('x402 Payment Required but no privateKey configured for auto-payment.');
      }

      // Attempt auto-purchase
      const purchase = await this.purchase(paymentInfo.productId, { skipVerification: true });

      if (purchase.success) {
        console.log('✅ Auto-payment successful. Retrying request...');
        // Retry with payment proof
        return this.callPremiumEndpoint(url, {
          ...options,
          headers: {
            ...options.headers,
            'x-payment-tx': purchase.txHash,
            'x-payment-address': this.config.walletAddress,
          },
        });
      } else {
        throw new Error(`x402 Auto-payment failed: ${purchase.error}`);
      }
    }

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`API call failed (${response.status}): ${errorMsg}`);
    }

    return response.json();
  }
}

// ============ ABIs ============

const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const MARKETPLACE_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'tags', type: 'string[]' },
      { name: 'priceUSDC', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    name: 'listProduct',
    outputs: [{ name: 'productId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'productId', type: 'bytes32' }],
    name: 'purchase',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'productId', type: 'bytes32' }, { name: 'rating', type: 'uint8' }],
    name: 'leaveReview',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'productId', type: 'bytes32' }],
    name: 'getProduct',
    outputs: [
      {
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'seller', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'tags', type: 'string[]' },
          { name: 'priceUSDC', type: 'uint256' },
          { name: 'metadataURI', type: 'string' },
          { name: 'totalSales', type: 'uint256' },
          { name: 'totalRevenueUSDC', type: 'uint256' },
          { name: 'listedAt', type: 'uint256' },
          { name: 'deprecated', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'productId', type: 'bytes32' }],
    name: 'getProductRating',
    outputs: [
      { name: 'rating', type: 'uint256' },
      { name: 'reviewCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ============ Export ============

export default OuroAgent;
