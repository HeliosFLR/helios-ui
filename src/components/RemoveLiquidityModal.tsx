'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { X, Loader2, AlertCircle, CheckCircle2, Minus } from 'lucide-react'
import { TokenIcon } from './TokenSelector'
import { useUserPositions, useRemoveLiquidity, useApproveForAll, useLBPairApproval } from '@/hooks/useLiquidity'
import { CONTRACTS, type Token } from '@/config/contracts'
import { formatAmount, cn } from '@/lib/utils'

interface Pool {
  address: `0x${string}`
  tokenX: Token
  tokenY: Token
  binStep: number
  activeId?: number
}

interface RemoveLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
  pool: Pool
}

export function RemoveLiquidityModal({ isOpen, onClose, pool }: RemoveLiquidityModalProps) {
  const { address, isConnected } = useAccount()
  const [percentage, setPercentage] = useState(100)

  const { positions, totalLiquidityX, totalLiquidityY, isLoading: positionsLoading, refetch: refetchPositions } = useUserPositions(
    pool.address,
    pool.activeId || 0
  )

  const { isApproved, refetch: refetchApproval } = useLBPairApproval(pool.address)
  const { approveForAll, isPending: isApproving, isSuccess: approveSuccess } = useApproveForAll()
  const {
    removeLiquidity,
    isPending: isRemoving,
    isConfirming,
    isSuccess: removeSuccess,
    error: removeError
  } = useRemoveLiquidity()

  // Calculate amounts to remove based on percentage
  const amountXToRemove = (totalLiquidityX * BigInt(percentage)) / BigInt(100)
  const amountYToRemove = (totalLiquidityY * BigInt(percentage)) / BigInt(100)

  // Get positions to remove (scaled by percentage)
  const positionsToRemove = positions.map(pos => ({
    id: pos.id,
    amount: (pos.balance * BigInt(percentage)) / BigInt(100)
  })).filter(pos => pos.amount > BigInt(0))

  // Refetch approval after successful approval
  useEffect(() => {
    if (approveSuccess) {
      refetchApproval()
    }
  }, [approveSuccess, refetchApproval])

  // Refetch positions after successful removal
  useEffect(() => {
    if (removeSuccess) {
      refetchPositions()
      setPercentage(100)
    }
  }, [removeSuccess, refetchPositions])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPercentage(100)
    }
  }, [isOpen])

  const handleApprove = async () => {
    await approveForAll(pool.address, CONTRACTS.LB_ROUTER)
  }

  const handleRemoveLiquidity = async () => {
    if (!address || positionsToRemove.length === 0) return

    await removeLiquidity({
      tokenX: pool.tokenX.address,
      tokenY: pool.tokenY.address,
      binStep: pool.binStep,
      amountXMin: (amountXToRemove * BigInt(95)) / BigInt(100), // 5% slippage
      amountYMin: (amountYToRemove * BigInt(95)) / BigInt(100),
      ids: positionsToRemove.map(p => p.id),
      amounts: positionsToRemove.map(p => p.amount),
      to: address,
    })
  }

  if (!isOpen) return null

  const hasPosition = positions.length > 0 && (totalLiquidityX > BigInt(0) || totalLiquidityY > BigInt(0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <Minus className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Remove Liquidity</h3>
              <p className="text-sm text-zinc-500">
                {pool.tokenX.symbol}/{pool.tokenY.symbol} - {pool.binStep / 100}% fee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {positionsLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-dune-400 mx-auto" />
              <p className="mt-4 text-zinc-500">Loading your positions...</p>
            </div>
          ) : !hasPosition ? (
            <div className="py-12 text-center">
              <p className="text-zinc-400">You don&apos;t have any liquidity in this pool.</p>
              <p className="text-sm text-zinc-500 mt-2">Add liquidity first to see your positions.</p>
            </div>
          ) : (
            <>
              {/* Current Position */}
              <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
                <h4 className="text-sm text-zinc-400 mb-3">Your Position</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={pool.tokenX.symbol} />
                      <span className="text-white font-medium">{pool.tokenX.symbol}</span>
                    </div>
                    <span className="text-white font-mono">
                      {formatAmount(totalLiquidityX, pool.tokenX.decimals, 6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={pool.tokenY.symbol} />
                      <span className="text-white font-medium">{pool.tokenY.symbol}</span>
                    </div>
                    <span className="text-white font-mono">
                      {formatAmount(totalLiquidityY, pool.tokenY.decimals, 6)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-zinc-500">
                    Active in {positions.length} bin{positions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Percentage Selector */}
              <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-400">Amount to Remove</span>
                  <span className="text-2xl font-bold text-white">{percentage}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between mt-3 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setPercentage(pct)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                        percentage === pct
                          ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                          : 'bg-zinc-700/50 text-zinc-400 border border-transparent hover:bg-zinc-700'
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount to Receive */}
              <div className="p-4 rounded-2xl bg-zinc-800/30 border border-white/5">
                <h4 className="text-sm text-zinc-400 mb-3">You Will Receive</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={pool.tokenX.symbol} />
                      <span className="text-white font-medium">{pool.tokenX.symbol}</span>
                    </div>
                    <span className="text-white font-mono text-lg">
                      {formatAmount(amountXToRemove, pool.tokenX.decimals, 6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={pool.tokenY.symbol} />
                      <span className="text-white font-medium">{pool.tokenY.symbol}</span>
                    </div>
                    <span className="text-white font-mono text-lg">
                      {formatAmount(amountYToRemove, pool.tokenY.decimals, 6)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!isConnected ? (
                  <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800 text-zinc-500 text-center font-medium">
                    Connect wallet to remove liquidity
                  </div>
                ) : !isApproved ? (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className={cn(
                      'w-full py-4 px-6 rounded-2xl font-semibold transition-all',
                      'bg-red-500 hover:bg-red-400 text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isApproving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Approving...
                      </span>
                    ) : (
                      'Approve LP Tokens'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleRemoveLiquidity}
                    disabled={isRemoving || isConfirming || positionsToRemove.length === 0}
                    className={cn(
                      'w-full py-4 px-6 rounded-2xl font-semibold transition-all',
                      'bg-gradient-to-r from-red-500 to-dune-500 hover:from-red-400 hover:to-orange-400 text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isRemoving || isConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isConfirming ? 'Confirming...' : 'Removing Liquidity...'}
                      </span>
                    ) : (
                      `Remove ${percentage}% Liquidity`
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Status Messages */}
          {removeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-400 text-sm">Liquidity removed successfully!</span>
            </div>
          )}

          {removeError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-400 text-sm">Failed to remove liquidity. Please try again.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
