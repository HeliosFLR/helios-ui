'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import {
  RefreshCw,
  X,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTRACTS, type Token } from '@/config/contracts'
import { LB_ROUTER_ABI, LB_PAIR_ABI } from '@/contracts/abis'

interface Position {
  poolAddress: `0x${string}`
  tokenX: Token
  tokenY: Token
  binStep: number
  activeId: number
  bins: Array<{
    binId: number
    share: number
    isActive: boolean
    liquidity: bigint
  }>
}

interface RebalanceModalProps {
  isOpen: boolean
  onClose: () => void
  position: Position
  onSuccess?: () => void
}

// Generate uniform distribution across bins
function generateUniformDistribution(binCount: number): bigint[] {
  const PRECISION = BigInt('1000000000000000000') // 1e18
  const perBin = PRECISION / BigInt(binCount)
  const distribution = Array(binCount).fill(perBin)
  // Add remainder to last bin to ensure sum = PRECISION
  const remainder = PRECISION - (perBin * BigInt(binCount))
  distribution[distribution.length - 1] = perBin + remainder
  return distribution
}

export function RebalanceModal({ isOpen, onClose, position, onSuccess }: RebalanceModalProps) {
  const { address } = useAccount()
  const [step, setStep] = useState<'preview' | 'approving' | 'removing' | 'adding' | 'success' | 'error'>('preview')
  const [newBinRange, setNewBinRange] = useState(10)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [removedAmountX, setRemovedAmountX] = useState<bigint>(BigInt(0))
  const [removedAmountY, setRemovedAmountY] = useState<bigint>(BigInt(0))
  const [removeProcessed, setRemoveProcessed] = useState(false)
  const [approveProcessed, setApproveProcessed] = useState(false)

  // Contract writes
  const { writeContract: approveWrite, data: approveTxHash, error: approveError } = useWriteContract()
  const { writeContract: removeWrite, data: removeTxHash, error: removeError } = useWriteContract()
  const { writeContract: addWrite, data: addTxHash, error: addError } = useWriteContract()

  // Transaction receipts with polling for better RPC compatibility
  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll every 2 seconds
    },
  })

  const { isSuccess: isRemoveConfirmed, data: removeReceipt } = useWaitForTransactionReceipt({
    hash: removeTxHash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll every 2 seconds
    },
  })

  const { isSuccess: isAddConfirmed } = useWaitForTransactionReceipt({
    hash: addTxHash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll every 2 seconds
    },
  })

  // Check if LBPair is approved for the router
  const { data: isApproved, refetch: refetchApproval } = useReadContract({
    address: position.poolAddress,
    abi: LB_PAIR_ABI,
    functionName: 'isApprovedForAll',
    args: address ? [address, CONTRACTS.LB_ROUTER as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Calculate current range stats
  const currentBins = position.bins.map(b => b.binId)
  const minBin = Math.min(...currentBins)
  const maxBin = Math.max(...currentBins)
  const isOutOfRange = !position.bins.some(b => b.isActive)
  const distanceFromActive = Math.abs(position.activeId - ((minBin + maxBin) / 2))

  // Generate new bin range
  const newMinBin = position.activeId - newBinRange
  const newMaxBin = position.activeId + newBinRange
  const totalNewBins = newBinRange * 2 + 1

  // Calculate rebalance efficiency score
  const efficiencyScore = Math.max(0, 100 - (distanceFromActive * 2))
  const newEfficiencyScore = 100 // Perfectly centered

  // Handle approval confirmation - proceed to remove
  useEffect(() => {
    if (isApproveConfirmed && step === 'approving' && !approveProcessed) {
      console.log('[Rebalance] Approve confirmed, proceeding to remove')
      setApproveProcessed(true)
      refetchApproval()
      // Small delay to ensure state is updated
      setTimeout(() => {
        executeRemoveLiquidity()
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveConfirmed, step, approveProcessed])

  // Handle remove confirmation - proceed to add
  useEffect(() => {
    if (isRemoveConfirmed && step === 'removing' && !removeProcessed) {
      console.log('[Rebalance] Remove confirmed, proceeding to add liquidity')
      console.log('[Rebalance] Remove receipt:', removeReceipt)
      setRemoveProcessed(true)
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        executeAddLiquidity()
      }, 1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRemoveConfirmed, step, removeProcessed, removeReceipt])

  // Handle add confirmation - show success
  useEffect(() => {
    if (isAddConfirmed && step === 'adding') {
      setStep('success')
      setShowConfetti(true)
      const xp = Math.floor(50 + (position.bins.length * 10) + (newBinRange * 5))
      setXpGained(xp)

      // Play success sound
      const audio = new Audio('/success.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})

      setTimeout(() => setShowConfetti(false), 3000)
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddConfirmed, step])

  // Handle errors
  useEffect(() => {
    const error = approveError || removeError || addError
    if (error) {
      console.error('[Rebalance] Error:', error)
      setErrorMessage(error.message || 'Transaction failed')
      setStep('error')
    }
  }, [approveError, removeError, addError])

  // Execute remove liquidity
  const executeRemoveLiquidity = useCallback(() => {
    if (!address) return

    setStep('removing')

    // Prepare bin IDs and amounts for removal
    const ids = position.bins.map(b => BigInt(b.binId))
    const amounts = position.bins.map(b => b.liquidity)

    // Deadline: 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

    removeWrite({
      address: CONTRACTS.LB_ROUTER as `0x${string}`,
      abi: LB_ROUTER_ABI,
      functionName: 'removeLiquidity',
      args: [
        position.tokenX.address,
        position.tokenY.address,
        position.binStep,
        BigInt(0), // amountXMin - accept any amount
        BigInt(0), // amountYMin - accept any amount
        ids,
        amounts,
        address,
        deadline,
      ],
    })
  }, [address, position, removeWrite])

  // Execute add liquidity with new range
  const executeAddLiquidity = useCallback(() => {
    if (!address) return

    setStep('adding')

    // Generate delta IDs for new bins centered on active ID
    const deltaIds: bigint[] = []
    for (let i = -newBinRange; i <= newBinRange; i++) {
      deltaIds.push(BigInt(i))
    }

    const binCount = deltaIds.length

    // Estimate token amounts based on removed amounts or fallback to position liquidity
    // In production, you'd read the actual balances after removal
    const estimatedAmountX = removedAmountX > BigInt(0) ? removedAmountX : parseUnits('1', position.tokenX.decimals)
    const estimatedAmountY = removedAmountY > BigInt(0) ? removedAmountY : parseUnits('1', position.tokenY.decimals)

    // Generate uniform distributions
    const distributionX = generateUniformDistribution(binCount)
    const distributionY = generateUniformDistribution(binCount)

    // Deadline: 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

    addWrite({
      address: CONTRACTS.LB_ROUTER as `0x${string}`,
      abi: LB_ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [{
        tokenX: position.tokenX.address,
        tokenY: position.tokenY.address,
        binStep: BigInt(position.binStep),
        amountX: estimatedAmountX,
        amountY: estimatedAmountY,
        amountXMin: BigInt(0), // Accept slippage
        amountYMin: BigInt(0),
        activeIdDesired: BigInt(position.activeId),
        idSlippage: BigInt(10), // Allow 10 bin slippage
        deltaIds,
        distributionX,
        distributionY,
        to: address,
        refundTo: address,
        deadline,
      }],
    })
  }, [address, position, newBinRange, removedAmountX, removedAmountY, addWrite])

  // Main rebalance handler
  const handleRebalance = async () => {
    if (!address) return

    setErrorMessage('')

    // Check if we need to approve first
    if (!isApproved) {
      setStep('approving')
      approveWrite({
        address: position.poolAddress,
        abi: LB_PAIR_ABI,
        functionName: 'approveForAll',
        args: [CONTRACTS.LB_ROUTER as `0x${string}`, true],
      })
    } else {
      // Already approved, proceed to remove
      executeRemoveLiquidity()
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('preview')
      setErrorMessage('')
      setRemovedAmountX(BigInt(0))
      setRemovedAmountY(BigInt(0))
      setRemoveProcessed(false)
      setApproveProcessed(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-3xl overflow-hidden animate-bounce-in">
        {/* Header Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="h-5 w-5 text-zinc-400" />
        </button>

        {/* Content */}
        <div className="relative p-6">
          {step === 'preview' && (
            <PreviewStep
              position={position}
              newBinRange={newBinRange}
              setNewBinRange={setNewBinRange}
              efficiencyScore={efficiencyScore}
              newEfficiencyScore={newEfficiencyScore}
              isOutOfRange={isOutOfRange}
              onRebalance={handleRebalance}
              currentBins={{ min: minBin, max: maxBin }}
              newBins={{ min: newMinBin, max: newMaxBin }}
            />
          )}

          {(step === 'approving' || step === 'removing' || step === 'adding') && (
            <ProcessingStep
              step={step}
              txHash={step === 'approving' ? approveTxHash : step === 'removing' ? removeTxHash : addTxHash}
            />
          )}

          {step === 'error' && (
            <ErrorStep
              message={errorMessage}
              onRetry={handleRebalance}
              onClose={onClose}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              xpGained={xpGained}
              newBins={totalNewBins}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewStep({
  position,
  newBinRange,
  setNewBinRange,
  efficiencyScore,
  newEfficiencyScore,
  isOutOfRange,
  onRebalance,
  currentBins,
  newBins,
}: {
  position: Position
  newBinRange: number
  setNewBinRange: (n: number) => void
  efficiencyScore: number
  newEfficiencyScore: number
  isOutOfRange: boolean
  onRebalance: () => void
  currentBins: { min: number; max: number }
  newBins: { min: number; max: number }
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
          <RefreshCw className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Rebalance Position</h2>
        <p className="text-zinc-400 text-sm">
          Re-center your liquidity around the current price
        </p>
      </div>

      {/* Status Alert */}
      {isOutOfRange && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <div className="text-red-400 font-medium text-sm">Position Out of Range!</div>
            <div className="text-red-400/70 text-xs">Your liquidity is not earning fees</div>
          </div>
        </div>
      )}

      {/* Efficiency Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
          <div className="text-xs text-zinc-500 mb-2">Current Efficiency</div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'text-2xl font-bold',
              efficiencyScore >= 70 ? 'text-emerald-500' :
              efficiencyScore >= 40 ? 'text-amber-500' : 'text-red-500'
            )}>
              {efficiencyScore}%
            </div>
            <EfficiencyRing score={efficiencyScore} size={40} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="text-xs text-emerald-400/70 mb-2">After Rebalance</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-emerald-500">
              {newEfficiencyScore}%
            </div>
            <EfficiencyRing score={newEfficiencyScore} size={40} color="emerald" />
          </div>
        </div>
      </div>

      {/* Range Adjustment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">New Bin Range</span>
          <span className="text-sm font-medium text-amber-500">±{newBinRange} bins</span>
        </div>

        <input
          type="range"
          min={3}
          max={25}
          value={newBinRange}
          onChange={(e) => setNewBinRange(Number(e.target.value))}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-zinc-500">
          <span>Concentrated</span>
          <span>Wide Range</span>
        </div>
      </div>

      {/* Bin Range Visualization */}
      <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500">Range Preview</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Current
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              New
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 font-mono text-sm">
          <span className="text-zinc-600">[{currentBins.min} - {currentBins.max}]</span>
          <ArrowRight className="h-4 w-4 text-amber-500" />
          <span className="text-amber-500">[{newBins.min} - {newBins.max}]</span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1">
          <Target className="h-4 w-4 text-amber-500" />
          <span className="text-xs text-zinc-400">
            Active Bin: <span className="text-white font-medium">{position.activeId}</span>
          </span>
        </div>
      </div>

      {/* XP Preview */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span className="text-sm text-purple-300">
          Earn <span className="font-bold text-white">+{Math.floor(50 + (position.bins.length * 10) + (newBinRange * 5))} XP</span> for rebalancing
        </span>
      </div>

      {/* Rebalance Button */}
      <button
        onClick={onRebalance}
        className="w-full btn-helios flex items-center justify-center gap-3 py-4 text-lg"
      >
        <Zap className="h-5 w-5" />
        Rebalance Now
        <Flame className="h-5 w-5 animate-fire-flicker" />
      </button>
    </div>
  )
}

function ProcessingStep({ step, txHash }: { step: 'approving' | 'removing' | 'adding'; txHash?: `0x${string}` }) {
  const stepConfig = {
    approving: {
      title: 'Approving...',
      description: 'Approving LB tokens for rebalance',
      stepNumber: 0,
    },
    removing: {
      title: 'Removing Liquidity...',
      description: 'Withdrawing from old bins',
      stepNumber: 1,
    },
    adding: {
      title: 'Adding to New Range...',
      description: 'Depositing into optimized bins',
      stepNumber: 2,
    },
  }

  const config = stepConfig[step]
  const explorerUrl = txHash ? `https://coston2-explorer.flare.network/tx/${txHash}` : null

  return (
    <div className="py-12 text-center">
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
        <div className="relative p-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
          <RefreshCw className="h-12 w-12 text-amber-500 animate-spin" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{config.title}</h3>
      <p className="text-zinc-400 text-sm mb-2">{config.description}</p>

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-amber-500 hover:text-amber-400 underline inline-block"
        >
          View on Explorer
        </a>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {/* Step 1: Approve */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm font-medium',
          config.stepNumber >= 1 ? 'bg-emerald-500 text-white' :
          step === 'approving' ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'
        )}>
          {config.stepNumber >= 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
        </div>

        <div className="w-8 h-1 rounded-full bg-zinc-700 overflow-hidden">
          <div className={cn(
            'h-full bg-amber-500 transition-all duration-500',
            config.stepNumber >= 1 ? 'w-full' : 'w-0'
          )} />
        </div>

        {/* Step 2: Remove */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm font-medium',
          config.stepNumber >= 2 ? 'bg-emerald-500 text-white' :
          step === 'removing' ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'
        )}>
          {config.stepNumber >= 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
        </div>

        <div className="w-8 h-1 rounded-full bg-zinc-700 overflow-hidden">
          <div className={cn(
            'h-full bg-amber-500 transition-all duration-500',
            config.stepNumber >= 2 ? 'w-full' : 'w-0'
          )} />
        </div>

        {/* Step 3: Add */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm font-medium',
          step === 'adding' ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-400'
        )}>
          3
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-xs text-zinc-500">
        <span className={cn(step === 'approving' && 'text-amber-500')}>Approve</span>
        <span className={cn(step === 'removing' && 'text-amber-500')}>Remove</span>
        <span className={cn(step === 'adding' && 'text-amber-500')}>Add</span>
      </div>
    </div>
  )
}

function ErrorStep({
  message,
  onRetry,
  onClose,
}: {
  message: string
  onRetry: () => void
  onClose: () => void
}) {
  return (
    <div className="py-8 text-center">
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="relative p-6 rounded-full bg-red-500/20">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Rebalance Failed</h3>
      <p className="text-zinc-400 text-sm mb-4 max-w-sm mx-auto">
        {message.length > 200 ? message.slice(0, 200) + '...' : message}
      </p>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  )
}

function SuccessStep({
  xpGained,
  newBins,
  onClose,
}: {
  xpGained: number
  newBins: number
  onClose: () => void
}) {
  return (
    <div className="py-8 text-center">
      {/* Success Icon */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
        <div className="relative p-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 animate-success-burst">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">Rebalance Complete!</h3>
      <p className="text-zinc-400 text-sm mb-6">
        Your liquidity is now perfectly centered
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
          <div className="text-xs text-zinc-500 mb-1">New Bins</div>
          <div className="text-2xl font-bold text-white">{newBins}</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="text-xs text-purple-400/70 mb-1">XP Earned</div>
          <div className="text-2xl font-bold text-purple-400 flex items-center justify-center gap-1">
            <Sparkles className="h-5 w-5" />
            +{xpGained}
          </div>
        </div>
      </div>

      {/* Achievement */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 mb-6 animate-shimmer">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          <span className="text-amber-400 font-medium">100% Efficiency Achieved!</span>
          <Flame className="h-5 w-5 text-amber-500 animate-fire-flicker" />
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full btn-helios-secondary py-3"
      >
        Done
      </button>
    </div>
  )
}

function EfficiencyRing({ score, size, color = 'amber' }: { score: number; size: number; color?: string }) {
  const circumference = 2 * Math.PI * (size / 2 - 4)
  const strokeDashoffset = circumference - (score / 100) * circumference

  const colorClass = color === 'emerald' ? 'stroke-emerald-500' :
    score >= 70 ? 'stroke-emerald-500' :
    score >= 40 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="text-zinc-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className={cn(colorClass, 'transition-all duration-500')}
      />
    </svg>
  )
}

function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#f59e0b', '#f97316', '#ea580c', '#22c55e', '#8b5cf6'][Math.floor(Math.random() * 5)],
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default RebalanceModal
