'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Loader2, AlertCircle, Target, TrendingUp, TrendingDown, Info, Flame } from 'lucide-react'
import { TokenSelector, TokenIcon } from './TokenSelector'
import { useTokenBalance, useTokenAllowance } from '@/hooks/useTokenBalance'
import { useApprove } from '@/hooks/useSwap'
import { usePoolsData } from '@/hooks/usePoolData'
import { CONTRACTS, type Token, TOKENS } from '@/config/contracts'
import { formatAmount, parseAmount, calculatePriceFromBinId, cn } from '@/lib/utils'
import { LB_ROUTER_ABI } from '@/contracts/abis'
import { useToast } from './Toast'
import { parseContractError, isUserRejection } from '@/lib/errors'

type OrderSide = 'buy' | 'sell'

export function LimitOrderCard() {
  const { address, isConnected } = useAccount()
  const toast = useToast()
  const { pools, isLoading: poolsLoading } = usePoolsData()

  const [orderSide, setOrderSide] = useState<OrderSide>('buy')
  const [tokenIn, setTokenIn] = useState<Token | null>(TOKENS[1]) // USDT for buy
  const [tokenOut, setTokenOut] = useState<Token | null>(TOKENS[0]) // WFLR for buy
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [pricePercentage, setPricePercentage] = useState(0) // % above/below current price

  const { balance } = useTokenBalance(tokenIn?.address)
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    tokenIn?.address,
    CONTRACTS.LB_ROUTER
  )

  // Find the pool for this pair
  const pool = useMemo(() => {
    if (!tokenIn || !tokenOut) return undefined
    return pools.find(p =>
      (p.tokenX.address.toLowerCase() === tokenIn.address.toLowerCase() &&
       p.tokenY.address.toLowerCase() === tokenOut.address.toLowerCase()) ||
      (p.tokenY.address.toLowerCase() === tokenIn.address.toLowerCase() &&
       p.tokenX.address.toLowerCase() === tokenOut.address.toLowerCase())
    )
  }, [tokenIn, tokenOut, pools])

  // Calculate current price from active bin
  const currentPrice = useMemo(() => {
    if (!pool || pool.activeId <= 0) return 0
    return calculatePriceFromBinId(
      pool.activeId,
      pool.binStep,
      pool.tokenX.decimals,
      pool.tokenY.decimals
    )
  }, [pool])

  // Calculate target bin ID based on limit price
  const targetBinId = useMemo(() => {
    if (!pool || !limitPrice || parseFloat(limitPrice) <= 0) return 0

    const targetPrice = parseFloat(limitPrice)
    const binStep = pool.binStep

    // Calculate bins from active bin to target price
    // Price relationship: price = (1 + binStep/10000)^(binId - 8388608)
    // Inverse: binId = 8388608 + log(price) / log(1 + binStep/10000)

    // For simplicity, use the percentage difference to estimate bins
    if (currentPrice > 0) {
      const priceDiff = (targetPrice / currentPrice) - 1
      const binsToMove = Math.round(priceDiff / (binStep / 10000))
      return pool.activeId + binsToMove
    }

    return pool.activeId
  }, [pool, limitPrice, currentPrice])

  // Update limit price when percentage changes
  useEffect(() => {
    if (currentPrice > 0 && pricePercentage !== 0) {
      const newPrice = currentPrice * (1 + pricePercentage / 100)
      setLimitPrice(newPrice.toFixed(6))
    }
  }, [pricePercentage, currentPrice])

  // Swap tokens when order side changes
  const handleSideChange = (side: OrderSide) => {
    setOrderSide(side)
    const tempToken = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmount('')
    setLimitPrice('')
    setPricePercentage(0)
  }

  const parsedAmount = tokenIn ? parseAmount(amount, tokenIn.decimals) : BigInt(0)
  const needsApproval = parsedAmount > BigInt(0) && parsedAmount > allowance
  const insufficientBalance = parsedAmount > balance

  // Contract calls
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming, isSuccess: approveSuccess } = useApprove()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance()
    }
  }, [approveSuccess, refetchAllowance])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Limit Order Placed!', `Your ${orderSide} order has been placed`, hash)
      setAmount('')
      setLimitPrice('')
      setPricePercentage(0)
    }
  }, [isSuccess, hash, orderSide, toast])

  useEffect(() => {
    if (error && !isUserRejection(error)) {
      toast.error('Order Failed', parseContractError(error))
    }
  }, [error, toast])

  const handleApprove = async () => {
    if (!tokenIn) return
    await approve(tokenIn.address, CONTRACTS.LB_ROUTER, parsedAmount * BigInt(2))
  }

  const handlePlaceOrder = async () => {
    if (!address || !tokenIn || !tokenOut || !pool || targetBinId <= 0) return

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

    // Determine if this is X or Y token based on pool
    const isTokenX = tokenIn.address.toLowerCase() === pool.tokenX.address.toLowerCase()

    // Create single-bin liquidity (limit order)
    const PRECISION = BigInt(10 ** 18)

    const liquidityParameters = {
      tokenX: pool.tokenX.address,
      tokenY: pool.tokenY.address,
      binStep: BigInt(pool.binStep),
      amountX: isTokenX ? parsedAmount : BigInt(0),
      amountY: isTokenX ? BigInt(0) : parsedAmount,
      amountXMin: BigInt(0),
      amountYMin: BigInt(0),
      activeIdDesired: BigInt(targetBinId),
      idSlippage: BigInt(0), // No slippage for limit orders
      deltaIds: [BigInt(0)], // Single bin at target
      distributionX: isTokenX ? [PRECISION] : [BigInt(0)],
      distributionY: isTokenX ? [BigInt(0)] : [PRECISION],
      to: address,
      refundTo: address,
      deadline,
    }

    writeContract({
      address: CONTRACTS.LB_ROUTER,
      abi: LB_ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [liquidityParameters],
    })
  }

  // Quick price percentage buttons
  const pricePresets = orderSide === 'buy'
    ? [{ label: '-1%', value: -1 }, { label: '-2%', value: -2 }, { label: '-5%', value: -5 }]
    : [{ label: '+1%', value: 1 }, { label: '+2%', value: 2 }, { label: '+5%', value: 5 }]

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white">Limit Order</h2>
          </div>
        </div>

        {/* Order Side Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleSideChange('buy')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              orderSide === 'buy'
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                : 'bg-zinc-800/50 text-zinc-500 border border-white/5 hover:border-white/10'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Buy
          </button>
          <button
            onClick={() => handleSideChange('sell')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              orderSide === 'sell'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-zinc-800/50 text-zinc-500 border border-white/5 hover:border-white/10'
            )}
          >
            <TrendingDown className="h-4 w-4" />
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">
              Amount to {orderSide === 'buy' ? 'spend' : 'sell'}
            </span>
            {tokenIn && (
              <button
                onClick={() => setAmount(formatAmount(balance, tokenIn.decimals, tokenIn.decimals))}
                className="text-sm text-zinc-500 hover:text-amber-500"
              >
                Balance: {formatAmount(balance, tokenIn.decimals)}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/30 border border-white/5">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '')
                if (value.split('.').length <= 2) setAmount(value)
              }}
              className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none"
            />
            <TokenSelector
              selectedToken={tokenIn}
              onSelect={setTokenIn}
              excludeToken={tokenOut}
            />
          </div>
        </div>

        {/* Limit Price Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 flex items-center gap-1">
              Limit Price
              <Info className="h-3 w-3 text-zinc-600" />
            </span>
            {currentPrice > 0 && (
              <span className="text-sm text-zinc-500">
                Current: {currentPrice.toFixed(6)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/30 border border-white/5">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={limitPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '')
                if (value.split('.').length <= 2) {
                  setLimitPrice(value)
                  setPricePercentage(0)
                }
              }}
              className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none"
            />
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800">
              <TokenIcon symbol={tokenOut?.symbol || ''} size="sm" />
              <span className="text-sm text-zinc-400">per</span>
              <TokenIcon symbol={tokenIn?.symbol || ''} size="sm" />
            </div>
          </div>

          {/* Price Presets */}
          <div className="flex gap-2 mt-2">
            {pricePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setPricePercentage(preset.value)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg border transition-all',
                  pricePercentage === preset.value
                    ? orderSide === 'buy'
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-zinc-800/50 text-zinc-500 border-white/5 hover:border-white/10'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        {amount && limitPrice && parseFloat(limitPrice) > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-800/30 border border-white/5 space-y-2 animate-float-up">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Order Type</span>
              <span className={cn(
                'font-medium',
                orderSide === 'buy' ? 'text-emerald-500' : 'text-red-400'
              )}>
                Limit {orderSide === 'buy' ? 'Buy' : 'Sell'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Target Bin</span>
              <span className="text-zinc-300 font-mono">#{targetBinId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">You&apos;ll receive ~</span>
              <span className="text-zinc-300 font-mono">
                {(parseFloat(amount) / parseFloat(limitPrice)).toFixed(4)} {tokenOut?.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-400">
              Limit orders place single-bin liquidity positions.
              Your order will fill when the price reaches your target.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {!isConnected ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Connect wallet to place order
            </div>
          ) : !pool ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              {poolsLoading ? 'Loading pools...' : 'No pool found for this pair'}
            </div>
          ) : !amount || parsedAmount === BigInt(0) ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Enter an amount
            </div>
          ) : !limitPrice || parseFloat(limitPrice) <= 0 ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Enter a limit price
            </div>
          ) : insufficientBalance ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Insufficient {tokenIn?.symbol} balance
            </div>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isApproving || isApproveConfirming}
              className="btn-helios w-full"
            >
              {isApproving || isApproveConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Approving...
                </span>
              ) : (
                `Approve ${tokenIn?.symbol}`
              )}
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={isPending || isConfirming}
              className={cn(
                'w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                orderSide === 'buy'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
              )}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isConfirming ? 'Confirming...' : 'Placing Order...'}
                </>
              ) : (
                <>
                  <Flame className="h-5 w-5" />
                  Place {orderSide === 'buy' ? 'Buy' : 'Sell'} Order
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
