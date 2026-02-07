import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, products } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        // Fetch transactions joined with products
        const history = await db
            .select({
                txHash: transactions.txHash,
                productId: products.productId,
                productName: products.name,
                priceUSDC: transactions.amountUSDC,
                type: transactions.type,
                status: transactions.status,
                createdAt: transactions.createdAt,
            })
            .from(transactions)
            .leftJoin(products, eq(transactions.productId, products.id))
            .where(
                and(
                    eq(transactions.fromAddress, address),
                    eq(transactions.type, 'purchase')
                )
            )
            .orderBy(desc(transactions.createdAt));

        return NextResponse.json({
            address,
            purchases: history,
            totalCount: history.length,
        });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
