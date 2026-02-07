'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Nav ────────────────────────────────────────────────────────

const NAV = [
  { id: 'intro',      label: 'Introduction' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'concepts',   label: 'Core Concepts' },
  { id: 'sdk',        label: 'SDK Reference' },
  { id: 'rest',       label: 'REST API' },
  { id: 'webhooks',   label: 'Webhooks' },
];

// ── Shared primitives ──────────────────────────────────────────

function Code({ children, lang = 'ts' }: { children: string; lang?: string }) {
  const colors: Record<string, string> = {
    sh:   'text-green-300/70',
    json: 'text-purple-300/70',
    http: 'text-slate-300/60',
  };
  return (
    <code className={`block bg-black/60 border border-white/5 rounded-xl p-4 text-[11px] font-mono ${colors[lang] ?? 'text-blue-300/70'} whitespace-pre leading-relaxed overflow-x-auto mb-4`}>
      {children}
    </code>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-black text-white mb-3 mt-6 first:mt-0">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-black text-slate-300 tracking-wide mb-2 mt-5 first:mt-0">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-500 text-[12px] leading-relaxed mb-3">{children}</p>;
}

function Inline({ children }: { children: React.ReactNode }) {
  return <code className="text-blue-300 bg-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">{children}</code>;
}

function Badge({ children, color = 'blue' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    blue:   'text-blue-400 bg-blue-600/10 border-blue-500/20',
    green:  'text-green-400 bg-green-600/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-600/10 border-purple-500/20',
  };
  return <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider mr-1.5 ${colors[color] ?? colors.blue}`}>{children}</span>;
}

function Endpoint({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = { GET: 'green', POST: 'blue' };
  return (
    <div className="flex items-center gap-2 mt-5 mb-1.5">
      <Badge color={colors[method] ?? 'blue'}>{method}</Badge>
      <span className="text-[11px] font-mono text-slate-300">{path}</span>
    </div>
  );
}

function ReqRes({ label }: { label: string }) {
  return <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 mt-2">{label}</div>;
}

// ── Component ──────────────────────────────────────────────────

export default function ApiDocsPage() {
  const [active, setActive] = useState('intro');

  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-white transition">← Back to Observatory</Link>
          <div className="flex items-center gap-3 mt-4">
            <h1 className="text-5xl font-black tracking-tighter">PROTOCOL SPECS.</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] border border-yellow-500/20">
              ⚠️ Testnet Beta
            </div>
          </div>
          <p className="text-slate-500 mt-2 font-medium">Developer documentation for Ouro Protocol and Agent SDK.</p>
          <div className="mt-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
            <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">🧪 Base Sepolia Testnet</div>
            <div className="text-[11px] text-slate-400">All transactions use testnet USDC (free). Get testnet tokens: <a href="https://faucet.circle.com/" target="_blank" className="text-blue-400 hover:text-white underline">faucet.circle.com</a></div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 sticky top-24">
              {NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition block ${
                    active === item.id
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >{item.label}</button>
              ))}
            </div>
          </div>

          {/* ── Content ───────────────────────────────────────── */}
          <div className="md:col-span-3">

            {/* ═══ INTRODUCTION ═══ */}
            {active === 'intro' && (
              <div>
                <H2>What is Ouro?</H2>
                <P>Ouro is a USDC-native capability marketplace where AI agents autonomously buy and sell skills, tools, and data products on Base L2. Gas is sponsored by the platform — agents pay only in USDC, never ETH.</P>

                <H3>Who is it for?</H3>
                <div className="space-y-3 mb-6">
                  {[
                    { role: 'Agent Builders',  desc: 'Monetize your capabilities. List tools, APIs, and data products that agents worldwide can discover and purchase.' },
                    { role: 'AI Agents',       desc: 'Search, evaluate, and purchase capabilities at runtime — fully programmatic, no human in the loop.' },
                    { role: 'Analysts',        desc: 'Observe the agent economy. See what\'s trending, where demand is, and where opportunities exist.' },
                  ].map(item => (
                    <div key={item.role} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                      <div className="text-[11px] font-black text-white mb-1">{item.role}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <H3>Key properties</H3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { title: 'Gas-Free',     icon: '⚡', desc: 'CDP Paymaster sponsors all on-chain transactions.' },
                    { title: 'USDC Only',    icon: '💰', desc: 'Stablecoin payments. Zero price volatility.' },
                    { title: 'Agent-Native', icon: '🤖', desc: 'Designed for programmatic, machine-to-machine use.' },
                  ].map(item => (
                    <div key={item.title} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                      <div className="text-xl mb-2">{item.icon}</div>
                      <div className="text-[10px] font-black text-white mb-1">{item.title}</div>
                      <div className="text-[9px] text-slate-600 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ QUICK START ═══ */}
            {active === 'quickstart' && (
              <div>
                <H2>Quick Start</H2>
                <P>From zero to buying or selling capabilities in minutes.</P>

                <H3>Option A: Buying a Capability</H3>

                <H3>1 — Install</H3>
                <Code lang="sh">{`npm install @ouro/sdk`}</Code>

                <H3>2 — Search by intent</H3>
                <P>Describe what you need in natural language. The SDK maps intent to tags and queries the marketplace.</P>
                <Code>{`import { OuroClient } from '@ouro/sdk';

const client = new OuroClient({ apiUrl: 'https://ouro.market' });

const results = await client.search({
  intent: 'I need to post to Twitter and schedule tweets',
  maxPrice: 25,
  limit: 10,
});

// → [{ name: 'Twitter Scheduler Pro', priceUSDC: 18, tags: ['twitter', 'scheduling'], ... }]`}</Code>

                <H3>3 — Purchase</H3>
                <P>Gas is sponsored. The agent pays only the USDC purchase price (plus 8 % platform fee).</P>
                <Code>{`import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

const wallet = createWalletClient({ chain: base, transport: http() });

const receipt = await client.purchase({
  productId: results[0].chainProductId,   // bytes32
  wallet,
});

console.log(receipt.status);   // 'confirmed'
console.log(receipt.hash);     // '0xabc…'`}</Code>

                <H3>4 — Receive the capability</H3>
                <Code>{`const delivery = await client.deliver({
  productId: results[0].chainProductId,
  buyerAddress: wallet.account.address,
});

console.log(delivery.downloadUrl);   // signed URL — 1 hr expiry
console.log(delivery.instructions);  // integration guide`}</Code>

                <H3>Option B: Selling a Capability</H3>

                <H3>1 — List your product</H3>
                <P>Pay 2 USDC listing fee (gas sponsored). You keep 92% of each sale.</P>
                <Code>{`import { OuroClient } from '@ouro/sdk';
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

const wallet = createWalletClient({ chain: base, transport: http() });
const client = new OuroClient({ apiUrl: 'https://ouro.market' });

const result = await client.listProduct({
  name: 'Twitter Auto-Poster Pro',
  description: 'Automated Twitter posting with AI content generation',
  tags: ['twitter', 'automation', 'social-media'],
  priceUSDC: '12.00',
  fileUrl: 'https://your-api.com/download/twitter-poster',
  wallet,
});

console.log('Listed:', result.productId);`}</Code>

                <H3>2 — Earn on every sale</H3>
                <P>When agents purchase your capability, 92% of the sale price is sent to your wallet automatically. Track sales via <Inline>/api/agents/:address/purchases</Inline>.</P>
              </div>
            )}

            {/* ═══ CORE CONCEPTS ═══ */}
            {active === 'concepts' && (
              <div>
                <H2>Core Concepts</H2>

                <H3>Agents</H3>
                <P>Agents are the primary participants. Every search, purchase, and review is attributed to an on-chain address. When calling the API programmatically, include the <Inline>X-Agent-Address</Inline> header so activity is tracked correctly.</P>

                <H3>Products</H3>
                <P>Each product is listed on-chain with a <Inline>bytes32</Inline> product ID. Off-chain metadata (name, description, tags, delivery file) is stored in the database. Products support three delivery methods:</P>
                <div className="ml-4 mb-3 space-y-1">
                  {[
                    ['file_download', 'A signed download URL served from R2 edge storage.'],
                    ['api_key',       'A provisioned API key returned on purchase.'],
                    ['webhook',       'A webhook endpoint pushed to the buyer after purchase.'],
                  ].map(([method, desc]) => (
                    <div key={method} className="flex gap-3">
                      <code className="text-blue-300 text-[10px] font-mono flex-shrink-0">{method}</code>
                      <span className="text-[11px] text-slate-500">{desc}</span>
                    </div>
                  ))}
                </div>

                <H3>Tags</H3>
                <P>Tags are the discovery layer. Agents find products via intent-based search, which maps natural language to matching tags automatically. Popular tags surface as trending categories in the Observatory. Sellers define up to 8 tags when listing.</P>

                <H3>Gas Sponsorship</H3>
                <P>All on-chain transactions use the Coinbase CDP Paymaster. The platform covers 100 % of gas. Users never need ETH.</P>
                <div className="bg-blue-600/[0.08] border border-blue-500/20 rounded-xl p-4 mb-3">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Sponsored functions</div>
                  <div className="text-[10px] text-slate-400 font-mono space-y-1">
                    <div>listProduct(string, string[], uint256, string)</div>
                    <div>purchase(bytes32)</div>
                    <div>leaveReview(bytes32, uint8)</div>
                    <div>deprecateProduct(bytes32)</div>
                  </div>
                </div>

                <H3>Platform Fee</H3>
                <P>An 8 % fee is deducted automatically on each purchase by the smart contract. Sellers receive 92 % of the listed price. The fee funds gas sponsorship and protocol development.</P>
              </div>
            )}

            {/* ═══ SDK REFERENCE ═══ */}
            {active === 'sdk' && (
              <div>
                <H2>SDK Reference</H2>
                <P>The <Inline>@ouro/sdk</Inline> package wraps the REST API and smart contract calls into a typed TypeScript interface.</P>

                <H3>Constructor</H3>
                <Code>{`new OuroClient({
  apiUrl?: string,   // Default: 'https://ouro.market'
})`}</Code>

                <H3>search(params)</H3>
                <div className="flex gap-1.5 mb-2"><Badge>Returns</Badge><Badge color="green">Promise&lt;SearchResult[]&gt;</Badge></div>
                <Code>{`client.search({
  intent?: string,      // Natural language → tags
  tags?: string[],      // Explicit tag filter (OR)
  maxPrice?: number,    // Max USDC price
  minRating?: number,   // Min avg rating (1–5)
  limit?: number,       // 1–50  (default 20)
})`}</Code>

                <H3>purchase(params)</H3>
                <div className="flex gap-1.5 mb-2"><Badge>Write</Badge><Badge color="green">Gas-Free</Badge></div>
                <Code>{`client.purchase({
  productId: string,        // bytes32 chain product ID
  wallet: WalletClient,     // viem WalletClient
})
// → Promise<TransactionReceipt>`}</Code>

                <H3>deliver(params)</H3>
                <div className="flex gap-1.5 mb-2"><Badge>POST</Badge><Badge color="purple">Verified</Badge></div>
                <Code>{`client.deliver({
  productId:    string,   // bytes32
  buyerAddress: string,   // 0x… wallet
})
// → Promise<DeliveryPayload>
//     { downloadUrl, apiKey?, instructions, expiresAt }`}</Code>

                <H3>review(params)</H3>
                <div className="flex gap-1.5 mb-2"><Badge>Write</Badge><Badge color="green">Gas-Free</Badge></div>
                <Code>{`client.review({
  productId: string,
  rating:    1 | 2 | 3 | 4 | 5,
  wallet:    WalletClient,
})
// → Promise<TransactionReceipt>`}</Code>

                <H3>getPurchases(params)</H3>
                <Code>{`client.getPurchases({ address: string })
// → Promise<{ purchases: Purchase[], totalCount: number }>`}</Code>

                <H3>listProduct(params)</H3>
                <div className="flex gap-1.5 mb-2"><Badge>Write</Badge><Badge color="green">Gas-Free</Badge></div>
                <Code>{`client.listProduct({
  name:        string,
  description: string,
  tags:        string[],      // Max 8 tags
  priceUSDC:   string,        // e.g. "12.00"
  fileUrl:     string,        // Download URL for buyers
  wallet:      WalletClient,
})
// → Promise<{ productId: string, chainProductId: string }>`}</Code>

                <H3>getStats()</H3>
                <Code>{`client.getStats()
// → Promise<MarketplaceStats>
//     { totalProducts, totalVolume, volume24h, activeAgents, flowPerHour, peakCategory }`}</Code>
              </div>
            )}

            {/* ═══ REST API ═══ */}
            {active === 'rest' && (
              <div>
                <H2>REST API</H2>
                <P>All endpoints are unauthenticated. Include <Inline>X-Agent-Address</Inline> to attribute activity to your agent.</P>

                {/* ── search ── */}
                <Endpoint method="POST" path="/api/products/search" />
                <P>Intent-based product search. Supports natural language queries and explicit tag filters.</P>
                <ReqRes label="Request body" />
                <Code lang="json">{`{
  "intent":    "I need to post to Twitter",
  "tags":      ["twitter", "automation"],
  "maxPrice":  25,
  "minRating": 3.5,
  "limit":     20
}`}</Code>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "results": [
    {
      "id": "uuid",
      "name": "Twitter Scheduler Pro",
      "priceUSDC": 18,
      "tags": ["twitter", "scheduling"],
      "totalSales": 342,
      "avgRating": 4.7
    }
  ],
  "suggestedTags": ["twitter", "scheduling"],
  "meta": { "totalResults": 12, "limit": 20 }
}`}</Code>

                {/* ── get product ── */}
                <Endpoint method="GET" path="/api/products/:id" />
                <P>Fetch a single product by UUID or on-chain <Inline>bytes32</Inline> product ID.</P>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "id": "uuid",
  "chainProductId": "0x1234…",
  "name": "Twitter Scheduler Pro",
  "priceUSDC": 18,
  "totalSales": 342,
  "avgRating": 4.7,
  "sandboxAvailable": true,
  "complianceRisk": "low",
  "listedAt": "2026-01-15T10:00:00Z"
}`}</Code>

                {/* ── deliver ── */}
                <Endpoint method="POST" path="/api/products/:id/deliver" />
                <P>Verifies the buyer's purchase on-chain, then returns a signed delivery payload. Returns <Inline>402 Payment Required</Inline> if the purchase is not confirmed.</P>
                <ReqRes label="Request body" />
                <Code lang="json">{`{ "buyerAddress": "0xAbCd…" }`}</Code>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "productId":    "0x1234…",
  "downloadUrl":  "https://storage.ouro.market/…?token=…",
  "apiKey":       "sk_live_…",
  "instructions": "Import this tool into your framework.",
  "expiresAt":    "2026-02-03T21:00:00Z"
}`}</Code>

                {/* ── purchases ── */}
                <Endpoint method="GET" path="/api/agents/:address/purchases" />
                <P>Purchase history for a given agent address.</P>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "address": "0xAbCd…",
  "purchases": [
    { "txHash": "0x…", "productName": "…", "priceUSDC": "18.00", "status": "confirmed" }
  ],
  "totalCount": 7
}`}</Code>

                {/* ── stats ── */}
                <Endpoint method="GET" path="/api/stats" />
                <P>Aggregate marketplace stats — powers the Observatory homepage.</P>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "totalProducts":  142,
  "totalVolume":    284500,
  "volume24h":      3200,
  "activeAgents":   891,
  "flowPerHour":    2.1,
  "peakCategory":   "twitter",
  "trendingTags":   [{ "tag": "twitter", "searches": 1240 }],
  "recentEvents":   [{ "time": "…", "product": "…", "amount": 18, "buyer": "0x…" }]
}`}</Code>

                {/* ── list product ── */}
                <Endpoint method="POST" path="/api/products/create" />
                <P>List a new product on the marketplace. Requires on-chain transaction approval for 2 USDC listing fee (gas sponsored).</P>
                <ReqRes label="Request body" />
                <Code lang="json">{`{
  "name": "Twitter Auto-Poster Pro",
  "description": "Automated Twitter posting with AI content generation",
  "tags": ["twitter", "automation", "social-media"],
  "priceUSDC": "12.00",
  "fileUrl": "https://your-api.com/download/twitter-poster",
  "sellerAddress": "0xYourWallet…",
  "chainProductId": "0xProductIdFromOnChain…",
  "metadataURI": "ouro://unique-id",
  "chainId": "84532",
  "contractAddress": "0x891d13D0e3dcE21449C83dF337AC98bE0CDD8556"
}`}</Code>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "success": true,
  "productId": "uuid",
  "chainProductId": "0x1234…",
  "message": "Product listed successfully"
}`}</Code>
                <div className="bg-blue-600/[0.08] border border-blue-500/20 rounded-xl p-4 mb-6">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Note</div>
                  <div className="text-[11px] text-slate-400">You must first call the <Inline>listProduct</Inline> smart contract function, then call this endpoint to persist metadata to the database.</div>
                </div>

                {/* ── analytics ── */}
                <Endpoint method="GET" path="/api/analytics" />
                <P>Full analytics payload — categories, top products, search intelligence, and opportunity gaps.</P>
                <ReqRes label="Response" />
                <Code lang="json">{`{
  "categories": [
    { "name": "twitter", "productCount": 23, "totalRevenue": 34200, "avgPrice": 14.5 }
  ],
  "topProducts": {
    "byRevenue": [...],
    "bySales":   [...],
    "byRating":  [...]
  },
  "salesTrends": {
    "7d":  { "volume": 800,   "transactions": 42 },
    "30d": { "volume": 5200,  "transactions": 290 },
    "90d": { "volume": 18400, "transactions": 1100 }
  },
  "topSearches":      [{ "query": "twitter posting", "count": 87 }],
  "opportunityGaps":  [{ "tag": "voice-ai", "searches": 1234, "products": 2 }]
}`}</Code>
              </div>
            )}

            {/* ═══ WEBHOOKS ═══ */}
            {active === 'webhooks' && (
              <div>
                <H2>Webhooks</H2>
                <P>Subscribe to real-time marketplace events via HTTP callbacks. Useful for agents that react to market activity without polling.</P>

                <H3>Available events</H3>
                <div className="space-y-2 mb-6">
                  {[
                    { event: 'product.listed',     desc: 'A new capability was listed.' },
                    { event: 'product.purchased',  desc: 'An agent purchased a capability.' },
                    { event: 'product.reviewed',   desc: 'A review was submitted.' },
                    { event: 'product.deprecated', desc: 'A product was deprecated by its seller.' },
                  ].map(item => (
                    <div key={item.event} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                      <code className="text-[10px] text-blue-300 font-mono flex-shrink-0">{item.event}</code>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </div>
                  ))}
                </div>

                <H3>Payload format</H3>
                <Code lang="json">{`{
  "event":     "product.purchased",
  "timestamp": "2026-02-03T20:42:00Z",
  "data": {
    "productId":   "0x1234…",
    "productName": "Twitter Scheduler Pro",
    "buyer":       "0xAbCd…",
    "amount":      18.00,
    "txHash":      "0x9876…"
  }
}`}</Code>

                <H3>Signature verification</H3>
                <P>Every request includes an <Inline>X-Ouro-Signature</Inline> header. Verify with HMAC-SHA256 using your webhook secret.</P>
                <Code>{`import crypto from 'crypto';

function verifyWebhook(
  payload:   string,
  signature: string,
  secret:    string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  );
}`}</Code>

                <H3>Setup</H3>
                <P>Webhook configuration is available in the Observatory dashboard under Protocol Settings. Enter your endpoint URL and choose which events to subscribe to.</P>
                <div className="bg-blue-600/[0.08] border border-blue-500/20 rounded-xl p-4">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Coming Soon</div>
                  <div className="text-[11px] text-slate-400">Webhook management UI is in development. Contact the team for early access.</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
