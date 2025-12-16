<p align="center">
  <img src="https://img.shields.io/badge/Flare-Network-orange?style=for-the-badge" alt="Flare Network" />
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">Helios DEX</h1>

<p align="center">
  <strong>The Concentrated Liquidity DEX on Flare Network</strong>
</p>

<p align="center">
  Better prices. Lower slippage. Powered by native FTSO oracle feeds.
</p>

<p align="center">
  <a href="https://app.heliosdex.io">Launch App</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contracts">Contracts</a>
</p>

---

## Overview

Helios is a next-generation decentralized exchange built on Flare Network, utilizing **Liquidity Book** technology for concentrated liquidity. Unlike traditional AMMs, Helios allows liquidity providers to concentrate their capital within specific price ranges, resulting in better capital efficiency and lower slippage for traders.

### Key Highlights

- **Concentrated Liquidity** - Liquidity Book (LB) architecture for capital-efficient trading
- **FTSO Integration** - Native Flare Time Series Oracle for accurate, decentralized price feeds
- **Sub-second Finality** - Lightning-fast trades on Flare Network
- **Multi-hop Routing** - Automatic route optimization for best execution
- **Limit Orders** - Place limit orders using single-bin liquidity positions

---

## Features

### Trading
| Feature | Description |
|---------|-------------|
| **Instant Swaps** | Swap tokens with real-time quotes and minimal slippage |
| **Limit Orders** | Set target prices and let your orders fill automatically |
| **Multi-hop Routing** | Automatic path finding for optimal trade execution |
| **Price Impact Display** | See exactly how your trade affects the market |

### Liquidity Provision
| Feature | Description |
|---------|-------------|
| **Concentrated Liquidity** | Provide liquidity in specific price ranges (bins) |
| **Flexible Distribution** | Choose uniform or curve distribution strategies |
| **Position Management** | View, rebalance, or remove your positions anytime |
| **Auto-compounding Fees** | Trading fees automatically compound in your position |

### Flare Native Features
| Feature | Description |
|---------|-------------|
| **FTSO Delegation** | Delegate your WFLR to earn FTSO rewards (~3-5% APR) |
| **Reward Claiming** | Claim accumulated FTSO rewards directly in-app |
| **FlareDrops** | Eligible positions can receive FlareDrop distributions |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/HeliosFLR/helios-dex.git
cd helios-dex

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` file:

```env
# Network: 'testnet' for Coston2, 'mainnet' for Flare
NEXT_PUBLIC_NETWORK=testnet

# WalletConnect Project ID (optional, for WalletConnect support)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

### Build for Production

```bash
npm run build
npm run start
```

---

## Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: wagmi v2, viem, RainbowKit
- **State**: TanStack Query

### Smart Contracts

Helios uses the **Liquidity Book** protocol, a concentrated liquidity AMM:

| Contract | Description |
|----------|-------------|
| **LBFactory** | Deploys and manages liquidity pools |
| **LBRouter** | Handles swaps, liquidity additions/removals |
| **LBPair** | Individual liquidity pool contracts |
| **LBQuoter** | Provides swap quotes and route optimization |

### Liquidity Book Concepts

**Bins**: Liquidity is distributed across discrete price bins. Each bin represents a specific price point.

**Bin Step**: Determines the price increment between bins (e.g., 15 = 0.15% per bin).

**Active Bin**: The bin where the current market price resides. Swaps occur in and around this bin.

---

## Contracts

### Coston2 Testnet

| Contract | Address |
|----------|---------|
| LBFactory | `0xdbfD526E99E458EA640b524cbC671650Be29aFD1` |
| LBRouter | `0xe62c4c776A79cBF66426519f282121684Be4fCdE` |
| LBQuoter | `0xeD0015D2d92fFbeE894f55645dDb4078dFEbE30d` |

### Supported Pools (Coston2)

| Pair | Address | Bin Step |
|------|---------|----------|
| WFLR/USDT | `0x72b2b9642c2eBac6b0C32D122b5ECD8cD110E091` | 15 (0.15%) |
| WFLR/USDC | `0x57AB117167833D1498badD8952d2FAa4a25db572` | 15 (0.15%) |
| sFLR/WFLR | `0x014c31E5cD8D13E4bb61a2405d9298d3CcEaB340` | 15 (0.15%) |
| USDC/USDT | `0x85944BEf3b1C150060A99a2D1286a5b912ED0fde` | 15 (0.15%) |

### Test Tokens (Coston2)

| Token | Address | Decimals |
|-------|---------|----------|
| WFLR | `0x58AD50724a983240D69072DE9c554ff1E12fedd7` | 18 |
| USDT | `0xfB864E898bBc04D1df1a1BCa381BbaefD511fB2A` | 6 |
| USDC | `0x4Fcbcfab3109809b0BCcCB42c82cC4E281e71C12` | 6 |
| sFLR | `0xf2F8BDfd3A216f684756768160cb3BFdF26b03f0` | 18 |

---

## Testing Guide

### Getting Testnet Tokens

1. Get C2FLR from the [Flare Faucet](https://faucet.flare.network/)
2. Use the in-app faucet to mint test USDT, USDC, and sFLR

### Test Scenarios

**Swap Testing**
- [ ] Connect wallet to Coston2 network
- [ ] Swap WFLR → USDT (direct route)
- [ ] Swap USDT → sFLR (multi-hop via WFLR)
- [ ] Verify price impact and slippage

**Liquidity Testing**
- [ ] Add liquidity to WFLR/USDT pool
- [ ] Adjust bin range and distribution
- [ ] View position on /positions page
- [ ] Remove partial liquidity
- [ ] Rebalance position to new range

**Limit Orders**
- [ ] Place a limit buy order below current price
- [ ] Place a limit sell order above current price
- [ ] Verify order appears as single-bin position

**FTSO Delegation**
- [ ] Wrap FLR to WFLR
- [ ] Delegate to FTSO provider
- [ ] Check delegation status
- [ ] Remove delegation

---

## Project Structure

```
helios-ui/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── page.tsx         # Home page with swap interface
│   │   ├── pools/           # Pools listing page
│   │   ├── positions/       # User positions page
│   │   └── analytics/       # Pool analytics page
│   ├── components/          # React components
│   │   ├── SwapCard.tsx     # Main swap interface
│   │   ├── LimitOrderCard.tsx
│   │   ├── AddLiquidityModal.tsx
│   │   ├── RemoveLiquidityModal.tsx
│   │   ├── RebalanceModal.tsx
│   │   └── FTSODelegation.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useSwap.ts       # Swap execution
│   │   ├── useQuote.ts      # Price quotes
│   │   ├── useLiquidity.ts  # Liquidity operations
│   │   └── useFTSODelegation.ts
│   ├── contracts/           # Contract ABIs
│   └── config/              # Configuration files
└── public/                  # Static assets
```

---

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Links

- **App**: [https://app.heliosdex.io](https://app.heliosdex.io)
- **Flare Network**: [https://flare.network](https://flare.network)
- **Flare Docs**: [https://docs.flare.network](https://docs.flare.network)

---

<p align="center">
  Built on Flare Network
</p>
