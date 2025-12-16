// XP System for Helios DEX
// This module handles all XP calculations, storage, and migration

export interface XPAction {
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'rebalance' | 'first_swap' | 'first_lp' | 'daily_login' | 'streak_bonus'
  amount: number // XP earned
  volumeUSD?: number // Volume in USD (for swaps/LP)
  timestamp: number
  txHash?: string
}

export interface UserXPData {
  address: string
  totalXP: number
  level: number
  actions: XPAction[]
  stats: {
    totalSwaps: number
    totalSwapVolumeUSD: number
    totalLiquidityAdded: number
    totalLiquidityRemoved: number
    totalRebalances: number
    currentStreak: number
    longestStreak: number
    lastActivityDate: string // YYYY-MM-DD format
    firstActionDate: string
  }
  achievements: string[]
  createdAt: number
  updatedAt: number
}

// XP Configuration - These values determine XP rewards
export const XP_CONFIG = {
  // Base XP for actions
  SWAP_BASE_XP: 10,
  SWAP_PER_USD: 0.5, // 0.5 XP per $1 swapped
  ADD_LIQUIDITY_BASE_XP: 50,
  ADD_LIQUIDITY_PER_USD: 1, // 1 XP per $1 of liquidity added
  REMOVE_LIQUIDITY_XP: 10,
  REBALANCE_XP: 100,

  // Bonus XP
  FIRST_SWAP_BONUS: 100,
  FIRST_LP_BONUS: 250,
  DAILY_LOGIN_XP: 5,

  // Streak bonuses (multiplier)
  STREAK_MULTIPLIER: {
    3: 1.1,   // 3 day streak = 10% bonus
    7: 1.25,  // 7 day streak = 25% bonus
    14: 1.5,  // 14 day streak = 50% bonus
    30: 2.0,  // 30 day streak = 100% bonus
  },

  // Level thresholds (XP required for each level)
  LEVEL_THRESHOLDS: [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    1000,   // Level 5
    2000,   // Level 6
    4000,   // Level 7
    7500,   // Level 8
    12500,  // Level 9
    20000,  // Level 10
    35000,  // Level 11
    55000,  // Level 12
    85000,  // Level 13
    125000, // Level 14
    175000, // Level 15
    250000, // Level 16
    350000, // Level 17
    500000, // Level 18
    750000, // Level 19
    1000000, // Level 20
  ],
}

// Achievement definitions
export const ACHIEVEMENTS = {
  first_swap: { name: 'First Swap', description: 'Complete your first swap', icon: '🔄', xpBonus: 100 },
  first_lp: { name: 'Liquidity Provider', description: 'Add liquidity for the first time', icon: '💧', xpBonus: 250 },
  rebalancer: { name: 'Rebalancer', description: 'Rebalance a position', icon: '⚖️', xpBonus: 100 },
  streak_3: { name: 'On Fire', description: '3 day trading streak', icon: '🔥', xpBonus: 50 },
  streak_7: { name: 'Weekly Warrior', description: '7 day trading streak', icon: '⚔️', xpBonus: 150 },
  streak_14: { name: 'Dedicated', description: '14 day trading streak', icon: '💪', xpBonus: 300 },
  streak_30: { name: 'Legend', description: '30 day trading streak', icon: '👑', xpBonus: 1000 },
  trades_10: { name: 'Active Trader', description: 'Complete 10 trades', icon: '📈', xpBonus: 100 },
  trades_50: { name: 'Experienced', description: 'Complete 50 trades', icon: '🎯', xpBonus: 500 },
  trades_100: { name: 'Master Trader', description: 'Complete 100 trades', icon: '🏆', xpBonus: 1000 },
  volume_1k: { name: 'Whale Spotter', description: 'Trade $1,000 in volume', icon: '🐋', xpBonus: 200 },
  volume_10k: { name: 'Market Mover', description: 'Trade $10,000 in volume', icon: '💰', xpBonus: 1000 },
  volume_100k: { name: 'Whale', description: 'Trade $100,000 in volume', icon: '🐳', xpBonus: 5000 },
  lp_1k: { name: 'LP Starter', description: 'Provide $1,000 in liquidity', icon: '🌊', xpBonus: 300 },
  lp_10k: { name: 'LP Pro', description: 'Provide $10,000 in liquidity', icon: '🌊', xpBonus: 1500 },
  level_5: { name: 'Rising Star', description: 'Reach level 5', icon: '⭐', xpBonus: 100 },
  level_10: { name: 'Veteran', description: 'Reach level 10', icon: '🌟', xpBonus: 500 },
  level_20: { name: 'Elite', description: 'Reach level 20', icon: '💫', xpBonus: 2000 },
}

const XP_STORAGE_KEY = 'helios_xp_data'

// Get level from XP
export function getLevelFromXP(xp: number): number {
  for (let i = XP_CONFIG.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_CONFIG.LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

// Get XP required for next level
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= XP_CONFIG.LEVEL_THRESHOLDS.length) {
    return XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1] * 2
  }
  return XP_CONFIG.LEVEL_THRESHOLDS[currentLevel]
}

