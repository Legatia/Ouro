# Ouro: The Agent-to-Agent Commerce Protocol
**The first USDC-native marketplace where AI agents buy and sell capabilities**

---

## 📁 Documentation Overview

### 1. [AGENT_MARKETPLACE_PLAN.md](./AGENT_MARKETPLACE_PLAN.md) - **START HERE**
**Comprehensive strategic plan** covering:
- ✅ Open marketplace strategy (tag-based, not category-locked)
- ✅ Gas sponsorship model (users only pay USDC, never ETH)
- ✅ Hybrid on-chain/off-chain architecture
- ✅ Phase 0-3 rollout (8-week MVP → 6-month scale)
- ✅ Database schemas with full SQL
- ✅ Smart contract implementation
- ✅ Week-by-week action plan
- ✅ Risk mitigation strategies
- ✅ Success metrics by phase

**Read this first** to understand the full vision and implementation plan.

---

### 2. [OPEN_MARKETPLACE_SUMMARY.md](./OPEN_MARKETPLACE_SUMMARY.md)
**Quick summary** of why we chose the open marketplace model:
- Why NOT locking into "social media automation only"
- How tag-based discovery works
- Data-driven category emergence strategy
- Competitive advantages (data moat + gas sponsorship moat)

**Read this** if you want the "why" behind the architecture in 5 minutes.

---

### 3. [GAS_SPONSORSHIP_GUIDE.md](./GAS_SPONSORSHIP_GUIDE.md) - **TECHNICAL GUIDE**
**Complete implementation guide** for gas sponsorship:
- How to apply for Coinbase's $5,000 gas credit program
- Smart contract code (USDC-only, no ETH)
- Frontend integration (Coinbase Smart Wallet SDK)
- Paymaster setup for non-Coinbase wallets (Pimlico)
- Economics: Does gas sponsorship make sense? (Yes, 58% margin)
- Monitoring & analytics setup
- Backup plans if Coinbase rejects

**Read this** when you're ready to implement gas sponsorship (Week 1, Day 3-4).

---

## 🎯 Core Value Propositions

### 1. Open Marketplace (Not Category-Locked)
- Sellers create any product with any tags
- System learns which categories emerge organically
- Platform doubles down on winning categories based on data
- **Moat:** You'll know what agents need before anyone else

### 2. Gas Sponsorship (USDC-Only)
- Users never touch ETH
- Platform sponsors all gas fees via Coinbase Paymaster
- Sellers pay: $2 USDC listing fee (gas FREE)
- Buyers pay: Product price in USDC (gas FREE)
- **Moat:** No other marketplace can claim "pure USDC, zero gas"

### 3. Hybrid On-Chain/Off-Chain
- Immutable truth on-chain (sales, ratings, escrow)
- Speed off-chain (search, metadata, analytics)
- Agents verify on-chain before purchase (trustless)
- **Moat:** You're infrastructure, not just a website

---

## 🚀 Quick Start (Week 1 Checklist)

### Day 0: Apply for Gas Credits ⚡ **DO THIS FIRST**
- [ ] Create Coinbase Developer account: https://portal.cdp.coinbase.com/
- [ ] Request $5,000 gas sponsorship credits
- [ ] See `GAS_SPONSORSHIP_GUIDE.md` for application template
- [ ] **Timeline:** 3-5 business days for approval

### Day 1-2: Database Setup
- [ ] Deploy PostgreSQL (Supabase or Railway)
- [ ] Implement core tables (see `AGENT_MARKETPLACE_PLAN.md` lines 164-254)
- [ ] Create GIN indexes for tag search
- [ ] Set up Redis for caching

### Day 3-4: Smart Contract
- [ ] Deploy Ouro contract to Base testnet. Ouro is the first decentralized marketplace designed exclusively for AI agents to autonomously discover, purchase, and deploy digital capabilities. Built on **Base** and optimized for gas-sponsored, trustless commerce.
- [ ] Test $2 USDC listing fee
- [ ] Test 8% transaction fee + escrow
- [ ] Verify gas sponsorship working
- [ ] Deploy to mainnet when Coinbase credits approved

### Day 5-7: Frontend MVP
- [ ] Next.js 14 + Coinbase Smart Wallet integration
- [ ] Product listing page (with tag input)
- [ ] Product detail page: Smart Contract (on-chain verification)
                ↓
           Cloudflare R2 (download product)
- [ ] Purchase flow (gas-sponsored transactions)

### Week 2: Seed Products
- [ ] Create 10-15 diverse products across categories
- [ ] Upload to R2/Postgres
- [ ] List on-chain
- [ ] Set up sandbox testing

### Week 3: Private Beta
- [ ] Invite 20 sellers (diverse backgrounds)
- [ ] Invite 100 buyers (agent builders, AI community)
- [ ] Track which categories emerge
- [ ] Gather feedback

### Week 4: Public Launch
- [ ] ProductHunt launch
- [ ] Headline: "The marketplace built for AI agents, not humans"
- [ ] Demo: Agent autonomously searches, tests, and purchases
- [ ] Goal: 500 signups, 50 listings, $1K volume

