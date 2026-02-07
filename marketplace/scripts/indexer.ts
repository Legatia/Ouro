import { createPublicClient, http, parseAbiItem, type Address, type PublicClient } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { db } from '../src/lib/db';
import { products, transactions, sellers, reviews } from '../src/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org';

const publicClient = createPublicClient({
    chain: CHAIN_ID === 8453 ? base : baseSepolia,
    transport: http(RPC_URL),
});

// ABIs for events
const PRODUCT_LISTED_ABI = parseAbiItem('event ProductListed(bytes32 indexed id, address indexed seller, string name, string[] tags, uint256 priceUSDC, string metadataURI)');
const PRODUCT_PURCHASED_ABI = parseAbiItem('event ProductPurchased(bytes32 indexed productId, address indexed buyer, address indexed seller, uint256 priceUSDC, uint256 platformFee)');
const PRODUCT_REVIEWED_ABI = parseAbiItem('event ProductReviewed(bytes32 indexed productId, address indexed buyer, uint8 rating, uint256 newAvgRating)');

async function indexEvents() {
    console.log('🚀 Starting Event Indexer...');
    console.log(`📡 Contract: ${CONTRACT_ADDRESS} on Chain ID ${CHAIN_ID}`);

    // 1. Index ProductListed
    publicClient.watchEvent({
        address: CONTRACT_ADDRESS,
        event: PRODUCT_LISTED_ABI,
        onLogs: async (logs) => {
            for (const log of logs) {
                const { id, seller, name, tags, priceUSDC, metadataURI } = log.args;
                if (!id || !seller || !name) continue;

                console.log(`📝 Syncing new product: ${name} (${id})`);

                // Upsert into products
                await db.insert(products).values({
                    productId: id,
                    sellerAddress: seller,
                    name: name,
                    slug: name.toLowerCase().replace(/ /g, '-'), // Basic slug logic
                    tags: tags as string[],
                    priceUSDC: (Number(priceUSDC) / 1e6).toString(),
                    metadataURI: metadataURI as string,
                    contractAddress: CONTRACT_ADDRESS,
                    chainId: CHAIN_ID,
                }).onConflictDoUpdate({
                    target: products.productId,
                    set: {
                        name,
                        tags: tags as string[],
                        priceUSDC: (Number(priceUSDC) / 1e6).toString(),
                        metadataURI: metadataURI as string,
                    }
                });

                // Log transaction
                await db.insert(transactions).values({
                    txHash: log.transactionHash,
                    blockNumber: Number(log.blockNumber),
                    type: 'listing',
                    fromAddress: seller,
                    chainId: CHAIN_ID,
                    status: 'confirmed',
                }).onConflictDoNothing();
            }
        },
    });

    // 2. Index ProductPurchased
    publicClient.watchEvent({
        address: CONTRACT_ADDRESS,
        event: PRODUCT_PURCHASED_ABI,
        onLogs: async (logs) => {
            for (const log of logs) {
                const { productId, buyer, seller, priceUSDC, platformFee } = log.args;
                if (!productId || !buyer || !seller) continue;

                console.log(`💰 Syncing purchase: Product ${productId} by ${buyer}`);

                // Update product stats
                await db.update(products)
                    .set({
                        totalSales: sql`${products.totalSales} + 1`,
                        totalRevenueUSDC: sql`${products.totalRevenueUSDC} + ${(Number(priceUSDC) / 1e6).toString()}`,
                        lastSaleAt: new Date(),
                    })
                    .where(eq(products.productId, productId));

                // Get internal product UUID for transaction record
                const p = await db.query.products.findFirst({
                    where: eq(products.productId, productId)
                });

                // Insert transaction record
                await db.insert(transactions).values({
                    txHash: log.transactionHash,
                    blockNumber: Number(log.blockNumber),
                    type: 'purchase',
                    productId: p?.id,
                    fromAddress: buyer,
                    toAddress: seller,
                    amountUSDC: (Number(priceUSDC) / 1e6).toString(),
                    platformFeeUSDC: (Number(platformFee) / 1e6).toString(),
                    chainId: CHAIN_ID,
                    status: 'confirmed',
                }).onConflictDoNothing();

                // Update seller earnings
                await db.insert(sellers).values({
                    address: seller,
                    totalEarningsUSDC: (Number(priceUSDC) / 1e6).toString(),
                    totalListings: 1,
                }).onConflictDoUpdate({
                    target: sellers.address,
                    set: {
                        totalEarningsUSDC: sql`${sellers.totalEarningsUSDC} + ${(Number(priceUSDC) / 1e6).toString()}`,
                    }
                });
            }
        },
    });

    console.log('🟢 Indexer is watching for events...');
}

indexEvents().catch(console.error);
