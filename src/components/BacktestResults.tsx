'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BacktestResultsData {
  performance: {
    total_return_pct: number
    final_capital: number
    total_pnl: number
    max_drawdown_pct: number
    total_trades: number
    win_rate_pct: number
    profit_factor: number | string
    avg_win: number
    avg_loss: number
  }
  equity_curve: {
    data: number[]
    length: number
  }
  trades: {
    summary: {
      total: number
      winners: number
      losers: number
    }
    details: Array<{
      entry_date: string | number
      exit_date: string | number
      entry_price: number
      exit_price: number
      pnl: number
      pnl_pct: number
      duration: number
    }>
  }
}

interface BacktestResultsProps {
  data: BacktestResultsData
  symbol: string
}

export function BacktestResults({ data, symbol }: BacktestResultsProps) {
  // Prepare chart data
  const chartData = data.equity_curve.data.map((value, index) => ({
    index,
    equity: value
  }))

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatPercent = (percent: number) => `${percent.toFixed(2)}%`

  return (
    <div className="space-y-6">
      
      {/* Performance Overview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-bold mb-6">Backtest Performance - {symbol}</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Total Return */}
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`${data.performance.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>↑</span>
              <span className="text-sm text-white/70">Total Return</span>
            </div>
            <p className={`text-2xl font-bold ${data.performance.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(data.performance.total_return_pct)}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {formatCurrency(data.performance.total_pnl)}
            </p>
          </div>

          {/* Max Drawdown */}
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">↓</span>
              <span className="text-sm text-white/70">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {formatPercent(data.performance.max_drawdown_pct)}
            </p>
          </div>

          {/* Win Rate */}
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">🎯</span>
              <span className="text-sm text-white/70">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {formatPercent(data.performance.win_rate_pct)}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {data.trades.summary.winners} / {data.trades.summary.total} trades
            </p>
          </div>

          {/* Profit Factor */}
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400">📈</span>
              <span className="text-sm text-white/70">Profit Factor</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {typeof data.performance.profit_factor === 'number' 
                ? data.performance.profit_factor.toFixed(2)
                : data.performance.profit_factor}
            </p>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="index" 
                stroke="#9CA3AF" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Line 
                type="monotone" 
                dataKey="equity" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-white/70">
          <span>Starting: {formatCurrency(10000)}</span>
          <span>Final: {formatCurrency(data.performance.final_capital)}</span>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Trade Statistics */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold mb-4">Trade Statistics</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total Trades</span>
              <span className="font-mono">{data.performance.total_trades}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70">Average Win</span>
              <span className="font-mono text-green-400">{formatCurrency(data.performance.avg_win)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70">Average Loss</span>
              <span className="font-mono text-red-400">{formatCurrency(data.performance.avg_loss)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70">Winners</span>
              <span className="font-mono text-green-400">{data.trades.summary.winners}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70">Losers</span>
              <span className="font-mono text-red-400">{data.trades.summary.losers}</span>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.trades.details.slice(0, 5).map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-black/30">
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Entry:</span>
                    <span className="font-mono">{formatCurrency(trade.entry_price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Exit:</span>
                    <span className="font-mono">{formatCurrency(trade.exit_price)}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(trade.pnl)}
                  </div>
                  <div className={`text-xs ${trade.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(trade.pnl_pct)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {data.trades.details.length > 5 && (
            <p className="text-xs text-white/50 mt-2">
              Showing 5 of {data.trades.details.length} trades
            </p>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              data.performance.total_return_pct >= 20 ? 'text-green-400' :
              data.performance.total_return_pct >= 10 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {data.performance.total_return_pct >= 20 ? 'High' :
               data.performance.total_return_pct >= 10 ? 'Medium' : 'Low'}
            </div>
            <div className="text-sm text-white/70">Return Quality</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              data.performance.max_drawdown_pct <= 10 ? 'text-green-400' :
              data.performance.max_drawdown_pct <= 20 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {data.performance.max_drawdown_pct <= 10 ? 'Low' :
               data.performance.max_drawdown_pct <= 20 ? 'Medium' : 'High'}
            </div>
            <div className="text-sm text-white/70">Risk Level</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              data.performance.win_rate_pct >= 60 ? 'text-green-400' :
              data.performance.win_rate_pct >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {data.performance.win_rate_pct >= 60 ? 'High' :
               data.performance.win_rate_pct >= 40 ? 'Medium' : 'Low'}
            </div>
            <div className="text-sm text-white/70">Consistency</div>
          </div>
        </div>
      </div>
    </div>
  )
}