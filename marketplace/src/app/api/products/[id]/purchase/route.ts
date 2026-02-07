/**
 * POST /api/products/[id]/purchase
 *
 * Records a confirmed on-chain purchase to the database.
 * Called by the client after waitForTransactionReceipt confirms the purchase tx.
 *
 * Writes:
 *   - transactions row (powers salesTrends + volume in stats/analytics)
 *   - products.totalSales / totalRevenueUSDC (powers top-products rankings)
 *   - tagAnalytics.totalPurchases for each tag on the product
 *
 * Idempotent: duplicate txHash is silently ignored.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, transactions, tagAnalytics } from '@/drizzle/schema';
import { eq, or, sql } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { txHash, blockNumber, buyerAddress } = await req.json();

    if (!txHash || blockNumber == null || !buyerAddress) {
      return NextResponse.json(
        { error: 'txHash, blockNumber, and buyerAddress are required' },
        { status: 400 },
      );
    }

    // Idempotency guard — receipt can be replayed on refresh
    const existing = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.txHash, txHash))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ ok: true });
    }

    // Resolve product by UUID or chainProductId
    const product = await db.query.products.findFirst({
      where: or(
        eq(products.id, id),
        eq(products.productId, id),
      ),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const price        = Number(product.priceUSDC);
    const platformFee  = price * 0.08;                          // 8 % — matches contract
    const sellerAmount = price - platformFee;
    const chainId      = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');

    // ── 1. Insert transaction ──────────────────────────────────
    await db.insert(transactions).values({
      chainId,
      txHash,
      blockNumber:           Number(blockNumber),
      type:                  'purchase',
      productId:             product.id,
      fromAddress:           buyerAddress,
      toAddress:             product.sellerAddress,
      amountUSDC:            String(price.toFixed(2)),
      platformFeeUSDC:       String(platformFee.toFixed(2)),
      status:                'confirmed',
    });

    // ── 2. Bump product stats ──────────────────────────────────
    await db
      .update(products)
      .set({
        totalSales:       sql`${products.totalSales} + 1`,
        totalRevenueUSDC: sql`${products.totalRevenueUSDC} + ${String(sellerAmount.toFixed(2))}`,
        lastSaleAt:       new Date(),
        updatedAt:        new Date(),
      })
      .where(eq(products.id, product.id));

    // ── 3. Bump tagAnalytics.totalPurchases for each product tag ─
    for (const tag of product.tags) {
      await db
        .insert(tagAnalytics)
        .values({
          tag,
          totalPurchases: 1,
          lastUsedAt:     new Date(),
        })
        .onConflictDoUpdate({
          target: tagAnalytics.tag,
          set: {
            totalPurchases: sql`${tagAnalytics.totalPurchases} + 1`,
            lastUsedAt:     new Date(),
          },
        });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Purchase record error:', error);
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 });
  }
}
