// Database Schema - Agent-First Marketplace
// Tag-based, open categories, supports gas sponsorship tracking

import { pgTable, uuid, varchar, text, integer, decimal, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Products table - Core marketplace listings
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),

  // On-chain reference
  chainId: integer('chain_id').notNull().default(8453), // Base mainnet
  contractAddress: varchar('contract_address', { length: 42 }).notNull(),
  productId: varchar('product_id', { length: 66 }).notNull(), // bytes32 from smart contract

  // Seller info
  sellerAddress: varchar('seller_address', { length: 42 }).notNull(),
  sellerENS: varchar('seller_ens', { length: 255 }),

  // Product details (off-chain, synced from IPFS)
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  tags: text('tags').array().notNull(), // ["twitter", "automation", "social-media"]

  // Pricing
  priceUSDC: decimal('price_usdc', { precision: 10, scale: 2 }).notNull(),
  pricingModel: varchar('pricing_model', { length: 20 }).notNull().default('one_time'), // one_time | subscription | usage_based

  // Metadata
  metadataURI: text('metadata_uri').notNull(), // IPFS hash
  fileFormat: varchar('file_format', { length: 20 }), // zip | json | py | docker
  deliveryMethod: varchar('delivery_method', { length: 30 }), // file_download | api_key | webhook

  // Classification (seller-defined)
  capabilityType: varchar('capability_type', { length: 30 }), // digital_asset | compute_lease | human_service
  sellerCategory: varchar('seller_category', { length: 100 }), // Freeform category

  // Requirements
  dependencies: jsonb('dependencies').$type<{
    apiKeys?: string[];
    environment?: string[];
    other?: string[];
  }>(),
  runtimeEnvironment: varchar('runtime_environment', { length: 30 }), // python3.11 | nodejs20 | docker

  // Trust & Safety
  complianceRisk: varchar('compliance_risk', { length: 10 }).notNull().default('low'), // low | medium | high
  sandboxAvailable: boolean('sandbox_available').notNull().default(true),
  openSource: boolean('open_source').notNull().default(false),
  sourceRepoUrl: varchar('source_repo_url', { length: 200 }),
  license: varchar('license', { length: 50 }),

  // Stats (synced from on-chain)
  totalSales: integer('total_sales').notNull().default(0),
  totalRevenueUSDC: decimal('total_revenue_usdc', { precision: 10, scale: 2 }).notNull().default('0'),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2 }),
  totalReviews: integer('total_reviews').notNull().default(0),

  // Analytics (off-chain only)
  viewCount: integer('view_count').notNull().default(0),
  sandboxTestCount: integer('sandbox_test_count').notNull().default(0),
  sandboxSuccessRate: decimal('sandbox_success_rate', { precision: 4, scale: 3 }),

  // Status
  deprecated: boolean('deprecated').notNull().default(false),
  successorProductId: uuid('successor_product_id'),

  // Timestamps
  listedAt: timestamp('listed_at').notNull().defaultNow(),
  lastSaleAt: timestamp('last_sale_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tagsIdx: index('tags_idx').using('gin', table.tags),
  sellerIdx: index('seller_idx').on(table.sellerAddress),
  priceIdx: index('price_idx').on(table.priceUSDC),
  salesIdx: index('sales_idx').on(table.totalSales),
  ratingIdx: index('rating_idx').on(table.avgRating),
  chainProductIdx: index('chain_product_idx').on(table.chainId, table.productId),
}));

// Tag analytics - Track emerging categories
export const tagAnalytics = pgTable('tag_analytics', {
  tag: varchar('tag', { length: 50 }).primaryKey(),

  // Usage stats
  productCount: integer('product_count').notNull().default(0),
  totalSearches: integer('total_searches').notNull().default(0),
  totalClicks: integer('total_clicks').notNull().default(0),
  totalPurchases: integer('total_purchases').notNull().default(0),

  // Performance metrics
  clickThroughRate: decimal('click_through_rate', { precision: 4, scale: 3 }),
  conversionRate: decimal('conversion_rate', { precision: 4, scale: 3 }),
  trendingScore: decimal('trending_score', { precision: 10, scale: 2 }), // Weighted score

  // Timestamps
  firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
}, (table) => ({
  trendingIdx: index('trending_idx').on(table.trendingScore.desc()),
  productCountIdx: index('product_count_idx').on(table.productCount.desc()),
}));

// Seller reputation
export const sellers = pgTable('sellers', {
  address: varchar('address', { length: 42 }).primaryKey(),
  ens: varchar('ens', { length: 255 }),

  // Reputation
  trustScore: integer('trust_score').notNull().default(0), // 0-1000 scale
  successfulTransactions: integer('successful_transactions').notNull().default(0),
  disputedTransactions: integer('disputed_transactions').notNull().default(0),
  resolutionRate: decimal('resolution_rate', { precision: 4, scale: 3 }),

  // Verification
  verifiedHuman: boolean('verified_human').notNull().default(false),
  kycCompletedAt: timestamp('kyc_completed_at'),

  // Stats
  totalListings: integer('total_listings').notNull().default(0),
  totalEarningsUSDC: decimal('total_earnings_usdc', { precision: 10, scale: 2 }).notNull().default('0'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  trustScoreIdx: index('trust_score_idx').on(table.trustScore.desc()),
}));

