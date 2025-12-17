'use client'

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { WNAT_ADDRESS } from '@/config/contracts'

const WNAT_ABI = [
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export function useWrap() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    query: {
      refetchInterval: 2000,
    },
  })

  const wrap = async (amount: bigint) => {
    if (!address) return

    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'deposit',
      value: amount,
    })
  }

  const unwrap = async (amount: bigint) => {
    if (!address) return

    writeContract({
      address: WNAT_ADDRESS,
      abi: WNAT_ABI,
      functionName: 'withdraw',
      args: [amount],
    })
  }

  return {
    wrap,
    unwrap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}
