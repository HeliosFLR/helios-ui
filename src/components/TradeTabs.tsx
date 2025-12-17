'use client'

import { useState } from 'react'
import { ArrowLeftRight, Target } from 'lucide-react'
import { SwapCard } from './SwapCard'
import { LimitOrderCard } from './LimitOrderCard'
import { cn } from '@/lib/utils'

type TradeTab = 'swap' | 'limit'

export function TradeTabs() {
  const [activeTab, setActiveTab] = useState<TradeTab>('swap')

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tab Selector */}
      <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-zinc-900/50 border border-white/5">
        <button
          onClick={() => setActiveTab('swap')}
          className={cn(
            'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'swap'
              ? 'bg-gradient-to-r from-dune-400 to-dune-500 text-black'
              : 'text-zinc-500 hover:text-white'
          )}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Swap
        </button>
        <button
          onClick={() => setActiveTab('limit')}
          className={cn(
            'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'limit'
              ? 'bg-gradient-to-r from-dune-400 to-dune-500 text-black'
              : 'text-zinc-500 hover:text-white'
          )}
        >
          <Target className="h-4 w-4" />
          Limit
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-float-up">
        {activeTab === 'swap' ? <SwapCard /> : <LimitOrderCard />}
      </div>
    </div>
  )
}
