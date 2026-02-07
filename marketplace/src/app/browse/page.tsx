'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  priceUSDC: number;
  sellerAddress: string;
  sellerENS: string | null;
  totalSales: number;
  avgRating: number | null;
  totalReviews: number;
  sandboxAvailable: boolean;
  complianceRisk: string;
  openSource: boolean;
  listedAt: string;
}

// ── Constants ──────────────────────────────────────────────────

const DEFAULT_TAGS = [
  'twitter', 'crypto', 'automation', 'data-extraction',
  'content-generation', 'social-media', 'trading', 'api-access',
];

const TAG_ICONS: Record<string, string> = {
  'twitter': '🐦', 'social-media': '📱', 'crypto': '💎', 'trading': '📈',
  'automation': '⚙️', 'data-extraction': '🧠', 'content-generation': '✍️',
  'video': '📺', 'email': '📧', 'pdf': '📄', 'linkedin': '💼',
  'api-access': '🔌', 'discord': '💬', 'instagram': '📸',
  'scheduling': '🕐', 'scraping': '🕸️', 'file-processing': '📂',
};

type SortBy = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating';

// ── Helpers ────────────────────────────────────────────────────

function getIcon(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_ICONS[tag]) return TAG_ICONS[tag];
  }
  return '📦';
}

// ── Component ──────────────────────────────────────────────────

export default function BrowsePage() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTags, setSelectedTags]     = useState<string[]>([]);
  const [sortBy, setSortBy]           = useState<SortBy>('popular');
  const [maxPrice, setMaxPrice]       = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch on filter change
  const tagsKey = selectedTags.join(',');

  useEffect(() => {
    let cancelled = false;
    const activeTags = tagsKey ? tagsKey.split(',') : [];

    async function runSearch() {
      setLoading(true);
      try {
        const body: Record<string, unknown> = { limit: 50 };
        if (debouncedQuery)        body.intent  = debouncedQuery;
        if (activeTags.length > 0) body.tags    = activeTags;
        if (maxPrice)              body.maxPrice = Number(maxPrice);

        const res  = await fetch('/api/products/search', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        const data = await res.json();

        if (!cancelled) {
          setProducts(res.ok ? (data.results ?? [])       : []);
          setSuggestedTags(res.ok ? (data.suggestedTags ?? []) : []);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();
    return () => { cancelled = true; };
  }, [debouncedQuery, tagsKey, maxPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side sort
  const sorted = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'newest':     return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
      case 'price-asc':  return a.priceUSDC - b.priceUSDC;
      case 'price-desc': return b.priceUSDC - a.priceUSDC;
      case 'rating':     return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      default:           return b.totalSales - a.totalSales;
    }
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setMaxPrice('');
  };

  // Merge suggested + defaults, dedupe, cap at 12
  const filterTags = [...new Set([...suggestedTags, ...DEFAULT_TAGS])].slice(0, 12);
  const hasFilters = searchQuery || selectedTags.length > 0 || maxPrice;

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-white transition">← Back to Observatory</Link>
          <h1 className="text-5xl font-black tracking-tighter mt-4">MARKETPLACE.</h1>
          <p className="text-slate-500 mt-2 font-medium">Discover and acquire autonomous capabilities for your agent node.</p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 gap-3 mb-5 focus-within:border-blue-500/50 transition">
          <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by intent… e.g. 'I need to post to Twitter'"
            className="flex-1 bg-transparent py-4 text-white placeholder-slate-600 focus:outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-600 hover:text-white transition text-lg leading-none">×</button>
          )}
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {filterTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition border ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              {loading ? '…' : sorted.length} {sorted.length === 1 ? 'capability' : 'capabilities'}
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[9px] font-black text-slate-600 hover:text-blue-400 transition uppercase tracking-widest">
                Clear ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Max price */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-[9px] text-slate-600 font-mono uppercase">Max $</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="—"
                className="bg-transparent text-white text-sm w-14 focus:outline-none placeholder-slate-700"
              />
            </div>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="popular"    style={{ background: '#020617' }}>Popular</option>
              <option value="newest"     style={{ background: '#020617' }}>Newest</option>
              <option value="price-asc"  style={{ background: '#020617' }}>Price: Low → High</option>
              <option value="price-desc" style={{ background: '#020617' }}>Price: High → Low</option>
              <option value="rating"     style={{ background: '#020617' }}>Rating</option>
            </select>
          </div>
        </div>

        {/* ── Grid / States ─────────────────────────────────────── */}

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-xl mb-6" />
                <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/10 rounded w-full mb-2" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>

        ) : sorted.length === 0 ? (
          /* Empty */
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-16 text-center">
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-3">
              {hasFilters ? 'No results match your filters' : 'No capabilities listed yet'}
            </div>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {hasFilters
                ? 'Try broadening your search or removing some filters.'
                : 'Be the first to list a capability. Agents are waiting.'}
            </p>
            {hasFilters && (
              <div className="flex justify-center mt-6">
                <button onClick={clearFilters} className="text-blue-400 text-[10px] font-black hover:text-white transition uppercase tracking-widest border-b border-blue-400/30">
                  Clear filters
                </button>
              </div>
            )}
          </div>

        ) : (
          /* Product cards */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sorted.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-blue-500/50 transition cursor-pointer group flex flex-col">

                {/* Icon row */}
                <div className="flex justify-between items-start mb-5">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-xl">
                    {getIcon(p.tags)}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.sandboxAvailable && (
                      <span className="text-[8px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">
                        Sandbox
                      </span>
                    )}
                    {p.complianceRisk !== 'low' && (
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        p.complianceRisk === 'medium'
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>{p.complianceRisk} risk</span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-black mb-2 group-hover:text-blue-400 transition">{p.name}</h3>

                {/* Description */}
                <p className="text-slate-500 text-xs leading-relaxed mb-4 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description || 'No description provided.'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {p.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[8px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                  {p.tags.length > 4 && (
                    <span className="text-[8px] text-slate-600 font-mono">+{p.tags.length - 4}</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-5 border-t border-white/5 mt-auto">
                  <span className="text-blue-400 font-black">${p.priceUSDC.toFixed(2)} USDC</span>
                  <div className="flex items-center gap-3 text-[9px] font-mono text-slate-600">
                    {p.avgRating !== null && <span>★ {p.avgRating.toFixed(1)}</span>}
                    <span>{p.totalSales} sold</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
