import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatAmount(amount: bigint, decimals: number, displayDecimals: number = 4): string {
  const divisor = BigInt(10 ** decimals)
  const integerPart = amount / divisor
  const fractionalPart = amount % divisor

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, displayDecimals)

  if (displayDecimals === 0 || fractionalStr === '0'.repeat(displayDecimals)) {
    return integerPart.toLocaleString()
  }

  return `${integerPart.toLocaleString()}.${fractionalStr}`
}

export function parseAmount(amount: string, decimals: number): bigint {
  if (!amount || amount === '') return BigInt(0)

  const [integerPart, fractionalPart = ''] = amount.split('.')
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
  const fullNumber = integerPart + paddedFractional

  return BigInt(fullNumber || '0')
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function calculatePriceFromBinId(binId: number, binStep: number, decimalsX: number, decimalsY: number): number {
  const base = 1 + binStep / 10000
  const rawPrice = Math.pow(base, binId - 8388608)
  const decimalAdjustment = Math.pow(10, decimalsY - decimalsX)
  return rawPrice * decimalAdjustment
}
