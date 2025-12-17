'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  Gift,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { cn, formatAmount } from '@/lib/utils'
import {
  useDelegationInfo,
  useDelegate,
  useUndelegateAll,
  useWNatBalance,
  useNativeBalance,
  useFTSOProviders,
  useUnclaimedEpochs,
  useClaimRewards,
} from '@/hooks/useFTSODelegation'
import { type FTSOProvider, getExplorerUrl } from '@/config/contracts'

export function FTSODelegationCard() {
  const { isConnected } = useAccount()
  const { balance: wnatBalance, isLoading: balanceLoading, refetch: refetchBalance } = useWNatBalance()
  const { balance: nativeBalance } = useNativeBalance()
  const { delegationInfo, isLoading: delegationLoading, isDelegated, refetch: refetchDelegation } = useDelegationInfo()
  const providers = useFTSOProviders()

  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<FTSOProvider | null>(null)
  const [delegationPercent, setDelegationPercent] = useState(100)

  const { delegate, isPending: isDelegating, isConfirming: isDelegateConfirming, isSuccess: delegateSuccess, error: delegateError, reset: resetDelegate } = useDelegate()
  const { undelegateAll, isPending: isUndelegating, isConfirming: isUndelegateConfirming, isSuccess: undelegateSuccess, error: undelegateError, reset: resetUndelegate } = useUndelegateAll()
  const { epochs: unclaimedEpochs, refetch: refetchEpochs } = useUnclaimedEpochs()
  const { claimRewards, isPending: isClaiming, isConfirming: isClaimConfirming, isSuccess: claimSuccess, error: claimError, reset: resetClaim } = useClaimRewards()

  // Refetch after successful delegation/undelegation/claim
  useEffect(() => {
    if (delegateSuccess || undelegateSuccess) {
      refetchDelegation()
      refetchBalance()
      setTimeout(() => {
        resetDelegate()
        resetUndelegate()
      }, 3000)
    }
  }, [delegateSuccess, undelegateSuccess, refetchDelegation, refetchBalance, resetDelegate, resetUndelegate])

  useEffect(() => {
    if (claimSuccess) {
      refetchEpochs()
      refetchBalance()
      setTimeout(() => {
        resetClaim()
      }, 3000)
    }
  }, [claimSuccess, refetchEpochs, refetchBalance, resetClaim])

  const handleDelegate = async () => {
    if (!selectedProvider) return
    // Convert percentage to basis points (100% = 10000 bips)
    const bips = delegationPercent * 100
    await delegate(selectedProvider.address, bips)
  }

  const handleUndelegate = async () => {
    await undelegateAll()
  }

  const handleClaimRewards = async () => {
    if (!unclaimedEpochs || unclaimedEpochs.length === 0) return
    await claimRewards(unclaimedEpochs)
  }

  const hasUnclaimedRewards = unclaimedEpochs && unclaimedEpochs.length > 0

  if (!isConnected) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <Gift className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">FTSO Delegation</h3>
        </div>
        <p className="text-zinc-500 text-sm">Connect wallet to manage FTSO delegation and earn rewards.</p>
      </div>
    )
  }

  const isPending = isDelegating || isDelegateConfirming || isUndelegating || isUndelegateConfirming || isClaiming || isClaimConfirming
  const isLoading = balanceLoading || delegationLoading

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Gift className="h-6 w-6 text-purple-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">FTSO Delegation</h3>
              {isDelegated && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              Delegate WFLR to earn FTSO rewards (~3-5% APR)
            </p>
          </div>
        </div>
        <div className={cn(
          'p-2 rounded-xl transition-all',
          isExpanded ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-500'
        )}>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 animate-float-up">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : (
            <>
          {/* Balance Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
              <div className="text-xs text-zinc-500 mb-1">Native FLR</div>
              <div className="text-lg font-bold text-white">
                {nativeBalance ? formatAmount(nativeBalance, 18, 4) : '0'} FLR
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/5">
              <div className="text-xs text-zinc-500 mb-1">Wrapped WFLR</div>
              <div className="text-lg font-bold text-white">
                {wnatBalance ? formatAmount(wnatBalance, 18, 4) : '0'} WFLR
              </div>
            </div>
          </div>

          {/* Current Delegation Status */}
          {isDelegated && delegationInfo && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-400">Currently Delegated</span>
              </div>
              <div className="space-y-2">
                {delegationInfo.delegatees.map((addr, i) => (
                  <div key={addr} className="flex items-center justify-between text-sm">
                    <a
                      href={getExplorerUrl('address', addr)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
                    >
                      {addr.slice(0, 6)}...{addr.slice(-4)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-white font-medium">
                      {(delegationInfo.percentages[i] / 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUndelegate}
                disabled={isPending}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                {isUndelegating || isUndelegateConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </span>
                ) : (
                  'Remove All Delegations'
                )}
              </button>
            </div>
          )}

          {/* Claim Rewards Section */}
          {hasUnclaimedRewards && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-dune-400/10 to-dune-500/10 border border-dune-400/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-dune-400" />
                  <span className="text-sm font-medium text-dune-300">Unclaimed Rewards</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {unclaimedEpochs?.length} epoch{unclaimedEpochs && unclaimedEpochs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={isPending}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-dune-400 to-dune-500 text-black text-sm font-semibold hover:from-dune-300 hover:to-orange-400 transition-all disabled:opacity-50"
              >
                {isClaiming || isClaimConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isClaimConfirming ? 'Confirming...' : 'Claiming...'}
                  </span>
                ) : (
                  'Claim FTSO Rewards'
                )}
              </button>
            </div>
          )}

          {/* Delegate Form */}
          {!isDelegated && (
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Select FTSO Provider</label>
                <div className="grid gap-2">
                  {providers.map((provider) => (
                    <button
                      key={provider.address}
                      onClick={() => setSelectedProvider(provider)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all flex items-center justify-between',
                        selectedProvider?.address === provider.address
                          ? 'bg-purple-500/10 border-purple-500/30 text-white'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-purple-400" />
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-xs text-zinc-500">{provider.description}</div>
                        </div>
                      </div>
                      {selectedProvider?.address === provider.address && (
                        <CheckCircle2 className="h-4 w-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delegation Percentage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-400">Delegation Amount</label>
                  <span className="text-sm font-medium text-white">{delegationPercent}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={10}
                  value={delegationPercent}
                  onChange={(e) => setDelegationPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between mt-1 text-xs text-zinc-500">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Estimated Rewards */}
              {wnatBalance && wnatBalance > BigInt(0) && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-purple-300">
                      Est. Annual Reward: <span className="font-bold text-white">
                        ~{formatAmount((wnatBalance * BigInt(delegationPercent) * BigInt(4)) / BigInt(10000), 18, 2)} FLR
                      </span>
                      <span className="text-zinc-500 ml-1">(~4% APR)</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Delegate Button */}
              <button
                onClick={handleDelegate}
                disabled={!selectedProvider || isPending || !wnatBalance || wnatBalance === BigInt(0)}
                className={cn(
                  'w-full py-4 px-6 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isDelegating || isDelegateConfirming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isDelegateConfirming ? 'Confirming...' : 'Delegating...'}
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Delegate WFLR
                  </>
                )}
              </button>

              {!wnatBalance || wnatBalance === BigInt(0) ? (
                <p className="text-center text-sm text-zinc-500">
                  You need WFLR to delegate. Wrap your FLR first.
                </p>
              ) : null}
            </div>
          )}

          {/* Success/Error Messages */}
          {delegateSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-400 text-sm">Delegation successful! You are now earning FTSO rewards.</span>
            </div>
          )}

          {undelegateSuccess && (
            <div className="p-3 rounded-xl bg-dune-400/10 border border-dune-400/20 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-dune-400" />
              <span className="text-dune-300 text-sm">Delegation removed successfully.</span>
            </div>
          )}

          {claimSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-400 text-sm">Rewards claimed successfully!</span>
            </div>
          )}

          {(delegateError || undelegateError || claimError) && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-400 text-sm">Transaction failed. Please try again.</span>
            </div>
          )}

          {/* Info Note */}
          <div className="p-3 rounded-xl bg-zinc-800/30 border border-white/5">
            <p className="text-xs text-zinc-500">
              <strong className="text-zinc-400">Note:</strong> FTSO delegation earns rewards from Flare&apos;s oracle system.
              Delegated tokens remain in your wallet - only vote power is delegated.
              Rewards are distributed every ~3.5 days.
            </p>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  )
}

export default FTSODelegationCard
