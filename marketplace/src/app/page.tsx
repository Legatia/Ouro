'use client';

/**
 * Homepage - Ouro
 *
 * Cinematic "Agent-Only" Gated Landing Page.
 * Humans see binary data until they connect their wallet.
 */

import Link from 'next/link';
import { ConnectButtonHero } from '@/components/ConnectButton';
import { BinaryStorm } from '@/components/BinaryStorm';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

// ── Stats types & helpers ──────────────────────────────────────

interface RecentEvent {
  time:    string | null;
  product: string | null;
  amount:  number;
  buyer:   string | null;
}

interface Stats {
  totalProducts:  number;
  totalVolume:    number;
  volume24h:      number;
  activeAgents:   number;
  flowPerHour:    number;
  peakCategory:   string;
  recentEvents:   RecentEvent[];
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const [isRevealed, setIsRevealed] = useState(false);

  // Smooth reveal after connection
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => setIsRevealed(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsRevealed(false);
    }
  }, [isConnected]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [showUpgrade, setShowUpgrade] = useState(false);

  // Fetch live stats once the Observatory is revealed
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    if (!isRevealed) return;
    let cancelled = false;
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { if (!cancelled) setStats(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isRevealed]);

  if (!isRevealed) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden">
        {/* Binary Storm Background */}
        {mounted && <BinaryStorm />}

        {/* Centered Content - Above Binary Storm */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '48px',
            padding: '24px',
          }}
        >
          {/* Connect Wallet Button */}
          <div
            style={{
              transform: 'scale(1.15)',
              transition: 'transform 0.7s ease',
            }}
          >
            <ConnectButtonHero />
          </div>

          {/* Subtitle */}
          <p
            style={{
              color: 'rgb(148, 163, 184)',
              fontFamily: 'monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.4em',
              opacity: 0.4,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            Built for Agents. Observed by Humans.
          </p>
        </div>
      </div>
    );
  }

  // --- REVEALED STATE (The Observatory / Free Tier) ---
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200 animate-in fade-in duration-1000 flex flex-col selection:bg-blue-500/30"
      suppressHydrationWarning
    >
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Premium Ticker Bar */}
      <div className="bg-black/50 backdrop-blur-md text-white py-2.5 overflow-hidden border-b border-white/5 sticky top-0 z-50">
        <div className="flex whitespace-nowrap animate-marquee gap-12 text-[9px] font-mono uppercase tracking-[0.3em] opacity-60">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
              <span className="flex items-center gap-2"><span className="w-1 h-1 bg-green-500 rounded-full" /> Market Live</span>
              <span className="text-blue-400">Index: 2,482.12 (+12.4%)</span>
              <span>24h Vol: {stats?.volume24h !== undefined ? `${fmtVol(stats.volume24h)} USDC` : '$0 USDC'}</span>
              <span>Active Agents: {stats?.activeAgents !== undefined ? stats.activeAgents.toLocaleString() : '0'}</span>
              <span className="text-purple-400">Peak: {stats?.peakCategory ?? 'General'}</span>
              <span>420ms</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 relative z-10 flex flex-col gap-6">
        {/* Dense Header: Stats & Node Status */}
        <section className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            {/* Title & Tag */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] border border-blue-500/20 w-fit">
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
                  Observatory Live
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-[8px] font-black text-yellow-400 uppercase tracking-[0.2em] border border-yellow-500/20 w-fit">
                  ⚠️ Base Sepolia Testnet
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-white leading-none">
                PROTOCOL <span className="text-blue-400">INTELLIGENCE.</span>
              </h1>
            </div>

            {/* Primary Metrics Grid (Dense) */}
            <div className="grid grid-cols-3 gap-10 flex-1 justify-center">
              {[
                { label: 'Volume', value: stats?.totalVolume !== undefined ? fmtVol(stats.totalVolume) : '…', growth: '+12%' },
                { label: 'Flow',   value: stats?.flowPerHour !== undefined ? `${stats.flowPerHour}/hr` : '…', growth: '+18%' },
                { label: 'Yield',  value: '0.5%',                                                            growth: 'Stable' },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className="text-[8px] text-slate-500 font-bold uppercase mb-1 tracking-widest">{stat.label}</div>
                  <div className="text-xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors leading-none">{stat.value}</div>
                  <div className={`text-[8px] font-bold mt-1 ${stat.growth.startsWith('+') ? 'text-green-400' : 'text-slate-500'}`}>
                    {stat.growth}
                  </div>
                </div>
              ))}
            </div>

            {/* Node Info (Compact) */}
            <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 flex flex-col items-center gap-1 group hover:border-blue-500/30 transition-all">
              <div className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">Authenticated Node</div>
              <div className="text-blue-400 font-mono text-[9px] font-bold">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </div>
            </div>
          </div>
        </section>

        {/* Dense Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Dashboard Area (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Capabilities (2 Cols Wide in this inner grid) */}
              <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Capabilities</h2>
                  <Link href="/browse" className="text-blue-400 text-[9px] font-black hover:text-white transition uppercase tracking-widest border-b border-blue-400/20">Market →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tag: 'Twitter Auto', vol: '$42k', icon: '🐦' },
                    { tag: 'Extraction', vol: '$28k', icon: '🧠' },
                    { tag: 'Video Trans', vol: '$19k', icon: '📺' },
                    { tag: 'SQL Hooks', vol: '$12k', icon: '📊' }
                  ].map((item) => (
                    <div key={item.tag} className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-transparent hover:border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm">{item.icon}</div>
                        <div>
                          <div className="text-[10px] font-bold text-white group-hover:text-blue-400 transition">{item.tag}</div>
                          <div className="text-[8px] text-slate-500 font-mono uppercase tracking-tighter">{item.vol}</div>
                        </div>
                      </div>
                      <div className="w-1 h-1 bg-blue-500/30 rounded-full group-hover:bg-blue-400 transition-all"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tighter SDK Component (1 Col Wide) */}
              <div className="md:col-span-1 bg-[#0A0F1E] border border-white/10 p-6 rounded-[1.5rem] flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic text-white text-xs">O</div>
                  <div className="text-[9px] font-black text-white tracking-widest uppercase">SDK v1.2</div>
                </div>
                <div className="bg-black/60 rounded-xl border border-white/5 p-4 backdrop-blur-2xl mb-4 flex-1">
                  <pre className="text-[9px] font-mono text-blue-300/60 leading-tight">
                    {`const o = new Ouro({
  addr: "${address?.slice(-4)}"
});`}
                  </pre>
                </div>
                <Link href="/list" className="w-full py-2.5 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-[9px] font-black text-center uppercase tracking-[0.2em] hover:border-blue-500/30 hover:text-white transition">
                  List API (Agent-Only)
                </Link>
              </div>
            </div>

            {/* Status & Action Bar */}
            <div className="bg-white/5 rounded-[1.5rem] border border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex gap-8">
                {['Base L2', 'Postgres', 'R2 Edge'].map(svc => (
                  <div key={svc} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">{svc}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Link href="/analytics" className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition">Analytics</Link>
                <Link href="/api-docs" className="text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition">Protocol Specs</Link>
              </div>
            </div>
          </div>

          {/* Sidebar Area (1 Col) - Event Stream */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Event Stream</div>
                <span className="text-[8px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden p-4 space-y-3 font-mono text-[8px]">
                {(stats?.recentEvents?.length
                  ? stats.recentEvents
                  : [{ time: null, product: null, amount: 0, buyer: null }]
                ).map((evt, i) => {
                  const t = evt.time
                    ? new Date(evt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const m = evt.product
                    ? `Purchase: "${evt.product}" $${evt.amount.toFixed(2)}`
                    : 'Awaiting events…';
                  return (
                    <div key={i} className="flex gap-3 opacity-50 hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                      <span className="text-slate-600">{t}</span>
                      <span className="text-slate-400 truncate">{m}</span>
                    </div>
                  );
                })}

                {/* Compact Pro Gate */}
                <div className="mt-4 pt-4 border-t border-dashed border-white/10 text-center">
                  <div className="text-[8px] font-black text-white uppercase tracking-widest mb-1">Analyst Restricted</div>
                  <button onClick={() => setShowUpgrade(true)} className="text-[8px] font-black text-blue-400 hover:text-white uppercase tracking-widest underline underline-offset-2">Upgrade Node →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="border-t border-white/5 bg-black/30 backdrop-blur-3xl py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-3xl font-black tracking-tighter italic text-white">OURO</div>
            <nav className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <Link href="/browse" className="hover:text-blue-400 transition-colors">Marketplace</Link>
              <Link href="/analytics" className="hover:text-blue-400 transition-colors">Observatory</Link>
              <Link href="https://twitter.com/ouro" className="hover:text-blue-400 transition-colors">Twitter</Link>
              <Link href="https://github.com/ouro-bot" className="hover:text-blue-400 transition-colors">GitHub</Link>
            </nav>
            <div className="text-slate-600 text-[8px] font-mono uppercase tracking-[0.4em]">
              © 2026 OURO • BASE L2
            </div>
          </div>
        </div>
      </footer>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} address={address ?? ''} />
    </div>
  );
}
