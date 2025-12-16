'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Menu, X, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { TransactionHistory, TransactionHistoryMini } from './TransactionHistory'
import { ThemeToggle } from './ThemeToggle'
import { FTSOPriceBadge } from './FTSOPriceDisplay'

const navItems = [
  { href: '/', label: 'Swap' },
  { href: '/pools', label: 'Pools' },
  { href: '/positions', label: 'Positions' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/docs', label: 'Docs' },
]

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient line at top */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <div className="border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                {/* Animated glow behind logo */}
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-amber-500/40 to-orange-500/40 group-hover:from-amber-400/50 group-hover:to-orange-400/50 transition-all duration-300 rounded-full scale-150 opacity-60 group-hover:opacity-100 animate-pulse-glow" />

                {/* Logo Image */}
                <div className="relative h-10 w-10 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Helios"
                    width={40}
                    height={40}
                    className="relative z-10 animate-glow-pulse"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-none">
                  <span className="text-white">Helios</span>
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">DEX</span>
                </span>
                <span className="text-[10px] text-zinc-500 tracking-wider uppercase">Powered by Flare</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 rounded-2xl p-1 border border-white/5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-5 py-2 text-sm font-medium rounded-xl transition-all duration-300',
                    pathname === item.href
                      ? 'text-black'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {pathname === item.href && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/25" />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Pending Transactions Mini */}
              <TransactionHistoryMini />

              {/* Transaction History */}
              <div className="hidden sm:block">
                <TransactionHistory />
              </div>

              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* FTSO Price Badge */}
              <div className="hidden md:block">
                <FTSOPriceBadge />
              </div>

              {/* Network Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-white/80 border border-white/5 dark:border-white/5 light:border-black/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-medium">Flare</span>
              </div>

              {/* Connect Button */}
              {mounted ? (
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted: buttonMounted,
                  }) => {
                    const ready = buttonMounted
                    const connected = ready && account && chain

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium text-xs hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
                              >
                                <Wallet className="h-3.5 w-3.5" />
                                Connect
                              </button>
                            )
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 font-medium text-xs border border-red-500/30 hover:bg-red-500/30 transition-all"
                              >
                                Wrong network
                              </button>
                            )
                          }

                          return (
                            <button
                              onClick={openAccountModal}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-white/10 hover:border-amber-500/30 transition-all"
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-black">
                                  {account.displayName.slice(0, 2)}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-zinc-300">
                                {account.displayName}
                              </span>
                            </button>
                          )
                        })()}
                      </div>
                    )
                  }}
                </ConnectButton.Custom>
              ) : (
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium text-xs">
                  <Wallet className="h-3.5 w-3.5" />
                  Connect
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-zinc-400" />
                ) : (
                  <Menu className="h-5 w-5 text-zinc-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-black/90 backdrop-blur-xl animate-float-up">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    pathname === item.href
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
