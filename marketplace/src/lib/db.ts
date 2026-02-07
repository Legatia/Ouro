import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/drizzle/schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const connectionString = process.env.DATABASE_URL;

// For edge runtime (if needed), we might use neon or similar, 
// but for now, postgres-js is standard for Node/Serverless non-edge.
// Note: search/route.ts used 'edge', but postgres-js doesn't work in edge.
// We'll stick to standard Node runtime for now or use a compatible driver if needed.
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
