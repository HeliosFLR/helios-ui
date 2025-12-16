'use client'

import { useAccount, useReadContracts } from 'wagmi'
import { LB_PAIR_ABI } from '@/contracts/abis'
import { POOLS, type Pool, type Token } from '@/config/contracts'
import { useMemo } from 'react'

export interface UserPosition {
  pool: Pool
  poolAddress: `0x${string}`
  tokenX: Token
  tokenY: Token
  binStep: number
  bins: BinPosition[]
  totalLiquidity: bigint
  activeId: number
}

export interface BinPosition {
  binId: number
  liquidity: bigint
  totalSupply: bigint
  share: number
  isActive: boolean
}

// Range of bins to check around active bin
// Matches the maximum bin range in the add liquidity UI (25) plus buffer
const BIN_RANGE = 15

export function useUserPositions() {
  const { address, isConnected } = useAccount()

  // First, get active IDs for all pools
  const activeIdContracts = POOLS.map((pool) => ({
    address: pool.address,
    abi: LB_PAIR_ABI,
    functionName: 'getActiveId' as const,
  }))

  const { data: activeIdData, isLoading: activeIdsLoading, refetch: refetchActiveIds } = useReadContracts({
    contracts: activeIdContracts,
    query: {
      refetchInterval: 30000, // Refresh every 15 seconds
      retry: 3, // Retry failed requests up to 3 times
      retryDelay: 1000, // Wait 1 second between retries
      staleTime: 20000, // Consider data fresh for 10 seconds
    },
  })


  // Track query metadata for proper alignment
  interface QueryMeta {
    poolIndex: number
    binId: number
  }

  // Build balance queries for bins around active ID for each pool
  const { balanceQueries, queryMeta } = useMemo(() => {
    if (!address || !activeIdData) return { balanceQueries: [], queryMeta: [] }

    const queries: {
      address: `0x${string}`
      abi: typeof LB_PAIR_ABI
      functionName: 'balanceOf'
      args: [string, number]
    }[] = []
    const meta: QueryMeta[] = []

    POOLS.forEach((pool, poolIndex) => {
      const activeId = activeIdData[poolIndex]?.result as number | undefined
      if (!activeId) return

      // Query bins around active ID
      for (let offset = -BIN_RANGE; offset <= BIN_RANGE; offset++) {
        const binId = activeId + offset
        if (binId > 0) {
          queries.push({
            address: pool.address,
            abi: LB_PAIR_ABI,
            functionName: 'balanceOf',
            args: [address, binId],
          })
          meta.push({ poolIndex, binId })
        }
      }
    })

    return { balanceQueries: queries, queryMeta: meta }
  }, [address, activeIdData])

  // Build total supply queries
  const supplyQueries = useMemo(() => {
    if (!activeIdData) return []

    const queries: {
      address: `0x${string}`
      abi: typeof LB_PAIR_ABI
      functionName: 'totalSupply'
      args: [number]
    }[] = []

    POOLS.forEach((pool, poolIndex) => {
      const activeId = activeIdData[poolIndex]?.result as number | undefined
      if (!activeId) return

      for (let offset = -BIN_RANGE; offset <= BIN_RANGE; offset++) {
        const binId = activeId + offset
        if (binId > 0) {
          queries.push({
            address: pool.address,
            abi: LB_PAIR_ABI,
            functionName: 'totalSupply',
            args: [binId],
          })
        }
      }
    })

    return queries
  }, [activeIdData])

  const { data: balanceData, isLoading: balancesLoading, refetch: refetchBalances } = useReadContracts({
    contracts: balanceQueries,
    query: {
      enabled: balanceQueries.length > 0 && isConnected,
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
      staleTime: 20000,
    },
  })

  const { data: supplyData, isLoading: suppliesLoading, refetch: refetchSupplies } = useReadContracts({
    contracts: supplyQueries,
    query: {
      enabled: supplyQueries.length > 0,
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
      staleTime: 20000,
    },
  })


  // Combined refetch function
  const refetch = async () => {
    await Promise.all([refetchActiveIds(), refetchBalances(), refetchSupplies()])
  }

  // Process positions using queryMeta for proper alignment
  const positions = useMemo<UserPosition[]>(() => {
    if (!activeIdData || !balanceData || !supplyData || queryMeta.length === 0) return []

    // Group bins by pool
    const poolBins = new Map<number, BinPosition[]>()

    queryMeta.forEach((meta, index) => {
      const balance = balanceData[index]?.result as bigint | undefined
      const supply = supplyData[index]?.result as bigint | undefined
      const activeId = activeIdData[meta.poolIndex]?.result as number | undefined

      if (balance && balance > BigInt(0)) {
        if (!poolBins.has(meta.poolIndex)) {
          poolBins.set(meta.poolIndex, [])
        }
        poolBins.get(meta.poolIndex)!.push({
          binId: meta.binId,
          liquidity: balance,
          totalSupply: supply ?? BigInt(0),
          share: supply && supply > BigInt(0)
            ? Number((balance * BigInt(10000)) / supply) / 100
            : 0,
          isActive: meta.binId === activeId,
        })
      }
    })

    // Build result array
    const result: UserPosition[] = []

    poolBins.forEach((bins, poolIndex) => {
      const pool = POOLS[poolIndex]
      const activeId = activeIdData[poolIndex]?.result as number | undefined
      if (!pool || !activeId) return

      const totalLiquidity = bins.reduce((sum, bin) => sum + bin.liquidity, BigInt(0))

      result.push({
        pool,
        poolAddress: pool.address,
        tokenX: pool.tokenX,
        tokenY: pool.tokenY,
        binStep: pool.binStep,
        bins: bins.sort((a, b) => a.binId - b.binId),
        totalLiquidity,
        activeId,
      })
    })

    return result
  }, [activeIdData, balanceData, supplyData, queryMeta])

  return {
    positions,
    isLoading: activeIdsLoading || balancesLoading || suppliesLoading,
    hasPositions: positions.length > 0,
    refetch,
  }
}
