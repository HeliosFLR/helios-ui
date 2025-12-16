'use client'

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { LB_ROUTER_ABI, ERC20_ABI } from '@/contracts/abis'
import { CONTRACTS } from '@/config/contracts'

import { getBestSwapRoute } from './useQuote'

export function useSwap() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll every 2 seconds for better RPC compatibility
    },
  })

  const swap = async (
    amountIn: bigint,
    amountOutMin: bigint,
    tokenIn: `0x${string}`,
    tokenOut: `0x${string}`,
    binStep: number // fallback bin step if route finding fails
  ) => {
    if (!address) return

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

    // Get the best route (supports multi-hop)
    const route = getBestSwapRoute(tokenIn, tokenOut)

    

    if (route) {
      // Use the found route (could be direct or multi-hop)
      writeContract({
        address: CONTRACTS.LB_ROUTER,
        abi: LB_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountIn,
          amountOutMin,
          {
            pairBinSteps: route.binSteps,
            versions: route.versions,
            tokenPath: route.path,
          },
          address,
          deadline,
        ],
      })
    } else {
      // Fallback to direct route
      writeContract({
        address: CONTRACTS.LB_ROUTER,
        abi: LB_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountIn,
          amountOutMin,
          {
            pairBinSteps: [BigInt(binStep)],
            versions: [3], // V2_2
            tokenPath: [tokenIn, tokenOut],
          },
          address,
          deadline,
        ],
      })
    }
  }

  return {
    swap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

export function useApprove() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll every 2 seconds for better RPC compatibility
    },
  })

  const approve = async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

interface AddLiquidityParams {
  tokenX: `0x${string}`
  tokenY: `0x${string}`
  binStep: number
  amountX: bigint
  amountY: bigint
  activeId: number
  binRange: number
  distribution: 'uniform' | 'curve'
}

export function useAddLiquidity() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll every 2 seconds for better RPC compatibility
    },
  })

  const addLiquidity = async (params: AddLiquidityParams) => {
    if (!address) return

    const { tokenX, tokenY, binStep, amountX, amountY, activeId, binRange, distribution } = params

    // Build deltaIds array (relative to active bin)
    const deltaIds: bigint[] = []
    for (let i = -binRange; i <= binRange; i++) {
      deltaIds.push(BigInt(i))
    }

    const PRECISION = BigInt(10 ** 18)

    // Build distribution arrays based on distribution type
    const distributionX: bigint[] = []
    const distributionY: bigint[] = []

    const ZERO = BigInt(0)

    if (distribution === 'uniform') {
      // Uniform distribution: equal amounts in each bin
      // X tokens go to bins above active (positive deltaIds)
      // Y tokens go to bins below active (negative deltaIds)
      // Active bin gets both

      const xBins = deltaIds.filter(d => d >= ZERO).length // bins that receive X
      const yBins = deltaIds.filter(d => d <= ZERO).length // bins that receive Y

      for (const deltaId of deltaIds) {
        if (deltaId >= ZERO) {
          distributionX.push(PRECISION / BigInt(xBins))
        } else {
          distributionX.push(ZERO)
        }

        if (deltaId <= ZERO) {
          distributionY.push(PRECISION / BigInt(yBins))
        } else {
          distributionY.push(ZERO)
        }
      }
    } else {
      // Curve distribution: concentrate more liquidity near active bin
      // Uses a simple triangular distribution

      // Calculate weights for X distribution (bins >= 0)
      const xWeights: bigint[] = []
      let xTotalWeight = ZERO
      for (const deltaId of deltaIds) {
        if (deltaId >= ZERO) {
          const weight = BigInt(binRange + 1) - deltaId // higher weight for bins closer to active
          xWeights.push(weight)
          xTotalWeight += weight
        } else {
          xWeights.push(ZERO)
        }
      }

      // Calculate weights for Y distribution (bins <= 0)
      const yWeights: bigint[] = []
      let yTotalWeight = ZERO
      for (const deltaId of deltaIds) {
        if (deltaId <= ZERO) {
          const weight = BigInt(binRange + 1) + deltaId // higher weight for bins closer to active
          yWeights.push(weight)
          yTotalWeight += weight
        } else {
          yWeights.push(ZERO)
        }
      }

      // Convert weights to distribution (sum = PRECISION)
      for (let i = 0; i < deltaIds.length; i++) {
        distributionX.push(xTotalWeight > ZERO ? (xWeights[i] * PRECISION) / xTotalWeight : ZERO)
        distributionY.push(yTotalWeight > ZERO ? (yWeights[i] * PRECISION) / yTotalWeight : ZERO)
      }
    }

    // Ensure distributions sum to exactly PRECISION (fix rounding)
    const sumX = distributionX.reduce((a, b) => a + b, ZERO)
    const sumY = distributionY.reduce((a, b) => a + b, ZERO)

    if (sumX > ZERO && sumX !== PRECISION) {
      const lastXIdx = distributionX.findLastIndex(x => x > ZERO)
      if (lastXIdx >= 0) {
        distributionX[lastXIdx] += PRECISION - sumX
      }
    }

    if (sumY > ZERO && sumY !== PRECISION) {
      const lastYIdx = distributionY.findLastIndex(y => y > ZERO)
      if (lastYIdx >= 0) {
        distributionY[lastYIdx] += PRECISION - sumY
      }
    }

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)

    const liquidityParameters = {
      tokenX,
      tokenY,
      binStep: BigInt(binStep),
      amountX,
      amountY,
      amountXMin: (amountX * BigInt(95)) / BigInt(100), // 5% slippage
      amountYMin: (amountY * BigInt(95)) / BigInt(100),
      activeIdDesired: BigInt(activeId),
      idSlippage: BigInt(5), // allow 5 bins of slippage
      deltaIds,
      distributionX,
      distributionY,
      to: address,
      refundTo: address,
      deadline,
    }

    writeContract({
      address: CONTRACTS.LB_ROUTER,
      abi: LB_ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [liquidityParameters],
    })
  }

  return {
    addLiquidity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}
