'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimeFrame = '1H' | '24H' | '7D' | '30D'

interface PriceData {
  time: number
  price: number
}

interface PriceChartProps {
  tokenSymbol: string
  currentPrice: number
  priceChange24h?: number
  className?: string
}

// Generate mock historical data
function generateMockData(timeframe: TimeFrame, currentPrice: number): PriceData[] {
  const now = Date.now()
  const points = {
    '1H': { count: 60, interval: 60 * 1000 },
    '24H': { count: 96, interval: 15 * 60 * 1000 },
    '7D': { count: 168, interval: 60 * 60 * 1000 },
    '30D': { count: 120, interval: 6 * 60 * 60 * 1000 },
  }[timeframe]

  const data: PriceData[] = []
  let price = currentPrice * (0.9 + Math.random() * 0.1) // Start from slightly different price

  for (let i = points.count; i >= 0; i--) {
    const time = now - i * points.interval
    // Random walk with slight trend towards current price
    const trend = (currentPrice - price) * 0.01
    const noise = (Math.random() - 0.5) * currentPrice * 0.02
    price = price + trend + noise
    price = Math.max(price, currentPrice * 0.5) // Floor
    data.push({ time, price: Number(price.toFixed(6)) })
  }

  // Ensure last point is current price
  data[data.length - 1].price = currentPrice

  return data
}

export function PriceChart({ tokenSymbol, currentPrice, priceChange24h = 0, className }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('24H')

  const data = useMemo(() => generateMockData(timeframe, currentPrice), [timeframe, currentPrice])

  const minPrice = Math.min(...data.map(d => d.price))
  const maxPrice = Math.max(...data.map(d => d.price))
  const priceRange = maxPrice - minPrice || 1

  // Generate SVG path
  const width = 400
  const height = 120
  const padding = 4

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.price - minPrice) / priceRange) * (height - padding * 2)
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`

  const isPositive = priceChange24h >= 0
  const strokeColor = isPositive ? '#22c55e' : '#ef4444'

  return (
    <div className={cn('glass-card rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{tokenSymbol}/USD</span>
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium',
              isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(priceChange24h).toFixed(2)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            ${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-800/50">
          {(['1H', '24H', '7D', '30D'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                timeframe === tf
                  ? 'bg-dune-400/20 text-dune-400'
                  : 'text-zinc-500 hover:text-white'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-32"
          preserveAspectRatio="none"
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id={`gradient-${tokenSymbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area */}
          <path
            d={areaPath}
            fill={`url(#gradient-${tokenSymbol})`}
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current price dot */}
          <circle
            cx={width - padding}
            cy={height - padding - ((currentPrice - minPrice) / priceRange) * (height - padding * 2)}
            r="4"
            fill={strokeColor}
          />
        </svg>

        {/* Price Range */}
        <div className="absolute top-0 right-0 text-xs text-zinc-500">
          ${maxPrice.toFixed(maxPrice < 1 ? 4 : 2)}
        </div>
        <div className="absolute bottom-0 right-0 text-xs text-zinc-500">
          ${minPrice.toFixed(minPrice < 1 ? 4 : 2)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
        <div>
          <div className="text-xs text-zinc-500 mb-1">24h High</div>
          <div className="text-sm font-medium text-white">
            ${(currentPrice * 1.02).toFixed(currentPrice < 1 ? 6 : 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">24h Low</div>
          <div className="text-sm font-medium text-white">
            ${(currentPrice * 0.98).toFixed(currentPrice < 1 ? 6 : 4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">24h Volume</div>
          <div className="text-sm font-medium text-white">$12.5K</div>
        </div>
      </div>
    </div>
  )
}

// Mini chart for pool cards
export function MiniPriceChart({ data, isPositive = true, className }: {
  data: number[]
  isPositive?: boolean
  className?: string
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const width = 80
  const height = 24

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d - min) / range) * height
    return `${x},${y}`
  })

  const path = `M ${points.join(' L ')}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('w-20 h-6', className)}>
      <path
        d={path}
        fill="none"
        stroke={isPositive ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
