'use client'

import { useReadContracts } from 'wagmi'
import { useEffect, useState } from 'react'
import { isMainnet } from '@/config/chains'

// FastUpdater ABI for getting current feeds
const FAST_UPDATER_ABI = [
  {
    inputs: [{ internalType: 'uint256[]', name: '_indices', type: 'uint256[]' }],
    name: 'fetchCurrentFeeds',
    outputs: [
      { internalType: 'uint256[]', name: '_feeds', type: 'uint256[]' },
      { internalType: 'int8[]', name: '_decimals', type: 'int8[]' },
      { internalType: 'uint64', name: '_timestamp', type: 'uint64' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// FastUpdater address
const FAST_UPDATER_ADDRESS = isMainnet
  ? '0x70e8870ef234EcD665F96Da4c669dc12c1e1c116' // Flare mainnet
  : '0x58fb598EC6DB6901aA6F26a9A2087E9274128E59' // Coston2 testnet

// Feed indices for FastUpdater (these map to specific price feeds)
// See: https://dev.flare.network/ftso/feeds
const FEED_INDICES = {
  FLR: 0,    // FLR/USD
  USDC: 16,  // USDC/USD
  USDT: 17,  // USDT/USD
}

// Sceptre sFLR contract for getting sFLR exchange rate
const SFLR_CONTRACT_ADDRESS = isMainnet
  ? '0x12e605bc104e93B45e1aD99F9e555f659051c2BB' // Flare mainnet
  : '0x12e605bc104e93B45e1aD99F9e555f659051c2BB' // Same on testnet (or update if different)

const SFLR_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_sharesAmount', type: 'uint256' }],
    name: 'getPooledFlrByShares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface TokenPrice {
  price: number
  decimals: number
  timestamp: number
  change24h: number
}

export interface FtsoPrices {
  [symbol: string]: TokenPrice
}

// Cache for 24h ago prices to calculate change
const priceCache24h: { [symbol: string]: { price: number; timestamp: number } } = {}

export function useFtsoPrices(): {
  prices: FtsoPrices
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const [prices, setPrices] = useState<FtsoPrices>({})

  // Fetch current prices from FastUpdater and sFLR exchange rate from Sceptre
  const {
    data: feedData,
    isLoading,
    error,
    refetch,
  } = useReadContracts({
    contracts: [
      {
        address: FAST_UPDATER_ADDRESS as `0x${string}`,
        abi: FAST_UPDATER_ABI,
        functionName: 'fetchCurrentFeeds',
        args: [[BigInt(FEED_INDICES.FLR), BigInt(FEED_INDICES.USDC), BigInt(FEED_INDICES.USDT)]],
      },
      {
        address: SFLR_CONTRACT_ADDRESS as `0x${string}`,
        abi: SFLR_ABI,
        functionName: 'getPooledFlrByShares',
        args: [BigInt(1e18)], // 1 sFLR in wei returns amount of FLR
      },
    ],
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 15000,
    },
  })

  // Process feed data
  useEffect(() => {
    if (feedData && feedData[0]?.status === 'success' && feedData[0].result) {
      const result = feedData[0].result as [bigint[], number[], bigint]
      const feeds = result[0]
      const decimals = result[1]
      const timestamp = Number(result[2])

      const newPrices: FtsoPrices = {}

      // FLR price (index 0 in our request - FEED_INDICES.FLR = 0)
      let flrPrice = 0
      if (feeds[0]) {
        flrPrice = Number(feeds[0]) / Math.pow(10, Math.abs(decimals[0]))
        const change24h = calculateChange24h('WFLR', flrPrice)
        newPrices['WFLR'] = {
          price: flrPrice,
          decimals: decimals[0],
          timestamp,
          change24h,
        }
      }

      // sFLR price from Sceptre contract (real exchange rate)
      if (flrPrice > 0 && feedData[1]?.status === 'success' && feedData[1].result) {
        // getPooledFlrByShares(1e18) returns how much FLR 1 sFLR is worth
        const sflrToFlrRate = Number(feedData[1].result as bigint) / 1e18
        const sflrPrice = flrPrice * sflrToFlrRate
        const change24h = calculateChange24h('sFLR', sflrPrice)
        newPrices['sFLR'] = {
          price: sflrPrice,
          decimals: decimals[0],
          timestamp,
          change24h,
        }
      } else if (flrPrice > 0) {
        // Fallback: estimate sFLR as FLR * 1.05 if Sceptre call fails
        newPrices['sFLR'] = {
          price: flrPrice * 1.05,
          decimals: decimals[0],
          timestamp,
          change24h: calculateChange24h('sFLR', flrPrice * 1.05),
        }
      }

      // USDC price (index 1 in our request - FEED_INDICES.USDC = 16)
      if (feeds[1]) {
        const usdcPrice = Number(feeds[1]) / Math.pow(10, Math.abs(decimals[1]))
        const change24h = calculateChange24h('USDC', usdcPrice)
        newPrices['USDC'] = {
          price: usdcPrice,
          decimals: decimals[1],
          timestamp,
          change24h,
        }
      }

      // USDT price (index 2 in our request - FEED_INDICES.USDT = 17)
      if (feeds[2]) {
        const usdtPrice = Number(feeds[2]) / Math.pow(10, Math.abs(decimals[2]))
        const change24h = calculateChange24h('USDT', usdtPrice)
        newPrices['USDT'] = {
          price: usdtPrice,
          decimals: decimals[2],
          timestamp,
          change24h,
        }
      }

      setPrices(newPrices)
    }
  }, [feedData])

  return { prices, isLoading, error: error as Error | null, refetch }
}

// Calculate 24h change (simplified - stores first seen price as reference)
function calculateChange24h(symbol: string, currentPrice: number): number {
  const now = Date.now()
  const cached = priceCache24h[symbol]

  if (!cached || now - cached.timestamp > 24 * 60 * 60 * 1000) {
    // Cache expired or doesn't exist, store current price
    priceCache24h[symbol] = { price: currentPrice, timestamp: now }
    return 0
  }

  // Calculate percentage change
  const change = ((currentPrice - cached.price) / cached.price) * 100
  return change
}

// Hook for single token price
export function useTokenPrice(symbol: string): TokenPrice | null {
  const { prices } = useFtsoPrices()
  return prices[symbol] || null
}

// Fallback prices when FTSO is unavailable (updated Dec 2025)
export const FALLBACK_PRICES: FtsoPrices = {
  WFLR: { price: 0.01748, decimals: 7, timestamp: Date.now(), change24h: 0 },
  USDT: { price: 1.0000, decimals: 6, timestamp: Date.now(), change24h: 0 },
  USDC: { price: 1.0000, decimals: 6, timestamp: Date.now(), change24h: 0 },
  sFLR: { price: 0.01892, decimals: 7, timestamp: Date.now(), change24h: 0 },
}
