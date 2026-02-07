import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/drizzle/schema';
import { eq, or } from 'drizzle-orm';
import { createPublicClient, http, type Address } from 'viem';
import { baseSepolia, base } from 'viem/chains';

// ABI snippet for hasUserPurchased
const MARKETPLACE_ABI = [
    {
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'productId', type: 'bytes32' },
        ],
        name: 'hasUserPurchased',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { buyerAddress } = await request.json();

        if (!buyerAddress) {
            return NextResponse.json({ error: 'buyerAddress is required' }, { status: 400 });
        }

        // 1. Fetch product from DB
        const product = await db.query.products.findFirst({
            where: or(
                eq(products.id, id),
                eq(products.productId, id)
            ),
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. Verify purchase on-chain
        const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
        const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org';
        const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

        const publicClient = createPublicClient({
            chain: chainId === 8453 ? base : baseSepolia,
            transport: http(rpcUrl),
        });

        const hasPurchased = await publicClient.readContract({
            address: contractAddress,
            abi: MARKETPLACE_ABI,
            functionName: 'hasUserPurchased',
            args: [buyerAddress as Address, product.productId as `0x${string}`],
        });

        if (!hasPurchased) {
            return NextResponse.json(
                { error: 'Purchase not verified on-chain', buyer: buyerAddress, productId: product.productId },
                { status: 402 } // Payment Required
            );
        }

        // 3. Deliver capability (signed R2 URL or API key)
        // In production, this would generate a signed URL from Cloudflare R2
        // For now, we return the metadataURI or a mock delivery payload
        const deliveryPayload = {
            productId: product.productId,
            name: product.name,
            deliveryMethod: product.deliveryMethod || 'file_download',
            // MOCK: In real app, generate a 1-hour signed URL here
            downloadUrl: `https://storage.agentmarket.com/deliverables/${product.productId}.zip?token=mock_signed_token`,
            apiKey: product.deliveryMethod === 'api_key' ? 'sk_live_agent_mock_key_123' : undefined,
            instructions: "Import this tool into your agentic framework (e.g., LangChain or MCP).",
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        };

        return NextResponse.json(deliveryPayload);
    } catch (error) {
        console.error('Delivery error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
