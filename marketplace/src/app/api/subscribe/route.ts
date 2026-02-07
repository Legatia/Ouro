/**
 * POST /api/subscribe
 *
 * Creates a Coinbase Payment Link for the requested tier and returns
 * both a direct-USDC URL and a fiat-onramp URL.  A pending subscription
 * row is inserted; it becomes active when the Coinbase webhook fires.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { createPaymentLink, generateOnrampUrl } from '@/lib/coinbase';

const TIERS: Record<string, { price: string; label: string }> = {
  analyst: { price: '9.99', label: 'Analyst – 30 days' },
};

export async function POST(req: NextRequest) {
  try {
    const { address, tier = 'analyst' } = await req.json();

    if (!address || !TIERS[tier]) {
      return NextResponse.json({ error: 'address and a valid tier are required' }, { status: 400 });
    }

    const addr = (address as string).toLowerCase();

    // Already active? Short-circuit.
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.address, addr), eq(subscriptions.status, 'active')))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    const { price, label } = TIERS[tier];

    // 1. Create Coinbase Payment Link (USDC path)
    console.log('[Subscribe] Creating payment link for:', { addr, tier, price });
    let link;
    try {
      link = await createPaymentLink({
        amount:      price,
        description: `Ouro ${label}`,
        metadata:    { address: addr, tier },
      });
      console.log('[Subscribe] Payment link created:', link.id);
    } catch (linkError) {
      console.error('[Subscribe] Payment link creation failed:', linkError);
      const errMsg = linkError instanceof Error ? linkError.message : String(linkError);
      return NextResponse.json({
        error: 'Failed to create payment link. Please check server logs.',
        details: errMsg
      }, { status: 500 });
    }

    // 2. Fiat onramp URL — buys USDC into wallet; user then pays via link
    const onrampUrl = generateOnrampUrl(addr, price);

    // 3. Wipe stale pending rows, insert fresh one
    await db.delete(subscriptions).where(
      and(eq(subscriptions.address, addr), eq(subscriptions.status, 'pending'))
    );

    await db.insert(subscriptions).values({
      address:       addr,
      tier,
      status:        'pending',
      amountUSDC:    price,
      paymentLinkId: link.id,
    });

    console.log('[Subscribe] Subscription created successfully');
    return NextResponse.json({ paymentUrl: link.url, onrampUrl });
  } catch (error) {
    console.error('[Subscribe] Unexpected error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
