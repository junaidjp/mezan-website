'use client'

import React from 'react'

interface Strategy {
  id: string
  name: string
  description: string
}

interface StrategySelectorProps {
  strategies: Strategy[]
  selected: Strategy
  onChange: (strategy: Strategy) => void
}

export function StrategySelector({ strategies, selected, onChange }: StrategySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Trading Strategy</label>
      <div className="relative">
        <select
          value={selected.id}
          onChange={(e) => {
            const strategy = strategies.find(s => s.id === e.target.value)
            if (strategy) onChange(strategy)
          }}
          className="w-full appearance-none rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
        >
          {strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.id} className="bg-gray-900">
              {strategy.name}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">▼</span>
      </div>
      <p className="mt-1 text-sm text-white/50">{selected.description}</p>
    </div>
  )
}