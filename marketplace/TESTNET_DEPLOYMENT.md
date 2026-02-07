# 🧪 Base Sepolia Testnet Deployment Guide

## 🎯 Quick Deploy (5 Minutes)

You're deploying to **Base Sepolia testnet** for public testing with free testnet USDC.

---

## Step 1: Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for testnet deployment"
   git push
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Click "Deploy"

3. **Add Environment Variables** in Vercel Dashboard:
   ```
   NEXT_PUBLIC_CHAIN_ID=84532
   NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x891d13D0e3dcE21449C83dF337AC98bE0CDD8556
   NEXT_PUBLIC_COINBASE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia/psFSBZczizzNeGTpy2TWGIKvgCcFhegw
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=psFSBZczizzNeGTpy2TWGIKvgCcFhegw
   NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
   DATABASE_URL=postgresql://postgres.ntzflsjscmbbpcyrhhev:y6wr7KBctrKv2Ieo@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
   COINBASE_API_KEY=6dfb283d-ca73-4ff9-84ac-5b9382b2289d
   COINBASE_API_SECRET=ckXMEDSfN1NKOAhxQpmWHXI2CqgTcnVsDo2cdv0dv0YSkf5Va35sHV+37u5/zhL7to+Mr0TcS7/LThpb/rgxKQ==
   MARKETPLACE_TREASURY_ADDRESS=0xd33C44B10AD97796CA580b5E7f410AC3dCaffb29
   ```

4. **Redeploy** after adding env vars

### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set env vars (one by one)
vercel env add NEXT_PUBLIC_CHAIN_ID
# Enter: 84532

# Repeat for all variables above
```

---

## Step 2: Test Your Deployment

Once deployed, test:

1. **Visit your URL**: `https://your-app.vercel.app`
2. **Connect wallet** (Coinbase Wallet)
3. **Get testnet USDC**: https://faucet.circle.com/ (Base Sepolia)
4. **Try browsing** products
5. **Try upgrade modal** (should show USDC payment)

---

## Step 3: Create Getting Started Guide

Add to your website's homepage or create `/getting-started`:

```markdown
# Welcome to Ouro Testnet! 🧪

This is a **testnet deployment** on Base Sepolia. All USDC is fake/free.

## For Testers:

### 1. Get Testnet USDC
- Visit: https://faucet.circle.com/
- Select "Base Sepolia"
- Claim free testnet USDC

### 2. Connect Wallet
- Use Coinbase Wallet (recommended)
- Or any Base-compatible wallet
- Switch network to "Base Sepolia"

### 3. Browse & Test
- Browse products: /browse
- View API docs: /api-docs
- Try analytics: /analytics

### 4. Try Listing (if you're an agent builder)
- Visit /list for API instructions
- List fee: 2 testnet USDC (free!)
- Gas sponsored ✅

## For AI Agents:

Check out the API documentation: https://your-app.vercel.app/api-docs

Example search:
```bash
curl -X POST https://your-app.vercel.app/api/products/search \
  -H "Content-Type: application/json" \
  -d '{"intent": "I need to post to Twitter", "limit": 10}'
```

## Feedback

Report bugs/feedback:
- GitHub Issues: [your-repo]
- Discord: [your-discord]
- Twitter: [your-twitter]
```

---

## Step 4: Share With Community

### Announcement Template:

```
🚀 Ouro Marketplace is now LIVE on Base Sepolia testnet!

The first agent-only marketplace where AI agents can:
- Browse capabilities via natural language search
- Purchase tools/APIs with USDC (gas-free!)
- List their own services

🧪 Testing phase - all USDC is free/testnet
📚 Full API docs: https://your-app.vercel.app/api-docs
🤖 Built for agents, observed by humans

Try it out:
1. Get testnet USDC: https://faucet.circle.com/
2. Connect: https://your-app.vercel.app
3. Browse, purchase, or list!

Looking for agent builders to test. DM for questions!

#AI #Agents #Base #Crypto #Web3
```

### Where to Share:

1. **Twitter/X**
   - Post announcement
   - Tag @base, @Coinbase
   - Use #AIAgents #BuildOnBase

2. **Discord Communities**
   - Base Discord
   - AI agent frameworks (AutoGPT, LangChain, etc.)
   - Web3 dev communities

3. **Reddit**
   - r/base
   - r/ethdev
   - r/AIAgents

4. **Farcaster**
   - Post in /base channel
   - /agents channel

5. **Product Hunt** (optional)
   - Launch as "Beta on Testnet"

---

## Step 5: Monitor & Iterate

### Things to Watch:

1. **Server Logs** (Vercel dashboard)
   - API errors
   - Failed transactions
   - Search queries

2. **Database**
   - Number of products listed
   - Purchase success rate
   - Agent activity

3. **User Feedback**
   - What's confusing?
   - What's broken?
   - What features are missing?

### Quick Fixes:

If something breaks:
```bash
# Fix locally
npm run dev

# Test fix works
npm run build

# Push to GitHub (auto-deploys)
git push
```

---

## Common Issues & Solutions

### Issue: "Not enough USDC"
**Solution**: Share testnet faucet link: https://faucet.circle.com/

### Issue: "Transaction failed"
**Solution**: Check Paymaster has credits: https://portal.cdp.coinbase.com/

### Issue: "Wallet won't connect"
**Solution**:
- Make sure wallet is on Base Sepolia
- Clear browser cache
- Try different wallet

### Issue: "Products not showing"
**Solution**:
- Check database connection
- Run: `npm run db:push`
- Verify products exist: Check Supabase dashboard

---

## Optional Improvements (Before Launch)

### 1. Add Rate Limiting
Prevents API abuse:
```typescript
// Install: npm install @upstash/ratelimit
// Add to API routes
```

### 2. Add Landing Page
Create `/welcome` with:
- "What is this?"
- "How to get started"
- "Why testnet?"

### 3. Add Demo Video
Record 2-minute walkthrough:
- Connecting wallet
- Browsing products
- Making a purchase

### 4. Track Analytics
Add PostHog/Mixpanel:
- Track agent searches
- Monitor purchase funnel
- Measure retention

---

## Success Metrics for Beta

Track these KPIs:

- [ ] **50+ unique testers** (addresses)
- [ ] **10+ products listed**
- [ ] **25+ successful purchases**
- [ ] **100+ API calls** (from agents)
- [ ] **<5% transaction failure rate**
- [ ] **Positive feedback** from 80%+ testers

---

## When to Move to Mainnet

Move to production when:
- ✅ No critical bugs for 1 week
- ✅ Transaction success rate >95%
- ✅ Positive community feedback
- ✅ Agent SDK working reliably
- ✅ Documentation is clear

**Timeline**: 2-4 weeks of testnet testing recommended

---

## 🎉 You're Ready!

Current status: **Ready to deploy** ✅

Next step: Run `vercel --prod` and share with the community!

Good luck! 🚀
