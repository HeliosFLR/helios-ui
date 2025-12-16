// Common contract error messages and their user-friendly translations
export const ERROR_MESSAGES: Record<string, string> = {
  // User rejected
  'User rejected': 'Transaction was rejected',
  'User denied': 'Transaction was rejected',
  'user rejected transaction': 'Transaction was rejected',

  // Insufficient funds
  'insufficient funds': 'Insufficient funds for gas',
  'insufficient balance': 'Insufficient token balance',
  'InsufficientAmount': 'Insufficient token amount',

  // Liquidity errors
  'InsufficientLiquidity': 'Not enough liquidity in pool',
  'LBRouter__InsufficientAmountOut': 'Output amount too low - try increasing slippage',
  'LBRouter__MaxAmountInExceeded': 'Input amount exceeded - try reducing amount',
  'LBRouter__IdSlippageCaught': 'Price moved too much - try again',

  // Approval errors
  'AllowanceOverflow': 'Approval amount too high',
  'InsufficientAllowance': 'Token not approved - please approve first',

  // Pool errors
  'LBFactory__PairAlreadyExists': 'Pool already exists',
  'LBFactory__InvalidBinStep': 'Invalid bin step',
  'LBPair__InsufficientLiquidityMinted': 'Not enough liquidity to mint',
  'LBPair__ZeroAmount': 'Amount cannot be zero',

  // General
  'execution reverted': 'Transaction failed - check your inputs',
  'nonce too low': 'Please wait for previous transaction to complete',
  'replacement transaction underpriced': 'Gas price too low - try again',
  'timeout': 'Transaction timed out - check status on explorer',
}

export function parseContractError(error: unknown): string {
  if (!error) return 'Unknown error occurred'

  const errorString = typeof error === 'string' ? error : String(error)

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.toLowerCase().includes(pattern.toLowerCase())) {
      return message
    }
  }

  // Try to extract revert reason
  const revertMatch = errorString.match(/reason="([^"]+)"/)
  if (revertMatch) {
    return revertMatch[1]
  }

  // Try to extract error name from contract
  const errorNameMatch = errorString.match(/error (\w+)\(/)
  if (errorNameMatch) {
    const errorName = errorNameMatch[1]
    return ERROR_MESSAGES[errorName] || `Contract error: ${errorName}`
  }

  // Shorten very long error messages
  if (errorString.length > 100) {
    // Try to get the first meaningful part
    const shortError = errorString.split('\n')[0].slice(0, 100)
    return shortError + '...'
  }

  return errorString
}

export function isUserRejection(error: unknown): boolean {
  if (!error) return false
  const errorString = String(error).toLowerCase()
  return (
    errorString.includes('user rejected') ||
    errorString.includes('user denied') ||
    errorString.includes('rejected by user')
  )
}

export function getErrorTitle(error: unknown): string {
  if (isUserRejection(error)) {
    return 'Transaction Cancelled'
  }
  return 'Transaction Failed'
}
