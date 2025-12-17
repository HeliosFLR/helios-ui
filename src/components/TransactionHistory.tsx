'use client'

import { useState } from 'react'
import {
  History,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRightLeft,
  Droplets,
  ChevronDown,
  Trash2,
  Clock
} from 'lucide-react'
import {
  useTransactionHistory,
  formatTransactionType,
  getTransactionExplorerUrl,
  formatTimeAgo,
  type Transaction
} from '@/hooks/useTransactionHistory'
import { cn } from '@/lib/utils'

export function TransactionHistory() {
  const { transactions, clearHistory, pendingCount } = useTransactionHistory()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
          'bg-zinc-800/50 border border-white/5 hover:border-dune-400/30',
          isOpen && 'bg-dune-400/10 border-dune-400/30'
        )}
      >
        <History className="h-4 w-4 text-zinc-400" />
        {pendingCount > 0 && (
          <span className="flex items-center justify-center h-5 w-5 text-xs font-medium bg-dune-400 text-black rounded-full animate-pulse">
            {pendingCount}
          </span>
        )}
        <ChevronDown className={cn(
          'h-4 w-4 text-zinc-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl overflow-hidden z-50 animate-float-up">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-dune-400" />
              <span className="font-semibold text-white">Recent Transactions</span>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-colors"
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Transaction List */}
          <div className="max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No recent transactions</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.hash} transaction={tx} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { type, status, hash, timestamp, tokenIn, tokenOut, amountIn, amountOut, poolPair } = transaction

  const StatusIcon = {
    pending: <Loader2 className="h-4 w-4 text-dune-400 animate-spin" />,
    confirmed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
  }[status]

  const TypeIcon = {
    swap: <ArrowRightLeft className="h-4 w-4" />,
    add_liquidity: <Droplets className="h-4 w-4" />,
    remove_liquidity: <Droplets className="h-4 w-4" />,
    approve: <CheckCircle2 className="h-4 w-4" />,
  }[type]

  return (
    <a
      href={getTransactionExplorerUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors group"
    >
      {/* Type Icon */}
      <div className={cn(
        'p-2 rounded-xl',
        status === 'confirmed' && 'bg-emerald-500/10 text-emerald-500',
        status === 'pending' && 'bg-dune-400/10 text-dune-400',
        status === 'failed' && 'bg-red-500/10 text-red-500'
      )}>
        {TypeIcon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">
            {formatTransactionType(type)}
          </span>
          {StatusIcon}
        </div>
        <div className="text-xs text-zinc-500 truncate">
          {type === 'swap' && tokenIn && tokenOut && (
            <span>{amountIn} {tokenIn} → {amountOut} {tokenOut}</span>
          )}
          {(type === 'add_liquidity' || type === 'remove_liquidity') && poolPair && (
            <span>{poolPair}</span>
          )}
          {type === 'approve' && tokenIn && (
            <span>Approved {tokenIn}</span>
          )}
        </div>
      </div>

      {/* Time & Link */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-zinc-500">{formatTimeAgo(timestamp)}</span>
        <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-dune-400 transition-colors" />
      </div>
    </a>
  )
}

// Mini version for header
export function TransactionHistoryMini() {
  const { pendingCount } = useTransactionHistory()

  if (pendingCount === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dune-400/10 border border-dune-400/20">
      <Loader2 className="h-3.5 w-3.5 text-dune-400 animate-spin" />
      <span className="text-xs font-medium text-dune-400">{pendingCount} pending</span>
    </div>
  )
}
