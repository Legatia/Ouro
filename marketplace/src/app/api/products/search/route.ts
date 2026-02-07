/**
 * Agent-Native Product Search API
 *
 * Endpoint: POST /api/products/search
 *
 * Features:
 * - Intent-based search (natural language → product matches)
 * - Tag-based filtering
 * - Fast response (<100ms using Postgres full-text search)
 * - Machine-readable JSON (no HTML for agents)
 *
 * Example Request:
 * {
 *   "intent": "I need to post to Twitter and schedule tweets",
 *   "maxPrice": 20,
 *   "minRating": 4.0,
 *   "limit": 10
 * }
 *
 * Example Response:
 * {
 *   "results": [...],
 *   "suggestedTags": ["twitter", "automation"],
 *   "alternativeSearches": ["twitter bots", "social posting"]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, tagAnalytics, agentAnalytics } from '@/drizzle/schema';
import { sql, and, or, gte, lte, desc, eq, inArray } from 'drizzle-orm';

// export const runtime = 'edge'; // postgres-js is not edge-compatible

interface SearchRequest {
  intent?: string;
  tags?: string[];
  maxPrice?: number;
  minRating?: number;
  sandboxTest?: boolean;
  complianceRisk?: ('low' | 'medium' | 'high')[];
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    // Extract search parameters
    const {
      intent,
      tags,
      maxPrice,
      minRating,
      sandboxTest,
      complianceRisk = ['low', 'medium'], // Default: exclude high-risk
      limit = 20,
    } = body;

    // Build search query
    const conditions = [
      eq(products.deprecated, false), // Only active products
    ];

    // Tag-based search
    if (tags && tags.length > 0) {
      conditions.push(
        sql`${products.tags} && ${tags}` // Array overlap operator
      );
    }

    // Intent-based search (convert natural language to tags)
    if (intent) {
      const extractedTags = await extractTagsFromIntent(intent);
      if (extractedTags.length > 0) {
        conditions.push(
          sql`${products.tags} && ${extractedTags}`
        );
      }
    }

    // Price filter
    if (maxPrice) {
      conditions.push(
        lte(products.priceUSDC, maxPrice.toString())
      );
    }

    // Rating filter
    if (minRating) {
      conditions.push(
        gte(products.avgRating, minRating.toString())
      );
    }

    // Sandbox filter
    if (sandboxTest) {
      conditions.push(eq(products.sandboxAvailable, true));
    }

    // Compliance risk filter
    if (complianceRisk && complianceRisk.length > 0) {
      conditions.push(
        inArray(products.complianceRisk, complianceRisk)
      );
    }

    // Execute search
    const results = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(
        // Ranking: (avgRating * totalSales) / price
        desc(sql`(COALESCE(${products.avgRating}, 0) * ${products.totalSales}) / GREATEST(${products.priceUSDC}, 1)`)
      )
      .limit(limit);

    // Pre-extract tags for relevance if intent exists
    const searchTags = intent ? await extractTagsFromIntent(intent) : [];

    // Calculate relevance scores (for intent-based search)
    const resultsWithRelevance = results.map(product => {
      let relevanceScore = 0.5; // Base score

      if (intent && product.tags && searchTags.length > 0) {
        const matchCount = product.tags.filter(tag =>
          searchTags.includes(tag.toLowerCase())
        ).length;
        relevanceScore = matchCount / Math.max(searchTags.length, 1);
      }

      return {
        ...product,
        relevanceScore,
      };
    });

    // Sort by relevance if intent-based search
    if (intent) {
      resultsWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Get suggested tags (popular tags among results)
    const allTags = results.flatMap(p => p.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const suggestedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    // Generate alternative searches
    const alternativeSearches = await generateAlternativeSearches(intent, tags);

    // Track this search (for analytics)
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const agentAddress = request.headers.get('x-agent-address'); // Agents should send their address

    await db.insert(agentAnalytics).values({
      agentAddress: agentAddress || undefined,
      userAgent,
      action: 'search',
      intent: intent || undefined,
      searchQuery: intent || tags?.join(', '),
      searchTags: tags,
      resultsCount: results.length,
    });

    // Track all searched tags — both explicit and intent-extracted
    const tagsToTrack = new Set([...(tags || []), ...searchTags]);
    for (const tag of tagsToTrack) {
      await db
        .insert(tagAnalytics)
        .values({
          tag,
          totalSearches: 1,
          lastUsedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: tagAnalytics.tag,
          set: {
            totalSearches: sql`${tagAnalytics.totalSearches} + 1`,
            lastUsedAt: new Date(),
          },
        });
    }

    return NextResponse.json({
      results: resultsWithRelevance.map(formatProductForAPI),
      suggestedTags,
      alternativeSearches,
      meta: {
        totalResults: results.length,
        limit,
        intent,
        tags,
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============ Helper Functions ============

/**
 * Extract tags from natural language intent
 *
 * Examples:
 *   "I need to post to Twitter" → ["twitter", "social-media", "posting"]
 *   "crypto arbitrage signals" → ["crypto", "trading", "arbitrage"]
 */
