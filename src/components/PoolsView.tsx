'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ExternalLink, Droplets, TrendingUp, Plus, ChevronDown, ChevronUp, Flame, Sparkles, BarChart3, Waves, Gift } from 'lucide-react'
import { usePoolsData } from '@/hooks/usePoolData'
import { TokenIcon } from './TokenSelector'
import { AddLiquidityModal } from './AddLiquidityModal'
import { RemoveLiquidityModal } from './RemoveLiquidityModal'
import { CreatePoolModal } from './CreatePoolModal'
import { formatAmount, calculatePriceFromBinId, cn } from '@/lib/utils'
import type { Token } from '@/config/contracts'

interface PoolWithTokens {
  address: `0x${string}`
  tokenX: Token
  tokenY: Token
  binStep: number
  reserveX: bigint
  reserveY: bigint
  activeId: number
}

export function PoolsView() {
  const { isConnected } = useAccount()
  const { pools, isLoading } = usePoolsData()
  const [selectedPool, setSelectedPool] = useState<PoolWithTokens | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAddLiquidity = (pool: PoolWithTokens) => {
    setSelectedPool(pool)
    setIsAddModalOpen(true)
  }

  const handleRemoveLiquidity = (pool: PoolWithTokens) => {
    setSelectedPool(pool)
    setIsRemoveModalOpen(true)
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="relative mb-10">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-amber-500/10 via-orange-500/5 to-transparent blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Waves className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Liquidity <span className="text-amber-500">Pools</span>
              </h1>
            </div>
            <p className="text-zinc-500 max-w-md">
              Provide liquidity to earn trading fees. Powered by Liquidity Book technology.
            </p>
          </div>
          {isConnected && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-helios flex items-center gap-2 group"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              Create Pool
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Real data only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={<Droplets className="h-5 w-5" />}
          label="Total Pools"
          value={pools.length.toString()}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Network"
          value="Coston2"
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Status"
          value="Testnet"
        />
      </div>

      {/* Pools List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-amber-500 animate-fire-flicker" />
            <h2 className="text-lg font-semibold text-white">Active Pools</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {pools.length} pools available
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-amber-500/20" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              </div>
            </div>
            <p className="mt-6 text-zinc-500">Loading pools...</p>
          </div>
        ) : pools.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-zinc-800/50 mb-4">
              <Droplets className="h-8 w-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium mb-2">No pools found</p>
            <p className="text-zinc-600 text-sm">Create the first pool to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pools.map((pool, index) => (
              <PoolRow
                key={pool.address}
                pool={pool}
                index={index}
                onAddLiquidity={() => handleAddLiquidity(pool as PoolWithTokens)}
                onRemoveLiquidity={() => handleRemoveLiquidity(pool as PoolWithTokens)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Liquidity Modal */}
      {selectedPool && (
        <AddLiquidityModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          pool={selectedPool}
        />
      )}

      {/* Remove Liquidity Modal */}
      {selectedPool && (
        <RemoveLiquidityModal
          isOpen={isRemoveModalOpen}
          onClose={() => setIsRemoveModalOpen(false)}
          pool={selectedPool}
        />
      )}

      {/* Create Pool Modal */}
      <CreatePoolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  change,
  positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  change?: string
  positive?: boolean
}) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {change && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-lg',
            positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          )}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1 stat-value">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  )
}

interface PoolRowProps {
  pool: {
    address: `0x${string}`
    tokenX: { symbol: string; decimals: number; name: string; address: `0x${string}` }
    tokenY: { symbol: string; decimals: number; name: string; address: `0x${string}` }
    binStep: number
    reserveX: bigint
    reserveY: bigint
    activeId: number
  }
  index: number
  onAddLiquidity: () => void
  onRemoveLiquidity: () => void
}

function PoolRow({ pool, index, onAddLiquidity, onRemoveLiquidity }: PoolRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const price = pool.activeId > 0
    ? calculatePriceFromBinId(pool.activeId, pool.binStep, pool.tokenX.decimals, pool.tokenY.decimals)
    : 0

  const feePercent = pool.binStep / 100

  return (
    <div
      className="group animate-float-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-all duration-300"
      >
        {/* Pool Tokens */}
        <div className="flex items-center gap-4 min-w-[220px]">
          <div className="relative flex -space-x-3">
            <div className="relative z-10 ring-2 ring-zinc-900 rounded-full">
              <TokenIcon symbol={pool.tokenX.symbol} size="lg" />
            </div>
            <div className="relative ring-2 ring-zinc-900 rounded-full">
              <TokenIcon symbol={pool.tokenY.symbol} size="lg" />
            </div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="text-left">
            <div className="font-bold text-white group-hover:text-amber-500 transition-colors">
              {pool.tokenX.symbol}/{pool.tokenY.symbol}
            </div>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium">
                {feePercent}% fee
              </span>
              {(pool.tokenX.symbol === 'WFLR' || pool.tokenY.symbol === 'WFLR') && (
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  +Rewards
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TVL */}
        <div className="flex-1 text-left hidden sm:block">
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">TVL</div>
          <div className="text-white font-medium">
            {formatAmount(pool.reserveX, pool.tokenX.decimals)} {pool.tokenX.symbol}
          </div>
          <div className="text-zinc-500 text-sm">
            {formatAmount(pool.reserveY, pool.tokenY.decimals)} {pool.tokenY.symbol}
          </div>
        </div>

        {/* Price */}
        <div className="flex-1 text-left hidden md:block">
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Price</div>
          <div className="text-white font-mono">
            1 {pool.tokenX.symbol} = {price.toFixed(6)} {pool.tokenY.symbol}
          </div>
        </div>

        {/* APR Breakdown */}
        <div className="flex-1 text-left hidden lg:block">
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Est. APR</div>
          <div className="space-y-0.5">
            <div className="text-white font-bold text-lg">
              {(pool.tokenX.symbol === 'WFLR' || pool.tokenY.symbol === 'WFLR') ? '8-12%' : '2-5%'}
            </div>
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="text-amber-500">{feePercent}% fees</span>
              {(pool.tokenX.symbol === 'WFLR' || pool.tokenY.symbol === 'WFLR') && (
                <>
                  <span className="text-purple-400">+3-5% FTSO</span>
                  <span className="text-pink-400">+FlareDrops</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expand Icon */}
        <div className={cn(
          'p-2 rounded-xl transition-all duration-300',
          isExpanded ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 group-hover:text-white'
        )}>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-5 animate-float-up">
          <div className="p-5 rounded-2xl bg-zinc-800/30 border border-white/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Pool Address</div>
                <a
                  href={`https://coston2-explorer.flare.network/address/${pool.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400 flex items-center gap-1.5 text-sm font-mono group"
                >
                  {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                  <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Bin Step</div>
                <div className="text-white font-medium">{pool.binStep}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Reserve X</div>
                <div className="text-white font-mono">
                  {formatAmount(pool.reserveX, pool.tokenX.decimals, 6)} {pool.tokenX.symbol}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Reserve Y</div>
                <div className="text-white font-mono">
                  {formatAmount(pool.reserveY, pool.tokenY.decimals, 6)} {pool.tokenY.symbol}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddLiquidity()
                }}
                className="flex-1 btn-helios-secondary flex items-center justify-center gap-2 py-3"
              >
                <Plus className="h-4 w-4" />
                Add Liquidity
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveLiquidity()
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
              >
                <Droplets className="h-4 w-4" />
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