// Transactions
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // On-chain reference
  chainId: integer('chain_id').notNull(),
  txHash: varchar('tx_hash', { length: 66 }).notNull().unique(),
  blockNumber: integer('block_number').notNull(),

  // Transaction details
  type: varchar('type', { length: 20 }).notNull(), // listing | purchase | review
  productId: uuid('product_id').references(() => products.id),

  // Parties
  fromAddress: varchar('from_address', { length: 42 }).notNull(),
  toAddress: varchar('to_address', { length: 42 }),

  // Amounts
  amountUSDC: decimal('amount_usdc', { precision: 10, scale: 2 }),
  platformFeeUSDC: decimal('platform_fee_usdc', { precision: 10, scale: 2 }),

  // Gas sponsorship tracking
  gasSponsoredByPlatform: boolean('gas_sponsored_by_platform').notNull().default(true),
  estimatedGasCostUSD: decimal('estimated_gas_cost_usd', { precision: 10, scale: 4 }),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('confirmed'), // pending | confirmed | failed

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  txHashIdx: index('tx_hash_idx').on(table.txHash),
  txProductIdx: index('tx_product_idx').on(table.productId),
  typeIdx: index('type_idx').on(table.type),
}));

// Gas sponsorship log (for accounting)
export const gasSponsorship = pgTable('gas_sponsorship', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Transaction reference
  transactionId: uuid('transaction_id').references(() => transactions.id),
  txHash: varchar('tx_hash', { length: 66 }).notNull(),

  // Sponsorship details
  userAddress: varchar('user_address', { length: 42 }).notNull(),
  functionName: varchar('function_name', { length: 50 }).notNull(), // listProduct | purchase | leaveReview

  // Costs
  gasUsed: integer('gas_used').notNull(),
  gasPrice: decimal('gas_price', { precision: 20, scale: 0 }), // wei
  gasCostETH: decimal('gas_cost_eth', { precision: 18, scale: 18 }),
  gasCostUSD: decimal('gas_cost_usd', { precision: 10, scale: 4 }),

  // Paymaster
  paymasterUsed: varchar('paymaster_used', { length: 20 }).notNull(), // coinbase | pimlico

  // Timestamp
  sponsoredAt: timestamp('sponsored_at').notNull().defaultNow(),
}, (table) => ({
  userIdx: index('user_idx').on(table.userAddress),
  sponsorDateIdx: index('sponsor_date_idx').on(table.sponsoredAt),
}));

// Official categories (promoted from popular tags)
export const officialCategories = pgTable('official_categories', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  iconUrl: varchar('icon_url', { length: 200 }),

  // Origin
  createdFromTag: varchar('created_from_tag', { length: 50 }),
  productCount: integer('product_count').notNull().default(0),

  // Display
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),

  // Timestamps
  promotedAt: timestamp('promoted_at').notNull().defaultNow(),
});

// Reviews (optional - can also read from on-chain events)
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),

  // On-chain reference
  txHash: varchar('tx_hash', { length: 66 }),

  // Review details
  productId: uuid('product_id').references(() => products.id).notNull(),
  buyerAddress: varchar('buyer_address', { length: 42 }).notNull(),

  rating: integer('rating').notNull(), // 1-5
  reviewText: text('review_text'),
  reviewURI: text('review_uri'), // IPFS hash for longer reviews

  // Verification
  verifiedPurchase: boolean('verified_purchase').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  reviewProductIdx: index('review_product_idx').on(table.productId),
  buyerIdx: index('buyer_idx').on(table.buyerAddress),
}));

// Agent SDK usage analytics (track agent API calls)
export const agentAnalytics = pgTable('agent_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Agent identification
  agentAddress: varchar('agent_address', { length: 42 }),
  userAgent: varchar('user_agent', { length: 255 }), // SDK version

  // Action
  action: varchar('action', { length: 50 }).notNull(), // search | view | purchase | review
  intent: text('intent'), // For intent-based searches: "I need to post to Twitter"

  // Search metadata (if action = search)
  searchQuery: text('search_query'),
  searchTags: text('search_tags').array(),
  resultsCount: integer('results_count'),

  // Result metadata
  productId: uuid('product_id').references(() => products.id),
  clickedResult: boolean('clicked_result'),
  purchasedResult: boolean('purchased_result'),

  // Timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  agentIdx: index('agent_idx').on(table.agentAddress),
  actionIdx: index('action_idx').on(table.action),
  agentDateIdx: index('agent_date_idx').on(table.createdAt),
}));

// Subscriptions — Analyst tier access for the Observatory
export const subscriptions = pgTable('subscriptions', {
  id:            uuid('id').primaryKey().defaultRandom(),
  address:       varchar('address', { length: 42 }).notNull(),
  tier:          varchar('tier', { length: 20 }).notNull().default('analyst'),
  status:        varchar('status', { length: 20 }).notNull().default('pending'), // pending | active | expired
  paymentMethod: varchar('payment_method', { length: 20 }),                      // usdc | fiat
  amountUSDC:    decimal('amount_usdc', { precision: 10, scale: 2 }).notNull(),
  paymentLinkId: varchar('payment_link_id', { length: 255 }),
  expiresAt:     timestamp('expires_at'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  subAddressIdx: index('sub_address_idx').on(table.address),
  subStatusIdx:  index('sub_status_idx').on(table.status),
}));
