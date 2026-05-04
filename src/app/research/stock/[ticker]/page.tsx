"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TickerSearch from "../../../../components/TickerSearch";
import ThemeToggle from "../../../../components/ThemeToggle";
import { useAuth } from "../../../../components/AuthProvider";

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const router = useRouter();
  const { user, loading: authLoading, hasResearchAccess, isElite } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = ticker?.toUpperCase() || "NVDA";

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!hasResearchAccess) { router.push("/research"); return; }

    fetch(`/api/stock/${t}`)
      .then(async (res) => {
        const data = await res.json();
        if (data.error === "not_halal") {
          setStock({ notHalal: true, message: data.message });
        } else {
          setStock(data);
        }
      })
      .catch((err) => console.error("Failed to fetch stock:", err))
      .finally(() => setLoading(false));
  }, [authLoading, user, router, t]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="mt-4 text-sm text-white/40">Loading {t} data...</p>
        </div>
      </main>
    );
  }

  if (stock?.notHalal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
            &#x2718;
          </div>
          <h1 className="text-2xl font-bold text-white">Not Halal Compliant</h1>
          <p className="mt-3 text-white/40">{stock.message}</p>
          <p className="mt-2 text-sm text-white/30">Mezan Research only covers HALAL and QUESTIONABLE tickers.</p>
          <a href="/research" className="mt-6 inline-block rounded-xl bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20">
            Back to Research
          </a>
        </div>
      </main>
    );
  }

  if (!stock) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-white/40">Failed to load stock data</p>
      </main>
    );
  }

  const detailTabs = [
    { id: "overview", label: "Overview" },
    { id: "chart", label: "Chart" },
    { id: "fundamentals", label: "Fundamentals" },
    { id: "technicals", label: "Technicals" },
    { id: "financials", label: "Financials" },
    { id: "analysts", label: "Analysts" },
    { id: "ownership", label: "Ownership" },
    { id: "news", label: "News" },
    { id: "halal", label: "Halal Report" },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <a href="/research" className="text-lg font-semibold tracking-tight">
              Mezan <span className="text-emerald-400">Research</span>
            </a>
            <span className="text-white/20">/</span>
            <span className="font-semibold">{t}</span>
          </div>
          <div className="flex items-center gap-3">
            <TickerSearch />
            <ThemeToggle />
            <button
              onClick={() => router.push("/research")}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:text-white"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* STOCK HEADER */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl font-bold text-emerald-400">
                {t.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{stock.name}</h1>
                <p className="mt-1 text-sm text-white/40">
                  {t} · {stock.exchange} · {stock.sector}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${stock.price.toFixed(2)}</p>
              <p className={`mt-1 text-lg font-semibold ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stock.change >= 0 ? "+" : ""}{stock.changeAmt.toFixed(2)} ({stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%)
              </p>
              <p className="mt-1 text-xs text-white/30">
                As of {new Date().toLocaleString("en-US", {
                  timeZone: "America/New_York",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })} ET
              </p>
            </div>
          </div>

          {/* Halal + AI Badges */}
          <div className="mt-5 flex items-center gap-3">
            {(() => {
              const s = stock.halal?.status || "UNKNOWN";
              const cfg = s === "HALAL"
                ? { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "HALAL" }
                : s === "NOT_HALAL"
                ? { bg: "bg-red-500/10", text: "text-red-400", label: "NOT HALAL" }
                : s === "QUESTIONABLE"
                ? { bg: "bg-amber-500/10", text: "text-amber-400", label: "QUESTIONABLE" }
                : { bg: "bg-white/5", text: "text-white/50", label: "UNKNOWN" };
              return (
                <span className={`rounded-lg ${cfg.bg} px-3 py-1 text-xs font-bold ${cfg.text}`}>
                  {cfg.label}
                </span>
              );
            })()}
            <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
              AI: {stock.aiConfidence}
            </span>
            <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
              stock.aiSignal === "BUY" ? "bg-emerald-500/10 text-emerald-400" :
              stock.aiSignal === "SELL" ? "bg-red-500/10 text-red-400" :
              "bg-amber-500/10 text-amber-400"
            }`}>
              {stock.aiSignal}
            </span>
            <span className="rounded-lg bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
              Day Range: ${stock.dayLow} - ${stock.dayHigh}
            </span>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 overflow-x-auto">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${
                  activeTab === tab.id
                    ? "bg-emerald-500/10 text-emerald-400 font-medium"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TAB CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "overview" && <OverviewTab stock={stock} ticker={t} />}
        {activeTab === "chart" && <ChartAndLevelsTab stock={stock} ticker={t} />}
{activeTab === "fundamentals" && <FundamentalsTab stock={stock} ticker={t} />}
        {activeTab === "technicals" && <TechnicalsTab stock={stock} />}
        {activeTab === "financials" && <FinancialsTab stock={stock} />}
        {activeTab === "analysts" && <AnalystsTab stock={stock} />}
        {activeTab === "ownership" && <OwnershipTab stock={stock} />}
        {activeTab === "news" && <NewsTab ticker={t} />}
        {activeTab === "halal" && <HalalTab stock={stock} ticker={t} />}
      </div>
    </main>
  );
}

// ===== COMPONENTS =====

