'use client'

import { Sun, Zap, Sparkles, Shield, TrendingUp, Flame, ArrowRight, ChevronDown, Layers, RefreshCw, Target, Wallet, BarChart3, Gift, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function DocsPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-dune-400/20 via-dune-500/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center pt-12 pb-16 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-dune-400/10 to-dune-500/10 border border-dune-400/20 mb-6">
            <Sun className="h-4 w-4 text-dune-400" />
            <span className="text-sm font-medium text-dune-300">Documentation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Welcome to </span>
            <span className="bg-gradient-to-r from-dune-300 via-dune-500 to-dune-400 bg-clip-text text-transparent">
              Helios DEX
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            The next-generation concentrated liquidity DEX on Flare Network.
            <span className="text-zinc-300"> Better prices. Lower slippage. Maximum efficiency.</span>
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-dune-400 to-dune-500 text-black font-bold hover:from-dune-300 hover:to-orange-400 transition-all duration-300 shadow-lg shadow-dune-400/25"
            >
              Launch App
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pools"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-800/80 border border-white/10 text-white font-medium hover:bg-zinc-700/80 hover:border-dune-400/30 transition-all"
            >
              View Pools
            </Link>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard value="0.15%" label="Min Spread" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard value="<1s" label="Finality" icon={<Zap className="h-5 w-5" />} />
          <StatCard value="100x" label="Capital Efficiency" icon={<Sparkles className="h-5 w-5" />} />
          <StatCard value="24/7" label="Trading" icon={<Clock className="h-5 w-5" />} />
        </div>
      </div>

      {/* What is Helios */}
      <Section
        badge="Overview"
        title="What is Helios?"
        description="Helios is a decentralized exchange built on Flare Network using Liquidity Book technology"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            icon={<Layers className="h-6 w-6" />}
            title="Concentrated Liquidity"
            description="Unlike traditional AMMs, Helios uses discrete price bins. Liquidity providers can concentrate capital in specific price ranges for up to 100x better capital efficiency."
            gradient="from-dune-400 to-yellow-500"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="FTSO Oracle Integration"
            description="Native integration with Flare Time Series Oracle provides accurate, decentralized price feeds for reliable trading and accurate price discovery."
            gradient="from-dune-500 to-dune-400"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Sub-Second Finality"
            description="Built on Flare Network fast consensus, trades confirm in under a second. No more waiting for block confirmations."
            gradient="from-red-500 to-dune-500"
          />
          <FeatureCard
            icon={<RefreshCw className="h-6 w-6" />}
            title="Auto-Compounding Fees"
            description="Trading fees earned by your liquidity position automatically compound, growing your position without any manual action required."
            gradient="from-dune-400 to-dune-500"
          />
        </div>
      </Section>

      {/* Trading Features */}
      <Section
        badge="Trading"
        title="Powerful Trading Tools"
        description="Everything you need for efficient token swaps"
      >
        <div className="space-y-4">
          <ExpandableCard
            icon={<ArrowRight className="h-5 w-5" />}
            title="Instant Swaps"
            preview="Swap tokens with real-time quotes and minimal slippage"
          >
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Real-time price quotes updated every block
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Automatic route optimization for best execution
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Price impact warnings for large trades
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Configurable slippage tolerance
              </li>
            </ul>
          </ExpandableCard>

          <ExpandableCard
            icon={<Target className="h-5 w-5" />}
            title="Limit Orders"
            preview="Set your price and let orders fill automatically"
          >
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Place buy orders below current market price
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Place sell orders above current market price
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Orders execute as single-bin liquidity positions
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Earn fees while waiting for your order to fill
              </li>
            </ul>
          </ExpandableCard>

          <ExpandableCard
            icon={<RefreshCw className="h-5 w-5" />}
            title="Multi-Hop Routing"
            preview="Automatic path finding across multiple pools"
          >
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Smart routing finds the best path for your trade
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Routes through multiple pools when beneficial
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Minimizes price impact on large trades
              </li>
            </ul>
          </ExpandableCard>
        </div>
      </Section>

      {/* Liquidity Provision */}
      <Section
        badge="Liquidity"
        title="Earn with Your Assets"
        description="Provide liquidity and earn trading fees"
      >
        <div className="space-y-4">
          <ExpandableCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Concentrated Positions"
            preview="Focus liquidity where it matters most"
          >
            <div className="space-y-4">
              <p className="text-zinc-400">
                Choose your price range and distribution strategy. Tighter ranges earn more fees but require more active management.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="text-dune-400 font-bold mb-1">Uniform</div>
                  <div className="text-xs text-zinc-500">Equal liquidity across all bins in range</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="text-dune-400 font-bold mb-1">Curve</div>
                  <div className="text-xs text-zinc-500">Concentrated around current price</div>
                </div>
              </div>
            </div>
          </ExpandableCard>

          <ExpandableCard
            icon={<RefreshCw className="h-5 w-5" />}
            title="Rebalancing"
            preview="Adjust positions as the market moves"
          >
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Move your liquidity to new price ranges
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                One-click rebalance from the positions page
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Keep earning fees as price moves
              </li>
            </ul>
          </ExpandableCard>

          <ExpandableCard
            icon={<Wallet className="h-5 w-5" />}
            title="Position Management"
            preview="Full control over your liquidity"
          >
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                View all positions on the Positions page
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                See your liquidity distribution across bins
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Remove partial or full liquidity anytime
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                Track your earned fees
              </li>
            </ul>
          </ExpandableCard>
        </div>
      </Section>

      {/* Flare Native */}
      <Section
        badge="Flare Native"
        title="Built for Flare"
        description="Take advantage of Flare Network unique features"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
              <Gift className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white mb-2 text-lg">FTSO Delegation</h3>
            <p className="text-sm text-zinc-400">
              Delegate your WFLR to FTSO providers and earn ~3-5% APR in rewards on top of trading fees.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-dune-400/10 to-dune-500/10 border border-dune-400/20">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-dune-400 to-dune-500 text-black mb-4">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white mb-2 text-lg">FlareDrops</h3>
            <p className="text-sm text-zinc-400">
              Eligible WFLR positions can receive FlareDrop distributions, adding to your overall yield.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white mb-2 text-lg">Oracle Security</h3>
            <p className="text-sm text-zinc-400">
              Native FTSO price feeds provide manipulation-resistant pricing for all supported assets.
            </p>
          </div>
        </div>
      </Section>

      {/* How Liquidity Book Works */}
      <Section
        badge="Technology"
        title="How Liquidity Book Works"
        description="Understanding the mechanics behind Helios"
      >
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
            <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-dune-400/20 flex items-center justify-center text-dune-400 text-sm font-bold">1</div>
              Price Bins
            </h3>
            <p className="text-zinc-400 mb-4">
              Liquidity is organized into discrete price bins. Each bin represents a specific price point, and liquidity can only be traded at that exact price.
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`shrink-0 w-12 rounded-lg ${i === 3 ? 'h-20 bg-gradient-to-t from-dune-400 to-dune-500' : 'h-12 bg-zinc-700'}`}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Active bin highlighted - this is where the current price resides</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
            <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-dune-400/20 flex items-center justify-center text-dune-400 text-sm font-bold">2</div>
              Bin Step
            </h3>
            <p className="text-zinc-400">
              The bin step determines the price increment between bins. Helios uses a 0.15% bin step (15 basis points), meaning each bin is 0.15% higher or lower than adjacent bins. Smaller steps mean more precision and tighter spreads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
            <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-dune-400/20 flex items-center justify-center text-dune-400 text-sm font-bold">3</div>
              Zero Slippage Within Bins
            </h3>
            <p className="text-zinc-400">
              Trades within a single bin have zero slippage - you get exactly the bin price. Slippage only occurs when a trade is large enough to move through multiple bins.
            </p>
          </div>
        </div>
      </Section>

      {/* Supported Assets */}
      <Section
        badge="Assets"
        title="Supported Tokens"
        description="Currently available on Coston2 Testnet"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TokenCard symbol="WFLR" name="Wrapped Flare" color="from-dune-400 to-dune-500" />
          <TokenCard symbol="sFLR" name="Staked Flare" color="from-purple-500 to-pink-500" />
          <TokenCard symbol="USDT" name="Tether USD" color="from-green-500 to-emerald-500" />
          <TokenCard symbol="USDC" name="USD Coin" color="from-blue-500 to-cyan-500" />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-dune-400/10 border border-dune-400/20">
          <p className="text-sm text-dune-200">
            <span className="font-bold">Testnet Mode:</span> Get test tokens from the faucet on the home page to try out all features risk-free.
          </p>
        </div>
      </Section>

      {/* Getting Started */}
      <Section
        badge="Quick Start"
        title="Get Started in Minutes"
        description="Four simple steps to start trading"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StepCard
            number={1}
            title="Connect Wallet"
            description="Click Connect and select your wallet. Make sure you are on Flare Network."
          />
          <StepCard
            number={2}
            title="Get Test Tokens"
            description="Use the faucet on the home page to mint testnet tokens."
          />
          <StepCard
            number={3}
            title="Start Trading"
            description="Swap tokens instantly or place limit orders at your target price."
          />
          <StepCard
            number={4}
            title="Provide Liquidity"
            description="Add liquidity to pools and start earning trading fees."
          />
        </div>
      </Section>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-dune-400/20 via-dune-500/10 to-transparent border border-dune-400/20 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-dune-400/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Flame className="h-12 w-12 text-dune-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Trade?
            </h2>
            <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
              Experience the future of decentralized trading on Flare Network.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-dune-400 to-dune-500 text-black font-bold hover:from-dune-300 hover:to-orange-400 transition-all duration-300 shadow-lg shadow-dune-400/25"
            >
              Launch App
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  badge,
  title,
  description,
  children,
}: {
  badge: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 mb-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-white/10 mb-4">
          <span className="text-xs font-medium text-dune-300">{badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-zinc-500 max-w-lg mx-auto">{description}</p>
      </div>
      {children}
    </div>
  )
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center">
      <div className="text-dune-400 mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-zinc-500">{label}</div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-dune-400/20 transition-all duration-300">
      <div className={`inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br ${gradient} text-black mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}

function ExpandableCard({
  icon,
  title,
  preview,
  children,
}: {
  icon: React.ReactNode
  title: string
  preview: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-dune-400/20 transition-all duration-300 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="p-2.5 rounded-xl bg-dune-400/10 text-dune-400 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-sm text-zinc-500 truncate">{preview}</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0">
          <div className="pt-4 border-t border-white/5">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function TokenCard({ symbol, name, color }: { symbol: string; name: string; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-center">
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} mx-auto mb-3 flex items-center justify-center text-white font-bold text-sm`}>
        {symbol.slice(0, 2)}
      </div>
      <div className="font-bold text-white">{symbol}</div>
      <div className="text-xs text-zinc-500">{name}</div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dune-400 to-dune-500 flex items-center justify-center text-black font-bold mb-3">
        {number}
      </div>
      <h3 className="font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}
