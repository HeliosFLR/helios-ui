'use client'

import { useState, useMemo } from 'react'
import { usePoolsData } from '@/hooks/usePoolData'
import { TokenIcon } from './TokenSelector'
import { MiniPriceChart } from './PriceChart'
import { formatAmount, calculatePriceFromBinId, cn } from '@/lib/utils'
import { Activity, TrendingUp, TrendingDown, Droplets } from 'lucide-react'

interface BinData {
  id: number
  liquidity: number
  isActive: boolean
}

// Generate mock bin distribution data
function generateMockBinData(activeId: number, spread: number = 50): BinData[] {
  const bins: BinData[] = []
  const startBin = activeId - spread
  const endBin = activeId + spread

  for (let i = startBin; i <= endBin; i++) {
    // Bell curve distribution centered on active bin
    const distance = Math.abs(i - activeId)
    const baseLiquidity = Math.max(0, 100 - distance * 2)
    const randomFactor = 0.5 + Math.random()
    const liquidity = baseLiquidity * randomFactor

    bins.push({
      id: i,
      liquidity: Math.max(0, liquidity),
      isActive: i === activeId,
    })
  }

  return bins
}

export function PoolAnalytics() {
  const { pools, isLoading } = usePoolsData()
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0)

  const selectedPool = pools[selectedPoolIndex]
  const binData = useMemo(() => {
    if (!selectedPool || selectedPool.activeId <= 0) return []
    return generateMockBinData(selectedPool.activeId, 40)
  }, [selectedPool])

  const maxLiquidity = Math.max(...binData.map(b => b.liquidity), 1)

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-4 border-dune-400/20" />
            <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-dune-400 border-t-transparent animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-zinc-500">Loading pool data...</p>
      </div>
    )
  }

  if (!selectedPool) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Droplets className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-500">No pools available</p>
      </div>
    )
  }

  const price = selectedPool.activeId > 0
    ? calculatePriceFromBinId(
        selectedPool.activeId,
        selectedPool.binStep,
        selectedPool.tokenX.decimals,
        selectedPool.tokenY.decimals
      )
    : 0

  return (
    <div className="space-y-6">
      {/* Pool Selector */}
      <div className="flex flex-wrap gap-2">
        {pools.map((pool, index) => (
          <button
            key={pool.address}
            onClick={() => setSelectedPoolIndex(index)}
            className={cn(
              'px-4 py-2 rounded-xl flex items-center gap-2 transition-all',
              selectedPoolIndex === index
                ? 'bg-dune-400/20 border border-dune-400/40 text-dune-400'
                : 'bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
            )}
          >
            <div className="relative flex -space-x-1">
              <TokenIcon symbol={pool.tokenX.symbol} size="xs" />
              <TokenIcon symbol={pool.tokenY.symbol} size="xs" />
            </div>
            <span className="font-medium">
              {pool.tokenX.symbol}/{pool.tokenY.symbol}
            </span>
            <span className="text-xs opacity-60">{pool.binStep / 100}%</span>
          </button>
        ))}
      </div>

      {/* Pool Stats and Liquidity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pool Stats */}
        <div className="glass-card rounded-2xl p-5">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-dune-400" />
            Pool Statistics
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
              <span className="text-zinc-400">Current Price</span>
              <span className="font-mono text-white">
                1 {selectedPool.tokenX.symbol} = {price.toFixed(6)} {selectedPool.tokenY.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
              <span className="text-zinc-400">Active Bin ID</span>
              <span className="font-mono text-white flex items-center gap-2">
                {selectedPool.activeId}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
              <span className="text-zinc-400">Bin Step</span>
              <span className="font-mono text-white">{selectedPool.binStep} bps</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
              <span className="text-zinc-400">Base Fee</span>
              <span className="font-mono text-white">{selectedPool.binStep / 100}%</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400">Reserve X</span>
                <span className="font-mono text-white">
                  {formatAmount(selectedPool.reserveX, selectedPool.tokenX.decimals, 4)} {selectedPool.tokenX.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Reserve Y</span>
                <span className="font-mono text-white">
                  {formatAmount(selectedPool.reserveY, selectedPool.tokenY.decimals, 4)} {selectedPool.tokenY.symbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity Distribution Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-dune-400" />
            Liquidity Distribution
          </h4>

          <div className="relative h-48">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-zinc-500 w-12">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>

            {/* Chart */}
            <div className="ml-14 h-40 flex items-end gap-px overflow-hidden">
              {binData.map((bin) => (
                <div
                  key={bin.id}
                  className="flex-1 min-w-[2px] group relative"
                  style={{ height: '100%' }}
                >
                  <div
                    className={cn(
                      'absolute bottom-0 w-full rounded-t transition-all duration-200',
                      bin.isActive
                        ? 'bg-dune-400'
                        : bin.id < selectedPool.activeId
                        ? 'bg-emerald-500/60 group-hover:bg-emerald-500'
                        : 'bg-blue-500/60 group-hover:bg-blue-500'
                    )}
                    style={{
                      height: `${(bin.liquidity / maxLiquidity) * 100}%`,
                    }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs whitespace-nowrap">
                      <div className="text-white font-medium">Bin {bin.id}</div>
                      <div className="text-zinc-400">{bin.liquidity.toFixed(1)}% liq</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active bin indicator */}
            <div className="ml-14 flex justify-center mt-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500/60" />
                  <span className="text-zinc-500">{selectedPool.tokenY.symbol}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-dune-400" />
                  <span className="text-zinc-500">Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500/60" />
                  <span className="text-zinc-500">{selectedPool.tokenX.symbol}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume and Price History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VolumeCard
          label="24h Volume"
          value="$2,450"
          change={12.5}
          data={Array.from({ length: 24 }, () => Math.random() * 100)}
        />
        <VolumeCard
          label="7d Volume"
          value="$15,200"
          change={-3.2}
          data={Array.from({ length: 7 }, () => Math.random() * 100)}
        />
        <VolumeCard
          label="Total Fees (24h)"
          value="$24.50"
          change={8.7}
          data={Array.from({ length: 24 }, () => Math.random() * 100)}
        />
      </div>
    </div>
  )
}

function VolumeCard({
  label,
  value,
  change,
  data,
}: {
  label: string
  value: string
  change: number
  data: number[]
}) {
  const isPositive = change >= 0

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
        <div className={cn(
          'flex items-center gap-0.5 text-xs font-medium',
          isPositive ? 'text-emerald-500' : 'text-red-500'
        )}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <div className="text-xl font-bold text-white mb-3">{value}</div>
      <MiniPriceChart data={data} isPositive={isPositive} className="w-full h-8" />
    </div>
  )
}
