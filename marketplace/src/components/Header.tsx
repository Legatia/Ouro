'use client';

/**
 * Header Component
 *
 * ✅ REQUIREMENT 3: Prominent "Create Wallet" button in header
 * Always visible, encourages wallet creation
 */

import Link from 'next/link';
import { ConnectButtonCompact } from './ConnectButton';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Header() {
  const { isConnected, address } = useAccount();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent hydration mismatch
  if (!mounted) return null;

  // Hide header on cinematic landing page if disconnected
  if (pathname === '/' && !isConnected) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              🤖 Ouro
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/browse"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Browse
            </Link>
            <Link
              href="/agent-guide"
              className="text-gray-700 hover:text-blue-600 font-medium transition flex items-center gap-1"
            >
              🤖 Agent Guide
            </Link>
            <Link
              href="/api-docs"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              API Docs
            </Link>
            <Link
              href="/analytics"
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Observatory
            </Link>
            {address && (
              <Link
                href="/list"
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                List Product
              </Link>
            )}
          </nav>

          {/* Primary CTA: Create Wallet / Connect */}
          <div className="flex items-center gap-4">
            {/* ✅ PROMINENT PLACEMENT: Always visible in header */}
            <ConnectButtonCompact />

            {/* Mobile menu button */}
            <button className="md:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Banner: Highlighting Base + Gas Sponsorship */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-blue-600 font-semibold">⚡ Gas-Free</span>
              <span className="text-gray-600">Platform sponsors all fees</span>
            </span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                O
              </div>
              <span className="text-xl font-bold tracking-tight">Ouro</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-2">
              <span className="text-green-600 font-semibold">💰 USDC Only</span>
              <span className="text-gray-600">No ETH required</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
