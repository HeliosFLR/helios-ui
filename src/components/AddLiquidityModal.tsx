'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { X, Loader2, AlertCircle, CheckCircle2, Droplets, Sparkles, AlertTriangle } from 'lucide-react'
import { TokenIcon } from './TokenSelector'
import { useTokenBalance, useTokenAllowance } from '@/hooks/useTokenBalance'
import { useAddLiquidity, useApprove } from '@/hooks/useSwap'
import { CONTRACTS, type Token } from '@/config/contracts'
import { formatAmount, parseAmount, cn, calculatePriceFromBinId } from '@/lib/utils'
import { useXP } from './GamificationBar'

interface Pool {
  address: `0x${string}`
  tokenX: Token
  tokenY: Token
  binStep: number
  activeId?: number
}

interface AddLiquidityModalProps {
  isOpen: boolean
  onClose: () => void
  pool: Pool
}

export function AddLiquidityModal({ isOpen, onClose, pool }: AddLiquidityModalProps) {
  const { isConnected } = useAccount()
  const [amountX, setAmountX] = useState('')
  const [amountY, setAmountY] = useState('')
  const [binRange, setBinRange] = useState(5) // +/- bins from active
  const [distribution, setDistribution] = useState<'uniform' | 'curve'>('uniform')
  const [xpEarned, setXpEarned] = useState(0)

  const { recordAddLiquidityXP } = useXP()

  // Calculate pool price from active bin
  const poolPrice = pool.activeId
    ? calculatePriceFromBinId(pool.activeId, pool.binStep, pool.tokenX.decimals, pool.tokenY.decimals)
    : 1

  // Auto-populate the other token amount when one changes
  const handleAmountXChange = (value: string) => {
    setAmountX(value)

    // Calculate corresponding Y amount based on pool price
    if (value && poolPrice > 0) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        const calculatedY = numValue * poolPrice
        setAmountY(calculatedY.toFixed(6).replace(/\.?0+$/, ''))
      } else {
        setAmountY('')
      }
    } else {
      setAmountY('')
    }
  }

  const handleAmountYChange = (value: string) => {
    setAmountY(value)

    // Calculate corresponding X amount based on pool price
    if (value && poolPrice > 0) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        const calculatedX = numValue / poolPrice
        setAmountX(calculatedX.toFixed(6).replace(/\.?0+$/, ''))
      } else {
        setAmountX('')
      }
    } else {
      setAmountX('')
    }
  }

  const { balance: balanceX, refetch: refetchBalanceX } = useTokenBalance(pool.tokenX.address)
  const { balance: balanceY, refetch: refetchBalanceY } = useTokenBalance(pool.tokenY.address)

  const { allowance: allowanceX, refetch: refetchAllowanceX } = useTokenAllowance(
    pool.tokenX.address,
    CONTRACTS.LB_ROUTER
  )
  const { allowance: allowanceY, refetch: refetchAllowanceY } = useTokenAllowance(
    pool.tokenY.address,
    CONTRACTS.LB_ROUTER
  )

  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApprove()
  const {
    addLiquidity,
    isPending: isAddingLiquidity,
    isConfirming,
    isSuccess: addLiquiditySuccess,
    error: addLiquidityError
  } = useAddLiquidity()

  const parsedAmountX = parseAmount(amountX, pool.tokenX.decimals)
  const parsedAmountY = parseAmount(amountY, pool.tokenY.decimals)

  const needsApprovalX = parsedAmountX > BigInt(0) && parsedAmountX > allowanceX
  const needsApprovalY = parsedAmountY > BigInt(0) && parsedAmountY > allowanceY

  const insufficientBalanceX = parsedAmountX > balanceX
  const insufficientBalanceY = parsedAmountY > balanceY

  // Check for decimal mismatch - pools with different decimals have known issues
  const hasDecimalMismatch = pool.tokenX.decimals !== pool.tokenY.decimals

  // Refetch allowances after approval
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowanceX()
      refetchAllowanceY()
    }
  }, [approveSuccess, refetchAllowanceX, refetchAllowanceY])

  // Reset and refetch after successful liquidity add
  useEffect(() => {
    if (addLiquiditySuccess) {
      // Record XP for adding liquidity
      // Estimate USD value based on tokens
      const estimateUSDValue = () => {
        const amtX = parseFloat(amountX) || 0
        const amtY = parseFloat(amountY) || 0
        let totalUSD = 0
        // Rough estimates for testnet
        if (pool.tokenX.symbol === 'USDT' || pool.tokenX.symbol === 'USDC') totalUSD += amtX
        else if (pool.tokenX.symbol === 'WFLR' || pool.tokenX.symbol === 'sFLR') totalUSD += amtX * 0.02
        else totalUSD += amtX
        if (pool.tokenY.symbol === 'USDT' || pool.tokenY.symbol === 'USDC') totalUSD += amtY
        else if (pool.tokenY.symbol === 'WFLR' || pool.tokenY.symbol === 'sFLR') totalUSD += amtY * 0.02
        else totalUSD += amtY
        return totalUSD
      }
      const volumeUSD = estimateUSDValue()
      const result = recordAddLiquidityXP(volumeUSD)
      setXpEarned(result.xpEarned)

      refetchBalanceX()
      refetchBalanceY()

      // Clear amounts after a delay
      setTimeout(() => {
        setAmountX('')
        setAmountY('')
        setXpEarned(0)
      }, 3000)
    }
  }, [addLiquiditySuccess, refetchBalanceX, refetchBalanceY, amountX, amountY, pool.tokenX.symbol, pool.tokenY.symbol, recordAddLiquidityXP])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmountX('')
      setAmountY('')
    }
  }, [isOpen])

  const handleApproveX = async () => {
    await approve(pool.tokenX.address, CONTRACTS.LB_ROUTER, parsedAmountX)
  }

  const handleApproveY = async () => {
    await approve(pool.tokenY.address, CONTRACTS.LB_ROUTER, parsedAmountY)
  }

  const handleAddLiquidity = async () => {
    if (!pool.activeId) return

    await addLiquidity({
      tokenX: pool.tokenX.address,
      tokenY: pool.tokenY.address,
      binStep: pool.binStep,
      amountX: parsedAmountX,
      amountY: parsedAmountY,
      activeId: pool.activeId,
      binRange,
      distribution,
    })
  }

  if (!isOpen) return null

  const totalBins = binRange * 2 + 1

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
            <div className="p-2 rounded-xl bg-dune-400/10">
              <Droplets className="h-5 w-5 text-dune-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add Liquidity</h3>
              <p className="text-sm text-zinc-500">
                {pool.tokenX.symbol}/{pool.tokenY.symbol} • {pool.binStep / 100}% fee
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
          {/* Decimal Mismatch Warning */}
          {hasDecimalMismatch && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">Pool Has Known Issues</p>
                  <p className="text-yellow-400/70 text-xs mt-1">
                    This pool has different token decimals ({pool.tokenX.decimals} vs {pool.tokenY.decimals})
                    which may cause price calculation issues. Adding liquidity may work, but swaps and rebalancing
                    might fail. Use USDC/USDT pool for full functionality.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Token Inputs */}
          <div className="space-y-3">
            <TokenAmountInput
              token={pool.tokenX}
              amount={amountX}
              balance={balanceX}
              onChange={handleAmountXChange}
              insufficientBalance={insufficientBalanceX}
            />
            <div className="flex items-center justify-center">
              <div className="px-3 py-1 rounded-lg bg-zinc-800/50 text-xs text-zinc-500">
                1 {pool.tokenX.symbol} ≈ {poolPrice.toFixed(4)} {pool.tokenY.symbol}
              </div>
            </div>
            <TokenAmountInput
              token={pool.tokenY}
              amount={amountY}
              balance={balanceY}
              onChange={handleAmountYChange}
              insufficientBalance={insufficientBalanceY}
            />
          </div>

          {/* Bin Range Selector */}
          <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Price Range</span>
              <span className="text-sm text-white font-medium">±{binRange} bins</span>
            </div>
            {/* Show calculated price range */}
            {pool.activeId && (
              <div className="mb-3 p-2 rounded-lg bg-zinc-900/50 border border-dune-400/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Min Price:</span>
                  <span className="text-white font-mono">
                    {calculatePriceFromBinId(
                      pool.activeId - binRange,
                      pool.binStep,
                      pool.tokenX.decimals,
                      pool.tokenY.decimals
                    ).toFixed(4)} {pool.tokenY.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-zinc-400">Max Price:</span>
                  <span className="text-white font-mono">
                    {calculatePriceFromBinId(
                      pool.activeId + binRange,
                      pool.binStep,
                      pool.tokenX.decimals,
                      pool.tokenY.decimals
                    ).toFixed(4)} {pool.tokenY.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-center mt-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-dune-400">
                    Current: {poolPrice.toFixed(4)} {pool.tokenY.symbol} per {pool.tokenX.symbol}
                  </span>
                </div>
              </div>
            )}
            <input
              type="range"
              min={1}
              max={25}
              value={binRange}
              onChange={(e) => setBinRange(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-dune-400"
            />
            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              <span>Narrow (higher fees)</span>
              <span>Wide (lower risk)</span>
            </div>
          </div>

          {/* Distribution Type */}
          <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-zinc-400">How to spread your liquidity</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDistribution('uniform')}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1',
                  distribution === 'uniform'
                    ? 'bg-dune-400/20 text-dune-400 border border-dune-400/30'
                    : 'bg-zinc-700/50 text-zinc-400 border border-transparent hover:bg-zinc-700'
                )}
              >
                <span>Uniform</span>
                <span className="text-xs opacity-70">Equal at all prices</span>
              </button>
              <button
                onClick={() => setDistribution('curve')}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1',
                  distribution === 'curve'
                    ? 'bg-dune-400/20 text-dune-400 border border-dune-400/30'
                    : 'bg-zinc-700/50 text-zinc-400 border border-transparent hover:bg-zinc-700'
                )}
              >
                <span>Concentrated</span>
                <span className="text-xs opacity-70">More at current price</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl bg-zinc-800/30 border border-white/5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Your Position</span>
              <span className="text-white font-medium">{totalBins} price points</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">You&apos;ll earn fees when price is between</span>
            </div>
            {pool.activeId && (
              <div className="flex items-center justify-center py-2 px-3 rounded-lg bg-dune-400/10 border border-dune-400/20">
                <span className="text-dune-400 font-mono text-sm">
                  {calculatePriceFromBinId(pool.activeId - binRange, pool.binStep, pool.tokenX.decimals, pool.tokenY.decimals).toFixed(4)}
                  {' → '}
                  {calculatePriceFromBinId(pool.activeId + binRange, pool.binStep, pool.tokenX.decimals, pool.tokenY.decimals).toFixed(4)}
                  {' '}{pool.tokenY.symbol}/{pool.tokenX.symbol}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs text-zinc-600 pt-1">
              <span>Bin IDs: {pool.activeId ? `${pool.activeId - binRange} - ${pool.activeId + binRange}` : '...'}</span>
              <span>Active: {pool.activeId || '...'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isConnected ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800 text-zinc-500 text-center font-medium">
                Connect wallet to add liquidity
              </div>
            ) : insufficientBalanceX || insufficientBalanceY ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium">
                Insufficient balance
              </div>
            ) : parsedAmountX === BigInt(0) && parsedAmountY === BigInt(0) ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800 text-zinc-500 text-center font-medium">
                Enter amounts
              </div>
            ) : needsApprovalX ? (
              <button
                onClick={handleApproveX}
                disabled={isApproving}
                className={cn(
                  'w-full py-4 px-6 rounded-2xl font-semibold transition-all',
                  'bg-dune-400 hover:bg-dune-300 text-black',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isApproving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Approving {pool.tokenX.symbol}...
                  </span>
                ) : (
                  `Approve ${pool.tokenX.symbol}`
                )}
              </button>
            ) : needsApprovalY ? (
              <button
                onClick={handleApproveY}
                disabled={isApproving}
                className={cn(
                  'w-full py-4 px-6 rounded-2xl font-semibold transition-all',
                  'bg-dune-400 hover:bg-dune-300 text-black',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isApproving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Approving {pool.tokenY.symbol}...
                  </span>
                ) : (
                  `Approve ${pool.tokenY.symbol}`
                )}
              </button>
            ) : (
              <button
                onClick={handleAddLiquidity}
                disabled={isAddingLiquidity || isConfirming || !pool.activeId}
                className={cn(
                  'w-full py-4 px-6 rounded-2xl font-semibold transition-all',
                  'bg-gradient-to-r from-dune-400 to-dune-500 hover:from-dune-300 hover:to-orange-400 text-black',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isAddingLiquidity || isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isConfirming ? 'Confirming...' : 'Adding Liquidity...'}
                  </span>
                ) : (
                  'Add Liquidity'
                )}
              </button>
            )}
          </div>

          {/* Status Messages */}
          {addLiquiditySuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-400 text-sm flex-1">Liquidity added successfully!</span>
              {xpEarned > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dune-400/20 border border-dune-400/30">
                  <Sparkles className="h-3 w-3 text-dune-400" />
                  <span className="text-dune-400 font-bold text-sm">+{xpEarned} XP</span>
                </div>
              )}
            </div>
          )}

          {addLiquidityError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-400 text-sm">Failed to add liquidity. Please try again.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TokenAmountInputProps {
  token: Token
  amount: string
  balance: bigint
  onChange: (value: string) => void
  insufficientBalance: boolean
}

function TokenAmountInput({ token, amount, balance, onChange, insufficientBalance }: TokenAmountInputProps) {
  return (
    <div className={cn(
      'p-4 rounded-2xl border transition-colors',
      insufficientBalance
        ? 'bg-red-500/5 border-red-500/20'
        : 'bg-zinc-800/50 border-white/5 hover:border-white/10'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TokenIcon symbol={token.symbol} />
          <span className="font-medium text-white">{token.symbol}</span>
        </div>
        <button
          onClick={() => onChange(formatAmount(balance, token.decimals, token.decimals))}
          className="text-sm text-zinc-500 hover:text-dune-400 transition-colors"
        >
          Max: {formatAmount(balance, token.decimals)}
        </button>
      </div>
      <input
        type="text"
        inputMode="decimal"
        placeholder="0.0"
        value={amount}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9.]/g, '')
          if (value.split('.').length <= 2) {
            onChange(value)
          }
        }}
        className="w-full bg-transparent text-2xl font-medium text-white placeholder:text-zinc-600 focus:outline-none"
      />
      {insufficientBalance && (
        <p className="mt-2 text-xs text-red-400">Insufficient balance</p>
      )}
    </div>
  )
}
