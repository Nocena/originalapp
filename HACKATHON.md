# Nocena - Decentralized Challenge-Based Social Network

> **The first social app to eliminate backend servers using Flow's Scheduled Transactions**

**🎥 [Watch Demo Video](https://youtu.be/O6Px5A3Kv0E)**

---

## The Problem

Social media is broken: centralized servers control your data, algorithmic feeds trap you in passive scrolling, and you don't own your digital identity. **What if social media made you actively participate in real life?**

---

## The Solution

**Nocena is a challenge-based social network where AI generates daily, weekly, and monthly challenges that get you off your phone and into the world.**

**How it works:**
1. Wake up to a new AI challenge (e.g., "Find a street musician and dance with them")
2. Complete it in real life - capture photo/video proof
3. Earn NCT tokens on Flow blockchain
4. Share with friends through Lens Protocol
5. Discover location-based challenges on the map

**Why it matters:**
- **500,000+ Lens Protocol profiles** integrated (~30k DAU)
- **Real-world engagement** that breaks screen addiction
- **True ownership** of identity and achievements
- **No central servers** controlling your social graph

---

## Why Flow & Forte Changed Everything

### Before Forte: Centralized Bottleneck ❌
- Cron jobs on Heroku to generate challenges
- Backend servers to trigger smart contracts
- Custodial wallets to pay gas fees
- MongoDB storing user data
- **Single points of failure everywhere**

### After Forte: True Autonomy ✅

**Scheduled Transactions = No More Cron Jobs**
```cadence
// Challenges now generate themselves autonomously
// Daily: 00:00 UTC | Weekly: Monday 00:00 UTC | Monthly: 1st day 00:00 UTC
// The blockchain IS the scheduler - no servers needed
```

**Benefits:**
- Challenges generate autonomously without infrastructure
- Unstoppable - even if our team vanished, challenges keep coming
- Verifiable - every generation is onchain and auditable
- Cost-efficient - zero server costs

**Lens Protocol = Zero Centralized Data**
- Eliminated entire User database
- 500,000+ existing profiles instantly available
- Users own their identity, social graph, and content
- Interoperable across all Lens apps

**NCT Token Economy on Flow EVM**
- Instant minting with near-zero gas fees
- Real-time leaderboard for token holders
- Composable for future DeFi actions
- Scalable for millions of users

---

## What We Built During Forte Hacks

### Complete Blockchain Migration
- **From:** Polygon with centralized cron jobs
- **To:** Flow EVM with autonomous scheduled transactions
- **Impact:** True decentralization of entire challenge system

### Major Features Shipped

**✅ Lens Protocol Integration**
- Eliminated centralized user database
- 500,000+ profiles with ~30k DAU integrated
- Zero sensitive data storage

**✅ NCT Token Economy**
- NCT (Nocenite) token deployed on Flow EVM
- Real-time leaderboard
- Automatic minting on challenge completion

**✅ Challenge System Overhaul**
- **Private Challenges:** Peer-to-peer with 24h expiration and token escrow
- **Public Challenges:** Location-based POI discovery with weekly refresh
- **Completion History:** Paginated with auto-generated video snapshots

**✅ MVC Backend Refactor**
- Modular GraphQL API
- Blockchain event listener
- Migration scripts for historical data

### Before & After Comparison

| Feature | Before (Polygon) | After (Flow + Forte) |
|---------|------------------|----------------------|
| Challenge Generation | Cron jobs on Heroku | Scheduled Transactions |
| User Identity | MongoDB | Lens Protocol |
| Social Graph | Centralized DB | Lens Protocol |
| Automation | Off-chain servers | Native blockchain |
| Data Storage | AWS + MongoDB | IPFS + Dgraph |

**130+ commits in October** - complete architectural transformation.

---

## Technical Architecture

**Stack:**
- Next.js 15, TypeScript, Tailwind CSS, PWA
- Flow EVM Testnet (NCT token + challenge contracts)
- Lens Protocol (decentralized social graph)
- Scheduled Transactions (autonomous challenge generation)
- Pinata/IPFS (decentralized media)
- Dgraph (challenge metadata, zero sensitive data)

**Key Innovation: Self-Scheduling Challenges**
```cadence
access(all) contract ChallengeScheduler {
    init() {
        FlowTransactionScheduler.scheduleRecurring(
            frequency: 86400, // 24 hours
            handler: self.generateDailyChallenge
        )
    }
    
    access(all) fun generateDailyChallenge() {
        let challenge = AIOracle.generateChallenge()
        self.activeChallenges[getCurrentDay()] = challenge
        emit DailyChallengeGenerated(challenge)
    }
}
```

---

## Why Nocena Wins

### Best Killer App on Flow ⭐
- Massive market: 500k+ Lens users, $200B social media industry
- Daily engagement loop keeps users coming back
- Real-world utility breaks screen addiction
- Network effects: more users = more value
- Flow enables consumer-scale with instant finality and low fees

### Best Use of Forte Features ⭐
- **Scheduled Transactions = Core Infrastructure** (not a feature, our entire system)
- Daily/weekly/monthly challenges run autonomously onchain
- Proves consumer apps can eliminate backend servers
- Future: Flow Actions for DeFi composability (staking, governance, rewards)

### Best Existing Code ⭐
- Live on Polygon before Forte Hacks
- 130+ commits migrating to Flow in October
- Entire architecture rebuilt around Forte
- Historical data migrated (challenge completions preserved)
- Production-ready PWA

**This isn't a prototype - it's a real app that went from centralized to fully decentralized using Flow.**

---

## Roadmap

**Q4 2025:** Public beta, mainnet deployment, Crypto Knights TV show apperarance
**Q1 2026:** Crypto Knights airs to milions on Apple TV+ and Amazon Prime
**Q2 2026:** App focusing on useful skill learning thru challenges
**Q3 2026:** Influencer tokenization

---

## Getting Started

```bash
git clone https://github.com/nocena/app.git
cd app
pnpm install
cp .env.example .env
pnpm dev
```

---

## Smart Contracts

All contracts deployed on **Flow EVM Testnet**:

| Contract | Address | Explorer |
|----------|---------|----------|
| NCT Token (ERC-20) | `Nocena-core repo` | [View](https://github.com/cadenpiper/nocena-core) |
| Scheduled Generator | `Nocena-scheduled-transactions repo` | [View](https://github.com/cadenpiper/nocena-scheduled-transactions) |

---

## Team

**Built by:**
- **Matija** - Full-stack Developer, Lens Integration
- **Caden** - Smart Contract Developer, Cadence Specialist
- **Jakub** - Product Lead, Frontend Architecture

---

## Links

- **Live App:** [nocena.app](https://app.nocena.com)
- **Demo Video:** [Watch Here](https://youtu.be/O6Px5A3Kv0E)
- **GitHub:** [github.com/nocena/app](https://github.com/Nocena/originalapp)
- **Twitter/X:** [@nocena_app](https://x.com/nocena_app)

---

**Built for Forte Hacks 2025 🚀**

*The first truly autonomous SocialFI, powered by Flow's Scheduled Transactions.*

`#ForteHacks` `#FlowBlockchain` `#LensProtocol` `#ScheduledTransactions` `#Web3Social`