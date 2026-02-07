/**
 * POST /api/webhooks/coinbase
 *
 * Receives payment-link events from Coinbase CDP.
 * On payment_link.payment.success → activates the matching subscription
 * with a 30-day window.  Idempotent: duplicate deliveries are a no-op.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature } from '@/lib/coinbase';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Raw body is required for HMAC verification — do not call req.json() first.
  const rawBody   = await req.text();
  const signature = req.headers.get('x-coinbase-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event     = JSON.parse(rawBody);
    const eventType = event.type ?? event.event;

    // Ack anything that isn't a successful payment
    if (eventType !== 'payment_link.payment.success') {
      return NextResponse.json({ ok: true });
    }

    // Payment-link ID — handle both flat and nested event shapes
    const linkId =
      event.data?.payment_link?.id ??
      event.data?.id ??
      event.payment_link?.id;

    if (!linkId) {
      return NextResponse.json({ error: 'No payment_link id in event' }, { status: 400 });
    }

    // Locate the subscription
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paymentLinkId, linkId))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: 'No subscription for this payment link' }, { status: 404 });
    }

    // Already active — idempotent ack
    if (sub.status === 'active') {
      return NextResponse.json({ ok: true });
    }

    // Activate
    await db
      .update(subscriptions)
      .set({
        status:        'active',
        paymentMethod: 'usdc',
        expiresAt:     new Date(Date.now() + THIRTY_DAYS),
        updatedAt:     new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
