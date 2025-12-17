'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ArrowDownUp, Loader2, AlertCircle, CheckCircle2, Flame, Sparkles, Settings2, RefreshCw, AlertTriangle } from 'lucide-react'
import { TokenSelector, TokenIcon } from './TokenSelector'
import { useTokenBalance, useTokenAllowance } from '@/hooks/useTokenBalance'
import { useSwap, useApprove } from '@/hooks/useSwap'
import { useSwapQuote, calculateFallbackQuote } from '@/hooks/useQuote'
import { findBestPool } from '@/hooks/usePoolData'
import { CONTRACTS, type Token, SWAP_TOKENS } from '@/config/contracts'
import { formatAmount, parseAmount, cn } from '@/lib/utils'
import { useXP } from './GamificationBar'


export function SwapCard() {
  const { isConnected } = useAccount()
  // Default to C2FLR -> USDT0 (main trading pair on Coston2)
  const [tokenIn, setTokenIn] = useState<Token | null>(SWAP_TOKENS.find(t => t.symbol === 'C2FLR') || SWAP_TOKENS[0])
  const [tokenOut, setTokenOut] = useState<Token | null>(SWAP_TOKENS.find(t => t.symbol === 'USDT0') || SWAP_TOKENS[2])
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [slippage, setSlippage] = useState(5) // Higher default for testnet
  const [showSettings, setShowSettings] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [isSwapAnimating, setIsSwapAnimating] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

  const { recordSwapXP } = useXP()

  const { balance: balanceIn, refetch: refetchBalanceIn } = useTokenBalance(tokenIn?.address)
  const { balance: balanceOut, refetch: refetchBalanceOut } = useTokenBalance(tokenOut?.address)
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    tokenIn?.address,
    CONTRACTS.LB_ROUTER
  )

  const { swap, isPending: isSwapping, isConfirming, isSuccess: swapSuccess, error: swapError } = useSwap()
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming, isSuccess: approveSuccess } = useApprove()

  const pool = tokenIn && tokenOut ? findBestPool(tokenIn.address, tokenOut.address) : undefined
  const parsedAmountIn = tokenIn ? parseAmount(amountIn, tokenIn.decimals) : BigInt(0)
  const needsApproval = parsedAmountIn > BigInt(0) && parsedAmountIn > allowance

  // Get real quote from LBQuoter (with multi-hop support)
  const {
    amountOut: quotedAmountOut,
    priceImpact: quotedPriceImpact,
    fees: quotedFees,
    route: swapRoute,
    binSteps: routeBinSteps,
    isMultiHop,
    isLoading: isQuoteLoading,
    error: quoteError
  } = useSwapQuote(tokenIn?.address, tokenOut?.address, parsedAmountIn)

  // Check if route exists (direct or multi-hop)
  const hasRoute = swapRoute.length >= 2

  // Update output amount based on quote
  useEffect(() => {
    if (!amountIn || !tokenIn || !tokenOut) {
      setAmountOut('')
      return
    }

    const inputAmount = parseFloat(amountIn)
    if (isNaN(inputAmount) || inputAmount <= 0) {
      setAmountOut('')
      return
    }

    // Use real quote if available (works for both direct and multi-hop)
    if (quotedAmountOut > BigInt(0)) {
      const formattedOut = formatAmount(quotedAmountOut, tokenOut.decimals, tokenOut.decimals)
      setAmountOut(formattedOut)
      return
    }

    // Fallback to estimate if quote fails, is zero, or loading finished without result
    // This handles cases where LBQuoter eth_call fails but actual swaps work
    if (!isQuoteLoading) {
      const { amountOut: fallbackOut } = calculateFallbackQuote(
        tokenIn.symbol,
        tokenOut.symbol,
        inputAmount,
        tokenOut.decimals
      )
      setAmountOut(fallbackOut.toFixed(tokenOut.decimals === 6 ? 6 : 4))
    }
  }, [amountIn, tokenIn, tokenOut, hasRoute, quotedAmountOut, isQuoteLoading, quoteError])

  // Refetch allowance after approval
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance()
    }
  }, [approveSuccess, refetchAllowance])

  // Handle swap success - simplified animation
  useEffect(() => {
    if (swapSuccess && !showSuccessAnimation) {
      setShowSuccessAnimation(true)

      // Record XP for the swap
      const estimateUSDValue = () => {
        const amount = parseFloat(amountIn) || 0
        if (!tokenIn) return amount
        if (tokenIn.symbol === 'USDT' || tokenIn.symbol === 'USDC') return amount
        if (tokenIn.symbol === 'WFLR' || tokenIn.symbol === 'sFLR') return amount * 0.02
        return amount
      }
      const result = recordSwapXP(estimateUSDValue())
      setXpEarned(result.xpEarned)

      // Refetch balances
      refetchBalanceIn()
      refetchBalanceOut()
      setTimeout(() => { refetchBalanceIn(); refetchBalanceOut() }, 3000)

      // Clear after short delay
      setTimeout(() => {
        setAmountIn('')
        setAmountOut('')
        setShowSuccessAnimation(false)
        setXpEarned(0)
      }, 1500)
    }
  }, [swapSuccess]) // Minimal dependencies to prevent re-triggering

  const handleSwapTokens = () => {
    setIsSwapAnimating(true)
    setTimeout(() => {
      const tempToken = tokenIn
      setTokenIn(tokenOut)
      setTokenOut(tempToken)
      setAmountIn(amountOut)
      setIsSwapAnimating(false)
    }, 200)
  }

  const handleApprove = async () => {
    if (!tokenIn) return
    await approve(tokenIn.address, CONTRACTS.LB_ROUTER, parsedAmountIn)
  }

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !hasRoute || routeBinSteps.length === 0) return

    const minAmountOut = tokenOut
      ? parseAmount(amountOut, tokenOut.decimals) * BigInt(Math.floor((100 - slippage) * 10)) / BigInt(1000)
      : BigInt(0)

    // Use the best route's bin step (first hop for simplicity)
    await swap(parsedAmountIn, minAmountOut, tokenIn.address, tokenOut.address, routeBinSteps[0])
  }

  const insufficientBalance = parsedAmountIn > balanceIn

  // Use real price impact from quote or fallback
  const priceImpact = quotedPriceImpact > 0 ? quotedPriceImpact : (amountIn && amountOut ? 0.3 : 0)
  const priceImpactClass = priceImpact < 1 ? 'price-impact-low' : priceImpact < 3 ? 'price-impact-medium' : 'price-impact-high'

  // Format fees for display
  const feesDisplay = quotedFees > BigInt(0) && tokenOut
    ? formatAmount(quotedFees, tokenOut.decimals, 6)
    : null

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        id="swap-card-container"
        className={cn(
          'relative glass-card rounded-3xl p-6 shadow-2xl transition-all duration-500',
          showSuccessAnimation && 'ring-2 ring-emerald-500/50 animate-success-burst',
          'hover:shadow-dune-400/5'
        )}
      >
        {/* Animated border on hover */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-dune-400/0 via-dune-400/10 to-dune-400/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-dune-400 animate-fire-flicker" />
            <h2 className="text-xl font-bold text-white">Swap</h2>
          </div>
          <div className="flex items-center gap-2">
            <SlippageSelector value={slippage} onChange={setSlippage} show={showSettings} />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'p-2 rounded-xl transition-all duration-200',
                showSettings ? 'bg-dune-400/20 text-dune-400' : 'hover:bg-white/5 text-zinc-400 hover:text-white'
              )}
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Input Token */}
        <div className={cn('space-y-2 transition-transform duration-200', isSwapAnimating && 'opacity-50')}>
          <TokenInput
            label="You pay"
            token={tokenIn}
            amount={amountIn}
            balance={balanceIn}
            onAmountChange={setAmountIn}
            onTokenSelect={setTokenIn}
            excludeToken={tokenOut}
            tokenList={SWAP_TOKENS}
          />

          {/* Swap Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleSwapTokens}
              className={cn(
                'p-3 rounded-2xl bg-zinc-800/80 border border-white/10 transition-all duration-300',
                'hover:border-dune-400/50 hover:bg-zinc-700/80 hover:shadow-lg hover:shadow-dune-400/10',
                'active:scale-95 group',
                isSwapAnimating && 'rotate-180'
              )}
            >
              <ArrowDownUp className="h-5 w-5 text-zinc-400 group-hover:text-dune-400 transition-colors" />
            </button>
          </div>

          {/* Output Token */}
          <TokenInput
            label="You receive"
            token={tokenOut}
            amount={amountOut}
            balance={balanceOut}
            onAmountChange={setAmountOut}
            onTokenSelect={setTokenOut}
            excludeToken={tokenIn}
            tokenList={SWAP_TOKENS}
            readOnly
            highlight={!!amountOut}
          />
        </div>

        {/* Route Info */}
        {hasRoute && amountIn && (
          <div className="mt-4 p-4 rounded-2xl bg-zinc-800/30 border border-white/5 space-y-3 animate-float-up">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Route</span>
                {isMultiHop && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-dune-400/10 text-dune-400 font-medium">
                    Multi-hop
                  </span>
                )}
                {isQuoteLoading && (
                  <RefreshCw className="h-3 w-3 text-dune-400 animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {swapRoute.map((symbol, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg">
                      <TokenIcon symbol={symbol} size="sm" />
                      <span className="text-xs text-zinc-400">{symbol}</span>
                    </div>
                    {index < swapRoute.length - 1 && (
                      <Sparkles className="h-3 w-3 text-dune-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">{isMultiHop ? 'Total Fee' : 'Pool Fee'}</span>
              <span className="text-zinc-300 font-medium">
                {routeBinSteps.length > 0
                  ? `${routeBinSteps.reduce((a, b) => a + b, 0) / 100}%`
                  : pool ? `${pool.binStep / 100}%` : '0%'
                }
              </span>
            </div>
            {feesDisplay && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Swap Fee</span>
                <span className="text-zinc-300 font-mono">{feesDisplay} {tokenOut?.symbol}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Price Impact</span>
              <span className={cn('font-medium', priceImpactClass)}>
                {isQuoteLoading ? '...' : `~${priceImpact.toFixed(2)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Min. Received</span>
              <span className="text-zinc-300 font-mono">
                {amountOut ? (parseFloat(amountOut) * (1 - slippage / 100)).toFixed(4) : '0'} {tokenOut?.symbol}
              </span>
            </div>
            {quoteError && (
              <div className="flex items-center gap-2 text-xs text-dune-400/70">
                <AlertCircle className="h-3 w-3" />
                Using estimated quote
              </div>
            )}
          </div>
        )}

        {/* High Price Impact Warning */}
        {priceImpact >= 3 && amountIn && (
          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 animate-float-up">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-semibold">High Price Impact Warning</p>
                <p className="text-red-500/70 text-sm mt-1">
                  This trade has a {priceImpact.toFixed(2)}% price impact. You may receive significantly less than expected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          {!isConnected ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Connect wallet to swap
            </div>
          ) : !tokenIn || !tokenOut ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Select tokens
            </div>
          ) : !amountIn || parsedAmountIn === BigInt(0) ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              Enter an amount
            </div>
          ) : insufficientBalance ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Insufficient {tokenIn.symbol} balance
            </div>
          ) : !hasRoute ? (
            <div className="w-full py-4 px-6 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500 text-center font-medium">
              No route found for this pair
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
                `Approve ${tokenIn.symbol}`
              )}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isSwapping || isConfirming}
              className="btn-helios w-full"
            >
              {isSwapping || isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isConfirming ? 'Confirming...' : 'Swapping...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Flame className="h-5 w-5" />
                  Swap
                </span>
              )}
            </button>
          )}
        </div>

        {/* Success Message - simple fade in */}
        {showSuccessAnimation && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-emerald-400 text-sm font-medium">Swap successful!</span>
            {xpEarned > 0 && (
              <span className="ml-auto text-dune-400 text-sm font-medium">+{xpEarned} XP</span>
            )}
          </div>
        )}

        {swapError && !showSuccessAnimation && (
          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-red-400 font-semibold">Swap failed</p>
              <p className="text-red-500/70 text-sm">
                {swapError.message?.includes('LBRouter__InsufficientAmountOut')
                  ? 'Insufficient liquidity in pool. Try a smaller amount.'
                  : swapError.message?.includes('rejected')
                    ? 'Transaction rejected by user'
                    : swapError.message?.includes('LBPair__OutOfLiquidity')
                      ? 'No liquidity available. Add liquidity to the pool first.'
                      : 'Transaction failed. Pool may have insufficient liquidity.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface TokenInputProps {
  label: string
  token: Token | null
  amount: string
  balance: bigint
  onAmountChange: (value: string) => void
  onTokenSelect: (token: Token) => void
  excludeToken?: Token | null
  readOnly?: boolean
  highlight?: boolean
  tokenList?: Token[]
}

function TokenInput({
  label,
  token,
  amount,
  balance,
  onAmountChange,
  onTokenSelect,
  excludeToken,
  readOnly,
  highlight,
  tokenList,
}: TokenInputProps) {
  return (
    <div className={cn(
      'p-4 rounded-2xl border transition-all duration-200',
      'bg-zinc-900/50 border-white/5',
      'hover:border-white/10',
      'focus-within:border-dune-400/30',
      highlight && 'border-dune-400/20 bg-dune-400/5'
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
        {token && (
          <button
            onClick={() => {
              if (!readOnly) {
                onAmountChange(formatAmount(balance, token.decimals, token.decimals))
              }
            }}
            className="text-xs text-zinc-500 hover:text-dune-400 transition-colors"
          >
            Balance: <span className="font-mono">{formatAmount(balance, token.decimals)}</span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '')
            if (value.split('.').length <= 2) {
              onAmountChange(value)
            }
          }}
          readOnly={readOnly}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none',
            readOnly && 'cursor-default',
            highlight && 'text-dune-400'
          )}
        />
        <TokenSelector
          selectedToken={token}
          onSelect={onTokenSelect}
          excludeToken={excludeToken}
          tokenList={tokenList}
        />
      </div>
    </div>
  )
}

function SlippageSelector({ value, onChange, show }: { value: number; onChange: (v: number) => void; show: boolean }) {
  const presets = [0.1, 0.5, 1.0]

  if (!show) return null

  return (
    <div className="flex items-center gap-1 animate-float-up">
      {presets.map((preset) => (
        <button
          key={preset}
          onClick={() => onChange(preset)}
          className={cn(
            'px-3 py-1.5 text-xs rounded-xl transition-all duration-200',
            value === preset
              ? 'bg-dune-400/20 text-dune-400 border border-dune-400/30 shadow-sm shadow-dune-400/10'
              : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
          )}
        >
          {preset}%
        </button>
      ))}
    </div>
  )
}
