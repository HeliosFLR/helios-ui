'use client'

import { useFTSOPrice, formatUSDPrice, getTimeSinceUpdate } from '@/hooks/useFTSOPrice'
import { TrendingUp, RefreshCw, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FTSOPriceDisplayProps {
  symbol?: string
  className?: string
  compact?: boolean
}

export function FTSOPriceDisplay({ symbol = 'WFLR', className, compact = false }: FTSOPriceDisplayProps) {
  const { price, timestamp, isLoading, refetch } = useFTSOPrice(symbol)

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Flame className="h-4 w-4 text-dune-400" />
        <span className="text-zinc-400">FLR:</span>
        <span className="text-white font-mono">
          {isLoading ? '...' : formatUSDPrice(price)}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/5',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-dune-400/10">
          <TrendingUp className="h-4 w-4 text-dune-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase">FTSO</span>
            <span className="text-white font-semibold font-mono">
              {isLoading ? '...' : formatUSDPrice(price)}
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            {getTimeSinceUpdate(timestamp)}
          </div>
        </div>
      </div>
      <button
        onClick={() => refetch()}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        title="Refresh price"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
      </button>
    </div>
  )
}

// Mini version for header
export function FTSOPriceBadge() {
  const { price, isLoading } = useFTSOPrice('WFLR')

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dune-400/10 border border-dune-400/20">
      <Flame className="h-3.5 w-3.5 text-dune-400" />
      <span className="text-xs font-medium text-dune-300">
        FLR {isLoading ? '...' : formatUSDPrice(price)}
      </span>
    </div>
  )
}
