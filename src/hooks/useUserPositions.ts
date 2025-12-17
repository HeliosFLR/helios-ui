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
  // Token amounts in the position
  totalAmountX: bigint
  totalAmountY: bigint
}

export interface BinPosition {
  binId: number
  liquidity: bigint
  totalSupply: bigint
  share: number
  isActive: boolean
  // User's share of reserves in this bin
  amountX: bigint
  amountY: bigint
}

// Range of bins to check around active bin
// Balance between catching limit orders and not overloading RPC
// 30 bins = ~3% price range which covers most limit orders
const BIN_RANGE = 30

export function useUserPositions() {
  const { address, isConnected } = useAccount()

  // First, get active IDs for all pools
  const activeIdContracts = POOLS.map((pool) => ({
    address: pool.address,
    abi: LB_PAIR_ABI,
    functionName: 'getActiveId' as const,
  }))

  const { data: activeIdData, isLoading: activeIdsLoading, isFetching: activeIdsFetching, refetch: refetchActiveIds } = useReadContracts({
    contracts: activeIdContracts,
    query: {
      refetchInterval: 15000, // Refresh every 15 seconds
      retry: 3,
      retryDelay: 1000,
      staleTime: 10000, // Consider data fresh for 10 seconds
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on focus (causes flicker)
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

  // Build getBin queries to fetch bin reserves
  const binReserveQueries = useMemo(() => {
    if (!activeIdData) return []

    const queries: {
      address: `0x${string}`
      abi: typeof LB_PAIR_ABI
      functionName: 'getBin'
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
            functionName: 'getBin',
            args: [binId],
          })
        }
      }
    })

    return queries
  }, [activeIdData])

  const { data: balanceData, isLoading: balancesLoading, isFetching: balancesFetching, refetch: refetchBalances } = useReadContracts({
    contracts: balanceQueries,
    query: {
      enabled: balanceQueries.length > 0 && isConnected,
      refetchInterval: 15000,
      retry: 3,
      retryDelay: 1000,
      staleTime: 10000,
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false,
    },
  })

  const { data: supplyData, isLoading: suppliesLoading, isFetching: suppliesFetching, refetch: refetchSupplies } = useReadContracts({
    contracts: supplyQueries,
    query: {
      enabled: supplyQueries.length > 0,
      refetchInterval: 15000,
      retry: 3,
      retryDelay: 1000,
      staleTime: 10000,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  })

  const { data: binReserveData, isLoading: reservesLoading, isFetching: reservesFetching, refetch: refetchReserves } = useReadContracts({
    contracts: binReserveQueries,
    query: {
      enabled: binReserveQueries.length > 0,
      refetchInterval: 15000,
      retry: 3,
      retryDelay: 1000,
      staleTime: 10000,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  })


  // Combined refetch function
  const refetch = async () => {
    await Promise.all([refetchActiveIds(), refetchBalances(), refetchSupplies(), refetchReserves()])
  }

  // Process positions using queryMeta for proper alignment
  const positions = useMemo<UserPosition[]>(() => {
    if (!activeIdData || !balanceData || !supplyData || !binReserveData || queryMeta.length === 0) return []

    // Group bins by pool
    const poolBins = new Map<number, BinPosition[]>()

    queryMeta.forEach((meta, index) => {
      const balance = balanceData[index]?.result as bigint | undefined
      const supply = supplyData[index]?.result as bigint | undefined
      const reserves = binReserveData[index]?.result as [bigint, bigint] | undefined
      const activeId = activeIdData[meta.poolIndex]?.result as number | undefined

      if (balance && balance > BigInt(0)) {
        // Calculate user's share of reserves
        let amountX = BigInt(0)
        let amountY = BigInt(0)

        if (reserves && supply && supply > BigInt(0)) {
          const [reserveX, reserveY] = reserves
          amountX = (reserveX * balance) / supply
          amountY = (reserveY * balance) / supply
        }

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
          amountX,
          amountY,
        })
      }
    })

    // Build result array - separate contiguous bin groups from isolated bins (limit orders)
    const result: UserPosition[] = []

    poolBins.forEach((bins, poolIndex) => {
      const pool = POOLS[poolIndex]
      const activeId = activeIdData[poolIndex]?.result as number | undefined
      if (!pool || !activeId) return

      // Sort bins by binId
      const sortedBins = bins.sort((a, b) => a.binId - b.binId)

      // Group bins into contiguous ranges
      // A bin is contiguous if it's within 3 bins of the previous one (allows small gaps)
      const groups: BinPosition[][] = []
      let currentGroup: BinPosition[] = []

      for (const bin of sortedBins) {
        if (currentGroup.length === 0) {
          currentGroup.push(bin)
        } else {
          const lastBin = currentGroup[currentGroup.length - 1]
          // If within 3 bins of the last one, it's part of the same group
          if (bin.binId - lastBin.binId <= 3) {
            currentGroup.push(bin)
          } else {
            // Start a new group
            groups.push(currentGroup)
            currentGroup = [bin]
          }
        }
      }
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }

      // Create a position for each group
      for (const groupBins of groups) {
        const totalLiquidity = groupBins.reduce((sum, bin) => sum + bin.liquidity, BigInt(0))
        const totalAmountX = groupBins.reduce((sum, bin) => sum + bin.amountX, BigInt(0))
        const totalAmountY = groupBins.reduce((sum, bin) => sum + bin.amountY, BigInt(0))

        result.push({
          pool,
          poolAddress: pool.address,
          tokenX: pool.tokenX,
          tokenY: pool.tokenY,
          binStep: pool.binStep,
          bins: groupBins,
          totalLiquidity,
          activeId,
          totalAmountX,
          totalAmountY,
        })
      }
    })

    return result
  }, [activeIdData, balanceData, supplyData, binReserveData, queryMeta])

  // isLoading = first load (no data yet)
  // isFetching = any fetch in progress (including refetch)
  const isLoading = activeIdsLoading || balancesLoading || suppliesLoading || reservesLoading
  const isFetching = activeIdsFetching || balancesFetching || suppliesFetching || reservesFetching

  return {
    positions,
    isLoading: isLoading && positions.length === 0, // Only show loading state on first load
    isFetching, // True when refreshing in background
    hasPositions: positions.length > 0,
    refetch,
  }
}