async function extractTagsFromIntent(intent: string): Promise<string[]> {
  const normalized = intent.toLowerCase();

  // Simple keyword extraction (in production, use LLM or better NLP)
  const keywords = [
    // Social media
    { patterns: ['twitter', 'tweet', 'x.com'], tags: ['twitter', 'social-media'] },
    { patterns: ['linkedin'], tags: ['linkedin', 'social-media'] },
    { patterns: ['discord'], tags: ['discord', 'social-media'] },
    { patterns: ['instagram', 'ig'], tags: ['instagram', 'social-media'] },

    // Actions
    { patterns: ['post', 'posting', 'publish'], tags: ['posting', 'automation'] },
    { patterns: ['schedule', 'scheduling'], tags: ['scheduling', 'automation'] },
    { patterns: ['scrape', 'scraping', 'extract'], tags: ['scraping', 'data-extraction'] },

    // Crypto
    { patterns: ['crypto', 'cryptocurrency'], tags: ['crypto'] },
    { patterns: ['arbitrage'], tags: ['arbitrage', 'trading', 'crypto'] },
    { patterns: ['dex', 'defi'], tags: ['defi', 'crypto'] },
    { patterns: ['trading', 'trade'], tags: ['trading'] },

    // Content
    { patterns: ['blog', 'article', 'content'], tags: ['content-generation', 'writing'] },
    { patterns: ['image', 'photo', 'picture'], tags: ['image-generation', 'media'] },
    { patterns: ['video'], tags: ['video-generation', 'media'] },

    // Data
    { patterns: ['pdf', 'document'], tags: ['file-processing', 'pdf'] },
    { patterns: ['csv', 'excel', 'spreadsheet'], tags: ['file-processing', 'data-extraction'] },
    { patterns: ['email'], tags: ['email', 'outreach'] },
  ];

  const extractedTags = new Set<string>();

  for (const { patterns, tags } of keywords) {
    if (patterns.some(pattern => normalized.includes(pattern))) {
      tags.forEach(tag => extractedTags.add(tag));
    }
  }

  return Array.from(extractedTags);
}

/**
 * Generate alternative search suggestions
 */
async function generateAlternativeSearches(
  intent?: string,
  tags?: string[]
): Promise<string[]> {
  if (!intent && (!tags || tags.length === 0)) {
    return [];
  }

  // Find related tags from tag_analytics
  const relatedTags = await db
    .select()
    .from(tagAnalytics)
    .where(
      tags && tags.length > 0
        ? inArray(tagAnalytics.tag, tags)
        : sql`true`
    )
    .orderBy(desc(tagAnalytics.totalSearches))
    .limit(5);

  return relatedTags.map(t => t.tag).filter(tag => !tags?.includes(tag));
}

/**
 * Format product for API response
 */
function formatProductForAPI(product: any) {
  return {
    id: product.id,
    chainProductId: product.productId,

    // Product info
    name: product.name,
    slug: product.slug,
    description: product.description,
    tags: product.tags,

    // Pricing
    priceUSDC: parseFloat(product.priceUSDC),
    pricingModel: product.pricingModel,

    // Seller
    sellerAddress: product.sellerAddress,
    sellerENS: product.sellerENS,

    // Stats
    totalSales: product.totalSales,
    avgRating: product.avgRating ? parseFloat(product.avgRating) : null,
    totalReviews: product.totalReviews,
    totalRevenue: parseFloat(product.totalRevenueUSDC),

    // Metadata
    metadataURI: product.metadataURI,
    sandboxAvailable: product.sandboxAvailable,
    complianceRisk: product.complianceRisk,
    openSource: product.openSource,

    // Relevance
    relevanceScore: product.relevanceScore,

    // Timestamps
    listedAt: product.listedAt,
  };
}
