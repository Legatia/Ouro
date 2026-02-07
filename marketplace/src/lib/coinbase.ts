/**
 * Coinbase CDP helpers — Payment Links, Onramp URLs, Webhook verification
 *
 * Env vars:
 *   COINBASE_API_KEY         – API Key ID (UUID format)
 *   COINBASE_API_SECRET      – Base64-encoded Ed25519 private key
 *   COINBASE_WEBHOOK_SECRET  – HMAC secret returned when webhook sub was created
 *   NEXT_PUBLIC_ONCHAINKIT_API_KEY – reused as Onramp appId
 */

import * as crypto from 'crypto';

// Payment Links use Coinbase Business API, not CDP Platform API
const BUSINESS_API_BASE = 'https://business.coinbase.com/api/v1';
const CDP_BASE = 'https://api.cdp.coinbase.com/platform/v2';

// ── CDP JWT (EdDSA with Ed25519) ───────────────────────────────

function createCdpJwt(url: string): string {
  const keyId      = process.env.COINBASE_API_KEY!;
  const keySecret  = process.env.COINBASE_API_SECRET!;
  const now        = Math.floor(Date.now() / 1000);
  const nonce      = crypto.randomBytes(16).toString('hex');

  const header  = Buffer.from(JSON.stringify({
    alg: 'EdDSA', kid: keyId, nonce, typ: 'JWT',
  })).toString('base64url');

  const payload = Buffer.from(JSON.stringify({
    sub: keyId, iss: 'cdp', aud: ['cdp_service'],
    nbf: now, exp: now + 120, uris: [url],
  })).toString('base64url');

  // Ed25519 key: decode base64 secret to raw 32-byte private key
  const privateKeyBytes = Buffer.from(keySecret, 'base64');

  // Build PKCS#8 wrapper for Ed25519 (DER format)
  // Ed25519 OID: 1.3.101.112
  const oid = Buffer.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]);
  const pkcs8Key = Buffer.concat([oid, privateKeyBytes]);

  const privateKey = crypto.createPrivateKey({
    key: pkcs8Key,
    format: 'der',
    type: 'pkcs8',
  });

  const sig = crypto.sign(null, Buffer.from(`${header}.${payload}`), privateKey)
    .toString('base64url');

  return `${header}.${payload}.${sig}`;
}

// ── Payment Link ────────────────────────────────────────────────

export async function createPaymentLink({
  amount, description, metadata,
}: {
  amount:      string;
  description: string;
  metadata:    Record<string, string>;
}): Promise<{ id: string; url: string }> {
  if (!process.env.COINBASE_API_KEY || !process.env.COINBASE_API_SECRET) {
    console.error('[Coinbase] Missing API credentials');
    throw new Error('Coinbase API credentials not configured. Please set COINBASE_API_KEY and COINBASE_API_SECRET in your environment.');
  }

  // DEVELOPMENT MODE: Return mock payment link if credentials are placeholder/invalid
  if (process.env.COINBASE_API_KEY?.includes('placeholder')) {
    console.warn('[Coinbase] Using mock payment link for development');
    return {
      id: `mock-payment-${Date.now()}`,
      url: 'https://pay.coinbase.com/demo-link-replace-with-real-credentials'
    };
  }

  const endpoint = `${BUSINESS_API_BASE}/payment-links`;
  const network = process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? 'base-sepolia' : 'base';

  console.log('[Coinbase] Creating payment link via Business API:', { endpoint, amount, network, description });

  try {
    const jwt = createCdpJwt(endpoint);
    console.log('[Coinbase] JWT created successfully');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        amount,
        currency:    'USDC',
        network,
        description,
        metadata,
      }),
    });

    console.log('[Coinbase] API response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Coinbase] API error response:', errorText);
      throw new Error(`Coinbase API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    console.log('[Coinbase] Payment link created:', data.id);
    return data;
  } catch (error) {
    console.error('[Coinbase] Request failed:', error);
    throw error;
  }
}

// ── Onramp URL (fiat → USDC) ────────────────────────────────────

export function generateOnrampUrl(destinationAddress: string, amountUsd: string): string {
  const network = process.env.NEXT_PUBLIC_CHAIN_ID === '84532' ? 'base-sepolia' : 'base';

  const params = new URLSearchParams({
    asset:              'USDC',
    network,
    buyAmount:          amountUsd,
    sellCurrency:       'USD',
    destinationAddress,
    partnerUserRef:     destinationAddress,
    appId:              process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY ?? '',
  });

  return `https://pay.coinbase.com/buy?${params.toString()}`;
}

// ── Webhook signature verification ─────────────────────────────

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.COINBASE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signature.replace(/^0x/, '');

  if (expected.length !== provided.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(provided, 'hex'),
  );
}
