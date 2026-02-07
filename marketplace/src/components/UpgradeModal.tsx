'use client';

import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { encodeFunctionData, parseUnits } from 'viem';

interface UpgradeModalProps {
  isOpen:  boolean;
  onClose: () => void;
  address: string;
}

// USDC Contract on Base Sepolia
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_CHAIN_ID === '84532'
  ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`;

// Treasury address (receives subscription payments)
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;

const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function UpgradeModal({ isOpen, onClose, address }: UpgradeModalProps) {
  const [onrampUrl, setOnrampUrl] = useState<string>('');
  const { address: connectedAddress } = useAccount();
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Generate onramp URL
  useEffect(() => {
    if (!isOpen || !address) return;
    const network = process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? 'base-sepolia' : 'base';
    const params = new URLSearchParams({
      asset: 'USDC',
      network,
      buyAmount: '9.99',
      sellCurrency: 'USD',
      destinationAddress: address,
      partnerUserRef: address,
      appId: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY ?? '',
    });
    setOnrampUrl(`https://pay.coinbase.com/buy?${params.toString()}`);
  }, [isOpen, address]);

  // Handle payment
  const handlePayment = () => {
    sendTransaction({
      to: USDC_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, parseUnits('9.99', 6)],
      }),
    });
  };

  // Activate subscription on success
  useEffect(() => {
    if (isSuccess && hash) {
      fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: connectedAddress,
          tier: 'analyst',
          txHash: hash,
          amountUSDC: '9.99',
        }),
      })
        .then(() => console.log('[Subscription] Activated'))
        .catch((err) => console.error('[Subscription] Activation failed:', err));
    }
  }, [isSuccess, hash, connectedAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 bg-[#0a0f1e] border border-white/10 rounded-[2rem] p-8 w-full max-w-md mx-4">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-600 hover:text-white transition text-xl leading-none">×</button>

        {/* Tier badge */}
        <div className="text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest w-fit mb-4">
          Analyst Tier
        </div>

        <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">Upgrade your Node.</h2>
        <p className="text-slate-500 text-[12px] leading-relaxed mb-6">
          Unlock full protocol telemetry — category performance, top products, search intelligence, and opportunity gaps.
        </p>

        {/* Price + feature list */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 mb-6">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-4xl font-black text-white leading-none">$9.99</span>
            <span className="text-[11px] font-mono text-slate-600">USDC</span>
          </div>
          <div className="text-[9px] font-mono text-slate-600">30 days • one-time</div>

          <div className="mt-4 space-y-2">
            {[
              'Category performance bars',
              'Top products — revenue / sales / rating',
              'Search intelligence feed',
              'Opportunity gaps radar',
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-green-400 text-[10px]">✓</span>
                <span className="text-[11px] text-slate-400">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment Actions ── */}
        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={isPending || isConfirming || isSuccess}
            className="block w-full py-3 bg-blue-600 text-white rounded-lg text-[11px] font-black text-center uppercase tracking-widest hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : isSuccess ? 'Success!' : 'Pay 9.99 USDC'}
          </button>

          {error && (
            <div className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              {error.message}
            </div>
          )}

          {isSuccess && (
            <div className="text-center py-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-black text-white mb-1">Payment Successful!</div>
              <p className="text-[9px] text-slate-500 mb-3">Analyst tier activated</p>
              <button
                onClick={() => { onClose(); window.location.reload(); }}
                className="text-[10px] font-black text-blue-400 hover:text-white uppercase tracking-widest"
              >Refresh Page</button>
            </div>
          )}

          <a
            href={onrampUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-white/[0.06] border border-white/10 text-slate-300 rounded-lg text-[11px] font-black text-center uppercase tracking-widest hover:border-white/20 hover:text-white transition"
          >Buy USDC with Card</a>

          <p className="text-[9px] font-mono text-slate-600 text-center leading-relaxed">
            Need USDC? Buy with card first, then return to pay.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <span className="text-[8px] font-mono text-slate-600">Gas sponsored • USDC on Base</span>
        </div>
      </div>
    </div>
  );
}
