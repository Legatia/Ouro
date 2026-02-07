/**
 * POST /api/subscription/activate
 *
 * Activates a subscription after successful on-chain payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { address, tier, txHash, amountUSDC } = await req.json();

    if (!address || !tier || !txHash || !amountUSDC) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const addr = (address as string).toLowerCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check if already has active subscription
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.address, addr),
        eq(subscriptions.status, 'active')
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Already has active subscription' },
        { status: 409 }
      );
    }

    // Delete any pending subscriptions
    await db.delete(subscriptions).where(
      and(
        eq(subscriptions.address, addr),
        eq(subscriptions.status, 'pending')
      )
    );

    // Create active subscription
    await db.insert(subscriptions).values({
      address: addr,
      tier,
      status: 'active',
      amountUSDC,
      paymentLinkId: txHash, // Store tx hash in paymentLinkId field
      expiresAt,
    });

    console.log('[Subscription] Activated:', { address: addr, tier, txHash });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('[Subscription] Activation failed:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
