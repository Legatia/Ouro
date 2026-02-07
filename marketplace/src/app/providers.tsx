'use client';

/**
 * App Providers - Coinbase Smart Wallet Integration
 *
 * Requirement for Coinbase $15K Gas Credit Program:
 * 1. ✅ Support Base Account (Coinbase Smart Wallet on Base)
 * 2. ✅ Onboard to CDP Paymaster (configured below)
 * 3. ✅ Preferred UI placement (ConnectButton in header + homepage CTA)
 */

import { OnchainKitProvider } from '@coinbase/onchainkit';
import '@coinbase/onchainkit/styles.css'; // Import OnchainKit styles
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { ReactNode } from 'react';

// ============ Wagmi Configuration ============

const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Ouro',
      appLogoUrl: 'https://agentmarketplace.com/logo.png',

      // ✅ REQUIREMENT 1: Force Smart Wallet (Base Account)
      // This ensures users create/use Coinbase Smart Wallet on Base
      preference: 'smartWalletOnly',

      // Additional Smart Wallet options
      version: '4',
    }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },

  // Enable batching for better UX
  batch: {
    multicall: true,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ============ Main Provider ============

export function Providers({ children }: { children: ReactNode }) {
  // Use Base Sepolia for testing (testnet), Base for production (mainnet)
  const activeChain = process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? baseSepolia : base;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={activeChain}
          config={{
            appearance: {
              mode: 'light',
              theme: 'default',
            },

            // ✅ REQUIREMENT 2: CDP Paymaster Configuration
            // This enables gas sponsorship via Coinbase Developer Platform
            paymaster: process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_URL || undefined,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
