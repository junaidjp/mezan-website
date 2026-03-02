"use client";

import React, { useState } from "react";
// import axios from "axios";
// import { StrategySelector } from "../../components/StrategySelector";
// import { StrategyStatus } from "../../components/StrategyStatus";
// import { BacktestResults } from "../../components/BacktestResults";

// TODO: Re-enable strategy logic later - currently disabled for MVP
// Types for API responses (commented out for now)
/*
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

interface BacktestData {
  symbol: string;
  strategy: string;
  current_status: {
    has_trend: boolean;
    has_entry: boolean;
    current_price: number;
    ema9: number;
    ema21: number;
    ema50: number;
  };
  backtest_results: {
    performance: {
      total_return_pct: number;
      final_capital: number;
      total_pnl: number;
      max_drawdown_pct: number;
      total_trades: number;
      win_rate_pct: number;
      profit_factor: number | string;
      avg_win: number;
      avg_loss: number;
    };
    equity_curve: {
      data: number[];
      length: number;
    };
    trades: {
      summary: {
        total: number;
        winners: number;
        losers: number;
      };
      details: Array<{
        entry_date: string | number;
        exit_date: string | number;
        entry_price: number;
        exit_price: number;
        pnl: number;
        pnl_pct: number;
        duration: number;
      }>;
    };
  };
}
*/

// const API_BASE_URL = "http://127.0.0.1:8000";

