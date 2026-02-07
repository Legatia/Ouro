'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────

interface Product {
  id:               string;
  chainProductId:   string;
  name:             string;
  description:      string | null;
  tags:             string[];
  priceUSDC:        number;
  sellerAddress:    string;
  sandboxAvailable: boolean;
  complianceRisk:   string;
  totalSales:       number;
  avgRating:        number | null;
  totalReviews:     number;
  listedAt:         string;
}

// ── Constants ──────────────────────────────────────────────────

const TAG_ICONS: Record<string, string> = {
  'twitter': '🐦', 'social-media': '📱', 'crypto': '💎', 'trading': '📈',
  'automation': '⚙️', 'data-extraction': '🧠', 'content-generation': '✍️',
  'video': '📺', 'email': '📧', 'pdf': '📄', 'linkedin': '💼',
  'api-access': '🔌', 'discord': '💬', 'instagram': '📸',
};

// ── Helpers ────────────────────────────────────────────────────

function getIcon(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_ICONS[tag]) return TAG_ICONS[tag];
  }
  return '📦';
}

// ── Component ──────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [copied,  setCopied]  = useState<string | null>(null);

  // ── Fetch product ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          if (data.error) { setError('Product not found'); }
          else            { setProduct(data); }
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { setError('Failed to load product'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  // ── Copy helper ──────────────────────────────────────────────
  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-12">
        <div className="max-w-4xl mx-auto">
          <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-10 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-64 bg-white/10 rounded-[1.5rem] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-12 flex flex-col items-center justify-center">
        <div className="text-slate-500 text-sm mb-6">{error || 'Product not found'}</div>
        <Link href="/browse" className="text-blue-400 text-[10px] font-black hover:text-white transition uppercase tracking-widest">← Back to Marketplace</Link>
      </div>
    );
  }

  // ── Snippet strings ─────────────────────────────────────────
  const sdkSnippet = `import { OuroClient } from '@ouro/sdk';

const client = new OuroClient({ chainId: 84532 });

// Search for capabilities
const results = await client.search({
  tags: ['automation'],
  maxPrice: 10,
});

// Purchase a capability (gas sponsored)
const receipt = await client.purchase({
  productId: '${product.chainProductId}',
});

// Retrieve delivery payload
const delivery = await client.deliver({
  productId: '${product.chainProductId}',
  txHash:    receipt.transactionHash,
});`;

  const restSnippet = `# 1. Search
curl -X POST https://ouro.market/api/products/search \\
  -H "Content-Type: application/json" \\
  -d '{"tags":["automation"],"maxPrice":10}'

# 2. Purchase — submit on-chain tx, then record it
curl -X POST https://ouro.market/api/products/${product.id}/purchase \\
  -H "Content-Type: application/json" \\
  -d '{
    "txHash":"0x…",
    "blockNumber":12345,
    "buyerAddress":"0x…"
  }'

# 3. Deliver
curl -X POST https://ouro.market/api/products/${product.id}/deliver \\
  -H "Content-Type: application/json" \\
  -d '{"buyerAddress":"0x…"}'`;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <Link href="/browse" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-white transition">← Back to Marketplace</Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">

          {/* ── Left: Product info + code snippets ─────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero row */}
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                {getIcon(product.tags)}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter leading-none">{product.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {product.avgRating !== null && (
                    <span className="text-[11px] font-mono text-slate-400">★ {product.avgRating.toFixed(1)} <span className="text-slate-600">({product.totalReviews})</span></span>
                  )}
                  <span className="text-[11px] font-mono text-slate-600">{product.totalSales} sold</span>
                  <span className="text-[9px] font-mono text-slate-700">Listed {new Date(product.listedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="text-[9px] font-black text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">{tag}</span>
              ))}
            </div>

            {/* Description */}
            <div>
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Description</div>
              <p className="text-slate-400 text-[13px] leading-relaxed">
                {product.description || 'No description provided.'}
              </p>
            </div>

            {/* Attributes grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Sandbox',  value: product.sandboxAvailable ? 'Available' : 'Not available', accent: product.sandboxAvailable ? 'text-green-400' : 'text-slate-600' },
                { label: 'Risk',     value: product.complianceRisk,                                    accent: product.complianceRisk === 'low' ? 'text-green-400' : product.complianceRisk === 'medium' ? 'text-yellow-400' : 'text-red-400' },
                { label: 'Seller',   value: `${product.sellerAddress.slice(0, 8)}…${product.sellerAddress.slice(-6)}`, accent: 'text-slate-400' },
                { label: 'Chain ID', value: product.chainProductId.slice(0, 10) + '…',                accent: 'text-slate-600' },
              ].map(a => (
                <div key={a.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{a.label}</div>
                  <div className={`text-[11px] font-mono ${a.accent}`}>{a.value}</div>
                </div>
              ))}
            </div>

            {/* ── SDK snippet ────────────────────────────────── */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[1.5rem] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TypeScript SDK</div>
                  <span className="text-[8px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">recommended</span>
                </div>
                <button
                  onClick={() => copy('sdk', sdkSnippet)}
                  className="text-[9px] font-black text-slate-600 hover:text-blue-400 transition uppercase tracking-widest"
                >
                  {copied === 'sdk' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="px-5 pb-5 overflow-x-auto">
                <code className="text-[11px] font-mono text-blue-300/70 whitespace-pre leading-relaxed">{sdkSnippet}</code>
              </pre>
            </div>

            {/* ── REST snippet ───────────────────────────────── */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[1.5rem] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">cURL / REST</div>
                <button
                  onClick={() => copy('rest', restSnippet)}
                  className="text-[9px] font-black text-slate-600 hover:text-blue-400 transition uppercase tracking-widest"
                >
                  {copied === 'rest' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="px-5 pb-5 overflow-x-auto">
                <code className="text-[11px] font-mono text-green-300/70 whitespace-pre leading-relaxed">{restSnippet}</code>
              </pre>
            </div>

          </div>

          {/* ── Right: Observation card ──────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 sticky top-24 space-y-6">

              {/* Price + badge */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-4xl font-black text-white leading-none">${product.priceUSDC.toFixed(2)}</div>
                  <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Agent Only</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600">USDC • one-time</div>
              </div>

              {/* Stats */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Total sales</span>
                  <span className="text-slate-300">{product.totalSales}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Avg rating</span>
                  <span className="text-slate-300">{product.avgRating !== null ? `★ ${product.avgRating.toFixed(1)}` : '—'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Reviews</span>
                  <span className="text-slate-300">{product.totalReviews}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Listed</span>
                  <span className="text-slate-300">{new Date(product.listedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Fee split */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Fee breakdown</div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Seller receives</span>
                  <span className="text-green-400">92%</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Platform fee</span>
                  <span className="text-slate-400">8%</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-600">Gas</span>
                  <span className="text-green-400">Sponsored</span>
                </div>
              </div>

              {/* SDK hint */}
              <div className="bg-blue-600/[0.08] border border-blue-500/20 rounded-xl p-4">
                <div className="text-[9px] font-mono text-blue-400 leading-relaxed">
                  Agents interact via SDK or REST. See code snippets on the left.
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
