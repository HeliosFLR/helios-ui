'use client'

import { Wallet, Flame, Zap, Trophy } from 'lucide-react'
import { UserPositions } from '@/components/UserPositions'
import { GamificationBar } from '@/components/GamificationBar'
import { FTSODelegationCard } from '@/components/FTSODelegation'

export default function PositionsPage() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Gamification Bar */}
      <GamificationBar />

      {/* Hero Header */}
      <div className="relative mb-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-dune-400/10 via-dune-500/5 to-transparent blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-dune-400 to-dune-500">
                <Wallet className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                My <span className="text-dune-400">Positions</span>
              </h1>
            </div>
            <p className="text-zinc-500 max-w-md">
              Manage your liquidity positions across all Helios pools.{' '}
              <span className="text-dune-300">Rebalance to maximize efficiency!</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <Trophy className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">Earn XP</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/5">
              <Flame className="h-4 w-4 text-dune-400 animate-fire-flicker" />
              <span className="text-sm text-zinc-400">Liquidity Book</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Planned Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <QuickActionCard
          icon={<Zap className="h-5 w-5" />}
          title="Auto-Rebalance"
          description="Coming Soon"
          disabled
        />
        <QuickActionCard
          icon={<Trophy className="h-5 w-5" />}
          title="Leaderboard"
          description="Coming Soon"
          disabled
        />
        <QuickActionCard
          icon={<Flame className="h-5 w-5" />}
          title="Streak Bonus"
          description="Coming Soon"
          disabled
        />
        <QuickActionCard
          icon={<Wallet className="h-5 w-5" />}
          title="Daily Reward"
          description="Coming Soon"
          disabled
        />
      </div>

      {/* User Positions */}
      <UserPositions />

      {/* FTSO Delegation Section */}
      <div className="mt-8">
        <FTSODelegationCard />
      </div>
    </div>
  )
}

function QuickActionCard({
  icon,
  title,
  description,
  disabled,
  highlight,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  disabled?: boolean
  highlight?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-xl text-left transition-all
        ${disabled
          ? 'bg-zinc-800/30 border border-zinc-700/50 opacity-50 cursor-not-allowed'
          : highlight
            ? 'bg-gradient-to-br from-dune-400/10 to-dune-500/10 border border-dune-400/30 hover:border-dune-400/50 hover-lift'
            : 'glass-card hover:border-dune-400/30 interactive-card'
        }
      `}
    >
      <div className={`
        inline-flex items-center justify-center p-2 rounded-lg mb-2
        ${highlight ? 'bg-dune-400/20 text-dune-400' : 'bg-zinc-700/50 text-zinc-400'}
      `}>
        {icon}
      </div>
      <div className="font-medium text-white text-sm">{title}</div>
      <div className={`text-xs ${highlight ? 'text-dune-300' : 'text-zinc-500'}`}>
        {description}
      </div>
    </button>
  )
}
