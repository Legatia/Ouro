/**
 * POST /api/products/create
 *
 * Persists a newly listed product to the database after the on-chain
 * listProduct() transaction has been confirmed.  The client extracts
 * chainProductId from the ProductListed event and includes it here.
 */

import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, tagAnalytics } from '@/drizzle/schema';
import { sql } from 'drizzle-orm';

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  // Random 6-char suffix guarantees uniqueness without a DB round-trip
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      description,
      tags,
      priceUSDC,
      fileUrl,
      sellerAddress,
      chainProductId,
      metadataURI,
      chainId,
      contractAddress,
    } = await req.json();

    if (
      !name ||
      !Array.isArray(tags) || tags.length === 0 ||
      !priceUSDC ||
      !sellerAddress ||
      !chainProductId ||
      !contractAddress
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [row] = await db
      .insert(products)
      .values({
        chainId:         Number(chainId ?? 84532),
        contractAddress: contractAddress,
        productId:       chainProductId,
        sellerAddress:   sellerAddress,
        name:            name,
        slug:            slugify(name),
        description:     description || null,
        tags:            tags,
        priceUSDC:       String(Number(priceUSDC).toFixed(2)),
        metadataURI:     metadataURI,
        deliveryMethod:  fileUrl ? 'file_download' : null,
      })
      .returning({ id: products.id });

    // Bump productCount so Opportunity Gaps stays accurate
    for (const tag of tags) {
      await db
        .insert(tagAnalytics)
        .values({
          tag,
          productCount: 1,
          lastUsedAt:   new Date(),
        })
        .onConflictDoUpdate({
          target: tagAnalytics.tag,
          set: {
            productCount: sql`${tagAnalytics.productCount} + 1`,
            lastUsedAt:   new Date(),
          },
        });
    }

    return NextResponse.json({ id: row.id });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
  }
}
