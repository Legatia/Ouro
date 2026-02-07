/**
 * GET /api/stats
 *
 * Aggregate marketplace stats for the Observatory homepage.
 * All queries run in parallel against existing tables.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, transactions, tagAnalytics } from '@/drizzle/schema';
import { sql, and, eq, gte, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const day = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      productCount,
      totalVolume,
      volume24h,
      activeAgents,
      purchases24h,
      trendingTags,
      recentEvents,
    ] = await Promise.all([
      // Active product count
      db.select({ n: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.deprecated, false)),

      // Lifetime volume (all confirmed purchases)
      db.select({ total: sql<string>`COALESCE(SUM(${transactions.amountUSDC}), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'purchase'),
          eq(transactions.status, 'confirmed'),
        )),

      // 24-hour volume
      db.select({ total: sql<string>`COALESCE(SUM(${transactions.amountUSDC}), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'purchase'),
          eq(transactions.status, 'confirmed'),
          gte(transactions.createdAt, day),
        )),

      // Distinct buyers in last 24 h
      db.select({ n: sql<number>`count(distinct ${transactions.fromAddress})` })
        .from(transactions)
        .where(gte(transactions.createdAt, day)),

      // Purchase count in last 24 h  (used to derive flow/hr)
      db.select({ n: sql<number>`count(*)` })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'purchase'),
          gte(transactions.createdAt, day),
        )),

      // Top tags by search volume
      db.select({ tag: tagAnalytics.tag, searches: tagAnalytics.totalSearches })
        .from(tagAnalytics)
        .orderBy(desc(tagAnalytics.totalSearches))
        .limit(10),

      // Most recent purchases (event-stream preview)
      db.select({
        createdAt:   transactions.createdAt,
        fromAddress: transactions.fromAddress,
        amountUSDC:  transactions.amountUSDC,
        productName: products.name,
      })
        .from(transactions)
        .leftJoin(products, eq(transactions.productId, products.id))
        .where(and(
          eq(transactions.type, 'purchase'),
          eq(transactions.status, 'confirmed'),
        ))
        .orderBy(desc(transactions.createdAt))
        .limit(5),
    ]);

    const purchaseCount = purchases24h[0]?.n ?? 0;

    return NextResponse.json({
      totalProducts:  productCount[0]?.n  ?? 0,
      totalVolume:    Number(totalVolume[0]?.total   ?? 0),
      volume24h:      Number(volume24h[0]?.total     ?? 0),
      activeAgents:   activeAgents[0]?.n  ?? 0,
      flowPerHour:    Math.round(purchaseCount / 24 * 10) / 10,
      peakCategory:   trendingTags[0]?.tag ?? 'General',
      trendingTags:   trendingTags.map(t => ({ tag: t.tag, searches: Number(t.searches) })),
      recentEvents:   recentEvents.map(e => ({
        time:    e.createdAt,
        product: e.productName,
        amount:  Number(e.amountUSDC ?? 0),
        buyer:   e.fromAddress,
      })),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Stats unavailable' }, { status: 500 });
  }
}
