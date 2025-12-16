'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { X, Plus, AlertCircle, CheckCircle2, Loader2, Info, Flame, Sparkles } from 'lucide-react'
import { TokenIcon } from './TokenSelector'
import { TOKENS, CONTRACTS, type Token } from '@/config/contracts'
import { LB_FACTORY_ABI } from '@/contracts/abis'
import { useToast } from './Toast'
import { parseContractError, isUserRejection } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface CreatePoolModalProps {
  isOpen: boolean
  onClose: () => void
}

// Bin step presets with descriptions
const BIN_STEPS = [
  { value: 1, label: '0.01%', description: 'Stablecoins & Pegged Assets' },
  { value: 5, label: '0.05%', description: 'Low Volatility Pairs' },
  { value: 10, label: '0.10%', description: 'Medium Volatility' },
  { value: 15, label: '0.15%', description: 'Standard Pairs' },
  { value: 20, label: '0.20%', description: 'Higher Volatility' },
  { value: 25, label: '0.25%', description: 'High Volatility Assets' },
]

export function CreatePoolModal({ isOpen, onClose }: CreatePoolModalProps) {
  const { address } = useAccount()
  const toast = useToast()

  const [tokenX, setTokenX] = useState<Token | null>(null)
  const [tokenY, setTokenY] = useState<Token | null>(null)
  const [binStep, setBinStep] = useState(15)
  const [isSelectingToken, setIsSelectingToken] = useState<'X' | 'Y' | null>(null)

  // Check if pool already exists
  const { data: existingPool } = useReadContract({
    address: CONTRACTS.LB_FACTORY as `0x${string}`,
    abi: LB_FACTORY_ABI,
    functionName: 'getLBPairInformation',
    args: tokenX && tokenY ? [tokenX.address, tokenY.address, BigInt(binStep)] : undefined,
    query: {
      enabled: !!tokenX && !!tokenY,
    },
  })

  const poolExists = existingPool && (existingPool as { LBPair: string }).LBPair !== '0x0000000000000000000000000000000000000000'

  // Create pool transaction - TODO: Implement actual pool creation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { writeContract: createPool, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Pool Created!', `${tokenX?.symbol}/${tokenY?.symbol} pool is now live`, hash)
      onClose()
    }
  }, [isSuccess, hash, tokenX, tokenY, toast, onClose])

  useEffect(() => {
    if (error) {
      if (!isUserRejection(error)) {
        toast.error('Pool Creation Failed', parseContractError(error))
      }
    }
  }, [error, toast])

  const handleCreatePool = async () => {
    if (!tokenX || !tokenY || !address) return

    // Note: Creating a pool in LB requires calling createLBPair on the factory
    // This is typically owner-only or requires preset parameters
    // For now, we'll show a message about this
    toast.info(
      'Pool Creation',
      'New pool creation requires approved preset parameters. Please contact the Helios team.'
    )
  }

  const handleTokenSelect = (token: Token) => {
    if (isSelectingToken === 'X') {
      if (token.address === tokenY?.address) {
        setTokenY(tokenX)
      }
      setTokenX(token)
    } else if (isSelectingToken === 'Y') {
      if (token.address === tokenX?.address) {
        setTokenX(tokenY)
      }
      setTokenY(token)
    }
    setIsSelectingToken(null)
  }

  const availableTokens = TOKENS.filter(() => {
    if (isSelectingToken === 'X') return true
    if (isSelectingToken === 'Y') return true
    return true
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-3xl w-full max-w-lg p-6 animate-float-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Plus className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Pool</h2>
              <p className="text-sm text-zinc-500">Launch a new liquidity pair</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Token Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-zinc-500 mb-2 block">Token X (Base)</label>
            <button
              onClick={() => setIsSelectingToken('X')}
              className="w-full p-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between"
            >
              {tokenX ? (
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={tokenX.symbol} />
                  <div className="text-left">
                    <div className="font-medium text-white">{tokenX.symbol}</div>
                    <div className="text-xs text-zinc-500">{tokenX.name}</div>
                  </div>
                </div>
              ) : (
                <span className="text-zinc-500">Select token</span>
              )}
              <Sparkles className="h-4 w-4 text-zinc-500" />
            </button>
          </div>

          <div>
            <label className="text-sm text-zinc-500 mb-2 block">Token Y (Quote)</label>
            <button
              onClick={() => setIsSelectingToken('Y')}
              className="w-full p-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between"
            >
              {tokenY ? (
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={tokenY.symbol} />
                  <div className="text-left">
                    <div className="font-medium text-white">{tokenY.symbol}</div>
                    <div className="text-xs text-zinc-500">{tokenY.name}</div>
                  </div>
                </div>
              ) : (
                <span className="text-zinc-500">Select token</span>
              )}
              <Sparkles className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Bin Step Selection */}
        <div className="mb-6">
          <label className="text-sm text-zinc-500 mb-2 block flex items-center gap-2">
            Bin Step (Fee Tier)
            <div className="group relative">
              <Info className="h-4 w-4 text-zinc-600 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Bin step determines the fee tier and price granularity. Lower values = tighter spreads, higher values = more fee income.
              </div>
            </div>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BIN_STEPS.map((step) => (
              <button
                key={step.value}
                onClick={() => setBinStep(step.value)}
                className={cn(
                  'p-3 rounded-xl border transition-all text-center',
                  binStep === step.value
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                    : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10'
                )}
              >
                <div className="font-medium">{step.label}</div>
                <div className="text-xs mt-1 opacity-70">{step.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pool Status */}
        {tokenX && tokenY && (
          <div className={cn(
            'p-4 rounded-xl mb-6 flex items-start gap-3',
            poolExists
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-emerald-500/10 border border-emerald-500/20'
          )}>
            {poolExists ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-500">Pool Already Exists</div>
                  <div className="text-sm text-amber-500/70 mt-1">
                    A {tokenX.symbol}/{tokenY.symbol} pool with {binStep / 100}% fee already exists.
                    You can add liquidity to the existing pool instead.
                  </div>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-emerald-500">New Pool Available</div>
                  <div className="text-sm text-emerald-500/70 mt-1">
                    This {tokenX.symbol}/{tokenY.symbol} pair with {binStep / 100}% fee doesn&apos;t exist yet.
                    Be the first to create it!
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="mb-2">
                Creating a new Liquidity Book pool requires:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-400/70">
                <li>Approved preset parameters from the factory</li>
                <li>Initial liquidity deposit</li>
                <li>Setting the initial price (active bin)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreatePool}
          disabled={!tokenX || !tokenY || isPending || isConfirming || !!poolExists}
          className={cn(
            'w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
            !tokenX || !tokenY || poolExists
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'btn-helios'
          )}
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isPending ? 'Confirm in Wallet...' : 'Creating Pool...'}
            </>
          ) : !tokenX || !tokenY ? (
            'Select Tokens'
          ) : poolExists ? (
            'Pool Already Exists'
          ) : (
            <>
              <Flame className="h-5 w-5" />
              Create Pool
            </>
          )}
        </button>

        {/* Token Selector Overlay */}
        {isSelectingToken && (
          <div className="absolute inset-0 bg-zinc-900/95 rounded-3xl p-6 animate-float-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Select Token</h3>
              <button
                onClick={() => setIsSelectingToken(null)}
                className="p-2 rounded-xl hover:bg-white/5"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-2">
              {availableTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full p-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-amber-500/30 transition-all flex items-center gap-3"
                >
                  <TokenIcon symbol={token.symbol} />
                  <div className="text-left flex-1">
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-xs text-zinc-500">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
