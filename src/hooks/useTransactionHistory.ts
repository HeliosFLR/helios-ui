'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

export interface Transaction {
  hash: string
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'approve'
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  tokenIn?: string
  tokenOut?: string
  amountIn?: string
  amountOut?: string
  poolPair?: string
}

const STORAGE_KEY = 'helios_tx_history'
const MAX_TRANSACTIONS = 50

export function useTransactionHistory() {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && address) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${address}`)
      if (stored) {
        try {
          setTransactions(JSON.parse(stored))
        } catch {
          setTransactions([])
        }
      }
    }
  }, [address])

  // Save to localStorage when transactions change
  useEffect(() => {
    if (typeof window !== 'undefined' && address && transactions.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${address}`, JSON.stringify(transactions.slice(0, MAX_TRANSACTIONS)))
    }
  }, [transactions, address])

  const addTransaction = useCallback((tx: Omit<Transaction, 'timestamp'>) => {
    setTransactions(prev => [{
      ...tx,
      timestamp: Date.now(),
    }, ...prev].slice(0, MAX_TRANSACTIONS))
  }, [])

  const updateTransaction = useCallback((hash: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx =>
      tx.hash === hash ? { ...tx, ...updates } : tx
    ))
  }, [])

  const clearHistory = useCallback(() => {
    setTransactions([])
    if (typeof window !== 'undefined' && address) {
      localStorage.removeItem(`${STORAGE_KEY}_${address}`)
    }
  }, [address])

  const pendingCount = transactions.filter(tx => tx.status === 'pending').length

  return {
    transactions,
    addTransaction,
    updateTransaction,
    clearHistory,
    pendingCount,
  }
}

// Helper to format transaction for display
export function formatTransactionType(type: Transaction['type']): string {
  switch (type) {
    case 'swap': return 'Swap'
    case 'add_liquidity': return 'Add Liquidity'
    case 'remove_liquidity': return 'Remove Liquidity'
    case 'approve': return 'Approve'
    default: return 'Transaction'
  }
}

export function getTransactionExplorerUrl(hash: string): string {
  return `https://coston2-explorer.flare.network/tx/${hash}`
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return new Date(timestamp).toLocaleDateString()
}
