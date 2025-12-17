'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Loader2, AlertCircle, Target, TrendingUp, TrendingDown, Info, Flame } from 'lucide-react'
import { TokenSelector, TokenIcon } from './TokenSelector'
import { useTokenBalance, useTokenAllowance } from '@/hooks/useTokenBalance'
import { useApprove } from '@/hooks/useSwap'
import { usePoolsData } from '@/hooks/usePoolData'
import { CONTRACTS, type Token, SWAP_TOKENS } from '@/config/contracts'
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
  // Default to USDC/USDT pair (the working pool)
  const [tokenIn, setTokenIn] = useState<Token | null>(SWAP_TOKENS[1]) // USDT for buy
  const [tokenOut, setTokenOut] = useState<Token | null>(SWAP_TOKENS[0]) // USDC for buy
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

  // Determine if tokenIn is tokenX or tokenY in the pool
  const isTokenInX = useMemo(() => {
    if (!pool || !tokenIn) return false
    return tokenIn.address.toLowerCase() === pool.tokenX.address.toLowerCase()
  }, [pool, tokenIn])

  // Display price in user-friendly format (what you get per what you spend)
  // For buy: tokenOut/tokenIn, for sell: same
  // This is the inverse of pool's native tokenY/tokenX format when buying with tokenY
  const displayPrice = useMemo(() => {
    if (currentPrice <= 0) return 0
    // When isTokenInX is false, we need to invert the pool price for display
    // Pool price is tokenY/tokenX, user expects tokenOut/tokenIn
    return isTokenInX ? currentPrice : (currentPrice > 0 ? 1 / currentPrice : 0)
  }, [currentPrice, isTokenInX])

  // Calculate target bin ID based on limit price using proper logarithmic formula
  const targetBinId = useMemo(() => {
    if (!pool || !limitPrice || parseFloat(limitPrice) <= 0 || currentPrice <= 0) return 0

    const userPrice = parseFloat(limitPrice)
    const binStep = pool.binStep
    const binStepFactor = 1 + binStep / 10000

    // User enters price in tokenOut/tokenIn format (how much output per input)
    // Pool price is tokenY/tokenX format
    // When !isTokenInX (tokenIn=Y, tokenOut=X): user format is inverse of pool format
    // Convert user's limit price to pool format for calculation
    const poolLimitPrice = isTokenInX ? userPrice : (userPrice > 0 ? 1 / userPrice : 0)

    if (poolLimitPrice <= 0) return 0

    // Calculate price ratio in pool format
    const priceRatio = poolLimitPrice / currentPrice

    // Calculate bins to move using logarithm
    const binsToMove = Math.round(Math.log(priceRatio) / Math.log(binStepFactor))

    const calculatedBinId = pool.activeId + binsToMove

    // Validate bin ID is within reasonable range (prevent overflow)
    if (calculatedBinId < 1 || calculatedBinId > 16777215) {
      console.warn('Target bin ID out of range:', calculatedBinId)
      return 0
    }

    return calculatedBinId
  }, [pool, limitPrice, currentPrice, isTokenInX])

  // Update limit price when percentage changes
  useEffect(() => {
    if (displayPrice > 0 && pricePercentage !== 0) {
      const newPrice = displayPrice * (1 + pricePercentage / 100)
      setLimitPrice(newPrice.toFixed(6))
    }
  }, [pricePercentage, displayPrice])

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
      toast.success(
        'Limit Order Placed!',
        `Your ${orderSide} order has been placed. View it in My Positions.`,
        hash
      )
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
    await approve(tokenIn.address, CONTRACTS.LB_ROUTER, parsedAmount)
  }

  const handlePlaceOrder = async () => {
    if (!address || !tokenIn || !tokenOut || !pool || targetBinId <= 0) return

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

    // Create single-bin liquidity (limit order)
    const PRECISION = BigInt(10 ** 18)

    // Use the pre-calculated isTokenInX to determine which token we're providing
    const liquidityParameters = {
      tokenX: pool.tokenX.address,
      tokenY: pool.tokenY.address,
      binStep: BigInt(pool.binStep),
      amountX: isTokenInX ? parsedAmount : BigInt(0),
      amountY: isTokenInX ? BigInt(0) : parsedAmount,
      amountXMin: BigInt(0),
      amountYMin: BigInt(0),
      activeIdDesired: BigInt(targetBinId),
      idSlippage: BigInt(5), // Allow small slippage for bin movement
      deltaIds: [BigInt(0)], // Single bin at target
      distributionX: isTokenInX ? [PRECISION] : [BigInt(0)],
      distributionY: isTokenInX ? [BigInt(0)] : [PRECISION],
      to: address,
      refundTo: address,
      deadline,
    }

    console.log('[LimitOrder] Placing order:', {
      tokenIn: tokenIn.symbol,
      tokenOut: tokenOut.symbol,
      isTokenInX,
      targetBinId,
      activeId: pool.activeId,
      binDiff: targetBinId - pool.activeId,
      amount: parsedAmount.toString(),
    })

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
            <Target className="h-5 w-5 text-dune-400" />
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
                className="text-sm text-zinc-500 hover:text-dune-400"
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
              tokenList={SWAP_TOKENS}
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
            {displayPrice > 0 && (
              <span className="text-sm text-zinc-500">
                Current: {displayPrice.toFixed(6)}
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
              <span className="text-zinc-500">Trigger Price</span>
              <span className="text-dune-400 font-mono">
                {parseFloat(limitPrice).toFixed(6)} {tokenOut?.symbol}/{tokenIn?.symbol}
              </span>
            </div>
            {targetBinId > 0 && pool && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Target Bin</span>
                <span className="text-zinc-400 font-mono text-xs">
                  #{targetBinId} ({targetBinId > pool.activeId ? '+' : ''}{targetBinId - pool.activeId} from current)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-zinc-500">You&apos;ll receive ~</span>
              <span className="text-white font-mono font-medium">
                {(parseFloat(amount) / parseFloat(limitPrice)).toFixed(4)} {tokenOut?.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Invalid Bin Warning - only show when we have valid price data */}
        {amount && limitPrice && parseFloat(limitPrice) > 0 && displayPrice > 0 && targetBinId === 0 && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-400">
                Invalid limit price. The target price is too far from the current market price.
                Try a price closer to {displayPrice.toFixed(6)}.
              </div>
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
            <div className="w-full py-4 px-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-center font-medium text-sm">
              {poolsLoading ? 'Loading pools...' : `No pool for ${tokenIn?.symbol}/${tokenOut?.symbol}. Try USDC/USDT pair.`}
            </div>
          ) : displayPrice <= 0 ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Loading price data...
            </div>
          ) : !amount || parsedAmount === BigInt(0) ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Enter an amount
            </div>
          ) : !limitPrice || parseFloat(limitPrice) <= 0 ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Enter a limit price
            </div>
          ) : targetBinId === 0 ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium">
              Invalid limit price
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