// Get today's date string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// Calculate streak bonus multiplier
function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return XP_CONFIG.STREAK_MULTIPLIER[30]
  if (streak >= 14) return XP_CONFIG.STREAK_MULTIPLIER[14]
  if (streak >= 7) return XP_CONFIG.STREAK_MULTIPLIER[7]
  if (streak >= 3) return XP_CONFIG.STREAK_MULTIPLIER[3]
  return 1
}

// Initialize or get user XP data
export function getUserXPData(address: string): UserXPData {
  if (typeof window === 'undefined') {
    return createDefaultUserData(address)
  }

  const storageKey = `${XP_STORAGE_KEY}_${address.toLowerCase()}`
  const stored = localStorage.getItem(storageKey)

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return createDefaultUserData(address)
    }
  }

  return createDefaultUserData(address)
}

// Create default user data
function createDefaultUserData(address: string): UserXPData {
  return {
    address: address.toLowerCase(),
    totalXP: 0,
    level: 1,
    actions: [],
    stats: {
      totalSwaps: 0,
      totalSwapVolumeUSD: 0,
      totalLiquidityAdded: 0,
      totalLiquidityRemoved: 0,
      totalRebalances: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
      firstActionDate: '',
    },
    achievements: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// Save user XP data
export function saveUserXPData(data: UserXPData): void {
  if (typeof window === 'undefined') return

  const storageKey = `${XP_STORAGE_KEY}_${data.address.toLowerCase()}`
  data.updatedAt = Date.now()
  localStorage.setItem(storageKey, JSON.stringify(data))

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('xp-updated', { detail: data }))
}

// Update streak
function updateStreak(data: UserXPData): UserXPData {
  const today = getTodayString()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (data.stats.lastActivityDate === today) {
    // Already active today, no change
    return data
  } else if (data.stats.lastActivityDate === yesterday) {
    // Continue streak
    data.stats.currentStreak++
    if (data.stats.currentStreak > data.stats.longestStreak) {
      data.stats.longestStreak = data.stats.currentStreak
    }
  } else if (data.stats.lastActivityDate) {
    // Streak broken
    data.stats.currentStreak = 1
  } else {
    // First activity
    data.stats.currentStreak = 1
    data.stats.firstActionDate = today
  }

  data.stats.lastActivityDate = today
  return data
}

// Check and award achievements
function checkAchievements(data: UserXPData): { data: UserXPData; newAchievements: string[] } {
  const newAchievements: string[] = []

  const checks = [
    { id: 'first_swap', condition: data.stats.totalSwaps >= 1 },
    { id: 'first_lp', condition: data.stats.totalLiquidityAdded > 0 },
    { id: 'rebalancer', condition: data.stats.totalRebalances >= 1 },
    { id: 'streak_3', condition: data.stats.currentStreak >= 3 },
    { id: 'streak_7', condition: data.stats.currentStreak >= 7 },
    { id: 'streak_14', condition: data.stats.currentStreak >= 14 },
    { id: 'streak_30', condition: data.stats.currentStreak >= 30 },
    { id: 'trades_10', condition: data.stats.totalSwaps >= 10 },
    { id: 'trades_50', condition: data.stats.totalSwaps >= 50 },
    { id: 'trades_100', condition: data.stats.totalSwaps >= 100 },
    { id: 'volume_1k', condition: data.stats.totalSwapVolumeUSD >= 1000 },
    { id: 'volume_10k', condition: data.stats.totalSwapVolumeUSD >= 10000 },
    { id: 'volume_100k', condition: data.stats.totalSwapVolumeUSD >= 100000 },
    { id: 'lp_1k', condition: data.stats.totalLiquidityAdded >= 1000 },
    { id: 'lp_10k', condition: data.stats.totalLiquidityAdded >= 10000 },
    { id: 'level_5', condition: data.level >= 5 },
    { id: 'level_10', condition: data.level >= 10 },
    { id: 'level_20', condition: data.level >= 20 },
  ]

  for (const check of checks) {
    if (check.condition && !data.achievements.includes(check.id)) {
      data.achievements.push(check.id)
      newAchievements.push(check.id)

      // Award achievement XP bonus
      const achievement = ACHIEVEMENTS[check.id as keyof typeof ACHIEVEMENTS]
      if (achievement) {
        data.totalXP += achievement.xpBonus
      }
    }
  }

  // Update level after achievement bonuses
  data.level = getLevelFromXP(data.totalXP)

  return { data, newAchievements }
}

// Record a swap
export function recordSwap(address: string, volumeUSD: number, txHash?: string): { xpEarned: number; newAchievements: string[] } {
  let data = getUserXPData(address)
  data = updateStreak(data)

  const isFirstSwap = data.stats.totalSwaps === 0

  // Calculate XP
  let xpEarned = XP_CONFIG.SWAP_BASE_XP + Math.floor(volumeUSD * XP_CONFIG.SWAP_PER_USD)

  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(data.stats.currentStreak)
  xpEarned = Math.floor(xpEarned * streakMultiplier)

  // First swap bonus
  if (isFirstSwap) {
    xpEarned += XP_CONFIG.FIRST_SWAP_BONUS
  }

  // Update stats
  data.stats.totalSwaps++
  data.stats.totalSwapVolumeUSD += volumeUSD
  data.totalXP += xpEarned
  data.level = getLevelFromXP(data.totalXP)

  // Record action
  data.actions.push({
    type: isFirstSwap ? 'first_swap' : 'swap',
    amount: xpEarned,
    volumeUSD,
    timestamp: Date.now(),
    txHash,
  })

  // Keep only last 100 actions
  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100)
  }

  // Check achievements
  const { data: updatedData, newAchievements } = checkAchievements(data)

  saveUserXPData(updatedData)

  return { xpEarned, newAchievements }
}

