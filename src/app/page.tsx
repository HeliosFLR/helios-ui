import { TradeTabs } from "@/components/TradeTabs";
import { TokenFaucet } from "@/components/TokenFaucet";
import { Sun, Sparkles, Shield, Zap, TrendingUp, Flame, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center">
      {/* Animated Sun Rays Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-dune-400/10 via-dune-500/5 to-transparent rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute inset-[20%] bg-gradient-radial from-dune-400/20 to-transparent rounded-full blur-2xl" />
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12 relative z-10 pt-8">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-dune-400/10 to-dune-500/10 border border-dune-400/20 mb-8 animate-float-up backdrop-blur-sm">
          <div className="relative">
            <Sun className="h-4 w-4 text-dune-400" />
            <div className="absolute inset-0 animate-ping">
              <Sun className="h-4 w-4 text-dune-400 opacity-50" />
            </div>
          </div>
          <span className="text-sm font-medium bg-gradient-to-r from-dune-300 to-dune-400 bg-clip-text text-transparent">
            Powered by Flare Network
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-white">Trade with </span>
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-dune-300 via-dune-500 to-dune-400 bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto]">
              Helios
            </span>
            <Flame className="absolute -top-2 -right-6 h-6 w-6 text-dune-400 animate-fire-flicker" />
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          The concentrated liquidity DEX on Flare.{" "}
          <span className="text-zinc-300">Better prices, lower slippage,</span>{" "}
          powered by native oracle feeds.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Link
            href="/pools"
            className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-800/80 border border-white/10 text-white font-medium hover:bg-zinc-700/80 hover:border-dune-400/30 transition-all duration-300"
          >
            <TrendingUp className="h-5 w-5 text-dune-400" />
            View Pools
            <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Learn More
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Trade Card with Glow Effect */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Glow behind card */}
        <div className="absolute inset-0 bg-gradient-to-b from-dune-400/20 via-dune-500/10 to-transparent blur-3xl -z-10 scale-150" />
        <TradeTabs />

        {/* Faucet Button */}
        <div className="mt-4 flex justify-center">
          <TokenFaucet />
        </div>
      </div>

      {/* Testnet Guide */}
      <div className="mt-8 w-full max-w-md mx-auto px-4">
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-dune-400/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-dune-400" />
            <span className="text-sm font-medium text-dune-400">Testnet Guide</span>
          </div>
          <div className="space-y-2">
            <TestStep number={1} text="Get test tokens from the faucet above" />
            <TestStep number={2} text="Swap USDC ↔ USDT (recommended pair)" />
            <TestStep number={3} text="Add liquidity to USDC/USDT pool" />
            <TestStep number={4} text="View & manage positions" />
            <TestStep number={5} text="Try rebalancing your position" />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Note: WFLR/USDT pool has limited functionality due to decimal mismatch.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 w-full max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Why <span className="text-dune-400">Helios</span>?
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Built on Flare Network with cutting-edge DeFi technology
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Lightning Fast"
            description="Sub-second finality on Flare Network ensures instant trades"
            gradient="from-dune-400 to-yellow-500"
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Concentrated Liquidity"
            description="Liquidity Book technology for capital-efficient trading"
            gradient="from-dune-500 to-dune-400"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="FTSO Powered"
            description="Native oracle price feeds for accurate, reliable pricing"
            gradient="from-red-500 to-dune-500"
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Low Fees"
            description="Competitive trading fees with flexible bin steps"
            gradient="from-dune-400 to-dune-500"
          />
        </div>
      </div>

      {/* Stats Section - Coming on Mainnet */}
      <div className="mt-20 w-full max-w-4xl mx-auto px-4">
        <div className="glass-card rounded-3xl p-8">
          <div className="text-center">
            <p className="text-zinc-500 text-sm mb-2">Currently on Coston2 Testnet</p>
            <p className="text-zinc-400">
              Real statistics will be available on <span className="text-dune-400 font-medium">Flare Mainnet</span> launch
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 mb-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-dune-400/10 to-dune-500/10 border border-dune-400/20">
          <Flame className="h-5 w-5 text-dune-400 animate-fire-flicker" />
          <span className="text-zinc-400">
            Built for <span className="text-white font-medium">Flare Network</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-dune-400/20 transition-all duration-300 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-dune-400/5">
      <div className={`inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br ${gradient} text-black mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function TestStep({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-dune-400/20 text-dune-400 text-xs font-bold shrink-0">
        {number}
      </div>
      <span className="text-sm text-zinc-300">{text}</span>
    </div>
  );
}

