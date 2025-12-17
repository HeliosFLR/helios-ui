'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useUserPositions, type UserPosition } from '@/hooks/useUserPositions'
import { TokenIcon } from './TokenSelector'
import { RemoveLiquidityModal } from './RemoveLiquidityModal'
import { AddLiquidityModal } from './AddLiquidityModal'
import { RebalanceModal } from './RebalanceModal'
import { calculatePriceFromBinId, cn, formatAmount } from '@/lib/utils'
import {
  Wallet,
  TrendingUp,
  Droplets,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ExternalLink,
  Activity,
  Sparkles,
  RefreshCw,
  Flame,
  Gift,
  DollarSign,
  Target,
  X,
} from 'lucide-react'
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

export function UserPositions() {
  const { isConnected } = useAccount()
  const { positions, isLoading, isFetching, hasPositions, refetch } = useUserPositions()
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false)

  if (!isConnected) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-dune-400/20 to-dune-500/20 mb-4">
          <Wallet className="h-8 w-8 text-dune-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
        <p className="text-zinc-500 text-sm">
          Connect your wallet to view your liquidity positions
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-dune-400/20" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-dune-400 border-t-transparent animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-zinc-500">Loading your positions...</p>
      </div>
    )
  }

  if (!hasPositions) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-zinc-800/50 mb-4">
          <Droplets className="h-8 w-8 text-zinc-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Positions Found</h3>
        <p className="text-zinc-500 text-sm mb-4">
          You don&apos;t have any liquidity positions yet
        </p>
        <a
          href="/pools"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-dune-400 to-dune-500 text-black font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Liquidity
        </a>
      </div>
    )
  }

  const handleAddLiquidity = (position: UserPosition) => {
    setSelectedPosition(position)
    setIsAddModalOpen(true)
  }

  const handleRemoveLiquidity = (position: UserPosition) => {
    setSelectedPosition(position)
    setIsRemoveModalOpen(true)
  }

  const handleRebalance = (position: UserPosition) => {
    setSelectedPosition(position)
    setIsRebalanceModalOpen(true)
  }

  // Convert position to modal format
  const getPoolForModal = (position: UserPosition | null): PoolWithTokens | null => {
    if (!position) return null
    return {
      address: position.poolAddress,
      tokenX: position.tokenX,
      tokenY: position.tokenY,
      binStep: position.binStep,
      reserveX: BigInt(0), // Not needed for modal
      reserveY: BigInt(0),
      activeId: position.activeId,
    }
  }

  // Separate limit orders (single-bin positions) from LP positions (multi-bin)
  const limitOrders = positions.filter(p => p.bins.length === 1)
  const lpPositions = positions.filter(p => p.bins.length > 1)

  return (
    <div className="space-y-6">
      {/* Refresh indicator */}
      {isFetching && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-500">
          <RefreshCw className="h-3 w-3 animate-spin text-dune-400" />
          <span>Refreshing positions...</span>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-dune-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">LP Positions</span>
          </div>
          <div className="text-2xl font-bold text-white">{lpPositions.length}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Limit Orders</span>
          </div>
          <div className="text-2xl font-bold text-white">{limitOrders.length}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Active Bins</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {positions.reduce((acc, p) => acc + p.bins.length, 0)}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-dune-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Pools</span>
          </div>
          <div className="text-2xl font-bold text-white">{new Set(positions.map(p => p.poolAddress)).size}</div>
        </div>
      </div>

      {/* Limit Orders Section */}
      {limitOrders.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <Target className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-white">Active Limit Orders</h3>
            <span className="text-xs text-zinc-500">({limitOrders.length})</span>
          </div>
          <div className="divide-y divide-white/5">
            {limitOrders.map((order) => (
              <LimitOrderRow
                key={`${order.poolAddress}-${order.bins[0]?.binId}`}
                order={order}
                onCancel={() => handleRemoveLiquidity(order)}
              />
            ))}
          </div>
        </div>
      )}

      {/* LP Position Cards */}
      {lpPositions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-dune-400" />
            <h3 className="font-semibold text-white">Liquidity Positions</h3>
          </div>
          {lpPositions.map((position) => (
            <PositionCard
              key={position.poolAddress}
              position={position}
              onAddLiquidity={() => handleAddLiquidity(position)}
              onRemoveLiquidity={() => handleRemoveLiquidity(position)}
              onRebalance={() => handleRebalance(position)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedPosition && (
        <>
          <AddLiquidityModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            pool={getPoolForModal(selectedPosition)!}
          />
          <RemoveLiquidityModal
            isOpen={isRemoveModalOpen}
            onClose={() => setIsRemoveModalOpen(false)}
            pool={getPoolForModal(selectedPosition)!}
          />
          <RebalanceModal
            isOpen={isRebalanceModalOpen}
            onClose={() => setIsRebalanceModalOpen(false)}
            position={{
              poolAddress: selectedPosition.poolAddress,
              tokenX: selectedPosition.tokenX,
              tokenY: selectedPosition.tokenY,
              binStep: selectedPosition.binStep,
              activeId: selectedPosition.activeId,
              bins: selectedPosition.bins.map(b => ({
                binId: b.binId,
                share: b.share,
                isActive: b.isActive,
                liquidity: b.liquidity,
              })),
            }}
            onSuccess={() => refetch?.()}
          />
        </>
      )}
    </div>
  )
}

function PositionCard({
  position,
  onAddLiquidity,
  onRemoveLiquidity,
  onRebalance,
}: {
  position: UserPosition
  onAddLiquidity: () => void
  onRemoveLiquidity: () => void
  onRebalance: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const price = position.activeId > 0
    ? calculatePriceFromBinId(
        position.activeId,
        position.binStep,
        position.tokenX.decimals,
        position.tokenY.decimals
      )
    : 0

  const minBin = Math.min(...position.bins.map(b => b.binId))
  const maxBin = Math.max(...position.bins.map(b => b.binId))

  // Calculate price range from bin IDs
  const minPrice = calculatePriceFromBinId(
    minBin,
    position.binStep,
    position.tokenX.decimals,
    position.tokenY.decimals
  )
  const maxPrice = calculatePriceFromBinId(
    maxBin,
    position.binStep,
    position.tokenX.decimals,
    position.tokenY.decimals
  )

  // Check if position is in range
  const inRange = position.bins.some(b => b.isActive)

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-all"
      >
        {/* Pool Info */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="relative flex -space-x-3">
            <div className="relative z-10 ring-2 ring-zinc-900 rounded-full">
              <TokenIcon symbol={position.tokenX.symbol} size="lg" />
            </div>
            <div className="relative ring-2 ring-zinc-900 rounded-full">
              <TokenIcon symbol={position.tokenY.symbol} size="lg" />
            </div>
          </div>
          <div className="text-left">
            <div className="font-bold text-white">
              {position.tokenX.symbol}/{position.tokenY.symbol}
            </div>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-dune-400/10 text-dune-400 text-xs font-medium">
                {position.binStep / 100}% fee
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-lg text-xs font-medium',
                inRange
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500'
              )}>
                {inRange ? 'In Range' : 'Out of Range'}
              </span>
              {(position.tokenX.symbol === 'WFLR' || position.tokenY.symbol === 'WFLR') && (
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  +Rewards
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Position Stats */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 text-left hidden sm:grid">
          {/* Position Value - Most Important */}
          <div>
            <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Position Value
            </div>
            <div className="text-white font-bold text-lg">
              {formatAmount(position.totalAmountX, position.tokenX.decimals, 2)} {position.tokenX.symbol}
            </div>
            <div className="text-zinc-400 text-sm">
              {formatAmount(position.totalAmountY, position.tokenY.decimals, 2)} {position.tokenY.symbol}
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Price Range</div>
            <div className="text-white font-mono text-sm">
              {minPrice.toFixed(4)} - {maxPrice.toFixed(4)}
            </div>
            <div className="text-xs text-zinc-600">
              {position.bins.length} bins
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-xs text-zinc-500 mb-1">Current Price</div>
            <div className="text-white font-mono text-sm">
              {price.toFixed(4)}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-xs text-zinc-500 mb-1">Bin IDs</div>
            <div className="text-zinc-400 font-mono text-xs">
              {minBin} - {maxBin}
            </div>
          </div>
        </div>

        {/* Expand */}
        <div className={cn(
          'p-2 rounded-xl transition-all',
          isExpanded ? 'bg-dune-400/10 text-dune-400' : 'text-zinc-500'
        )}>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 animate-float-up">
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5">
            {/* Bin Visualization */}
            <div className="mb-4">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                Liquidity Distribution
              </div>
              <BinVisualization position={position} />
            </div>

            {/* Bin Details */}
            <div className="mb-4">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                Your Bins ({position.bins.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {position.bins.map((bin) => {
                  const binPrice = calculatePriceFromBinId(
                    bin.binId,
                    position.binStep,
                    position.tokenX.decimals,
                    position.tokenY.decimals
                  )
                  return (
                    <div
                      key={bin.binId}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg text-sm',
                        bin.isActive ? 'bg-dune-400/10 border border-dune-400/20' : 'bg-zinc-800/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-white">@ {binPrice.toFixed(4)}</span>
                          <span className="font-mono text-zinc-600 text-xs">Bin #{bin.binId}</span>
                        </div>
                        {bin.isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-dune-400/20 text-dune-400 text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">
                          {formatAmount(bin.amountX, position.tokenX.decimals, 4)} {position.tokenX.symbol}
                        </div>
                        <div className="text-zinc-500 text-xs">
                          {formatAmount(bin.amountY, position.tokenY.decimals, 4)} {position.tokenY.symbol}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pool Link */}
            <div className="mb-4">
              <a
                href={`https://coston2-explorer.flare.network/address/${position.poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dune-400 hover:text-dune-300 flex items-center gap-1"
              >
                View Pool Contract
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {/* Rebalance Button - Highlighted if out of range */}
              <button
                onClick={onRebalance}
                className={cn(
                  "flex-1 min-w-[140px] py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                  inRange
                    ? "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 border border-zinc-600"
                    : "bg-gradient-to-r from-dune-400 to-dune-500 text-black hover:opacity-90 animate-pulse-glow"
                )}
              >
                <RefreshCw className={cn("h-4 w-4", !inRange && "animate-spin-slow")} />
                Rebalance
                {!inRange && <Flame className="h-4 w-4 animate-fire-flicker" />}
              </button>
              <button
                onClick={onAddLiquidity}
                className="flex-1 min-w-[100px] btn-helios-secondary flex items-center justify-center gap-2 py-3"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
              <button
                onClick={onRemoveLiquidity}
                className="flex-1 min-w-[100px] py-3 px-4 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
              >
                <Minus className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BinVisualization({ position }: { position: UserPosition }) {
  const minBin = Math.min(...position.bins.map(b => b.binId))
  const maxBin = Math.max(...position.bins.map(b => b.binId))

  // Create visualization bins
  const vizBins = []
  for (let binId = minBin; binId <= maxBin; binId++) {
    const bin = position.bins.find(b => b.binId === binId)
    vizBins.push({
      binId,
      hasLiquidity: !!bin,
      isActive: binId === position.activeId,
    })
  }

  return (
    <div className="flex items-end gap-px h-16 overflow-hidden">
      {vizBins.map((bin) => (
        <div
          key={bin.binId}
          className="flex-1 min-w-[3px] flex flex-col justify-end h-full"
        >
          <div
            className={cn(
              'w-full rounded-t transition-all',
              bin.hasLiquidity
                ? bin.isActive
                  ? 'bg-dune-400 h-full'
                  : bin.binId < position.activeId
                  ? 'bg-emerald-500/60 h-3/4'
                  : 'bg-blue-500/60 h-3/4'
                : 'bg-zinc-700/30 h-1/4'
            )}
          />
          {bin.isActive && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-dune-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Limit Order Row Component
function LimitOrderRow({
  order,
  onCancel,
}: {
  order: UserPosition
  onCancel: () => void
}) {
  const bin = order.bins[0]
  if (!bin) return null

  const triggerPrice = calculatePriceFromBinId(
    bin.binId,
    order.binStep,
    order.tokenX.decimals,
    order.tokenY.decimals
  )

  const currentPrice = calculatePriceFromBinId(
    order.activeId,
    order.binStep,
    order.tokenX.decimals,
    order.tokenY.decimals
  )

  // Determine order type based on bin position relative to active
  const isBuyOrder = bin.binId < order.activeId
  const priceDiff = ((triggerPrice - currentPrice) / currentPrice * 100).toFixed(2)

  // Calculate how far from trigger
  const binsAway = Math.abs(bin.binId - order.activeId)

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-all">
      {/* Order Type */}
      <div className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-bold uppercase',
        isBuyOrder
          ? 'bg-emerald-500/20 text-emerald-500'
          : 'bg-red-500/20 text-red-400'
      )}>
        {isBuyOrder ? 'Buy' : 'Sell'}
      </div>

      {/* Pair */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex -space-x-2">
          <TokenIcon symbol={order.tokenX.symbol} size="sm" />
          <TokenIcon symbol={order.tokenY.symbol} size="sm" />
        </div>
        <span className="text-sm text-white font-medium">
          {order.tokenX.symbol}/{order.tokenY.symbol}
        </span>
      </div>

      {/* Trigger Price */}
      <div className="flex-1">
        <div className="text-xs text-zinc-500 mb-0.5">Trigger Price</div>
        <div className="text-white font-mono text-sm">{triggerPrice.toFixed(6)}</div>
        <div className="text-xs text-zinc-600">
          {parseFloat(priceDiff) >= 0 ? '+' : ''}{priceDiff}% from current
        </div>
      </div>

      {/* Amount */}
      <div className="flex-1 text-right">
        <div className="text-xs text-zinc-500 mb-0.5">Amount</div>
        <div className="text-white font-mono text-sm">
          {formatAmount(order.totalAmountX, order.tokenX.decimals, 4)} {order.tokenX.symbol}
        </div>
        <div className="text-zinc-500 font-mono text-xs">
          {formatAmount(order.totalAmountY, order.tokenY.decimals, 4)} {order.tokenY.symbol}
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <div className={cn(
          'px-2 py-1 rounded-lg text-xs font-medium',
          binsAway <= 5
            ? 'bg-dune-400/20 text-dune-400'
            : 'bg-zinc-800 text-zinc-400'
        )}>
          {binsAway <= 5 ? 'Near trigger' : `${binsAway} bins away`}
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        title="Cancel order"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
