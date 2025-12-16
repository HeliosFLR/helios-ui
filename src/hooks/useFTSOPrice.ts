'use client'

import { useReadContract, useReadContracts } from 'wagmi'

// Flare Contract Registry address (same on all Flare networks)
const FLARE_CONTRACT_REGISTRY = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019'

// ABI for FlareContractRegistry
const FLARE_CONTRACT_REGISTRY_ABI = [
  {
    inputs: [{ name: '_name', type: 'string' }],
    name: 'getContractAddressByName',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ABI for FtsoRegistry
const FTSO_REGISTRY_ABI = [
  {
    inputs: [{ name: '_symbol', type: 'string' }],
    name: 'getCurrentPriceWithDecimals',
    outputs: [
      { name: '_price', type: 'uint256' },
      { name: '_timestamp', type: 'uint256' },
      { name: '_assetPriceUsdDecimals', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_symbol', type: 'string' }],
    name: 'getCurrentPrice',
    outputs: [
      { name: '_price', type: 'uint256' },
      { name: '_timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Get FtsoRegistry address from FlareContractRegistry
export function useFtsoRegistryAddress() {
  return useReadContract({
    address: FLARE_CONTRACT_REGISTRY,
    abi: FLARE_CONTRACT_REGISTRY_ABI,
    functionName: 'getContractAddressByName',
    args: ['FtsoRegistry'],
  })
}

// Main hook to get FTSO price for a symbol
export function useFTSOPrice(symbol: string) {
  // First get the FtsoRegistry address
  const { data: registryAddress } = useFtsoRegistryAddress()

  // Then get the price (C2FLR for Coston2, FLR for mainnet)
  const ftsoSymbol = symbol === 'WFLR' || symbol === 'FLR' ? 'C2FLR' : symbol

  const { data, isLoading, error, refetch } = useReadContract({
    address: registryAddress as `0x${string}`,
    abi: FTSO_REGISTRY_ABI,
    functionName: 'getCurrentPriceWithDecimals',
    args: [ftsoSymbol],
    query: {
      enabled: !!registryAddress,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  })

  const price = data ? Number(data[0]) / Math.pow(10, Number(data[2])) : null
  const timestamp = data ? Number(data[1]) : null
  const decimals = data ? Number(data[2]) : null

  return {
    price,
    timestamp,
    decimals,
    rawPrice: data?.[0],
    isLoading,
    error,
    refetch,
  }
}

// Hook to get multiple FTSO prices at once
export function useFTSOPrices(symbols: string[]) {
  const { data: registryAddress } = useFtsoRegistryAddress()

  const contracts = symbols.map((symbol) => {
    const ftsoSymbol = symbol === 'WFLR' || symbol === 'FLR' ? 'C2FLR' : symbol
    return {
      address: registryAddress as `0x${string}`,
      abi: FTSO_REGISTRY_ABI,
      functionName: 'getCurrentPriceWithDecimals' as const,
      args: [ftsoSymbol] as const,
    }
  })

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!registryAddress,
      refetchInterval: 30000,
    },
  })

  const prices: Record<string, { price: number; timestamp: number } | null> = {}

  if (data) {
    symbols.forEach((symbol, index) => {
      const result = data[index]
      if (result.status === 'success' && result.result) {
        const [rawPrice, timestamp, decimals] = result.result as [bigint, bigint, bigint]
        prices[symbol] = {
          price: Number(rawPrice) / Math.pow(10, Number(decimals)),
          timestamp: Number(timestamp),
        }
      } else {
        prices[symbol] = null
      }
    })
  }

  return {
    prices,
    isLoading,
    error,
    refetch,
  }
}

// Format price for display
export function formatUSDPrice(price: number | null): string {
  if (price === null) return '--'
  if (price < 0.01) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(4)}`
  if (price < 100) return `$${price.toFixed(2)}`
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

// Calculate time since last update
export function getTimeSinceUpdate(timestamp: number | null): string {
  if (!timestamp) return '--'
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
