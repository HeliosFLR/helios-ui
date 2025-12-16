'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-xl transition-all duration-300',
        'hover:bg-white/5 dark:hover:bg-white/5',
        'bg-amber-100 dark:bg-transparent',
        'group'
      )}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon (for dark mode - click to go light) */}
        <Sun
          className={cn(
            'absolute inset-0 h-5 w-5 transition-all duration-300',
            theme === 'dark'
              ? 'text-amber-500 rotate-0 scale-100'
              : 'text-amber-500 -rotate-90 scale-0'
          )}
        />
        {/* Moon icon (for light mode - click to go dark) */}
        <Moon
          className={cn(
            'absolute inset-0 h-5 w-5 transition-all duration-300',
            theme === 'light'
              ? 'text-amber-600 rotate-0 scale-100'
              : 'text-amber-600 rotate-90 scale-0'
          )}
        />
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-300" />
    </button>
  )
}
