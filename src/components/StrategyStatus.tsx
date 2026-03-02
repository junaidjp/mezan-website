"use client";

import React from "react";

interface StrategyStatusData {
  symbol: string;
  strategy: string;
  is_trending: boolean;
  entry_signal: boolean;
  exit_signal: boolean;
  current_price: number;
  // EMA fields (for EMA-based strategies)
  ema9?: number;
  ema21?: number;
  ema50?: number;
  ema20?: number;
  // RSI field (for mean reversion and momentum strategies)
  rsi?: number;
  // ADX field (for momentum strategy)
  adx?: number;
  // MACD field (for momentum strategy)
  macd?: number;
  recommendation: "BUY" | "HOLD" | "AVOID";
}

interface StrategyStatusProps {
  data: StrategyStatusData;
}

export function StrategyStatus({ data }: StrategyStatusProps) {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "BUY":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "HOLD":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "AVOID":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "BUY":
        return <span>↑</span>;
      case "HOLD":
        return <span>—</span>;
      case "AVOID":
        return <span>↓</span>;
      default:
        return <span>●</span>;
    }
  };

  const getStrategyExplanation = (strategyName: string) => {
    switch (strategyName) {
      case "Mezan EMA Trend":
        return "This strategy looks for trend alignment (EMA9 > EMA21 > EMA50), controlled pullbacks to the EMA21 level, and momentum resumption when price reclaims EMA9. Current recommendation is based on these conditions.";

      case "Breakout Strategy":
        return "This strategy identifies breakouts from consolidation periods. It looks for low volatility (narrow Bollinger Bands), then enters when price breaks above resistance with high volume confirmation and strong trend filter.";

      case "Mean Reversion Strategy":
        return "This strategy trades oversold bounces in uptrends. It enters when RSI is oversold (<30) or price touches lower Bollinger Band while maintaining uptrend (EMA20 > EMA50 and price > 200 SMA), then exits on overbought conditions or trend breaks.";

      case "Momentum Strategy":
        return "This strategy rides strong trends with momentum confirmation. It enters on new 20-day highs when trend is strong (ADX > 25), MACD is bullish, RSI is in momentum zone (50-80), and volume confirms the move.";

      default:
        return "Strategy-specific logic will be displayed here based on the selected trading approach.";
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null || isNaN(price)) {
      return "$--";
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{data.symbol}</h2>
          <p className="text-white/70">{data.strategy}</p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 border ${getRecommendationColor(data.recommendation)}`}
        >
          {getRecommendationIcon(data.recommendation)}
          <span className="font-semibold">{data.recommendation}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Status</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Price</span>
              <span className="font-mono text-lg">
                {formatPrice(data.current_price)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">Trending</span>
              <div
                className={`flex items-center gap-2 ${data.is_trending ? "text-green-400" : "text-red-400"}`}
              >
                <span>{data.is_trending ? "↑" : "↓"}</span>
                <span>{data.is_trending ? "Yes" : "No"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">Entry Signal</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  data.entry_signal
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {data.entry_signal ? "Active" : "None"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70">Exit Signal</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  data.exit_signal
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {data.exit_signal ? "Active" : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* EMA Levels */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Strategy Indicators</h3>

          <div className="space-y-3">
            {/* Show EMA levels for EMA-based strategies */}
            {data.ema9 !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">EMA 9</span>
                <span className="font-mono">{formatPrice(data.ema9)}</span>
              </div>
            )}

            {data.ema21 !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">EMA 21</span>
                <span className="font-mono">{formatPrice(data.ema21)}</span>
              </div>
            )}

            {data.ema50 !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">EMA 50</span>
                <span className="font-mono">{formatPrice(data.ema50)}</span>
              </div>
            )}

            {/* Show EMA 20 for mean reversion */}
            {data.ema20 !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">EMA 20</span>
                <span className="font-mono">{formatPrice(data.ema20)}</span>
              </div>
            )}

            {/* Show RSI for applicable strategies */}
            {data.rsi !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">RSI</span>
                <span className="font-mono">{data.rsi.toFixed(1)}</span>
              </div>
            )}

            {/* Show ADX for momentum strategy */}
            {data.adx !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">ADX</span>
                <span className="font-mono">{data.adx.toFixed(1)}</span>
              </div>
            )}

            {/* Show MACD for momentum strategy */}
            {data.macd !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-white/70">MACD</span>
                <span className="font-mono">{data.macd.toFixed(4)}</span>
              </div>
            )}
          </div>

          {/* EMA Alignment Visual - only show for EMA strategies */}
          {data.ema9 !== undefined &&
            data.ema21 !== undefined &&
            data.ema50 !== undefined && (
              <div className="mt-4 p-3 bg-black/30 rounded-lg">
                <p className="text-xs text-white/70 mb-2">EMA Alignment</p>
                <div className="space-y-1">
                  <div
                    className={`h-1 rounded ${data.ema9 > data.ema21 ? "bg-green-500" : "bg-red-500"} relative`}
                  >
                    <span className="absolute -top-6 left-0 text-xs text-white/70">
                      EMA9
                    </span>
                  </div>
                  <div
                    className={`h-1 rounded ${data.ema21 > data.ema50 ? "bg-green-500" : "bg-red-500"} relative`}
                  >
                    <span className="absolute -top-6 left-0 text-xs text-white/70">
                      EMA21
                    </span>
                  </div>
                  <div className="h-1 rounded bg-white/30 relative">
                    <span className="absolute -top-6 left-0 text-xs text-white/70">
                      EMA50
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Strategy Explanation */}
      <div className="mt-6 p-4 rounded-lg bg-black/30">
        <h4 className="font-medium mb-2">Strategy Logic</h4>
        <p className="text-sm text-white/70">
          {getStrategyExplanation(data.strategy)}
        </p>
      </div>
    </div>
  );
}
