'use client'

import { useReadContract, useAccount } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'

export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount()

  const { data: balance, isLoading, refetch, isError } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
      refetchInterval: 5000, // Poll every 5 seconds for balance updates
      staleTime: 3000, // Consider data stale after 3 seconds
      retry: 3, // Retry failed RPC calls 3 times
      retryDelay: 1000, // Wait 1 second between retries
    },
  })

  // Force refetch with retry logic
  const refetchWithRetry = async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await refetch()
        return
      } catch {
        if (i < 2) await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  return {
    balance: balance ?? BigInt(0),
    isLoading,
    isError,
    refetch: refetchWithRetry,
  }
}

export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  const { address } = useAccount()

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!address && !!spenderAddress,
      refetchInterval: 5000, // Poll for allowance updates
      staleTime: 3000,
      retry: 3,
      retryDelay: 1000,
    },
  })

  // Force refetch with retry logic
  const refetchWithRetry = async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await refetch()
        return
      } catch {
        if (i < 2) await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  return {
    allowance: allowance ?? BigInt(0),
    isLoading,
    refetch: refetchWithRetry,
  }
}
