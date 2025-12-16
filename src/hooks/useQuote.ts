'use client'

import { useReadContract } from 'wagmi'
import { POOLS, TOKENS, getTokenByAddress } from '@/config/contracts'
import { LB_PAIR_ABI } from '@/contracts/abis'

interface QuoteResult {
  amountOut: bigint
  fees: bigint
  priceImpact: number
  route: string[]
  binSteps: number[]
  isMultiHop: boolean
  isLoading: boolean
  error: Error | null
}

interface Route {
  path: `0x${string}`[]
  binSteps: bigint[]
  versions: number[]
  tokenSymbols: string[]
  poolAddress: `0x${string}`
  swapForY: boolean // true if swapping tokenX for tokenY
}

// Find all possible routes between two tokens
function findAllRoutes(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  maxHops: number = 3
): Route[] {
  const routes: Route[] = []
  const tokenInLower = tokenIn.toLowerCase()
  const tokenOutLower = tokenOut.toLowerCase()

  // Direct route
  const directPool = POOLS.find(p =>
    (p.tokenX.address.toLowerCase() === tokenInLower &&
     p.tokenY.address.toLowerCase() === tokenOutLower) ||
    (p.tokenY.address.toLowerCase() === tokenInLower &&
     p.tokenX.address.toLowerCase() === tokenOutLower)
  )

  if (directPool) {
    const tokenInData = getTokenByAddress(tokenIn)
    const tokenOutData = getTokenByAddress(tokenOut)
    const swapForY = directPool.tokenX.address.toLowerCase() === tokenInLower
    routes.push({
      path: [tokenIn, tokenOut],
      binSteps: [BigInt(directPool.binStep)],
      versions: [3], // V2_2
      tokenSymbols: [tokenInData?.symbol || '', tokenOutData?.symbol || ''],
      poolAddress: directPool.address,
      swapForY,
    })
  }

  // Multi-hop routes through intermediate tokens
  if (maxHops >= 2) {
    for (const intermediateToken of TOKENS) {
      if (
        intermediateToken.address.toLowerCase() === tokenInLower ||
        intermediateToken.address.toLowerCase() === tokenOutLower
      ) {
        continue
      }

      const pool1 = POOLS.find(p =>
        (p.tokenX.address.toLowerCase() === tokenInLower &&
         p.tokenY.address.toLowerCase() === intermediateToken.address.toLowerCase()) ||
        (p.tokenY.address.toLowerCase() === tokenInLower &&
         p.tokenX.address.toLowerCase() === intermediateToken.address.toLowerCase())
      )

      const pool2 = POOLS.find(p =>
        (p.tokenX.address.toLowerCase() === intermediateToken.address.toLowerCase() &&
         p.tokenY.address.toLowerCase() === tokenOutLower) ||
        (p.tokenY.address.toLowerCase() === intermediateToken.address.toLowerCase() &&
         p.tokenX.address.toLowerCase() === tokenOutLower)
      )

      if (pool1 && pool2) {
        const tokenInData = getTokenByAddress(tokenIn)
        const tokenOutData = getTokenByAddress(tokenOut)
        routes.push({
          path: [tokenIn, intermediateToken.address, tokenOut],
          binSteps: [BigInt(pool1.binStep), BigInt(pool2.binStep)],
          versions: [3, 3],
          tokenSymbols: [tokenInData?.symbol || '', intermediateToken.symbol, tokenOutData?.symbol || ''],
          poolAddress: pool1.address,
          swapForY: pool1.tokenX.address.toLowerCase() === tokenInLower,
        })
      }
    }
  }

  return routes
}

// Find the best route to use (prefer direct, then shortest path)
function selectBestRoute(routes: Route[]): Route | undefined {
  if (routes.length === 0) return undefined
  return routes.sort((a, b) => a.path.length - b.path.length)[0]
}