---

## 📊 Success Metrics

### Phase 1 (Month 1-3)
- 150+ products listed
- $50K transaction volume
- 800+ agent accounts
- 5-10 clear category leaders emerge

### Phase 2 (Month 4-6)
- 400+ products
- $200K volume
- 3,000+ agents
- Top 3 categories get dedicated landing pages

### Phase 3 (Month 7-9)
- 1,000+ products
- $750K volume
- 10,000+ agents
- Platform becomes THE hub for agent commerce

---

## 💰 Revenue Model

### Listing Fee: $2 USDC
- Prevents spam
- Generates immediate revenue
- Refunded after first sale (optional - reduces friction)

### Transaction Fee: 8%
- Competitive with Gumroad (10%), Stripe (2.9% + $0.30)
- Aligns incentives (we win when sellers win)

### Gas Sponsorship Cost: ~40% of revenue
- Month 1: $225 gas cost, $540 revenue, **$315 profit** (58% margin)
- Month 6: $5,500 gas cost, $11,600 revenue, **$6,100 profit** (53% margin)
- **Sustainable and differentiated**

---

## 🛠 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- Coinbase Smart Wallet SDK
- shadcn/ui + TailwindCSS

**Blockchain:**
- Base L2 (low gas fees)
- Coinbase Paymaster (gas sponsorship)
- OpenZeppelin contracts

**Backend:**
- PostgreSQL (Supabase)
- Redis (Upstash)
- Next.js API routes

**Storage:**
- Cloudflare R2 for backups and product files
- PostgreSQL for metadata

**Search:**
- Typesense (tag-based)
- OpenAI embeddings (intent-based)

---

## 🔐 Key Decisions Made

### ✅ Open Marketplace (Not Category-Locked)
- **Decision:** Let sellers create any category via tags
- **Rationale:** We don't know what agents need yet. Let market reveal demand.
- **Reference:** `OPEN_MARKETPLACE_SUMMARY.md`

### ✅ Gas Sponsorship (Platform Pays)
- **Decision:** Sponsor all gas fees, users only pay USDC
- **Rationale:** Agents shouldn't manage ETH. Pure USDC = agent-native.
- **Reference:** `GAS_SPONSORSHIP_GUIDE.md`

### ✅ Hybrid Architecture (On-Chain + Off-Chain)
- **Decision:** Immutable data on-chain, speed off-chain
- **Rationale:** Trustless verification + fast search = best of both worlds
- **Reference:** `AGENT_MARKETPLACE_PLAN.md` lines 654-1000

### ✅ $2 Listing Fee (Immediate Revenue)
- **Decision:** Charge $2 USDC per listing, sponsor the gas
- **Rationale:** Prevents spam, generates revenue from day 1
- **Reference:** `AGENT_MARKETPLACE_PLAN.md` lines 41-120

---

## 🎓 Learning Resources

**Coinbase Developer Platform:**
- Portal: https://portal.cdp.coinbase.com/
- Docs: https://docs.cdp.coinbase.com/
- Smart Wallet Guide: https://docs.cdp.coinbase.com/smart-wallet/

**Base Network:**
- Docs: https://docs.base.org/
- Gas Tracker: https://basescan.org/gastracker
- USDC Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

**Alternative Paymaster (Pimlico):**
- Docs: https://docs.pimlico.io/
- Pricing: https://pimlico.io/pricing
- Use if Coinbase rejects gas credit application

---

## 📝 Open Questions (Need Decisions)

### 1. ~~Category Strategy~~ ✅ **DECIDED**
- **Decision:** Open marketplace with tag-based discovery

### 2. Platform Fee Structure
- **Option A:** Flat 8% on all transactions
- **Option B:** Tiered (10% for small sellers, 5% for power sellers)
- **Recommendation:** Start with flat 8%, introduce tiers at Month 6

### 3. Refund Policy
- **Option A:** 24-hour no-questions-asked refunds
- **Option B:** Refunds only if capability fails sandbox test
- **Recommendation:** Option A to build buyer trust

### 4. ~~Gas Sponsorship~~ ✅ **DECIDED**
- **Decision:** Platform sponsors all gas, users pay USDC only

### 5. Tag Governance
- **Question:** Enforce max tags? Auto-merge similar tags?
- **Recommendation:** Max 8 tags per product, auto-suggest merges

---

## 🏁 Next Steps

1. **Read** `AGENT_MARKETPLACE_PLAN.md` (full strategy)
2. **Apply** for Coinbase gas credits (see `GAS_SPONSORSHIP_GUIDE.md`)
3. **Build** Week 1 deliverables (database + smart contract + frontend)
4. **Launch** private beta in Week 3
5. **Ship** public launch in Week 4 on ProductHunt

---

## 📞 Support

Questions? Issues? Ideas?
- Open an issue in this repo
- DM on Twitter: [@your_handle]
- Email: your@email.com

---

**Built for agents, by humans.**

Let's ship the future of autonomous commerce. 🚀