function AnalystProjections({ projections: p }: { projections: any }) {
  const total = (p.strongBuy || 0) + (p.buy || 0) + (p.hold || 0) + (p.sell || 0) + (p.strongSell || 0);
  const bullish = (p.strongBuy || 0) + (p.buy || 0);
  const bullishPct = total > 0 ? Math.round((bullish / total) * 100) : 0;
  const isUpside = p.upside >= 0;

  // Consensus label
  const consensusLabel = bullishPct >= 70 ? "Strong Buy" : bullishPct >= 50 ? "Buy" : bullishPct >= 30 ? "Hold" : "Sell";
  const consensusColor = bullishPct >= 70 ? "text-emerald-400" : bullishPct >= 50 ? "text-emerald-300" : bullishPct >= 30 ? "text-amber-400" : "text-red-400";
  const consensusBg = bullishPct >= 70 ? "bg-emerald-500" : bullishPct >= 50 ? "bg-emerald-400" : bullishPct >= 30 ? "bg-amber-400" : "bg-red-400";

  // Price position on bar (0-100%)
  const range = p.highTarget - p.lowTarget;
  const currentPos = range > 0 ? Math.min(100, Math.max(0, ((p.currentPrice - p.lowTarget) / range) * 100)) : 50;
  const avgPos = range > 0 ? Math.min(100, Math.max(0, ((p.avgTarget - p.lowTarget) / range) * 100)) : 50;

  // Rating bars data
  const ratings = [
    { label: "Strong Buy", count: p.strongBuy || 0, color: "#10b981" },
    { label: "Buy", count: p.buy || 0, color: "#34d399" },
    { label: "Hold", count: p.hold || 0, color: "#fbbf24" },
    { label: "Sell", count: p.sell || 0, color: "#f87171" },
    { label: "Strong Sell", count: p.strongSell || 0, color: "#ef4444" },
  ];
  const maxCount = Math.max(...ratings.map((r) => r.count), 1);

  return (
    <Card>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* LEFT: Consensus + Rating Bars */}
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-6">Analyst Consensus</h3>

          {/* Consensus Gauge */}
          <div className="flex items-center gap-6 mb-8">
            <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full ${consensusBg}/15 border-2 ${consensusBg.replace("bg-", "border-")}/30`}>
              <div className="text-center">
                <p className={`text-xl font-bold ${consensusColor}`}>{consensusLabel}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/50">
                Based on <span className="text-white font-semibold">{total}</span> Wall Street analysts
              </p>
              <p className="text-sm text-white/40 mt-1">
                <span className={`font-semibold ${consensusColor}`}>{bullishPct}%</span> recommend buying
              </p>
            </div>
          </div>

          {/* Rating Horizontal Bars */}
          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-20 text-xs text-white/40 text-right">{r.label}</span>
                <div className="flex-1 h-6 rounded-md bg-white/[0.04] overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${(r.count / maxCount) * 100}%`,
                      backgroundColor: r.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="w-8 text-sm font-semibold text-white/70 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Price Target Visual */}
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-6">Price Forecast</h3>

          {/* Big upside number */}
          <div className="text-center mb-8">
            <p className={`text-5xl font-bold ${isUpside ? "text-emerald-400" : "text-red-400"}`}>
              {isUpside ? "+" : ""}{p.upside}%
            </p>
            <p className="text-sm text-white/40 mt-2">
              Upside from current price of <span className="text-white font-semibold">${p.currentPrice}</span>
            </p>
          </div>

          {/* Price Target Range Bar */}
          <div className="relative px-4 mb-3">
            {/* The bar */}
            <div className="relative h-4 rounded-full bg-gradient-to-r from-red-500/20 via-amber-500/20 to-emerald-500/20 border border-white/[0.06]">
              {/* Average target marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${avgPos}%` }}
              >
                <div className="h-8 w-0.5 bg-emerald-400 -mt-2" />
                <div className="h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#060a10] -mt-[10px]" />
              </div>

              {/* Current price marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${currentPos}%` }}
              >
                <div className="h-4 w-4 rounded-full bg-white border-2 border-[#060a10]" />
              </div>
            </div>
          </div>

          {/* Labels below bar */}
          <div className="flex justify-between px-2 mb-6">
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">${p.lowTarget}</p>
              <p className="text-[10px] text-white/30">Low</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">${p.avgTarget}</p>
              <p className="text-[10px] text-white/30">Average</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-300">${p.highTarget}</p>
              <p className="text-[10px] text-white/30">High</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-white/30">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-white border border-white/30" />
              <span>Current Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span>Avg Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Analyst Targets */}
      {p.analystTargets?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Latest Research Reports</h3>
          <div className="space-y-2">
            {p.analystTargets.map((at: any, i: number) => (
              <div key={i} className="rounded-lg bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold flex-shrink-0 ${
                      ["Buy","Outperform","Overweight","Strong Buy","Strong-Buy"].includes(at.rating)
                        ? "bg-emerald-500/10 text-emerald-400"
                        : ["Sell","Underperform","Underweight","Strong Sell"].includes(at.rating)
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {at.rating}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{at.firm}</p>
                      <p className={`text-[10px] ${
                        at.action === "Upgraded" || at.action === "Initiated" ? "text-emerald-400"
                        : at.action === "Downgraded" ? "text-red-400"
                        : "text-white/30"
                      }`}>
                        {at.action}{at.prevRating && at.prevRating !== at.rating ? ` from ${at.prevRating}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    {at.target && <p className="text-sm font-bold text-white/80">${at.target}</p>}
                    <p className="text-[10px] text-white/25">{at.date}</p>
                  </div>
                </div>
                {at.headline && (
                  <p className="mt-2 text-[11px] text-white/35 truncate">{at.headline}</p>
                )}
                {at.priceWhenPosted && (
                  <p className="mt-1 text-[10px] text-white/20">Price when posted: ${at.priceWhenPosted}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TradingViewChart({ ticker }: { ticker: string }) {
  useEffect(() => {
    const container = document.getElementById("tv-chart-container");
    if (!container) return;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.onload = () => {
      // @ts-ignore
      new window.TradingView.widget({
        autosize: true,
        symbol: ticker,
        interval: "D",
        timezone: "America/New_York",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: "tv-chart-container",
        hide_side_toolbar: false,
        withdateranges: true,
        studies_overrides: {
          "moving average exponential.plot.color.0": "#81c784",     // EMA 10 - Light Green
          "moving average exponential.plot.linewidth": 2,
        },
        studies: [
          { id: "MAExp@tv-basicstudies", inputs: { length: 10 }, styles: { plot: { color: "#81c784", linewidth: 2 } } },
          { id: "MAExp@tv-basicstudies", inputs: { length: 21 }, styles: { plot: { color: "#42a5f5", linewidth: 2 } } },
          { id: "MAExp@tv-basicstudies", inputs: { length: 50 }, styles: { plot: { color: "#b39ddb", linewidth: 2 } } },
          { id: "MAExp@tv-basicstudies", inputs: { length: 200 }, styles: { plot: { color: "#ef5350", linewidth: 2 } } },
          { id: "VWAP@tv-basicstudies" },
          { id: "RSI@tv-basicstudies", inputs: { length: 14 } },
          { id: "MACD@tv-basicstudies" },
        ],
      });
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [ticker]);

  return <div id="tv-chart-container" style={{ height: 550 }} />;
}

function colorPct(val: string | null | undefined) {
  if (!val) return "N/A";
  const n = parseFloat(val);
  return `${n >= 0 ? "+" : ""}${val}%`;
}

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold text-white/50 uppercase tracking-wider">{title}</h3>}
      {children}
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-3 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold">{value}</span>
        {sub && <span className="ml-2 text-xs text-white/30">{sub}</span>}
      </div>
    </div>
  );
}

function BarMeter({ label, value, max = 100, color = "emerald" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color === "emerald" ? "bg-emerald-500" : color === "blue" ? "bg-blue-500" : "bg-amber-500";
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/20">
        <span>{label.includes("Valuation") ? "Overvalued" : "Low"}</span>
        <span>{label.includes("Valuation") ? "Undervalued" : "High"}</span>
      </div>
    </div>
  );
}

function SentimentBar({ label, level }: { label: string; level: "Weak" | "Neutral" | "Strong" }) {
  const pos = level === "Weak" ? 0 : level === "Neutral" ? 1 : 2;
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i === pos ? "bg-emerald-500" : "bg-white/10"}`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/20">
        <span>Weak</span><span>Neutral</span><span>Strong</span>
      </div>
    </div>
  );
}

// ===== TABS =====

function OverviewTab({ stock, ticker }: { stock: StockInfo; ticker: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Detailed Quote */}
      <div className="lg:col-span-2 space-y-6">
        <Card title="Detailed Quote">
          <StatRow label="Open" value={`$${stock.open}`} />
          <StatRow label="Previous Close" value={`$${stock.prevClose}`} />
          <StatRow label="Day Range" value={`$${stock.dayLow} - $${stock.dayHigh}`} />
          <StatRow label="52-Week Range" value={`$${stock.fiftyTwoLow} - $${stock.fiftyTwoHigh}`} />
          <StatRow label="Market Cap" value={stock.marketCap} />
          <StatRow label="P/E Ratio (TTM)" value={stock.pe.toString()} />
          <StatRow label="EPS (TTM)" value={`$${stock.eps}`} />
          <StatRow label="Sector" value={stock.sector} />
          <StatRow label="Volume" value={stock.volume} />
          <StatRow label="Avg Volume (20d)" value={stock.avgVolume} />
          <StatRow label="Beta" value={stock.beta.toString()} />
          <StatRow label="Dividend Yield" value={stock.dividendYield} />
        </Card>

        {/* AI Analysis */}
        <Card title="Mezan AI Analysis">
          <div className="flex items-center gap-3 mb-4">
            <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
              stock.aiSignal === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
            }`}>
              {stock.aiSignal}
            </span>
            <span className="text-sm text-white/40">Confidence: <span className="text-emerald-400 font-semibold">{stock.aiConfidence}</span></span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">{stock.aiAnalysis}</p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <p className="text-[10px] text-white/25">Entry</p>
              <p className="text-sm font-semibold">${stock.aiEntry}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <p className="text-[10px] text-white/25">Stop</p>
              <p className="text-sm font-semibold text-red-400">${stock.aiStop}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <p className="text-[10px] text-white/25">Target</p>
              <p className="text-sm font-semibold text-emerald-400">${stock.aiTarget}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-3 py-2">
              <p className="text-[10px] text-white/25">R:R</p>
              <p className="text-sm font-semibold text-blue-400">{stock.aiRR}</p>
            </div>
          </div>
        </Card>

        {/* Company Thesis — what they do + bull/bear demand case */}
        {stock.thesis && (
          <Card title="Company & Investment Thesis">
            <div className="space-y-5">
              {stock.thesis.businessSummary && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">What they do</p>
                  <p className="text-sm leading-relaxed text-white/70">{stock.thesis.businessSummary}</p>
                </div>
              )}
              {stock.thesis.bullCase && (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <span>&#x25B2;</span> Bull Case — Demand Story
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">{stock.thesis.bullCase}</p>
                </div>
              )}
              {stock.thesis.bearCase && (
                <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                    <span>&#x25BC;</span> Bear Case — Risks to Demand
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">{stock.thesis.bearCase}</p>
                </div>
              )}
              <p className="text-[10px] text-white/25">
                {stock.thesis.source === "manual" ? "Editorial — Mezan Research" : "AI-generated, refreshed monthly"}
                {stock.thesis.generatedAt && ` · ${new Date(stock.thesis.generatedAt).toLocaleDateString()}`}
              </p>
            </div>
          </Card>
        )}

        {/* Pros & Risks */}
        <div className="grid grid-cols-2 gap-4">
          <Card title="Why it could go up">
            <ul className="space-y-3">
              {(stock.pros || []).map((pro: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0 text-emerald-400">&#x25B2;</span>
                  <span className="text-sm leading-relaxed text-white/60">{pro}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Risks to consider">
            <ul className="space-y-3">
              {(stock.risks || []).map((risk: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0 text-red-400">&#x25BC;</span>
                  <span className="text-sm leading-relaxed text-white/60">{risk}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Analyst Projections — TipRanks Style */}
        {stock.projections && <AnalystProjections projections={stock.projections} />}

        {/* Sales & EPS Growth Table */}
        {stock.growthHistory?.length > 0 && (
          <Card title="Sales & EPS Growth">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-2 text-left text-xs font-medium text-white/40">Year</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Revenue</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Rev Growth</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">EPS</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">EPS Growth</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Gross Margin</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Op Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.growthHistory.map((yr: any) => (
                    <tr key={yr.year} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2.5 text-sm font-semibold">{yr.year}</td>
                      <td className="py-2.5 text-right text-sm text-white/70">{yr.revenueFormatted}</td>
                      <td className={`py-2.5 text-right text-sm font-medium ${yr.revenueGrowth !== null ? (yr.revenueGrowth >= 0 ? "text-emerald-400" : "text-red-400") : "text-white/20"}`}>
                        {yr.revenueGrowth !== null ? `${yr.revenueGrowth >= 0 ? "+" : ""}${yr.revenueGrowth}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right text-sm text-white/70">${yr.eps}</td>
                      <td className={`py-2.5 text-right text-sm font-medium ${yr.epsGrowth !== null ? (yr.epsGrowth >= 0 ? "text-emerald-400" : "text-red-400") : "text-white/20"}`}>
                        {yr.epsGrowth !== null ? `${yr.epsGrowth >= 0 ? "+" : ""}${yr.epsGrowth}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right text-sm text-white/50">{yr.grossMargin !== null ? `${yr.grossMargin}%` : "—"}</td>
                      <td className="py-2.5 text-right text-sm text-white/50">{yr.operatingMargin !== null ? `${yr.operatingMargin}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Forward Estimates */}
        {stock.forwardEstimates?.length > 0 && (
          <Card title="Forward Estimates">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-2 text-left text-xs font-medium text-white/40">Year</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Est Revenue</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Est EPS</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">EPS Range</th>
                    <th className="py-2 text-right text-xs font-medium text-white/40">Analysts</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.forwardEstimates.map((est: any) => (
                    <tr key={est.year} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2.5 text-sm font-semibold">{est.year}</td>
                      <td className="py-2.5 text-right text-sm text-white/70">{est.estRevenue}</td>
                      <td className="py-2.5 text-right text-sm font-medium text-emerald-400">${est.estEps}</td>
                      <td className="py-2.5 text-right text-sm text-white/40">${est.epsLow} - ${est.epsHigh}</td>
                      <td className="py-2.5 text-right text-sm text-white/50">{est.numAnalysts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        <Card title="Social Sentiment">
          {/* Sentiment Score + Label */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Stocktwits Sentiment</p>
              <span className={`text-2xl font-bold ${
                parseFloat(stock.sentimentScore) >= 1 ? "text-emerald-400"
                : parseFloat(stock.sentimentScore) >= -0.5 ? "text-amber-400"
                : "text-red-400"
              }`}>{stock.sentimentLabel}</span>
            </div>
          </div>

          {/* Bullish vs Bearish visual */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-emerald-400 font-semibold">{stock.stBullish} Bullish</span>
              <span className="text-red-400 font-semibold">{stock.stBearish} Bearish</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="bg-emerald-500 transition-all" style={{ width: `${stock.bullishPct}%` }} />
              <div className="bg-red-500 transition-all" style={{ width: `${100 - stock.bullishPct}%` }} />
            </div>
            <p className="text-center text-[10px] text-white/25 mt-1">
              {stock.bullishPct}% Bullish
            </p>
          </div>

          {/* Metrics */}
          {stock.watchlistCount && stock.watchlistCount !== "0" && (
            <StatRow label="Watchlist" value={`${stock.watchlistCount} watchers`} />
          )}
          <StatRow label="Mentions (24h)" value={stock.mentions} />
          <StatRow label="Buzz Change" value={`${parseInt(stock.buzzChange) >= 0 ? "+" : ""}${stock.buzzChange}%`} />
          {stock.impressions && stock.impressions !== "0" && <StatRow label="Impressions" value={stock.impressions} />}
          <StatRow label="Stocktwits" value={stock.stocktwitsPosts?.toString() || "0"} />
          <StatRow label="X / Twitter" value={stock.twitterPosts?.toString() || "0"} />
        </Card>

        <Card title="Insider Activity (90 days)">
          {stock.insiders.map((ins, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div>
                <p className="text-sm font-medium">{ins.name}</p>
                <p className="text-[11px] text-white/30">{ins.title}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${ins.action === "Buy" ? "text-emerald-400" : "text-red-400"}`}>
                  {ins.action}
                </p>
                <p className="text-[11px] text-white/30">{ins.amount}</p>
              </div>
            </div>
          ))}
        </Card>

        <Card title="News">
          {stock.news.slice(0, 4).map((n, i) => (
            <div key={i} className="py-3 border-b border-white/[0.04] last:border-0">
              <p className="text-sm font-medium leading-snug">{n.headline}</p>
              <p className="mt-1 text-[11px] text-white/30">{n.source} · {n.time}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ChartAndLevelsTab({ stock, ticker }: { stock: any; ticker: string }) {
  return (
    <div className="space-y-6">
      {/* Key Levels */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Support Levels">
          {stock.supports.map((s: string, i: number) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-xs font-bold text-red-400">S{i + 1}</span>
                <span className="text-sm text-white/50">Support Level {i + 1}</span>
              </div>
              <span className="text-sm font-semibold text-red-400">${s}</span>
            </div>
          ))}
        </Card>

        <Card title="Resistance Levels">
          {stock.resistances.map((r: string, i: number) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">R{i + 1}</span>
                <span className="text-sm text-white/50">Resistance Level {i + 1}</span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">${r}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* TradingView Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Daily Chart</h3>
          <div className="flex items-center gap-2">
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold" style={{background:"#81c78420",color:"#81c784"}}>EMA 10</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold" style={{background:"#42a5f520",color:"#42a5f5"}}>EMA 21</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold" style={{background:"#b39ddb20",color:"#b39ddb"}}>EMA 50</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-semibold" style={{background:"#ef535020",color:"#ef5350"}}>EMA 200</span>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">VWAP</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <TradingViewChart ticker={ticker} />
        </div>
      </Card>
    </div>
  );
}

function FundamentalsTab({ stock, ticker }: { stock: StockInfo; ticker: string }) {
  const f = stock.fundamentals;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Fundamental Score Bars */}
      <Card title="Fundamental Analysis">
        <BarMeter label="Valuation" value={f.valuation} />
        <BarMeter label="Quality" value={f.quality} color="blue" />
        <BarMeter label="Growth Stability" value={f.growthStability} color="blue" />
        <BarMeter label="Financial Health" value={f.financialHealth} />
      </Card>

      {/* Valuation */}
      <Card title="Valuation">
        <StatRow label="Market Cap" value={stock.marketCap} />
        <StatRow label="P/E (TTM)" value={stock.pe ? stock.pe.toString() : "N/A"} />
        <StatRow label="Forward P/E" value={f.forwardPE || "N/A"} />
        <StatRow label="PEG" value={f.peg || "N/A"} />
        <StatRow label="P/S" value={f.ps || "N/A"} />
        <StatRow label="P/B" value={f.pb || "N/A"} />
        <StatRow label="P/C" value={f.pc || "N/A"} />
        <StatRow label="P/FCF" value={f.pfcf || "N/A"} />
        <StatRow label="EV/EBITDA" value={f.evToEbitda || "N/A"} />
        <StatRow label="EV/Sales" value={f.evToSales || "N/A"} />
        <StatRow label="EPS (TTM)" value={`$${stock.eps}`} />
      </Card>

      {/* Growth */}
      <Card title="Growth">
        <StatRow label="EPS Growth (YoY)" value={colorPct(f.epsGrowthYoy)} />
        <StatRow label="EPS Growth (5yr)" value={colorPct(f.epsGrowth5yr)} />
        <StatRow label="Sales Growth (YoY)" value={colorPct(f.salesGrowthYoy)} />
        {f.epsQQ && <StatRow label="EPS Q/Q" value={colorPct(f.epsQQ)} />}
        {f.salesQQ && <StatRow label="Sales Q/Q" value={colorPct(f.salesQQ)} />}
        {f.epsNextY && <StatRow label="EPS Est Next Y" value={`$${f.epsNextY}`} />}
        {f.earningsDate && <StatRow label="Earnings" value={f.earningsDate} />}
      </Card>

      {/* Profitability */}
      <Card title="Profitability">
        <StatRow label="Gross Margin" value={`${f.grossMargin}%`} />
        <StatRow label="Operating Margin" value={`${f.operatingMargin}%`} />
        <StatRow label="EBITDA Margin" value={`${f.ebitdaMargin}%`} />
        <StatRow label="Net Margin" value={`${f.netMargin}%`} />
        <StatRow label="ROE" value={`${f.roe}%`} />
        <StatRow label="ROA" value={`${f.roa}%`} />
      </Card>

      {/* Financial Health */}
      <Card title="Financial Health">
        <StatRow label="Debt / Equity" value={f.debtToEquity} />
        <StatRow label="Current Ratio" value={f.currentRatio} />
        <StatRow label="Quick Ratio" value={f.quickRatio} />
        <StatRow label="Dividend Yield" value={stock.dividendYield} />
      </Card>

      {/* Price Performance */}
      <Card title="Price Performance">
        <StatRow label="Day Range" value={`$${stock.dayLow} - $${stock.dayHigh}`} />
        <StatRow label="52-Week High" value={`$${stock.fiftyTwoHigh}`} />
        <StatRow label="52-Week Low" value={`$${stock.fiftyTwoLow}`} />
        <StatRow label="Beta" value={stock.beta?.toString()} />
        <StatRow label="Avg Volume" value={stock.avgVolume} />
      </Card>
    </div>
  );
}

function SentimentDetail({ label, timeframe, level, score, checks }: {
  label: string; timeframe: string; level: string; score: number; checks: string[];
}) {
  const color = level === "Strong" ? "emerald" : level === "Neutral" ? "amber" : "red";
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-[10px] text-white/30">{timeframe}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold text-${color}-400`}>{score}/5</span>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold bg-${color}-500/10 text-${color}-400`}>
            {level}
          </span>
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? `bg-${color}-500` : "bg-white/10"}`} />
        ))}
      </div>
      {checks.length > 0 && (
        <ul className="space-y-1.5">
          {checks.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                c.includes("above") || c.includes("bullish") || c.includes("aligned") || c.includes("strong") || c.includes("Golden") || c.includes("Near") || c.includes("upper") || c.includes("zone") || c.includes("positive") || c.includes("intact")
                  ? "bg-emerald-400"
                  : c.includes("below") || c.includes("bearish") || c.includes("Death") || c.includes("overbought") || c.includes("oversold") || c.includes("negative") || c.includes("weak")
                  ? "bg-red-400"
                  : "bg-amber-400"
              }`} />
              <span className="text-[11px] text-white/50">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TechnicalsTab({ stock }: { stock: StockInfo }) {
  const t = stock.technicals;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Technical Sentiment">
        <SentimentDetail
          label="Short-term"
          timeframe="2-6 weeks"
          level={t.shortTerm}
          score={t.shortTermScore || 0}
          checks={t.shortTermChecks || []}
        />
        <SentimentDetail
          label="Mid-term"
          timeframe="6 weeks - 9 months"
          level={t.midTerm}
          score={t.midTermScore || 0}
          checks={t.midTermChecks || []}
        />
        <SentimentDetail
          label="Long-term"
          timeframe="9 months - 2 years"
          level={t.longTerm}
          score={t.longTermScore || 0}
          checks={t.longTermChecks || []}
        />
      </Card>

      <Card title="Moving Averages">
        <StatRow label="EMA 10" value={`$${t.ema10}`} />
        <StatRow label="EMA 21" value={`$${t.ema21}`} />
        <StatRow label="EMA 50" value={`$${t.ema50}`} />
        <StatRow label="EMA 200" value={`$${t.ema200}`} />
        <StatRow label="VWAP" value={`$${t.vwap}`} />
      </Card>

      <Card title="Indicators">
        <StatRow label="RSI (14)" value={t.rsi.toString()} />
        <StatRow label="MACD" value={t.macd} />
        <StatRow label="ADX" value={t.adx.toString()} />
        <StatRow label="ATR (14)" value={`$${t.atr}`} />
        <StatRow label="Volume Ratio" value={`${t.volumeRatio}x`} />
      </Card>

      <Card title="Key Levels">
        <StatRow label="Support 1" value={`$${stock.supports[0]}`} />
        <StatRow label="Support 2" value={`$${stock.supports[1]}`} />
        <StatRow label="Resistance 1" value={`$${stock.resistances[0]}`} />
        <StatRow label="Resistance 2" value={`$${stock.resistances[1]}`} />
        <StatRow label="52-Week High" value={`$${stock.fiftyTwoHigh}`} />
        <StatRow label="52-Week Low" value={`$${stock.fiftyTwoLow}`} />
      </Card>
    </div>
  );
}

function FinancialsTab({ stock }: { stock: StockInfo }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Balance Sheet">
        <StatRow label="Total Assets" value={`$${stock.financials.totalAssets}`} />
        <StatRow label="Total Liabilities" value={`$${stock.financials.totalLiabilities}`} />
        <StatRow label="Debt to Assets" value={`${stock.financials.debtToAssets}%`} />
        <StatRow label="Total Debt" value={`$${stock.financials.totalDebt}`} />
        <StatRow label="Cash & Equivalents" value={`$${stock.financials.cash}`} />
      </Card>

      <Card title="Income Statement">
        <StatRow label="Revenue" value={`$${stock.financials.revenue}`} />
        <StatRow label="Gross Profit" value={`$${stock.financials.grossProfit}`} />
        <StatRow label="Net Income" value={`$${stock.financials.netIncome}`} />
        <StatRow label="Profit Margin" value={`${stock.fundamentals.netMargin}%`} />
      </Card>

      <Card title="Cash Flow">
        <StatRow label="Operating Cash Flow" value={`$${stock.financials.operatingCashFlow}`} />
        <StatRow label="Free Cash Flow" value={`$${stock.financials.freeCashFlow}`} />
        <StatRow label="CapEx" value={`$${stock.financials.capex}`} />
      </Card>

      <Card title="Dividends">
        <StatRow label="Dividend Yield" value={stock.dividendYield} />
        <StatRow label="Dividend Amount" value={`$${stock.financials.dividendAmount}`} />
        <StatRow label="Payout Ratio" value={`${stock.financials.payoutRatio}%`} />
        <StatRow label="Ex-Dividend Date" value={stock.financials.exDivDate} />
      </Card>
    </div>
  );
}

function AnalystsTab({ stock }: { stock: StockInfo }) {
  const p = stock.projections;
  const c = p?.consensus;
  const targets = p?.analystTargets || [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Consensus */}
      <Card title="Analyst Consensus">
        {c ? (
          <>
            <div className="flex items-center gap-6 mb-6">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl text-lg font-bold ${
                c.label === "Buy" || c.label === "Strong Buy" ? "bg-emerald-500/10 text-emerald-400" :
                c.label === "Hold" ? "bg-amber-500/10 text-amber-400" :
                "bg-red-500/10 text-red-400"
              }`}>
                <div className="text-center">
                  <p className="text-sm font-bold">{c.label}</p>
                </div>
              </div>
              <p className="text-sm text-white/50 flex-1">
                Based on <span className="text-white font-semibold">{c.total}</span> analyst ratings
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Strong Buy", count: c.strongBuy, color: "#10b981" },
                { label: "Buy", count: c.buy, color: "#34d399" },
                { label: "Hold", count: c.hold, color: "#fbbf24" },
                { label: "Sell", count: c.sell, color: "#f87171" },
                { label: "Strong Sell", count: c.strongSell, color: "#ef4444" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-white/40 text-right">{r.label}</span>
                  <div className="flex-1 h-5 rounded-md bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-md" style={{
                      width: `${(r.count / Math.max(c.total, 1)) * 100}%`,
                      backgroundColor: r.color, opacity: 0.7,
                    }} />
                  </div>
                  <span className="w-8 text-sm font-semibold text-white/70 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-5 gap-2 mb-4">
            {["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"].map((label, i) => (
              <div key={label} className="text-center">
                <div className={`mx-auto mb-1 h-8 w-full rounded-lg flex items-center justify-center text-sm font-bold ${
                  i < 2 ? "bg-emerald-500/10 text-emerald-400" : i === 2 ? "bg-white/5 text-white/50" : "bg-red-500/10 text-red-400"
                }`}>
                  {p?.[["strongBuy","buy","hold","sell","strongSell"][i] as keyof typeof p] || 0}
                </div>
                <p className="text-[9px] text-white/30">{label}</p>
              </div>
            ))}
          </div>
        )}

        <StatRow label="Average Price Target" value={`$${p?.avgTarget || "—"}`} />
        <StatRow label="High Target" value={`$${p?.highTarget || "—"}`} />
        <StatRow label="Low Target" value={`$${p?.lowTarget || "—"}`} />
        <StatRow label="Upside" value={`${(p?.upside || 0) >= 0 ? "+" : ""}${p?.upside || 0}%`} />
      </Card>

      {/* Latest Research Reports */}
      <Card title="Latest Research Reports">
        {targets.length === 0 ? (
          <p className="text-sm text-white/30">No recent analyst reports available</p>
        ) : (
          <div className="space-y-2">
            {targets.map((at: any, i: number) => (
              <div key={i} className="rounded-lg bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold flex-shrink-0 ${
                      ["Buy","Outperform","Overweight","Strong Buy","Strong-Buy"].includes(at.rating)
                        ? "bg-emerald-500/10 text-emerald-400"
                        : ["Sell","Underperform","Underweight","Strong Sell"].includes(at.rating)
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {at.rating}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{at.firm}</p>
                      <p className={`text-[10px] ${
                        at.action === "Upgraded" || at.action === "Initiated" ? "text-emerald-400"
                        : at.action === "Downgraded" ? "text-red-400"
                        : "text-white/30"
                      }`}>
                        {at.action}{at.prevRating && at.prevRating !== at.rating ? ` from ${at.prevRating}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    {at.target && <p className="text-sm font-bold text-white/80">${at.target}</p>}
                    <p className="text-[10px] text-white/25">{at.date}</p>
                  </div>
                </div>
                {at.headline && (
                  <p className="mt-2 text-[11px] text-white/35 truncate">{at.headline}</p>
                )}
                {at.priceWhenPosted && (
                  <p className="mt-1 text-[10px] text-white/20">Price when posted: ${at.priceWhenPosted}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function OwnershipTab({ stock }: { stock: any }) {
  const summary = stock.institutionalSummary;
  const holders = stock.institutionalHolders || [];

  return (
    <div className="space-y-6">
      {/* Top row: Breakdown + Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Ownership Breakdown">
          <div className="space-y-4">
            {stock.ownership.map((o: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white/60">{o.type}</span>
                  <span className="text-sm font-semibold">{o.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${
                    i === 0 ? "bg-blue-500" : i === 1 ? "bg-amber-400" : "bg-emerald-400"
                  }`} style={{ width: `${o.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <StatRow label="Total Outstanding Shares" value={stock.sharesOutstanding} />
          </div>
        </Card>

        {summary && (
          <Card title={`13F Summary (${summary.date})`}>
            <StatRow label="Investors Holding" value={summary.investorsHolding?.toLocaleString()} sub={summary.investorsHoldingChange > 0 ? `+${summary.investorsHoldingChange}` : `${summary.investorsHoldingChange}`} />
            <StatRow label="Institutional Ownership" value={`${summary.ownershipPercent}%`} sub={summary.ownershipPercentChange > 0 ? `+${summary.ownershipPercentChange}%` : `${summary.ownershipPercentChange}%`} />
            <StatRow label="Total Invested" value={summary.totalInvested} sub={summary.totalInvestedChange} />
            <StatRow label="Put/Call Ratio" value={summary.putCallRatio?.toString()} sub={summary.putCallRatioChange > 0 ? `+${summary.putCallRatioChange}%` : `${summary.putCallRatioChange}%`} />

            {/* Position changes */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
                <p className="text-[10px] text-white/30">New Positions</p>
                <p className="text-lg font-bold text-emerald-400">+{summary.newPositions}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
                <p className="text-[10px] text-white/30">Increased</p>
                <p className="text-lg font-bold text-emerald-400">+{summary.increasedPositions}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 px-3 py-2">
                <p className="text-[10px] text-white/30">Reduced</p>
                <p className="text-lg font-bold text-red-400">-{summary.reducedPositions}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 px-3 py-2">
                <p className="text-[10px] text-white/30">Closed</p>
                <p className="text-lg font-bold text-red-400">-{summary.closedPositions}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Top institutional holders */}
      {holders.length > 0 && (
        <Card title="Top Institutional Holders">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 text-left text-xs font-medium text-white/40">Holder</th>
                  <th className="py-2 text-right text-xs font-medium text-white/40">Shares</th>
                  <th className="py-2 text-right text-xs font-medium text-white/40">Change</th>
                  <th className="py-2 text-right text-xs font-medium text-white/40">Date</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((h: any, i: number) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2.5 text-sm">{h.name}</td>
                    <td className="py-2.5 text-right text-sm text-white/70">{h.sharesFormatted}</td>
                    <td className={`py-2.5 text-right text-sm font-medium ${h.change > 0 ? "text-emerald-400" : h.change < 0 ? "text-red-400" : "text-white/30"}`}>
                      {h.changeFormatted}
                    </td>
                    <td className="py-2.5 text-right text-sm text-white/30">{h.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function NewsTab({ ticker }: { ticker: string }) {
  const stock = mockStockData[ticker] || mockStockData["NVDA"];
  return (
    <Card title="News & Catalysts">
      <div className="space-y-1">
        {stock.news.map((n, i) => (
          <div key={i} className="flex gap-4 rounded-xl p-3 transition hover:bg-white/[0.03]">
            <div className="flex-1">
              <p className="text-sm font-medium">{n.headline}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[11px] text-white/30">{n.source}</span>
                <span className="text-[11px] text-white/20">{n.time}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  n.impact === "HIGH" ? "bg-red-500/10 text-red-400" :
                  n.impact === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                  "bg-white/5 text-white/30"
                }`}>
                  {n.impact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HalalTab({ stock, ticker }: { stock: StockInfo; ticker: string }) {
  const s = stock.halal?.status || "UNKNOWN";
  const cfg = s === "HALAL"
    ? { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "✔", label: "HALAL", subtitle: "Passes AAOIFI screening" }
    : s === "NOT_HALAL"
    ? { bg: "bg-red-500/10", text: "text-red-400", icon: "✖", label: "NOT HALAL", subtitle: stock.halal?.nonHalalReason || "Fails AAOIFI screening" }
    : s === "QUESTIONABLE"
    ? { bg: "bg-amber-500/10", text: "text-amber-400", icon: "?", label: "QUESTIONABLE", subtitle: "Borderline — review reasoning below" }
    : { bg: "bg-white/5", text: "text-white/50", icon: "?", label: "UNKNOWN", subtitle: "No compliance data available" };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Halal Compliance Report">
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${cfg.bg}`}>
            <span className="text-2xl">{cfg.icon}</span>
          </div>
          <div>
            <p className={`text-lg font-bold ${cfg.text}`}>{cfg.label}</p>
            <p className="text-sm text-white/40">{cfg.subtitle}</p>
          </div>
        </div>

        <StatRow label="Business Activity" value={stock.halal?.businessActivity || "UNKNOWN"} />
        <StatRow label="Revenue Compliance" value={s === "HALAL" ? "100% Compliant" : s === "NOT_HALAL" ? "Non-compliant" : "—"} />
        <StatRow label="Debt / Market Cap" value={`${stock.halal.debtRatio}%`} sub={stock.halal.debtRatio < 33 ? "PASS" : "FAIL"} />
        <StatRow label="Cash / Market Cap" value={`${stock.halal.cashRatio}%`} sub={stock.halal.cashRatio < 33 ? "PASS" : "FAIL"} />
        <StatRow label="Interest Income" value={`${stock.halal.interestIncome}%`} sub={stock.halal.interestIncome < 5 ? "PASS" : "FAIL"} />
      </Card>

      <Card title="Revenue Breakdown">
        {stock.halal.segments.map((seg, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-white/50">{seg.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{seg.pct}%</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  {seg.status}
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${seg.pct}%` }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ===== TYPES & MOCK DATA =====

type StockInfo = typeof mockStockData.NVDA;

const mockStockData: Record<string, any> = {
  NVDA: {
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    sector: "Information Technology",
    price: 208.27,
    change: 4.32,
    changeAmt: 8.63,
    open: "199.96",
    prevClose: "199.64",
    dayHigh: "210.00",
    dayLow: "199.81",
    fiftyTwoHigh: "235.60",
    fiftyTwoLow: "86.62",
    marketCap: "$4.85T",
    pe: 40.73,
    eps: "5.11",
    volume: "285.4M",
    avgVolume: "245.1M",
    beta: 1.65,
    dividendYield: "0.02%",
    sharesOutstanding: "24.3B",
    aiSignal: "BUY",
    aiConfidence: "HIGH",
    aiEntry: "208.00",
    aiStop: "199.00",
    aiTarget: "235.00",
    aiRR: "1:3",
    aiAnalysis: "NVDA is showing strong institutional accumulation with price above all major EMAs. The MACD histogram is accelerating on increasing volume. RSI at 62 provides room for further upside. Key support at $200 from the 21 EMA. The AI/data center spending cycle remains in early innings with Blackwell Ultra chip announcement adding tailwind. Insider buying activity in the last 30 days adds conviction. Risk: Earnings on May 28 could create short-term volatility, but consensus is significantly bullish.",
    supports: ["200.00", "195.50", "188.00"],
    resistances: ["215.00", "225.80", "235.60"],
    sentimentScore: "3.33",
    sentimentLabel: "Extremely Positive",
    bullishPct: 82,
    mentions: "12,400",
    buzzChange: "45",
    insiders: [
      { name: "Jensen Huang", title: "CEO", action: "Buy", amount: "$2.4M" },
      { name: "Colette Kress", title: "CFO", action: "Buy", amount: "$890K" },
      { name: "Debora Shoquist", title: "EVP Ops", action: "Buy", amount: "$450K" },
    ],
    news: [
      { headline: "NVIDIA announces next-gen Blackwell Ultra chips for AI training", source: "Reuters", time: "2h ago", impact: "HIGH" },
      { headline: "NVIDIA partners with Saudi Arabia on $10B AI infrastructure", source: "Bloomberg", time: "5h ago", impact: "HIGH" },
      { headline: "Analysts raise NVDA price targets after GTC keynote", source: "CNBC", time: "8h ago", impact: "MEDIUM" },
      { headline: "NVIDIA CUDA platform reaches 50M developer milestone", source: "PR Newswire", time: "1d ago", impact: "LOW" },
      { headline: "Data center GPU demand expected to grow 40% in 2026", source: "Gartner", time: "1d ago", impact: "MEDIUM" },
    ],
    fundamentals: {
      valuation: 97,
      quality: 69,
      growthStability: 86,
      financialHealth: 62,
      pePercentile: "36",
      epsGrowthYoy: "66.78",
      epsGrowthPercentile: "81",
      epsGrowth5yr: "95.29",
      epsGrowth5yrPercentile: "99",
      grossMargin: "74.40",
      grossMarginPercentile: "91",
      ebitdaMargin: "63.72",
      ebitdaMarginPercentile: "100",
      netMargin: "55.85",
    },
    technicals: {
      shortTerm: "Strong" as const,
      midTerm: "Strong" as const,
      longTerm: "Strong" as const,
      ema10: "205.30",
      ema21: "200.15",
      ema50: "195.80",
      ema200: "172.40",
      vwap: "204.50",
      rsi: 62.4,
      macd: "+2.45 (Bullish)",
      adx: 38.5,
      atr: "5.20",
      volumeRatio: "1.8",
    },
    financials: {
      totalAssets: "206.8B",
      totalLiabilities: "49.5B",
      debtToAssets: "23.9",
      totalDebt: "12.5B",
      cash: "31.4B",
      revenue: "68.1B",
      grossProfit: "51.9B",
      netIncome: "38.1B",
      operatingCashFlow: "102.7B",
      freeCashFlow: "95.2B",
      capex: "7.5B",
      dividendAmount: "0.01",
      payoutRatio: "1",
      exDivDate: "Mar 11, 2026",
    },
    analysts: {
      consensus: "Very Bullish",
      score: "9.6",
      totalAnalysts: 7,
      distribution: [4, 2, 1, 0, 0],
      avgTarget: "250.00",
      highTarget: "300.00",
      lowTarget: "180.00",
      reports: [
        { firm: "Trading Central", rating: "Buy", date: "Apr 24", accuracy: "97" },
        { firm: "Jefferson Research", rating: "Neutral", date: "Apr 24", accuracy: "81" },
        { firm: "Zacks Investment", rating: "Outperform", date: "Apr 16", accuracy: "63" },
        { firm: "McLean Capital", rating: "Buy", date: "Apr 17", accuracy: "33" },
        { firm: "Refinitiv/Verus", rating: "Neutral", date: "Apr 23", accuracy: "26" },
        { firm: "Argus Research", rating: "Buy", date: "Apr 15", accuracy: "25" },
      ],
    },
    ownership: [
      { type: "Institutional", pct: 38.3 },
      { type: "Institutional Funds", pct: 28.8 },
      { type: "Fund Ownership", pct: 0.9 },
      { type: "Insider", pct: 0.4 },
      { type: "Other", pct: 31.6 },
    ],
    secFilings: [
      { type: "SCHEDULE 13G/A", desc: "Beneficial Ownership Statement", date: "Mar 26" },
      { type: "Form-4", desc: "Insider Transaction", date: "Mar 24" },
      { type: "Form-144", desc: "Insider Intention to Sell", date: "Mar 20" },
      { type: "10-K", desc: "Annual Report", date: "Feb 28" },
      { type: "8-K", desc: "Current Report", date: "Feb 26" },
    ],
    halal: {
      debtRatio: 5.8,
      cashRatio: 6.5,
      interestIncome: 0.12,
      segments: [
        { name: "Data Center", pct: 78, status: "COMPLIANT" },
        { name: "Gaming", pct: 12, status: "COMPLIANT" },
        { name: "Professional Visualization", pct: 5, status: "COMPLIANT" },
        { name: "Automotive", pct: 3, status: "COMPLIANT" },
        { name: "OEM & Other", pct: 2, status: "COMPLIANT" },
      ],
    },
  },
};
