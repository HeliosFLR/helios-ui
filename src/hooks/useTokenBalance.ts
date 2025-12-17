'use client'

import { useReadContract, useAccount, useBalance } from 'wagmi'
import { ERC20_ABI } from '@/contracts/abis'
import { NATIVE_TOKEN_ADDRESS } from '@/config/contracts'

export function useTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount()

  const isNative = tokenAddress?.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()

  // For native token, use useBalance
  const { data: nativeBalance, isLoading: isNativeLoading, refetch: refetchNative } = useBalance({
    address: address,
    query: {
      enabled: !!address && isNative,
      refetchInterval: 5000,
      staleTime: 3000,
    },
  })

  // For ERC20 tokens, use useReadContract
  const { data: erc20Balance, isLoading: isErc20Loading, refetch: refetchErc20, isError } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address && !isNative,
      refetchInterval: 5000, // Poll every 5 seconds for balance updates
      staleTime: 3000, // Consider data stale after 3 seconds
      retry: 3, // Retry failed RPC calls 3 times
      retryDelay: 1000, // Wait 1 second between retries
    },
  })

  // Force refetch with retry logic
  const refetchWithRetry = async () => {
    if (isNative) {
      await refetchNative()
      return
    }
    for (let i = 0; i < 3; i++) {
      try {
        await refetchErc20()
        return
      } catch {
        if (i < 2) await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  const balance = isNative ? (nativeBalance?.value ?? BigInt(0)) : (erc20Balance ?? BigInt(0))
  const isLoading = isNative ? isNativeLoading : isErc20Loading

  return {
    balance,
    isLoading,
    isError: isNative ? false : isError,
    refetch: refetchWithRetry,
  }
}

export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  const { address } = useAccount()

  const isNative = tokenAddress?.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!address && !!spenderAddress && !isNative,
      refetchInterval: 5000, // Poll for allowance updates
      staleTime: 3000,
      retry: 3,
      retryDelay: 1000,
    },
  })

  // Force refetch with retry logic
  const refetchWithRetry = async () => {
    if (isNative) return // No need to refetch for native token
    for (let i = 0; i < 3; i++) {
      try {
        await refetch()
        return
      } catch {
        if (i < 2) await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  // Native tokens don't need approval - return max value
  const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

  return {
    allowance: isNative ? MAX_UINT256 : (allowance ?? BigInt(0)),
    isLoading: isNative ? false : isLoading,
    refetch: refetchWithRetry,
  }
}
