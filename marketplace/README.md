# Ouro Marketplace
for AI Agents, Not Humans

**The first USDC-native marketplace where AI agents autonomously buy and sell capabilities.**

---

## 🎯 Core Concept

**You're right:** The frontend is just for curious humans. The **real** marketplace is the API and SDK.

### For Agents (Primary Users)
- **Search via intent:** `"I need to post to Twitter"` → finds products
- **Verify on-chain:** Trustlessly check sales/ratings on Base L2
- **Purchase (gas-free):** Pay in USDC only, platform sponsors gas
- **Install capability:** Download from IPFS or get API key

### For Humans (Secondary - Sellers/Browsers)
- **Browse marketplace:** See what agents are buying
- **List products:** Easier than using API directly
- **Verify trust:** Check on-chain stats before telling agents to buy

---

## 📦 What's Built

### Agent-Native Infrastructure ✅
- **Smart Contract** (`contracts/AgentMarketplace.sol`) - USDC-only, gas-sponsored
- **Agent SDK** (`sdk/agent-sdk.ts`) - Intent-based search, on-chain verification
- **Agent API** (`src/app/api/products/search/route.ts`) - Fast search, JSON responses
- **Database Schema** (`drizzle/schema.ts`) - Tag-based, tracks emerging categories

### Minimal Human UI ✅
- **Homepage** (`src/app/page.tsx`) - Explains what this is
- **List Product** (`src/app/list/page.tsx`) - Sellers list via UI

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Apply for Coinbase Gas Credits
See `../GAS_SPONSORSHIP_GUIDE.md` for application template.

### 4. Set Up Database
```bash
npm run db:push
```

### 5. Deploy Smart Contract
```bash
# Testnet first
npm run contract:deploy:testnet

# Then mainnet
npm run contract:deploy:mainnet
```

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Architecture

### Agent Flow (Primary)
```
Agent SDK
    ↓
API /api/products/search (intent → products)
    ↓
Verify on-chain (Base L2 smart contract)
    ↓
Purchase (gas sponsored, USDC only)
    ↓
Download from IPFS
```

### Human Flow (Secondary)
```
Next.js Frontend
    ↓
Coinbase Smart Wallet
    ↓
Smart Contract (list product, $2 USDC, gas FREE)
    ↓
IPFS upload metadata
    ↓
Agents discover via tags
```

---

## 🛠 Tech Stack

**Agent Layer:**
- viem + wagmi (blockchain interaction)
- Custom SDK (intent-based search)
- Edge API routes (low latency)

**Frontend Layer:**
- Next.js 15 (App Router)
- Coinbase Smart Wallet
- TailwindCSS

**Blockchain:**
- Base L2 (low gas fees)
- Coinbase Paymaster (gas sponsorship)
- OpenZeppelin contracts

**Data:**
- PostgreSQL (Supabase)
- Redis (Upstash)
- IPFS (Pinata)

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `BUILD_SUMMARY.md` | What's built + deployment checklist |
| `../AGENT_MARKETPLACE_PLAN.md` | Full strategic plan |
| `../GAS_SPONSORSHIP_GUIDE.md` | Coinbase gas sponsorship setup |
| `../OPEN_MARKETPLACE_SUMMARY.md` | Why open categories |

---

## 🎯 Key Decisions

### ✅ Agent-First, Not Human-First
- API/SDK is primary interface
- Frontend is minimal (just for sellers to list)
- Machine-readable responses (JSON)

### ✅ Gas Sponsorship (USDC-Only)
- Platform sponsors ALL gas fees
- Users only interact with USDC, never ETH
- $2 listing fee + 8% transaction fee

### ✅ Open Marketplace (Tag-Based)
- No pre-defined categories
- Sellers create their own tags
- System learns which categories emerge organically

### ✅ Hybrid On-Chain/Off-Chain
- Immutable truth on-chain (sales, ratings)
- Speed off-chain (search, metadata)
- Agents verify on-chain before purchase

---

## 💰 Economics

**Revenue Model:**
- $2 USDC listing fee (net $1.50 after gas)
- 8% transaction fee (net $0.46 per $12 sale after gas)

**Gas Sponsorship:**
- Month 1: $225 gas cost, $363 revenue, $363 profit (Coinbase credits)
- Month 6: $5,500 gas cost, $11,600 revenue, $6,100 profit (53% margin)

**Sustainable and differentiated.**

---

## 🔐 Security

**Smart Contract:**
- OpenZeppelin libraries (audited)
- ReentrancyGuard on all state-changing functions
- No ETH handling (USDC only)

**Gas Sponsorship:**
- Rate limits per user (10 txns/day)
- Monitor for abuse via analytics
- Daily spending caps on Paymaster

**Data Integrity:**
- On-chain verification before purchase
- IPFS for decentralized file storage
- No single point of failure

---

## 📈 Success Metrics

### Phase 1 (Month 1-3)
- 150+ products listed
- $50K transaction volume
- 800+ agent accounts
- 5-10 category leaders emerge

### Phase 2 (Month 4-6)
- 400+ products
- $200K volume
- 3,000+ agents
- Top 3 categories get landing pages

### Phase 3 (Month 7-9)
- 1,000+ products
- $750K volume
- 10,000+ agents
- Platform is THE hub for agent commerce

---

## 🤝 Contributing

This is an open marketplace. We welcome:
- Sellers listing products
- Developers building on the SDK
- Feedback on agent UX
- Bug reports and improvements

---

## 📞 Support

- Docs: `/docs`
- API: `/api-docs`
- GitHub: [your-repo]
- Twitter: [@your-handle]

---

**Built for the agent economy. Let's ship.** 🚀
