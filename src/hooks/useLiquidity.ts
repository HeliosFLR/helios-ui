'use client'

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { LB_ROUTER_ABI, LB_PAIR_ABI } from '@/contracts/abis'
import { CONTRACTS } from '@/config/contracts'

interface Position {
  id: bigint
  balance: bigint
  reserveX: bigint
  reserveY: bigint
}

// Hook to fetch user's liquidity positions in a pool
export function useUserPositions(pairAddress: `0x${string}`, activeId: number) {
  const { address } = useAccount()
  const userAddress = address || '0x0000000000000000000000000000000000000000' as `0x${string}`

  // Define a range of bins to check (around the active ID)
  const binRange = 50 // Check 50 bins on each side
  const binIds: bigint[] = []

  if (activeId > 0) {
    for (let i = -binRange; i <= binRange; i++) {
      const binId = activeId + i
      if (binId > 0) {
        binIds.push(BigInt(binId))
      }
    }
  }

  // Create batch calls for balanceOf
  const balanceContracts = binIds.map(id => ({
    address: pairAddress,
    abi: LB_PAIR_ABI,
    functionName: 'balanceOf' as const,
    args: [userAddress, id] as const,
  }))

  // Create batch calls for getBin (to get reserves)
  const binContracts = binIds.map(id => ({
    address: pairAddress,
    abi: LB_PAIR_ABI,
    functionName: 'getBin' as const,
    args: [Number(id)] as const,
  }))

  // Create batch calls for totalSupply
  const supplyContracts = binIds.map(id => ({
    address: pairAddress,
    abi: LB_PAIR_ABI,
    functionName: 'totalSupply' as const,
    args: [id] as const,
  }))

  const { data: balances, isLoading: balancesLoading, refetch: refetchBalances } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!address && binIds.length > 0,
    },
  })

  const { data: bins, isLoading: binsLoading } = useReadContracts({
    contracts: binContracts,
    query: {
      enabled: binIds.length > 0,
    },
  })

  const { data: supplies, isLoading: suppliesLoading } = useReadContracts({
    contracts: supplyContracts,
    query: {
      enabled: binIds.length > 0,
    },
  })

  // Process the results to find positions with balance
  const positions: Position[] = []
  let totalLiquidityX = BigInt(0)
  let totalLiquidityY = BigInt(0)

  if (balances && bins && supplies) {
    for (let i = 0; i < binIds.length; i++) {
      const balanceResult = balances[i]
      const binResult = bins[i]
      const supplyResult = supplies[i]

      if (
        balanceResult?.status === 'success' &&
        binResult?.status === 'success' &&
        supplyResult?.status === 'success'
      ) {
        const balance = balanceResult.result as bigint
        const [reserveX, reserveY] = binResult.result as [bigint, bigint]
        const totalSupply = supplyResult.result as bigint

        if (balance > BigInt(0) && totalSupply > BigInt(0)) {
          // Calculate user's share of reserves
          const userReserveX = (reserveX * balance) / totalSupply
          const userReserveY = (reserveY * balance) / totalSupply

          positions.push({
            id: binIds[i],
            balance,
            reserveX: userReserveX,
            reserveY: userReserveY,
          })

          totalLiquidityX += userReserveX
          totalLiquidityY += userReserveY
        }
      }
    }
  }

  return {
    positions,
    totalLiquidityX,
    totalLiquidityY,
    isLoading: balancesLoading || binsLoading || suppliesLoading,
    refetch: refetchBalances,
  }
}

// Hook to check if the LB pair is approved for the router
export function useLBPairApproval(pairAddress: `0x${string}`) {
  const { address } = useAccount()

  const { data: isApproved, refetch } = useReadContract({
    address: pairAddress,
    abi: LB_PAIR_ABI,
    functionName: 'isApprovedForAll',
    args: [address || '0x0000000000000000000000000000000000000000', CONTRACTS.LB_ROUTER],
    query: {
      enabled: !!address,
    },
  })

  return {
    isApproved: isApproved as boolean || false,
    refetch,
  }
}

// Hook to approve the LB pair for the router
export function useApproveForAll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approveForAll = async (pairAddress: `0x${string}`, spender: `0x${string}`) => {
    writeContract({
      address: pairAddress,
      abi: LB_PAIR_ABI,
      functionName: 'approveForAll',
      args: [spender, true],
    })
  }

  return {
    approveForAll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

interface RemoveLiquidityParams {
  tokenX: `0x${string}`
  tokenY: `0x${string}`
  binStep: number
  amountXMin: bigint
  amountYMin: bigint
  ids: bigint[]
  amounts: bigint[]
  to: `0x${string}`
}

// Hook to remove liquidity
export function useRemoveLiquidity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const removeLiquidity = async (params: RemoveLiquidityParams) => {
    const { tokenX, tokenY, binStep, amountXMin, amountYMin, ids, amounts, to } = params

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

    writeContract({
      address: CONTRACTS.LB_ROUTER,
      abi: LB_ROUTER_ABI,
      functionName: 'removeLiquidity',
      args: [
        tokenX,
        tokenY,
        binStep,
        amountXMin,
        amountYMin,
        ids,
        amounts,
        to,
        deadline,
      ],
    })
  }

  return {
    removeLiquidity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
