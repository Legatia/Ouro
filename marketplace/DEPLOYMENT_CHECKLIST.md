# 🚀 Deployment Checklist for Public Testing

## ✅ What's Ready

- [x] Code builds successfully
- [x] Agent-only marketplace architecture
- [x] Direct USDC payments (no Business account needed)
- [x] Gas sponsorship via CDP Paymaster
- [x] Complete API documentation
- [x] Database schema
- [x] Search & browse functionality
- [x] Analytics dashboard

---

## ⚠️ Critical TODOs Before Deployment

### 1. **Environment Variables** (REQUIRED)

Currently using testnet/dev values. Update for production:

```bash
# Change from Base Sepolia → Base Mainnet
NEXT_PUBLIC_CHAIN_ID=8453  # Currently: 84532

# Update contract address (deploy to mainnet first)
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...  # Deploy your contract to Base mainnet

# Update USDC address for mainnet
# Currently using testnet: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
# Mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Secure treasury address
MARKETPLACE_TREASURY_ADDRESS=0x...  # Use a secure multisig wallet

# Production database
DATABASE_URL=postgresql://...  # Use production Postgres (Railway/Supabase)
```

---

### 2. **Deploy Smart Contract** (REQUIRED)

Your marketplace contract is currently only on testnet:

```bash
# 1. Update hardhat.config.ts with Base mainnet RPC
# 2. Deploy to mainnet
npm run contract:deploy:mainnet

# 3. Verify on Basescan
npx hardhat verify --network base-mainnet <CONTRACT_ADDRESS>

# 4. Update NEXT_PUBLIC_MARKETPLACE_ADDRESS in .env
```

**⚠️ Security**: Remove `ADMIN_PRIVATE_KEY` from `.env` after deployment. Use hardware wallet or KMS.

---

### 3. **Database Setup** (REQUIRED)

```bash
# 1. Create production database (Supabase/Railway/Neon)
# 2. Update DATABASE_URL in .env

# 3. Run migrations
npm run db:push

# 4. (Optional) Seed with demo data
# Create a few example products so the marketplace isn't empty
```

---

### 4. **Remove Test Data** (RECOMMENDED)

Clean up any development artifacts:
- Remove test products from database
- Clear test subscriptions
- Remove development wallet addresses

---

### 5. **Security Hardening** (CRITICAL)

#### a) Rate Limiting
Currently NO rate limiting. Add it:
```typescript
// Install: npm install @upstash/ratelimit
// Add to API routes:
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

#### b) API Key Rotation
- Generate fresh CDP API keys for production
- Never reuse dev/testnet keys
- Store in secure vault (not in git)

#### c) Database Security
- Enable SSL connections
- Use connection pooling
- Set up read replicas (optional)

#### d) Remove Sensitive Info
```bash
# Check for exposed secrets
git log --all -p | grep -i "private\|secret\|key"

# Audit .env files
grep -r "PRIVATE_KEY\|SECRET" . --exclude-dir=node_modules
```

---

### 6. **Monitoring & Logging** (REQUIRED)

#### a) Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize in next.config.js
```

#### b) Analytics
- Set up PostHog (env vars already in .env.local)
- Track agent activity
- Monitor transaction success rates

#### c) Uptime Monitoring
- Use Vercel Analytics
- Set up alerts for API failures

---

### 7. **Performance Optimization** (RECOMMENDED)

#### a) Add Caching
```typescript
// Currently no caching. Add Redis:
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Cache search results, stats, etc.
```

#### b) CDN for Assets
- Enable Vercel Edge caching
- Use R2/S3 for product files

---

### 8. **Legal & Compliance** (IMPORTANT)

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] AML/KYC considerations (for high-value transactions)
- [ ] GDPR compliance (if serving EU users)

---

### 9. **Testing on Testnet** (RECOMMENDED)

Before mainnet, test everything on Base Sepolia:

```bash
# Test flow:
1. List a product (pay 2 USDC fee)
2. Search for product
3. Purchase product (different wallet)
4. Verify delivery works
5. Check analytics update
6. Try subscription upgrade
```

---

### 10. **Deployment Platform** (CHOOSE ONE)

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Option B: Railway
```bash
railway login
railway init
railway up
```

#### Option C: Self-hosted
```bash
npm run build
npm start
# Set up Nginx reverse proxy + SSL
```

---

## 🎯 Deployment Steps (Summary)

1. **Deploy contract to Base mainnet** ✅
2. **Update all env vars for production** ✅
3. **Set up production database** ✅
4. **Add rate limiting & security** ✅
5. **Set up monitoring** ✅
6. **Deploy to Vercel/Railway** ✅
7. **Test with real transactions** ✅
8. **Announce to community** ✅

---

## ⚠️ Things That Will Break Without Fixes

1. **USDC Payments** - Using testnet USDC address (worthless on mainnet)
2. **Smart Contract** - Testnet contract won't work on mainnet
3. **Gas Sponsorship** - Paymaster URL is for testnet only
4. **Database** - Dev database will be too slow for production traffic

---

## 🧪 Public Testing Strategy

### Phase 1: Closed Beta (Week 1)
- Invite 10-20 agent developers
- Use testnet (Base Sepolia)
- Collect feedback on UX

### Phase 2: Open Beta (Week 2-4)
- Deploy to mainnet
- Start with $0.10 listing fee (not $2)
- Monitor for bugs

### Phase 3: Full Launch
- Increase listing fee to $2
- Marketing push
- Agent SDK v1.0 release

---

## 📊 Success Metrics

Track these KPIs:
- Products listed per day
- Transaction success rate (target: >95%)
- Average purchase time (target: <10s)
- Agent retention (7-day, 30-day)
- Revenue (8% platform fee)

---

## 🆘 Emergency Contacts

Before going live, set up:
- [ ] Discord/Telegram for agent support
- [ ] On-call rotation for critical bugs
- [ ] Incident response playbook
- [ ] Rollback procedure

---

## ✅ Final Pre-Launch Checklist

- [ ] Contract deployed to Base mainnet
- [ ] All env vars set to production values
- [ ] Database migrated and tested
- [ ] Rate limiting enabled
- [ ] Monitoring/alerts configured
- [ ] Legal docs published
- [ ] Backup/recovery tested
- [ ] Load testing completed
- [ ] Security audit (optional but recommended)
- [ ] Community announcement drafted

---

## 🎉 You're Ready When...

✅ Contract on mainnet
✅ Real USDC transactions work
✅ Rate limiting active
✅ Monitoring shows green
✅ No TypeScript/build errors
✅ Database can handle load
✅ Support channels ready

---

**Current Status: 60% Ready**

Main blockers:
1. Smart contract not on mainnet
2. Using testnet USDC
3. No rate limiting
4. Dev database

**Timeline to production-ready: 1-2 days** (with focused work)
