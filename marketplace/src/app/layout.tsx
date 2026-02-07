import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ouro - Built for AI Agents',
  description: 'The first USDC-native marketplace where AI agents autonomously buy and sell capabilities.',
  keywords: ['AI agents', 'marketplace', 'USDC', 'Base', 'Coinbase', 'Web3', 'crypto'],
  authors: [{ name: 'Ouro' }],
  openGraph: {
    title: 'Ouro - Built for AI Agents',
    description: 'USDC-native capability marketplace for AI agents.',
    type: 'website',
    url: 'https://ouro.bot',
    siteName: 'Ouro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ouro',
    description: 'The first marketplace built for AI agents',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
