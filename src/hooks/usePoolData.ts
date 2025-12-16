'use client'

import { useReadContract, useReadContracts } from 'wagmi'
import { LB_PAIR_ABI } from '@/contracts/abis'
import { POOLS, type Pool } from '@/config/contracts'

export function usePoolActiveId(poolAddress: `0x${string}`) {
  const { data: activeId, isLoading } = useReadContract({
    address: poolAddress,
    abi: LB_PAIR_ABI,
    functionName: 'getActiveId',
  })

  return { activeId, isLoading }
}

export function usePoolReserves(poolAddress: `0x${string}`) {
  const { data: reserves, isLoading } = useReadContract({
    address: poolAddress,
    abi: LB_PAIR_ABI,
    functionName: 'getReserves',
  })

  return {
    reserveX: reserves?.[0] ?? BigInt(0),
    reserveY: reserves?.[1] ?? BigInt(0),
    isLoading,
  }
}

export function usePoolsData() {
  const contracts = POOLS.map((pool) => ({
    address: pool.address,
    abi: LB_PAIR_ABI,
    functionName: 'getReserves' as const,
  }))

  const activeIdContracts = POOLS.map((pool) => ({
    address: pool.address,
    abi: LB_PAIR_ABI,
    functionName: 'getActiveId' as const,
  }))

  const { data: reservesData, isLoading: reservesLoading } = useReadContracts({
    contracts,
    query: {
      staleTime: 20000,
      refetchInterval: 30000,
    },
  })

  const { data: activeIdData, isLoading: activeIdLoading } = useReadContracts({
    contracts: activeIdContracts,
    query: {
      staleTime: 20000,
      refetchInterval: 30000,
    },
  })

  const poolsWithData = POOLS.map((pool, index) => {
    const reserves = reservesData?.[index]?.result as [bigint, bigint] | undefined
    const activeIdRaw = activeIdData?.[index]?.result
    // activeId comes back as bigint from contract, convert to number
    const activeId = activeIdRaw !== undefined ? Number(activeIdRaw) : 0

    return {
      ...pool,
      reserveX: reserves?.[0] ?? BigInt(0),
      reserveY: reserves?.[1] ?? BigInt(0),
      activeId,
    }
  })

  return {
    pools: poolsWithData,
    isLoading: reservesLoading || activeIdLoading,
  }
}

export function findBestPool(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`
): Pool | undefined {
  return POOLS.find((pool) => {
    const matchXY =
      pool.tokenX.address.toLowerCase() === tokenIn.toLowerCase() &&
      pool.tokenY.address.toLowerCase() === tokenOut.toLowerCase()
    const matchYX =
      pool.tokenY.address.toLowerCase() === tokenIn.toLowerCase() &&
      pool.tokenX.address.toLowerCase() === tokenOut.toLowerCase()
    return matchXY || matchYX
  })
}
