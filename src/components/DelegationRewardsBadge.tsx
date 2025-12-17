'use client'

import { Flame, Gift, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DelegationRewardsBadgeProps {
  tokenSymbol: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * Badge showing that a pool earns WFLR delegation rewards (FTSO + FlareDrops)
 * Only shows for pools containing WFLR
 */
export function DelegationRewardsBadge({
  tokenSymbol,
  size = 'md',
  showLabel = true,
  className
}: DelegationRewardsBadgeProps) {
  // Only show for WFLR pools
  const isWFLR = tokenSymbol === 'WFLR' || tokenSymbol === 'FLR'
  if (!isWFLR) return null

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg font-medium',
        'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
        'border border-purple-500/30',
        'text-purple-300',
        sizeClasses[size],
        className
      )}
      title="This pool earns FTSO delegation rewards and FlareDrops"
    >
      <Gift className={cn(iconSizes[size], 'text-purple-400')} />
      {showLabel && (
        <span>+Rewards</span>
      )}
    </div>
  )
}

/**
 * Detailed delegation rewards info card
 */
export function DelegationRewardsInfo({ className }: { className?: string }) {
  return (
    <div className={cn(
      'p-4 rounded-xl',
      'bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-dune-400/10',
      'border border-purple-500/20',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">WFLR Delegation Rewards</h3>
          <p className="text-xs text-zinc-400">Earn extra on WFLR pools</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-300">
          <Flame className="h-4 w-4 text-dune-400" />
          <span>FTSO delegation rewards from voting power</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <Gift className="h-4 w-4 text-pink-400" />
          <span>FlareDrops distributed to LPs</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        WFLR in pools is automatically delegated to earn rewards,
        which are distributed proportionally to liquidity providers.
      </p>
    </div>
  )
}

/**
 * Small inline indicator for pool rows
 */
export function DelegationRewardsIndicator({
  hasWFLR,
  className
}: {
  hasWFLR: boolean
  className?: string
}) {
  if (!hasWFLR) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-purple-400',
        className
      )}
      title="Earns FTSO + FlareDrop rewards"
    >
      <Gift className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">+Rewards</span>
    </div>
  )
}
