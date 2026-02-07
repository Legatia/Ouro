'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { UpgradeModal } from '@/components/UpgradeModal';

// ── Types ──────────────────────────────────────────────────────

type Period     = '7d' | '30d' | '90d';
type ProductTab = 'byRevenue' | 'bySales' | 'byRating';

interface Category {
  name: string;
  productCount: number;
  totalSales:   number;
  totalRevenue: number;
  avgPrice:     number;
}

interface TopProduct {
  id:           string;
  name:         string;
  tags:         string[];
  priceUSDC:    number;
  totalSales:   number;
  avgRating:    number | null;
  totalRevenue: number;
}

interface SearchQuery { query: string; count: number; }

interface Gap { tag: string; searches: number; products: number; ratio: number; }

interface AnalyticsData {
  categories:   Category[];
  topProducts:  Record<ProductTab, TopProduct[]>;
  salesTrends:  Record<Period, { volume: number; transactions: number }>;
  topSearches:  SearchQuery[];
  opportunityGaps: Gap[];
}

// ── Helpers ────────────────────────────────────────────────────

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ── Component ──────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period,     setPeriod]     = useState<Period>('30d');
  const [productTab, setProductTab] = useState<ProductTab>('byRevenue');

  const { address, isConnected } = useAccount();
  const [hasAccess,    setHasAccess]    = useState<boolean | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Check subscription status
  useEffect(() => {
    if (!mounted || !isConnected || !address) {
      setHasAccess(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/subscription/${address}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setHasAccess(data.active === true);
      })
      .catch(() => { if (!cancelled) setHasAccess(false); });
    return () => { cancelled = true; };
  }, [mounted, isConnected, address]);

  const trend      = data?.salesTrends[period];
  const maxRevenue = data ? Math.max(...data.categories.map(c => c.totalRevenue), 1) : 1;
  const maxSearch  = data ? Math.max(...data.opportunityGaps.map(g => g.searches), 1) : 1;

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-white transition">← Back to Observatory</Link>
          <h1 className="text-5xl font-black tracking-tighter mt-4">ANALYTICS PRO.</h1>
          <p className="text-slate-500 mt-2 font-medium">Deep protocol telemetry and agent behavioral mapping.</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-8">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition border ${
                period === p
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >{p}</button>
          ))}
        </div>

        {/* ── Summary Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Volume',       value: loading ? '…' : fmtVol(trend?.volume ?? 0),                                                sub: `${period} window` },
            { label: 'Transactions', value: loading ? '…' : (trend?.transactions ?? 0).toLocaleString(),                            sub: `${period} window` },
            { label: 'Categories',   value: loading ? '…' : (data?.categories.length ?? 0).toString(),                              sub: 'active tags' },
            { label: 'Top Product',  value: loading ? '…' : (data?.topProducts.byRevenue[0]?.name ?? '—').slice(0, 18),             sub: loading ? '' : `Revenue: ${fmtVol(data?.topProducts.byRevenue[0]?.totalRevenue ?? 0)}` },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5">
              <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-2">{s.label}</div>
              <div className="text-2xl font-black text-white leading-none">{s.value}</div>
              <div className="text-[8px] text-slate-600 font-mono mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Two-column: Category bars | Top Products table ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Category Performance */}
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Category Performance</h2>

            {loading || !data ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : data.categories.length === 0 ? (
              <p className="text-slate-600 text-xs">No categories yet. Products appear here once listed.</p>
            ) : (
              <div className="space-y-4">
                {data.categories.slice(0, 8).map(c => (
                  <div key={c.name} className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black text-white group-hover:text-blue-400 transition uppercase tracking-wider">{c.name}</span>
                      <span className="text-[9px] font-mono text-slate-500">{fmtVol(c.totalRevenue)}</span>
                    </div>
                    {/* Revenue bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-700"
                        style={{ width: `${(c.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[8px] text-slate-600 font-mono">{c.productCount} products • {c.totalSales} sales</span>
                      <span className="text-[8px] text-slate-600 font-mono">Avg ${c.avgPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products — tabbed */}
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Top Products</h2>
              <div className="flex gap-1">
                {[
                  { key: 'byRevenue' as ProductTab, label: 'Revenue' },
                  { key: 'bySales'   as ProductTab, label: 'Sales'   },
                  { key: 'byRating' as ProductTab, label: 'Rating'  },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setProductTab(key)}
                    className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition ${
                      productTab === key ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            {loading || !data ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : (data.topProducts[productTab] ?? []).length === 0 ? (
              <p className="text-slate-600 text-xs">No products yet.</p>
            ) : (
              <div className="space-y-1">
                {data.topProducts[productTab].map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition">
                    <span className="text-[9px] font-black text-slate-600 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black text-white truncate">{p.name}</div>
                      <div className="text-[8px] text-slate-600 font-mono">{p.tags.slice(0, 3).join(' • ')}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-black text-blue-400">${p.priceUSDC.toFixed(2)}</div>
                      <div className="text-[8px] text-slate-600 font-mono">
                        {productTab === 'byRating' && p.avgRating !== null
                          ? `★ ${p.avgRating.toFixed(1)}`
                          : `${p.totalSales} sold`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom row: Search Intel | Opportunity Gaps ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Search Intelligence */}
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Search Intelligence</h2>
            <p className="text-[9px] text-slate-600 mb-5">Agent intent queries — what the network is actively looking for.</p>

            {loading || !data ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => <div key={i} className="h-7 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : data.topSearches.length === 0 ? (
              <p className="text-slate-600 text-xs">No searches recorded yet. They appear after agents use the search API.</p>
            ) : (
              <div className="space-y-1">
                {data.topSearches.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition">
                    <span className="text-[10px] font-mono text-slate-300">"{s.query}"</span>
                    <span className="text-[8px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{s.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opportunity Gaps */}
          <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Opportunity Gaps</h2>
            <p className="text-[9px] text-slate-600 mb-5">High search volume, low product supply — where demand outpaces supply.</p>

            {loading || !data ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : data.opportunityGaps.length === 0 ? (
              <p className="text-slate-600 text-xs">No gap data yet. Gaps appear once agents search the marketplace.</p>
            ) : (
              <div className="space-y-2">
                {data.opportunityGaps.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {(g.ratio > 50 || g.products < 3) && (
                          <span className="text-[7px] font-black text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase tracking-wider">Emerging</span>
                        )}
                        <span className="text-[10px] font-black text-white">{g.tag}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] font-mono flex-shrink-0">
                      <span className="text-slate-400">{g.searches.toLocaleString()} searches</span>
                      <span className="text-slate-600">{g.products} products</span>
                    </div>
                    {/* Demand intensity bar */}
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${Math.min((g.searches / maxSearch) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Paywall Overlay — only shown when connected but no access */}
      {mounted && hasAccess === false && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-10 max-w-md mx-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[8px] font-black text-orange-400 uppercase tracking-[0.2em] border border-orange-500/20 mb-4">
              Analyst Required
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-3">Premium Telemetry.</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Access category performance, top products, search intelligence, and opportunity gaps.
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 transition"
            >
              Upgrade — $9.99 USDC
            </button>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} address={address ?? ''} />
    </div>
  );
}
