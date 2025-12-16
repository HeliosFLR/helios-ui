'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Activity, Flame, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react'
import { PriceChart } from '@/components/PriceChart'
import { PoolAnalytics } from '@/components/PoolAnalytics'
import { TOKENS, POOLS } from '@/config/contracts'
import { TokenIcon } from '@/components/TokenSelector'
import { cn } from '@/lib/utils'

// Mock price data for tokens (in production, fetch from FTSO)
const TOKEN_PRICES: Record<string, { price: number; change24h: number }> = {
  WFLR: { price: 0.0215, change24h: 3.45 },
  USDT: { price: 1.0001, change24h: 0.02 },
  USDC: { price: 0.9998, change24h: -0.01 },
  sFLR: { price: 0.0228, change24h: 4.12 },
}

export default function AnalyticsPage() {
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])

  const priceData = TOKEN_PRICES[selectedToken.symbol] || { price: 1, change24h: 0 }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative mb-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-amber-500/10 via-orange-500/5 to-transparent blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
                <BarChart3 className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Analytics <span className="text-amber-500">Dashboard</span>
              </h1>
            </div>
            <p className="text-zinc-500 max-w-md">
              Real-time charts and analytics powered by Flare FTSO oracles
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats - Real data only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Network"
          value="Coston2"
          change={0}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Status"
          value="Testnet"
          change={0}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Active Pools"
          value={POOLS.length.toString()}
          change={0}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <StatCard
          label="Price Source"
          value="FTSO"
          change={0}
          icon={<Flame className="h-5 w-5" />}
        />
      </div>

      {/* Token Selector and Price Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Token List */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500 animate-fire-flicker" />
            Token Prices
          </h3>
          <div className="space-y-2">
            {TOKENS.map((token) => {
              const price = TOKEN_PRICES[token.symbol] || { price: 0, change24h: 0 }
              const isSelected = selectedToken.address === token.address
              const isPositive = price.change24h >= 0

              return (
                <button
                  key={token.address}
                  onClick={() => setSelectedToken(token)}
                  className={cn(
                    'w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200',
                    isSelected
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={token.symbol} />
                    <div className="text-left">
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-zinc-500">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">
                      ${price.price.toFixed(price.price < 1 ? 4 : 2)}
                    </div>
                    <div className={cn(
                      'text-xs flex items-center justify-end gap-0.5',
                      isPositive ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(price.change24h).toFixed(2)}%
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Price Chart */}
        <div className="lg:col-span-2">
          <PriceChart
            tokenSymbol={selectedToken.symbol}
            currentPrice={priceData.price}
            priceChange24h={priceData.change24h}
          />
        </div>
      </div>

      {/* Pool Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-amber-500" />
          Pool Analytics
        </h2>
        <PoolAnalytics />
      </div>

      {/* Top Trading Pairs */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          Top Trading Pairs (24h)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-white/5">
                <th className="text-left pb-3">Pair</th>
                <th className="text-right pb-3">Price</th>
                <th className="text-right pb-3">24h Change</th>
                <th className="text-right pb-3">Volume</th>
                <th className="text-right pb-3">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {POOLS.map((pool) => {
                return (
                  <tr key={pool.address} className="hover:bg-white/[0.02]">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex -space-x-2">
                          <div className="relative z-10 ring-2 ring-zinc-900 rounded-full">
                            <TokenIcon symbol={pool.tokenX.symbol} size="sm" />
                          </div>
                          <div className="relative ring-2 ring-zinc-900 rounded-full">
                            <TokenIcon symbol={pool.tokenY.symbol} size="sm" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {pool.tokenX.symbol}/{pool.tokenY.symbol}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {pool.binStep / 100}% fee
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-white font-mono">
                        {(TOKEN_PRICES[pool.tokenX.symbol]?.price || 0.02).toFixed(4)}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-zinc-500 text-sm">
                        Testnet
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-zinc-500 text-sm">Testnet</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-zinc-500 text-xs">Live on mainnet</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string
  value: string
  change: number
  icon: React.ReactNode
}) {
  const isPositive = change >= 0

  return (
    <div className="glass-card rounded-2xl p-4 group">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {change !== 0 && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            isPositive ? 'text-emerald-500' : 'text-red-500'
          )}>
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-white stat-value">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  )
}
