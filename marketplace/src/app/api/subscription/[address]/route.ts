/**
 * GET /api/subscription/:address
 *
 * Returns the current subscription status for the given wallet address.
 * Automatically downgrades expired subscriptions on read.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    const addr = address.toLowerCase();

    const [sub] = await db
      .select({
        id:        subscriptions.id,
        tier:      subscriptions.tier,
        status:    subscriptions.status,
        expiresAt: subscriptions.expiresAt,
      })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.address, addr),
        eq(subscriptions.status, 'active'),
      ))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ active: false });
    }

    // Lazy expiry — downgrade on read
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      await db
        .update(subscriptions)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));

      return NextResponse.json({ active: false, expired: true });
    }

    return NextResponse.json({ active: true, tier: sub.tier, expiresAt: sub.expiresAt });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
