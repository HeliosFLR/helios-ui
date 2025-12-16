'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import {
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Star,
  Award,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getUserXPData,
  getXPForNextLevel,
  ACHIEVEMENTS,
  recordSwap,
  recordAddLiquidity,
  recordRemoveLiquidity,
  recordRebalance,
  exportXPDataForMigration,
  type UserXPData,
} from '@/lib/xp'

export function GamificationBar() {
  const { isConnected, address } = useAccount()
  const [xpData, setXpData] = useState<UserXPData | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newAchievement, setNewAchievement] = useState<{ id: string; name: string; icon: string } | null>(null)
  const [previousLevel, setPreviousLevel] = useState(1)

  // Load XP data from storage
  const loadXPData = useCallback(() => {
    if (address) {
      const data = getUserXPData(address)
      setXpData(data)
    }
  }, [address])

  useEffect(() => {
    loadXPData()
  }, [loadXPData])

  // Listen for XP updates
  useEffect(() => {
    const handleXPUpdate = (event: CustomEvent<UserXPData>) => {
      const newData = event.detail

      // Check for level up
      if (xpData && newData.level > xpData.level) {
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 3000)
      }

      // Check for new achievements
      if (xpData && newData.achievements.length > xpData.achievements.length) {
        const newAchievementId = newData.achievements.find(
          (a: string) => !xpData.achievements.includes(a)
        )
        if (newAchievementId && ACHIEVEMENTS[newAchievementId as keyof typeof ACHIEVEMENTS]) {
          const achievement = ACHIEVEMENTS[newAchievementId as keyof typeof ACHIEVEMENTS]
          setNewAchievement({ id: newAchievementId, name: achievement.name, icon: achievement.icon })
          setTimeout(() => setNewAchievement(null), 5000)
        }
      }

      setXpData(newData)
    }

    window.addEventListener('xp-updated', handleXPUpdate as EventListener)
    return () => window.removeEventListener('xp-updated', handleXPUpdate as EventListener)
  }, [xpData])

  // Track previous level for level-up animation
  useEffect(() => {
    if (xpData && xpData.level > previousLevel) {
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 3000)
    }
    if (xpData) {
      setPreviousLevel(xpData.level)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpData?.level])

  if (!isConnected || !xpData) return null

  // Calculate current level progress
  const currentLevelXP = xpData.level > 1 ? getXPForNextLevel(xpData.level - 1) : 0
  const nextLevelXP = getXPForNextLevel(xpData.level)
  const levelProgress = ((xpData.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  // Get achievement objects for display
  const achievementList = Object.entries(ACHIEVEMENTS).slice(0, 5)

  return (
    <>
      {/* Main Stats Bar */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Level & XP */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border-2 border-amber-500/30">
                <span className="text-xl font-bold text-amber-500">{xpData.level}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full px-1.5 py-0.5 border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-400">LVL</span>
              </div>
            </div>

            <div className="min-w-[150px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">XP Progress</span>
                <span className="text-xs font-medium text-amber-400">
                  {xpData.totalXP.toLocaleString()} / {nextLevelXP.toLocaleString()}
                </span>
              </div>
              <div className="xp-bar">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${Math.min(levelProgress, 100)}%` }}
                />
                <div className="xp-bar-glow" />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className={cn(
            "streak-counter",
            xpData.stats.currentStreak > 0 && "active"
          )}>
            <Flame className={cn(
              "h-5 w-5",
              xpData.stats.currentStreak > 0 ? "text-orange-500 animate-streak-flame" : "text-zinc-500"
            )} />
            <div>
              <div className="text-lg font-bold text-white">{xpData.stats.currentStreak}</div>
              <div className="text-[10px] text-zinc-500 -mt-1">DAY STREAK</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">{xpData.stats.totalSwaps}</span>
              </div>
              <div className="text-[10px] text-zinc-500">Trades</div>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-500">
                <Target className="h-4 w-4" />
                <span className="text-lg font-bold">{xpData.stats.totalRebalances}</span>
              </div>
              <div className="text-[10px] text-zinc-500">Rebalances</div>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-1 text-purple-500">
                <Award className="h-4 w-4" />
                <span className="text-lg font-bold">{xpData.achievements.length}</span>
              </div>
              <div className="text-[10px] text-zinc-500">Achievements</div>
            </div>
          </div>

          {/* Achievements Preview */}
          <div className="flex items-center gap-2">
            {achievementList.map(([id, achievement]) => {
              const unlocked = xpData.achievements.includes(id)
              return (
                <div
                  key={id}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all",
                    unlocked
                      ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                      : "bg-zinc-800/50 border border-zinc-700 grayscale opacity-40"
                  )}
                  title={unlocked ? `${achievement.name}: ${achievement.description}` : '???'}
                >
                  {unlocked ? achievement.icon : '?'}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-level-up text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-3xl animate-ping" />
              <div className="relative p-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                <Star className="h-16 w-16 text-white" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white glow-text">
              LEVEL UP!
            </div>
            <div className="text-xl text-amber-400 mt-1">
              Level {xpData.level}
            </div>
          </div>
        </div>
      )}

      {/* Achievement Notification */}
      {newAchievement && (
        <div className="fixed top-20 right-4 z-50 animate-notification-slide">
          <div className="glass-card rounded-xl p-4 border border-amber-500/30 flex items-center gap-3">
            <div className="text-3xl">{newAchievement.icon}</div>
            <div>
              <div className="text-xs text-amber-400 font-medium">ACHIEVEMENT UNLOCKED</div>
              <div className="text-white font-bold">{newAchievement.name}</div>
            </div>
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
        </div>
      )}
    </>
  )
}

// Hook to record XP from other components
export function useXP() {
  const { address } = useAccount()

  const recordSwapXP = useCallback((volumeUSD: number, txHash?: string) => {
    if (!address) return { xpEarned: 0, newAchievements: [] }
    return recordSwap(address, volumeUSD, txHash)
  }, [address])

  const recordAddLiquidityXP = useCallback((volumeUSD: number, txHash?: string) => {
    if (!address) return { xpEarned: 0, newAchievements: [] }
    return recordAddLiquidity(address, volumeUSD, txHash)
  }, [address])

  const recordRemoveLiquidityXP = useCallback((volumeUSD: number, txHash?: string) => {
    if (!address) return { xpEarned: 0 }
    return recordRemoveLiquidity(address, volumeUSD, txHash)
  }, [address])

  const recordRebalanceXP = useCallback((txHash?: string) => {
    if (!address) return { xpEarned: 0, newAchievements: [] }
    return recordRebalance(address, txHash)
  }, [address])

  const exportXPDataFn = useCallback(() => {
    if (!address) return null
    return exportXPDataForMigration(address)
  }, [address])

  return {
    recordSwapXP,
    recordAddLiquidityXP,
    recordRemoveLiquidityXP,
    recordRebalanceXP,
    exportXPData: exportXPDataFn,
  }
}

// Export button component
export function ExportXPButton() {
  const { exportXPData } = useXP()
  const { isConnected } = useAccount()

  const handleExport = () => {
    const data = exportXPData()
    if (!data) return

    // Create and download file
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `helios-xp-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isConnected) return null

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-400 hover:border-purple-500/40 transition-all text-sm"
      title="Export XP data for mainnet migration"
    >
      <Download className="h-4 w-4" />
      Export XP
    </button>
  )
}

export default GamificationBar
