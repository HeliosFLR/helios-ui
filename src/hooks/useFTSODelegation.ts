'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi'
import { WNAT_ABI, FTSO_REWARD_MANAGER_ABI } from '@/contracts/abis'
import { WNAT_ADDRESS, FTSO_PROVIDERS, FTSO_REWARD_MANAGER_ADDRESS, type FTSOProvider } from '@/config/contracts'

export interface DelegationInfo {
  delegatees: `0x${string}`[]
  percentages: number[] // in basis points (10000 = 100%)
  count: number
}

// Hook to get user's WFLR balance (native wrapped token)
export function useWNatBalance() {
  const { address } = useAccount()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: WNAT_ADDRESS,
    abi: WNAT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    balance: balance as bigint | undefined,
    isLoading,
    refetch,
  }
}

// Hook to get user's native FLR balance
export function useNativeBalance() {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useBalance({
    address,
  })

  return {
    balance: data?.value,
    formatted: data?.formatted,
    isLoading,
    refetch,
  }
}

// Hook to get user's current delegation info
export function useDelegationInfo() {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useReadContract({
    address: WNAT_ADDRESS,
    abi: WNAT_ABI,
    functionName: 'delegatesOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const delegationInfo: DelegationInfo | null = data
    ? {
        delegatees: (data as [string[], bigint[], bigint, bigint])[0] as `0x${string}`[],
        percentages: (data as [string[], bigint[], bigint, bigint])[1].map(b => Number(b)),
        count: Number((data as [string[], bigint[], bigint, bigint])[2]),
      }
    : null

  return {
    delegationInfo,
    isLoading,
    refetch,
    isDelegated: delegationInfo ? delegationInfo.count > 0 : false,
  }
}

// Hook to get vote power delegated from user to a specific provider
export function useVotePowerFromTo(providerAddress: `0x${string}` | undefined) {
  const { address } = useAccount()

  const { data, isLoading } = useReadContract({
    address: WNAT_ADDRESS,
    abi: WNAT_ABI,
    functionName: 'votePowerFromTo',
    args: address && providerAddress ? [address, providerAddress] : undefined,
    query: {
      enabled: !!address && !!providerAddress,
    },
  })

  return {
    votePower: data as bigint | undefined,
    isLoading,
  }
}

// Hook to delegate to a single provider
export function useDelegate() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const delegate = async (providerAddress: `0x${string}`, bips: number) => {
    // bips is in basis points: 10000 = 100%
    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'delegate',
      args: [providerAddress, BigInt(bips)],
    })
  }

  return {
    delegate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// Hook to delegate to multiple providers
export function useBatchDelegate() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const batchDelegate = async (providers: { address: `0x${string}`; bips: number }[]) => {
    const addresses = providers.map(p => p.address)
    const bips = providers.map(p => BigInt(p.bips))

    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'batchDelegate',
      args: [addresses, bips],
    })
  }

  return {
    batchDelegate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// Hook to remove all delegations
export function useUndelegateAll() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const undelegateAll = async () => {
    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'undelegateAll',
    })
  }

  return {
    undelegateAll,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// Hook to wrap native FLR to WFLR
export function useWrapFLR() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const wrap = async (amount: bigint) => {
    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'deposit',
      value: amount,
    })
  }

  return {
    wrap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// Hook to unwrap WFLR to native FLR
export function useUnwrapFLR() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const unwrap = async (amount: bigint) => {
    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'withdraw',
      args: [amount],
    })
  }

  return {
    unwrap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// Get list of suggested FTSO providers
export function useFTSOProviders(): FTSOProvider[] {
  return FTSO_PROVIDERS
}

// Hook to get unclaimed reward epochs
export function useUnclaimedEpochs() {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useReadContract({
    address: FTSO_REWARD_MANAGER_ADDRESS,
    abi: FTSO_REWARD_MANAGER_ABI,
    functionName: 'getEpochsWithUnclaimedRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    epochs: data as bigint[] | undefined,
    isLoading,
    refetch,
  }
}

// Hook to get detailed reward state
export function useRewardState() {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useReadContract({
    address: FTSO_REWARD_MANAGER_ADDRESS,
    abi: FTSO_REWARD_MANAGER_ABI,
    functionName: 'getStateOfRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const rewardState = data
    ? {
        dataProviders: (data as [string[], bigint[], boolean[], boolean])[0] as `0x${string}`[],
        rewardAmounts: (data as [string[], bigint[], boolean[], boolean])[1].map(b => b as bigint),
        claimed: (data as [string[], bigint[], boolean[], boolean])[2],
        claimable: (data as [string[], bigint[], boolean[], boolean])[3],
      }
    : null

  // Calculate total unclaimed rewards
  const totalUnclaimedRewards = rewardState
    ? rewardState.rewardAmounts.reduce((sum, amount, i) => {
        if (!rewardState.claimed[i]) {
          return sum + amount
        }
        return sum
      }, BigInt(0))
    : BigInt(0)

  return {
    rewardState,
    totalUnclaimedRewards,
    isLoading,
    refetch,
  }
}

// Hook to get current reward epoch
export function useCurrentRewardEpoch() {
  const { data, isLoading } = useReadContract({
    address: FTSO_REWARD_MANAGER_ADDRESS,
    abi: FTSO_REWARD_MANAGER_ABI,
    functionName: 'getCurrentRewardEpoch',
  })

  return {
    currentEpoch: data as bigint | undefined,
    isLoading,
  }
}

// Hook to claim rewards
export function useClaimRewards() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const claimRewards = async (epochs: bigint[]) => {
    if (!address) return

    writeContract({
      address: FTSO_REWARD_MANAGER_ADDRESS,
      abi: FTSO_REWARD_MANAGER_ABI,
      functionName: 'claimReward',
      args: [address, address, epochs],
    })
  }

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}
