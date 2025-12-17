'use client'

import { useState, useEffect } from 'react'
import { useReadContracts } from 'wagmi'
import { ChevronDown, X, Search, Plus, AlertTriangle, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { TOKENS, type Token } from '@/config/contracts'
import { ERC20_ABI } from '@/contracts/abis'
import { cn } from '@/lib/utils'
import { isAddress } from 'viem'

// Storage key for custom tokens
const CUSTOM_TOKENS_KEY = 'helios_custom_tokens'

// Load custom tokens from localStorage
function loadCustomTokens(): Token[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CUSTOM_TOKENS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save custom tokens to localStorage
function saveCustomTokens(tokens: Token[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens))
}

interface TokenSelectorProps {
  selectedToken: Token | null
  onSelect: (token: Token) => void
  excludeToken?: Token | null
  tokenList?: Token[] // Optional custom token list (defaults to TOKENS)
}

export function TokenSelector({ selectedToken, onSelect, excludeToken, tokenList }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [customTokens, setCustomTokens] = useState<Token[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importAddress, setImportAddress] = useState('')
  const [importError, setImportError] = useState('')

  // Use provided token list or default to TOKENS
  const baseTokens = tokenList || TOKENS

  // Load custom tokens on mount
  useEffect(() => {
    setCustomTokens(loadCustomTokens())
  }, [])

  // All tokens (base + custom)
  const allTokens = [...baseTokens, ...customTokens]

  // Check if search is a valid address for import
  const isSearchAddress = isAddress(search)
  const isTokenAlreadyAdded = allTokens.some(
    t => t.address.toLowerCase() === search.toLowerCase()
  )

  // Read token data for import
  const tokenDataContracts = importAddress && isAddress(importAddress) ? [
    {
      address: importAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'name' as const,
    },
    {
      address: importAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'symbol' as const,
    },
    {
      address: importAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals' as const,
    },
  ] : []

  const { data: tokenData, isLoading: isLoadingToken } = useReadContracts({
    contracts: tokenDataContracts,
    query: {
      enabled: tokenDataContracts.length > 0,
    },
  })

  // Handle import
  const handleImport = () => {
    if (!tokenData || tokenData.some(d => d.status === 'failure')) {
      setImportError('Could not fetch token data. Make sure the address is a valid ERC20 token.')
      return
    }

    const name = tokenData[0].result as string
    const symbol = tokenData[1].result as string
    const decimals = tokenData[2].result as number

    const newToken: Token = {
      address: importAddress as `0x${string}`,
      name,
      symbol,
      decimals,
    }

    const updatedTokens = [...customTokens, newToken]
    setCustomTokens(updatedTokens)
    saveCustomTokens(updatedTokens)
    setIsImporting(false)
    setImportAddress('')
    setImportError('')
  }

  const handleRemoveCustomToken = (address: string) => {
    const updatedTokens = customTokens.filter(t => t.address !== address)
    setCustomTokens(updatedTokens)
    saveCustomTokens(updatedTokens)
  }

  const filteredTokens = allTokens.filter((token) => {
    if (excludeToken && token.address === excludeToken.address) return false
    if (!search) return true
    return (
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase())
    )
  })

  const isCustomToken = (address: string) => {
    return customTokens.some(t => t.address.toLowerCase() === address.toLowerCase())
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all shrink-0',
          'bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-dune-400/30',
        )}
      >
        {selectedToken ? (
          <>
            <TokenIcon symbol={selectedToken.symbol} size="sm" />
            <span className="text-sm font-medium text-white">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-sm text-zinc-400">Select</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false)
              setIsImporting(false)
              setImportAddress('')
              setImportError('')
            }}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-float-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">
                {isImporting ? 'Import Token' : 'Select a token'}
              </h3>
              <button
                onClick={() => {
                  if (isImporting) {
                    setIsImporting(false)
                    setImportAddress('')
                    setImportError('')
                  } else {
                    setIsOpen(false)
                  }
                }}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            {isImporting ? (
              /* Import Token View */
              <div className="p-4">
                <div className="mb-4">
                  <label className="text-sm text-zinc-500 mb-2 block">Token Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={importAddress}
                    onChange={(e) => {
                      setImportAddress(e.target.value)
                      setImportError('')
                    }}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-dune-400/50 focus:ring-1 focus:ring-dune-400/50 font-mono text-sm"
                  />
                </div>

                {/* Token Preview */}
                {importAddress && isAddress(importAddress) && (
                  <div className="mb-4 p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                    {isLoadingToken ? (
                      <div className="flex items-center gap-3 text-zinc-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading token data...
                      </div>
                    ) : tokenData && tokenData.every(d => d.status === 'success') ? (
                      <div className="flex items-center gap-3">
                        <TokenIcon symbol={tokenData[1].result as string} />
                        <div>
                          <div className="font-medium text-white">{tokenData[1].result as string}</div>
                          <div className="text-sm text-zinc-500">{tokenData[0].result as string}</div>
                          <div className="text-xs text-zinc-600">{tokenData[2].result as number} decimals</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Could not load token data</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Warning */}
                <div className="mb-4 p-3 rounded-xl bg-dune-400/10 border border-dune-400/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-dune-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-dune-400/80">
                      Only import tokens you trust. Malicious tokens can steal your funds.
                      Always verify the token contract on the explorer.
                    </div>
                  </div>
                </div>

                {importError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {importError}
                  </div>
                )}

                <div className="flex gap-3">
                  <a
                    href={importAddress ? `https://coston2-explorer.flare.network/address/${importAddress}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 text-zinc-400 font-medium hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Explorer
                  </a>
                  <button
                    onClick={handleImport}
                    disabled={!importAddress || !isAddress(importAddress) || isLoadingToken || !tokenData}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl font-medium transition-all',
                      importAddress && isAddress(importAddress) && !isLoadingToken && tokenData
                        ? 'bg-gradient-to-r from-dune-400 to-dune-500 text-black hover:opacity-90'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    )}
                  >
                    Import Token
                  </button>
                </div>
              </div>
            ) : (
              /* Token List View */
              <>
                {/* Search */}
                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search name, symbol, or paste address"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-dune-400/50 focus:ring-1 focus:ring-dune-400/50"
                    />
                  </div>

                  {/* Import by address prompt */}
                  {isSearchAddress && !isTokenAlreadyAdded && (
                    <button
                      onClick={() => {
                        setImportAddress(search)
                        setIsImporting(true)
                        setSearch('')
                      }}
                      className="w-full mt-3 p-3 rounded-xl bg-dune-400/10 border border-dune-400/20 text-dune-400 hover:bg-dune-400/20 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Import token at {search.slice(0, 6)}...{search.slice(-4)}
                    </button>
                  )}
                </div>

                {/* Custom Tokens Section */}
                {customTokens.length > 0 && !search && (
                  <div className="p-2 border-b border-white/5">
                    <div className="px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider">
                      Imported Tokens
                    </div>
                    {customTokens.map((token) => (
                      <div
                        key={token.address}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5"
                      >
                        <button
                          onClick={() => {
                            onSelect(token)
                            setIsOpen(false)
                            setSearch('')
                          }}
                          className="flex items-center gap-3 flex-1"
                        >
                          <TokenIcon symbol={token.symbol} size="lg" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-white">{token.symbol}</div>
                            <div className="text-sm text-zinc-500">{token.name}</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleRemoveCustomToken(token.address)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors"
                          title="Remove token"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Token List */}
                <div className="max-h-80 overflow-y-auto p-2">
                  {!search && (
                    <div className="px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider">
                      Default Tokens
                    </div>
                  )}
                  {filteredTokens.filter(t => !isCustomToken(t.address)).length === 0 && !isSearchAddress ? (
                    <div className="py-8 text-center text-zinc-500">
                      <p>No tokens found</p>
                      <button
                        onClick={() => setIsImporting(true)}
                        className="mt-2 text-dune-400 hover:text-dune-300 text-sm flex items-center gap-1 mx-auto"
                      >
                        <Plus className="h-4 w-4" />
                        Import a token
                      </button>
                    </div>
                  ) : (
                    filteredTokens
                      .filter(t => search ? true : !isCustomToken(t.address))
                      .map((token) => (
                        <button
                          key={token.address}
                          onClick={() => {
                            onSelect(token)
                            setIsOpen(false)
                            setSearch('')
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                            'hover:bg-white/5',
                            selectedToken?.address === token.address && 'bg-dune-400/10'
                          )}
                        >
                          <TokenIcon symbol={token.symbol} size="lg" />
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{token.symbol}</span>
                              {isCustomToken(token.address) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-dune-400/10 text-dune-400">
                                  Imported
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-zinc-500">{token.name}</div>
                          </div>
                        </button>
                      ))
                  )}
                </div>

                {/* Import Button */}
                <div className="p-3 border-t border-white/5">
                  <button
                    onClick={() => setIsImporting(true)}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-800/50 text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Import Token by Address
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function TokenIcon({ symbol, logoUrl, size = 'md' }: { symbol: string; logoUrl?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    xs: 'h-5 w-5 text-[10px]',
    sm: 'h-6 w-6 text-xs',
    md: 'h-7 w-7 text-sm',
    lg: 'h-10 w-10 text-lg',
  }[size]

  const sizePx = {
    xs: 20,
    sm: 24,
    md: 28,
    lg: 40,
  }[size]

  const colors: Record<string, string> = {
    WFLR: 'from-rose-500 to-dune-500',
    USDT: 'from-emerald-500 to-teal-500',
    USDC: 'from-blue-500 to-cyan-500',
    sFLR: 'from-purple-500 to-pink-500',
  }

  // Check if we have a logo for this token
  const tokenLogos: Record<string, string> = {
    WFLR: '/tokens/wflr.png',
    USDT: '/tokens/usdt.png',
    USDC: '/tokens/usdc.png',
    sFLR: '/tokens/sflr.webp',
  }

  const logo = logoUrl || tokenLogos[symbol]

  if (logo) {
    return (
      <img
        src={logo}
        alt={symbol}
        className={cn('rounded-full object-cover', sizeClasses)}
        width={sizePx}
        height={sizePx}
        onError={(e) => {
          // Fallback to gradient on error
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white',
        sizeClasses,
        colors[symbol] || 'from-zinc-500 to-zinc-600'
      )}
    >
      {symbol.slice(0, 1)}
    </div>
  )
}

export { TokenIcon }
