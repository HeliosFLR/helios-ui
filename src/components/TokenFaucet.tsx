'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Droplets, Loader2, CheckCircle2, AlertCircle, Coins, ExternalLink } from 'lucide-react'
import { TOKENS, type Token } from '@/config/contracts'
import { ERC20_ABI } from '@/contracts/abis'
import { TokenIcon } from './TokenSelector'
import { cn } from '@/lib/utils'
import { parseUnits } from 'viem'

const FAUCET_AMOUNTS: Record<string, string> = {
  'WFLR': '1000',
  'USDT': '100',
  'USDC': '100',
  'sFLR': '500',
}

export function TokenFaucet() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll for better RPC compatibility
    },
  })

  const handleMint = async (token: Token) => {
    if (!address) return

    setSelectedToken(token)
    const amount = FAUCET_AMOUNTS[token.symbol] || '100'
    const parsedAmount = parseUnits(amount, token.decimals)

    writeContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [address, parsedAmount],
    })
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
    setSelectedToken(null)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-500 hover:border-amber-500/40 transition-all group"
      >
        <Coins className="h-4 w-4 group-hover:animate-bounce" />
        <span className="text-sm font-medium">Get Test Tokens</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-md glass-card rounded-3xl shadow-2xl overflow-hidden animate-bounce-in">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                  <Droplets className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Token Faucet</h3>
                  <p className="text-sm text-zinc-500">Get test tokens on Coston2</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!isConnected ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">Connect your wallet to use the faucet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {TOKENS.map((token) => (
                    <FaucetTokenRow
                      key={token.address}
                      token={token}
                      amount={FAUCET_AMOUNTS[token.symbol] || '100'}
                      onMint={() => handleMint(token)}
                      isPending={isPending && selectedToken?.address === token.address}
                      isConfirming={isConfirming && selectedToken?.address === token.address}
                      isSuccess={isSuccess && selectedToken?.address === token.address}
                      error={error && selectedToken?.address === token.address ? error : null}
                    />
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="mt-6 p-4 rounded-xl bg-zinc-800/30 border border-white/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-zinc-400 space-y-2">
                    <p>These are test tokens on Coston2 testnet.</p>
                    <p>
                      <strong className="text-zinc-300">Need C2FLR for gas?</strong>{' '}
                      <a
                        href="https://faucet.flare.network/coston2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-500 hover:text-amber-400 inline-flex items-center gap-1"
                      >
                        Get C2FLR here
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    <p className="text-xs text-zinc-500">
                      All tokens are mintable. Use WFLR/USDT or USDC/USDT pools for swapping.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 pt-0">
              <button
                onClick={handleClose}
                className="w-full py-3 px-6 rounded-xl bg-zinc-800 text-zinc-400 font-medium hover:bg-zinc-700 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface FaucetTokenRowProps {
  token: Token
  amount: string
  onMint: () => void
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

function FaucetTokenRow({
  token,
  amount,
  onMint,
  isPending,
  isConfirming,
  isSuccess,
  error,
}: FaucetTokenRowProps) {
  const isLoading = isPending || isConfirming

  // Extract readable error message
  const errorMessage = error?.message?.includes('reverted')
    ? 'Contract does not support minting'
    : error?.message?.includes('rejected')
      ? 'Transaction rejected'
      : error ? 'Mint failed - try again'
        : null

  return (
    <div className={cn(
      'p-4 rounded-2xl border transition-all',
      isSuccess
        ? 'bg-emerald-500/5 border-emerald-500/30'
        : error
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-zinc-800/30 border-white/5 hover:border-amber-500/20'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TokenIcon symbol={token.symbol} size="lg" />
          <div>
            <div className="font-medium text-white">{token.symbol}</div>
            <div className="text-sm text-zinc-500">{amount} tokens</div>
          </div>
        </div>

        <button
          onClick={onMint}
          disabled={isLoading || isSuccess}
          className={cn(
            'px-4 py-2 rounded-xl font-medium text-sm transition-all',
            isSuccess
              ? 'bg-emerald-500/20 text-emerald-500'
              : error
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isConfirming ? 'Confirming...' : 'Minting...'}
            </span>
          ) : isSuccess ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Minted!
            </span>
          ) : error ? (
            'Retry'
          ) : (
            'Mint'
          )}
        </button>
      </div>
      {errorMessage && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </div>
      )}
    </div>
  )
}

// Compact faucet button for pages
export function FaucetButton() {
  const [showFaucet, setShowFaucet] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowFaucet(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
      >
        <Coins className="h-3.5 w-3.5" />
        Faucet
      </button>
      {showFaucet && <TokenFaucetModal onClose={() => setShowFaucet(false)} />}
    </>
  )
}

function TokenFaucetModal({ onClose }: { onClose: () => void }) {
  const { address } = useAccount()
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
    query: {
      refetchInterval: 2000, // Poll for better RPC compatibility
    },
  })

  const handleMint = async (token: Token) => {
    if (!address) return

    setSelectedToken(token)
    const amount = FAUCET_AMOUNTS[token.symbol] || '100'
    const parsedAmount = parseUnits(amount, token.decimals)

    writeContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [address, parsedAmount],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-3xl shadow-2xl overflow-hidden animate-bounce-in">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Droplets className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Token Faucet</h3>
              <p className="text-sm text-zinc-500">Get test tokens on Coston2</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {TOKENS.map((token) => (
            <FaucetTokenRow
              key={token.address}
              token={token}
              amount={FAUCET_AMOUNTS[token.symbol] || '100'}
              onMint={() => handleMint(token)}
              isPending={isPending && selectedToken?.address === token.address}
              isConfirming={isConfirming && selectedToken?.address === token.address}
              isSuccess={isSuccess && selectedToken?.address === token.address}
              error={error && selectedToken?.address === token.address ? error : null}
            />
          ))}
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl bg-zinc-800 text-zinc-400 font-medium hover:bg-zinc-700 hover:text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
