/**
 * GET /api/analytics
 *
 * Returns the full Analyst-tier analytics payload in one call.
 * Categories are computed JS-side (avoids unnest complexity in Drizzle).
 * All DB queries run in parallel.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, transactions, tagAnalytics, agentAnalytics } from '@/drizzle/schema';
import { sql, and, eq, gte, desc } from 'drizzle-orm';

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    const d7  = new Date(now -  7 * DAY);
    const d30 = new Date(now - 30 * DAY);
    const d90 = new Date(now - 90 * DAY);

    const [
      allProducts,
      allTags,
      recentSearches,
      vol7, vol30, vol90,
    ] = await Promise.all([
      // All active products (source for categories + top-product views)
      db.select().from(products).where(eq(products.deprecated, false)),

      // Full tag-analytics table
      db.select().from(tagAnalytics),

      // Recent agent searches (for search-intelligence aggregation)
      db.select({ query: agentAnalytics.searchQuery })
        .from(agentAnalytics)
        .where(and(
          eq(agentAnalytics.action, 'search'),
          sql`${agentAnalytics.searchQuery} IS NOT NULL`,
        ))
        .orderBy(desc(agentAnalytics.createdAt))
        .limit(200),

      // ── Sales-trend windows ──
      db.select({
        volume: sql<string>`COALESCE(SUM(${transactions.amountUSDC}), 0)`,
        count:  sql<number>`count(*)`,
      }).from(transactions).where(and(
        eq(transactions.type, 'purchase'),
        eq(transactions.status, 'confirmed'),
        gte(transactions.createdAt, d7),
      )),

      db.select({
        volume: sql<string>`COALESCE(SUM(${transactions.amountUSDC}), 0)`,
        count:  sql<number>`count(*)`,
      }).from(transactions).where(and(
        eq(transactions.type, 'purchase'),
        eq(transactions.status, 'confirmed'),
        gte(transactions.createdAt, d30),
      )),

      db.select({
        volume: sql<string>`COALESCE(SUM(${transactions.amountUSDC}), 0)`,
        count:  sql<number>`count(*)`,
      }).from(transactions).where(and(
        eq(transactions.type, 'purchase'),
        eq(transactions.status, 'confirmed'),
        gte(transactions.createdAt, d90),
      )),
    ]);

    // ── Derive categories by iterating tags on each product ──
    const catMap = new Map<string, { productCount: number; totalSales: number; totalRevenue: number; prices: number[] }>();

    for (const p of allProducts) {
      for (const tag of p.tags) {
        const c = catMap.get(tag) ?? { productCount: 0, totalSales: 0, totalRevenue: 0, prices: [] };
        c.productCount++;
        c.totalSales   += p.totalSales;
        c.totalRevenue += Number(p.totalRevenueUSDC);
        c.prices.push(Number(p.priceUSDC));
        catMap.set(tag, c);
      }
    }

    const categories = [...catMap.entries()]
      .map(([name, c]) => ({
        name,
        productCount: c.productCount,
        totalSales:   c.totalSales,
        totalRevenue: c.totalRevenue,
        avgPrice:     c.prices.length ? c.prices.reduce((a, b) => a + b, 0) / c.prices.length : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // ── Top products — three sort views ──
    function fmtProduct(p: typeof allProducts[0]) {
      return {
        id:           p.id,
        name:         p.name,
        tags:         p.tags,
        priceUSDC:    Number(p.priceUSDC),
        totalSales:   p.totalSales,
        avgRating:    p.avgRating !== null ? Number(p.avgRating) : null,
        totalRevenue: Number(p.totalRevenueUSDC),
      };
    }

    const topByRevenue = [...allProducts].sort((a, b) => Number(b.totalRevenueUSDC) - Number(a.totalRevenueUSDC)).slice(0, 10).map(fmtProduct);
    const topBySales   = [...allProducts].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10).map(fmtProduct);
    const topByRating  = allProducts
      .filter(p => p.avgRating !== null)
      .sort((a, b) => Number(b.avgRating) - Number(a.avgRating))
      .slice(0, 10)
      .map(fmtProduct);

    // ── Search intelligence — aggregate query strings ──
    const searchMap = new Map<string, number>();
    for (const s of recentSearches) {
      if (s.query) searchMap.set(s.query, (searchMap.get(s.query) ?? 0) + 1);
    }
    const topSearches = [...searchMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([query, count]) => ({ query, count }));

    // ── Opportunity gaps — high search / low product supply ──
    const opportunityGaps = allTags
      .filter(t => Number(t.totalSearches) > 0)
      .map(t => ({
        tag:      t.tag,
        searches: Number(t.totalSearches),
        products: t.productCount,
        ratio:    Number(t.totalSearches) / Math.max(t.productCount, 1),
      }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);

    // ── Tag-analytics enriched view ──
    const tagStats = allTags
      .sort((a, b) => Number(b.totalSearches) - Number(a.totalSearches))
      .slice(0, 15)
      .map(t => ({
        tag:          t.tag,
        productCount: t.productCount,
        searches:     Number(t.totalSearches),
        clicks:       Number(t.totalClicks),
        purchases:    Number(t.totalPurchases),
        trendingScore: t.trendingScore ? Number(t.trendingScore) : 0,
      }));

    return NextResponse.json({
      categories,
      topProducts: { byRevenue: topByRevenue, bySales: topBySales, byRating: topByRating },
      tagAnalytics: tagStats,
      salesTrends: {
        '7d':  { volume: Number(vol7[0]?.volume  ?? 0), transactions: vol7[0]?.count  ?? 0 },
        '30d': { volume: Number(vol30[0]?.volume ?? 0), transactions: vol30[0]?.count ?? 0 },
        '90d': { volume: Number(vol90[0]?.volume ?? 0), transactions: vol90[0]?.count ?? 0 },
      },
      topSearches,
      opportunityGaps,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 500 });
  }
}
