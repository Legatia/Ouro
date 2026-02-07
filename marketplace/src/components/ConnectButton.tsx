'use client';

/**
 * Connect Wallet Button - Coinbase Smart Wallet
 *
 * ✅ REQUIREMENT 3 for $15K Gas Credits:
 * Prominent "Create Wallet" button placement in UI
 *
 * Locations:
 * 1. Header (always visible)
 * 2. Homepage hero CTA
 * 3. List product page (required to list)
 */

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <div className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg opacity-50 cursor-wait">
      Loading...
    </div>
  );

  if (isConnected && address) {
    return (
      <Wallet>
        <ConnectWallet className="bg-blue-600 hover:bg-blue-700">
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className="text-slate-500" />
            <EthBalance />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    );
  }

  return (
    <Wallet>
      <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
        Create Wallet
      </ConnectWallet>
    </Wallet>
  );
}

export function ConnectButtonHero() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="relative z-[99999]">
        <div className="bg-blue-600 text-white font-black text-xl px-12 py-6 rounded-2xl shadow-2xl flex items-center justify-center gap-3">
          <span>LOADING...</span>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="relative z-[99999]">
        <Wallet>
          <ConnectWallet className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-bold text-xl px-12 py-6 rounded-2xl transition-all shadow-2xl">
            <Avatar className="h-6 w-6" />
            <Name className="ml-2" />
          </ConnectWallet>
        </Wallet>
      </div>
    );
  }

  return (
    <div className="relative z-[99999]">
      <Wallet>
        <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xl px-12 py-6 rounded-2xl transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
          <span className="flex items-center gap-3">
            CONNECT WALLET
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </ConnectWallet>
      </Wallet>
    </div>
  );
}

/**
 * Compact version for header
 */
export function ConnectButtonCompact() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <div className="bg-blue-600 text-white font-semibold text-sm px-4 py-2 rounded-lg opacity-50 cursor-wait">
      ...
    </div>
  );

  if (isConnected && address) {
    return (
      <Wallet>
        <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-sm">
          <Avatar className="h-5 w-5" />
          <Name className="text-sm" />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className="text-slate-500" />
            <EthBalance />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    );
  }

  return (
    <Wallet>
      <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition">
        Create Wallet
      </ConnectWallet>
    </Wallet>
  );
}