// Extended LB_PAIR_ABI with getSwapOut
const PAIR_SWAP_ABI = [
  ...LB_PAIR_ABI,
  {
    inputs: [
      { internalType: 'uint128', name: 'amountIn', type: 'uint128' },
      { internalType: 'bool', name: 'swapForY', type: 'bool' },
    ],
    name: 'getSwapOut',
    outputs: [
      { internalType: 'uint128', name: 'amountInLeft', type: 'uint128' },
      { internalType: 'uint128', name: 'amountOut', type: 'uint128' },
      { internalType: 'uint128', name: 'fee', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useSwapQuote(
  tokenIn: `0x${string}` | undefined,
  tokenOut: `0x${string}` | undefined,
  amountIn: bigint
): QuoteResult {
  // Find all possible routes
  const routes = tokenIn && tokenOut ? findAllRoutes(tokenIn, tokenOut) : []
  const bestRoute = selectBestRoute(routes)

  // Use direct pool query instead of broken quoter
  const { data, isLoading, error } = useReadContract({
    address: bestRoute?.poolAddress,
    abi: PAIR_SWAP_ABI,
    functionName: 'getSwapOut',
    args: bestRoute ? [amountIn as unknown as bigint, bestRoute.swapForY] : undefined,
    query: {
      enabled: !!bestRoute && amountIn > BigInt(0),
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })

  // Process the result
  if (data && bestRoute) {
    const [amountInLeft, amountOut, fee] = data as [bigint, bigint, bigint]

    // Calculate price impact based on how much input was actually used
    const amountUsed = amountIn - amountInLeft
    let priceImpact = 0
    if (amountUsed > BigInt(0) && amountIn > BigInt(0)) {
      // If significant input was left unused, there's high slippage
      const usedRatio = Number(amountUsed) / Number(amountIn)
      priceImpact = usedRatio < 1 ? (1 - usedRatio) * 100 : 0
    }

    return {
      amountOut,
      fees: fee,
      priceImpact: Math.min(priceImpact, 0.3), // Pool fee is ~0.15%
      route: bestRoute.tokenSymbols,
      binSteps: bestRoute.binSteps.map(b => Number(b)),
      isMultiHop: bestRoute.path.length > 2,
      isLoading,
      error: null,
    }
  }

  // Fallback if no quote found
  const tokenInSymbol = tokenIn ? getTokenByAddress(tokenIn)?.symbol : ''
  const tokenOutSymbol = tokenOut ? getTokenByAddress(tokenOut)?.symbol : ''

  return {
    amountOut: BigInt(0),
    fees: BigInt(0),
    priceImpact: 0,
    route: tokenInSymbol && tokenOutSymbol ? [tokenInSymbol, tokenOutSymbol] : [],
    binSteps: bestRoute ? bestRoute.binSteps.map(b => Number(b)) : [],
    isMultiHop: bestRoute ? bestRoute.path.length > 2 : false,
    isLoading,
    error: error as Error | null,
  }
}

// Export route finder for use in swap execution
export function getBestSwapRoute(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`
): { path: `0x${string}`[]; binSteps: bigint[]; versions: number[] } | null {
  const routes = findAllRoutes(tokenIn, tokenOut)
  const best = selectBestRoute(routes)
  if (!best) return null
  return {
    path: best.path,
    binSteps: best.binSteps,
    versions: best.versions,
  }
}

// Fallback quote calculation when quoter fails
export function calculateFallbackQuote(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tokenOutDecimals: number // Reserved for future precision handling
): { amountOut: number; priceImpact: number } {
  let estimatedOutput: number
  let priceImpact = 0.3 // Base fee impact

  // Price estimates (simplified)
  const prices: Record<string, number> = {
    'WFLR': 0.02,
    'USDT': 1.0,
    'USDC': 1.0,
    'sFLR': 0.02,
  }

  const priceIn = prices[tokenInSymbol] || 1
  const priceOut = prices[tokenOutSymbol] || 1

  const valueIn = amountIn * priceIn
  estimatedOutput = (valueIn / priceOut) * 0.997 // 0.3% fee

  // Add slippage for larger trades
  if (valueIn > 1000) {
    priceImpact += (valueIn / 10000) * 0.1 // Additional 0.1% per $10k
    estimatedOutput *= (1 - priceImpact / 100)
  }

  return {
    amountOut: estimatedOutput,
    priceImpact,
  }
}