// Record adding liquidity
export function recordAddLiquidity(address: string, volumeUSD: number, txHash?: string): { xpEarned: number; newAchievements: string[] } {
  let data = getUserXPData(address)
  data = updateStreak(data)

  const isFirstLP = data.stats.totalLiquidityAdded === 0

  // Calculate XP
  let xpEarned = XP_CONFIG.ADD_LIQUIDITY_BASE_XP + Math.floor(volumeUSD * XP_CONFIG.ADD_LIQUIDITY_PER_USD)

  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(data.stats.currentStreak)
  xpEarned = Math.floor(xpEarned * streakMultiplier)

  // First LP bonus
  if (isFirstLP) {
    xpEarned += XP_CONFIG.FIRST_LP_BONUS
  }

  // Update stats
  data.stats.totalLiquidityAdded += volumeUSD
  data.totalXP += xpEarned
  data.level = getLevelFromXP(data.totalXP)

  // Record action
  data.actions.push({
    type: isFirstLP ? 'first_lp' : 'add_liquidity',
    amount: xpEarned,
    volumeUSD,
    timestamp: Date.now(),
    txHash,
  })

  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100)
  }

  const { data: updatedData, newAchievements } = checkAchievements(data)
  saveUserXPData(updatedData)

  return { xpEarned, newAchievements }
}

// Record removing liquidity
export function recordRemoveLiquidity(address: string, volumeUSD: number, txHash?: string): { xpEarned: number } {
  let data = getUserXPData(address)
  data = updateStreak(data)

  const xpEarned = XP_CONFIG.REMOVE_LIQUIDITY_XP

  data.stats.totalLiquidityRemoved += volumeUSD
  data.totalXP += xpEarned
  data.level = getLevelFromXP(data.totalXP)

  data.actions.push({
    type: 'remove_liquidity',
    amount: xpEarned,
    volumeUSD,
    timestamp: Date.now(),
    txHash,
  })

  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100)
  }

  saveUserXPData(data)

  return { xpEarned }
}

// Record rebalance
export function recordRebalance(address: string, txHash?: string): { xpEarned: number; newAchievements: string[] } {
  let data = getUserXPData(address)
  data = updateStreak(data)

  let xpEarned = XP_CONFIG.REBALANCE_XP

  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(data.stats.currentStreak)
  xpEarned = Math.floor(xpEarned * streakMultiplier)

  data.stats.totalRebalances++
  data.totalXP += xpEarned
  data.level = getLevelFromXP(data.totalXP)

  data.actions.push({
    type: 'rebalance',
    amount: xpEarned,
    timestamp: Date.now(),
    txHash,
  })

  if (data.actions.length > 100) {
    data.actions = data.actions.slice(-100)
  }

  const { data: updatedData, newAchievements } = checkAchievements(data)
  saveUserXPData(updatedData)

  return { xpEarned, newAchievements }
}

// Export data for migration
export function exportXPDataForMigration(address: string): string {
  const data = getUserXPData(address)

  const exportData = {
    version: 1,
    network: 'coston2',
    exportedAt: Date.now(),
    data: {
      address: data.address,
      totalXP: data.totalXP,
      level: data.level,
      stats: data.stats,
      achievements: data.achievements,
      actionsCount: data.actions.length,
      createdAt: data.createdAt,
    },
    // Create a simple signature for verification (not cryptographically secure, just for basic validation)
    checksum: btoa(`${data.address}:${data.totalXP}:${data.stats.totalSwaps}:${data.createdAt}`),
  }

  return JSON.stringify(exportData, null, 2)
}

// Get all stored XP data (for leaderboard/admin)
export function getAllStoredXPData(): UserXPData[] {
  if (typeof window === 'undefined') return []

  const allData: UserXPData[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(XP_STORAGE_KEY)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '')
        if (data.address && data.totalXP !== undefined) {
          allData.push(data)
        }
      } catch {
        // Skip invalid entries
      }
    }
  }

  // Sort by XP descending
  return allData.sort((a, b) => b.totalXP - a.totalXP)
}

// Get leaderboard (top N users)
export function getLeaderboard(limit: number = 10): UserXPData[] {
  return getAllStoredXPData().slice(0, limit)
}