export default function AnalysisPage() {
  // Strategy logic temporarily disabled for MVP
  // const [symbol, setSymbol] = useState("");
  // const [strategies, setStrategies] = useState<Strategy[]>([]);
  // const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  // const [loading, setLoading] = useState(false);
  // const [loadingStrategies, setLoadingStrategies] = useState(true);
  // const [strategyStatus, setStrategyStatus] = useState<StrategyStatusData | null>(null);
  // const [backtestData, setBacktestData] = useState<BacktestData | null>(null);
  // const [error, setError] = useState<string | null>(null);

  // Load available strategies on component mount
  /*
  React.useEffect(() => {
    const loadStrategies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/strategies`);
        const strategiesList = response.data.strategies;
        setStrategies(strategiesList);
        if (strategiesList.length > 0) {
          setSelectedStrategy(strategiesList[0]);
        }
      } catch (err) {
        console.error("Failed to load strategies:", err);
        // Fallback to default strategy
        const fallbackStrategy = {
          id: "mezan_ema_trend",
          name: "Mezan EMA Trend",
          description: "EMA-based trend following strategy",
        };
        setStrategies([fallbackStrategy]);
        setSelectedStrategy(fallbackStrategy);
      } finally {
        setLoadingStrategies(false);
      }
    };

    loadStrategies();
  }, []);

  const testConnection = async () => {
    try {
      console.log("Testing API connection...");
      const response = await axios.get(`${API_BASE_URL}/strategies`);
      console.log("Connection test successful:", response.data);
      alert("✅ API Connection successful!");
    } catch (err: any) {
      console.error("Connection test failed:", err);
      alert(`❌ API Connection failed: ${err.message}`);
    }
  };

  const analyzeSymbol = async () => {
    if (!symbol.trim() || !selectedStrategy) return;

    setLoading(true);
    setError(null);
    setStrategyStatus(null);
    setBacktestData(null);

    try {
      console.log(
        "Calling API for symbol:",
        symbol.toUpperCase(),
        "with strategy:",
        selectedStrategy.id,
      );

      // Get strategy status
      const statusUrl = `${API_BASE_URL}/strategy-status?symbol=${symbol.toUpperCase()}&strategy=${selectedStrategy.id}`;
      console.log("Fetching strategy status from:", statusUrl);

      const statusResponse = await axios.get<StrategyStatusData>(statusUrl);
      console.log("Strategy status response:", statusResponse.data);
      setStrategyStatus(statusResponse.data);

      // Get backtest results
      const backtestUrl = `${API_BASE_URL}/backtest?symbol=${symbol.toUpperCase()}&strategy=${selectedStrategy.id}`;
      console.log("Fetching backtest data from:", backtestUrl);

      const backtestResponse = await axios.get<BacktestData>(backtestUrl);
      console.log("Backtest response:", backtestResponse.data);
      setBacktestData(backtestResponse.data);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          `Failed to analyze symbol: ${err.message}. Please check if the symbol exists and the API server is running.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      analyzeSymbol();
    }
  };
  */

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold tracking-tight">
            Mezan <span className="text-emerald-400">Strategy</span> Analyzer
          </div>
          <nav className="flex gap-6 text-sm text-white/70">
            <a href="/" className="hover:text-white">
              Home
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Coming Soon Section */}
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold mb-6">Strategy Analysis</h1>
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            <h2 className="text-2xl font-semibold">Coming Soon</h2>
          </div>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            We're working on bringing you powerful strategy analysis tools that will help you:
          </p>
          
          <div className="grid gap-6 md:grid-cols-3 mt-12 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-3xl mb-4">📈</div>
              <h3 className="font-semibold mb-2">Real-time Analysis</h3>
              <p className="text-white/60 text-sm">Get current strategy classification for any stock with live market data</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Strategy Status</h3>
              <p className="text-white/60 text-sm">See if stocks are trending, have entry signals, or should be avoided</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold mb-2">Historical Validation</h3>
              <p className="text-white/60 text-sm">View complete backtest performance with detailed trade analysis</p>
            </div>
          </div>

          <div className="mt-16 bg-white/5 border border-white/10 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              📱 Download the Mobile App
            </h3>
            <p className="text-white/70 mb-6">
              Get access to our complete strategy analysis tools in the Mezan Investing mobile app, available now on iOS and Android.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="https://apple.co/YOUR_APP_LINK"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
              >
                Download for iOS
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=YOUR_PACKAGE"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Download for Android
              </a>
            </div>
          </div>
        </div>

        {/* Original Strategy Analysis Section - Commented Out for Later Implementation */}
        {/*
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Strategy Analysis</h1>
            <p className="text-white/70">
              Enter a stock symbol to see current strategy status and historical
              backtest performance
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Stock Symbol
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter symbol (e.g., NVDA, AAPL)"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            {loadingStrategies ? (
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                <div className="h-12 bg-white/10 rounded"></div>
              </div>
            ) : selectedStrategy ? (
              <StrategySelector
                strategies={strategies}
                selected={selectedStrategy}
                onChange={setSelectedStrategy}
              />
            ) : (
              <div className="text-red-400">Failed to load strategies</div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={analyzeSymbol}
              disabled={loading || !symbol.trim() || !selectedStrategy}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>🔍 Analyze Strategy</>
              )}
            </button>

            <button
              onClick={testConnection}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
            >
              Test API Connection
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <span>⚠️</span>
              <span className="font-medium">Analysis Failed</span>
            </div>
            <p className="mt-1 text-red-300">{error}</p>
          </div>
        )}

        {strategyStatus && (
          <div className="space-y-8">
            <StrategyStatus data={strategyStatus} />

            {backtestData && (
              <BacktestResults
                data={backtestData.backtest_results}
                symbol={symbol.toUpperCase()}
              />
            )}
          </div>
        )}

        {!strategyStatus && !loading && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📈 How Strategy Analysis Works
            </h3>
            <div className="space-y-3 text-white/70">
              <p>
                • <strong>Real-time Analysis:</strong> Get current strategy
                classification for any stock
              </p>
              <p>
                • <strong>Strategy Status:</strong> See if the stock is
                trending, has entry signals, or should be avoided
              </p>
              <p>
                • <strong>Historical Validation:</strong> View complete backtest
                performance with trade details
              </p>
              <p>
                • <strong>Risk Metrics:</strong> Understand drawdown, win rate,
                and profit factors
              </p>
            </div>
          </div>
        )}
        */}
      </div>
    </main>
  );
}
