import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Search by UUID or chain-specific productId
        const product = await db.query.products.findFirst({
            where: or(
                eq(products.id, id),
                eq(products.productId, id)
            ),
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(formatProductForAPI(product));
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function formatProductForAPI(product: any) {
    return {
        id: product.id,
        chainProductId: product.productId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        tags: product.tags,
        priceUSDC: parseFloat(product.priceUSDC),
        pricingModel: product.pricingModel,
        sellerAddress: product.sellerAddress,
        metadataURI: product.metadataURI,
        sandboxAvailable: product.sandboxAvailable,
        complianceRisk: product.complianceRisk,
        totalSales: product.totalSales,
        avgRating: product.avgRating ? parseFloat(product.avgRating) : null,
        totalReviews: product.totalReviews,
        listedAt: product.listedAt,
    };
}
