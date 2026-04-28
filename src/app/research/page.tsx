"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TickerSearch from "../../components/TickerSearch";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../components/AuthProvider";

export default function ResearchDashboard() {
  const router = useRouter();
  const { user, loading, hasResearchAccess, isElite, sessionConflict, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("research");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (sessionConflict) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
            &#x26A0;
          </div>
          <h1 className="text-xl font-bold text-white">Session Active Elsewhere</h1>
          <p className="mt-3 text-sm text-white/50">
            Your account is currently active on another device or browser.
            Please log out from the other session first, or contact support.
          </p>
          <p className="mt-2 text-xs text-white/30">
            Each Mezan Research subscription supports one active session at a time.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white/50 transition hover:text-white hover:border-white/20"
          >
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  if (!hasResearchAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-white">Mezan Research</h1>
          <p className="mt-3 text-sm text-white/50">
            Access comprehensive stock research, AI-powered analysis, technical indicators,
            and curated halal investment recommendations.
          </p>

          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-white/[0.02] p-6">
            <p className="text-sm font-medium text-emerald-400">Mezan Research Subscription</p>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">$13.99</span>
              <span className="text-white/40">/month</span>
            </div>
            <ul className="mt-4 space-y-2 text-left text-sm text-white/50">
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Full stock research for any ticker</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI-powered analysis & recommendations</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Technical indicators & S/R levels</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Analyst ratings & price targets</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Social sentiment tracking</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> App Elite access included</li>
            </ul>
            <button
              onClick={async () => {
                const res = await fetch("/api/stripe/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid: user.uid, email: user.email }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              className="mt-6 block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 text-center text-sm font-bold text-black transition hover:from-emerald-400 hover:to-emerald-300"
            >
              Subscribe Now
            </button>
          </div>

          <p className="mt-4 text-xs text-white/25">
            Logged in as {user.email}
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 text-xs text-white/30 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white">
      {/* TOP NAV */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold tracking-tight">
              Mezan <span className="text-emerald-400">Research</span>
            </span>
            <nav className="hidden items-center gap-1 md:flex">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    activeTab === t.id
                      ? "bg-emerald-500/10 text-emerald-400 font-medium"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <TickerSearch />
            <ThemeToggle />
            {(hasResearchAccess || isElite) && (
              <span className="hidden rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 md:inline">
                {hasResearchAccess ? "Research" : "Elite"}
              </span>
            )}
            <span className="text-xs text-white/30">{user.email}</span>
            <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "research" && <ResearchListsTab />}
        {activeTab === "hotlists" && <HotListsTab />}
        {activeTab === "ai" && <TenetAITab />}
        {activeTab === "news" && <NewsTab />}
        {activeTab === "sentiment" && <SentimentTab />}
        {activeTab === "insider" && <InsiderTab />}
        {activeTab === "rotation" && <RotationTab />}
        {activeTab === "portfolio" && <PortfolioTab />}
      </div>
    </main>
  );
}

const tabs = [
  { id: "research", label: "Recommendations" },
  { id: "hotlists", label: "Hot Lists" },
  { id: "ai", label: "Mezan AI" },
  { id: "news", label: "News" },
  { id: "sentiment", label: "Sentiment" },
  { id: "insider", label: "Insiders" },
  { id: "rotation", label: "Rotation" },
  { id: "portfolio", label: "Junaid's Portfolio" },
];

// ===== STOCK CARD COMPONENT =====
function StockCard({ stock }: { stock: StockData }) {
  const isUp = stock.change >= 0;
  return (
    <a href={`/research/stock/${stock.ticker}`} className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-emerald-500/20 hover:bg-white/[0.04] cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400">
            {stock.ticker.slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold">{stock.ticker}</p>
            <p className="text-xs text-white/30">{stock.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">${stock.price.toFixed(2)}</p>
          <p className={`text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {isUp ? "+" : ""}{stock.change.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className={`rounded-lg border border-white/[0.06] bg-white/[0.06] px-2.5 py-1.5 flex items-center gap-1.5`}>
          <span className="text-base">{stock.halal === "HALAL" ? "✅" : stock.halal === "NOT_HALAL" ? "❌" : "❓"}</span>
          <p className="text-[10px] font-medium text-white/50">Halal</p>
        </div>
        <Chip label="Support" value={`$${stock.support}`} />
        <Chip label="Resistance" value={`$${stock.resistance}`} />
        <Chip label="RSI" value={stock.rsi.toString()} />
      </div>

      {stock.aiSummary && (
        <div className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-white/40">{stock.aiSummary}</p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {stock.sentiment && (
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
            stock.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {stock.sentiment}
          </span>
        )}
        {stock.aiConfidence && (
          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            AI: {stock.aiConfidence}
          </span>
        )}
        {stock.insiderActivity && (
          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            {stock.insiderActivity}
          </span>
        )}
      </div>
    </a>
  );
}

function Chip({ label, value, color = "white" }: { label: string; value: string; color?: string }) {
  const c = color === "emerald" ? "text-emerald-400" : color === "red" ? "text-red-400" : "text-white";
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.06] px-2.5 py-1.5">
      <p className="text-[10px] font-medium text-white/50">{label}</p>
      <p className={`text-xs font-semibold ${c}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-white/40">{subtitle}</p>}
    </div>
  );
}

// ===== TAB: RESEARCH LISTS =====
function ResearchListsTab() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research/picks")
      .then((r) => r.json())
      .then((data) => setStocks(Array.isArray(data) ? data : []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Research Lists" subtitle="Curated halal swing candidates — updated daily" />
      {stocks.length === 0 ? (
        <p className="text-white/40 text-sm">No picks yet. Add tickers from the admin panel.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stocks.map((s) => <StockCard key={s.ticker} stock={s} />)}
        </div>
      )}
    </div>
  );
}

// ===== TAB: HOT LISTS =====
function HotListsTab() {
  const [hotlists, setHotlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research/hotlists")
      .then((r) => r.json())
      .then((data) => setHotlists(Array.isArray(data) ? data : []))
      .catch(() => setHotlists([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Hot Lists & Themes" subtitle="Curated tickers grouped by sector themes and catalysts" />
      {hotlists.length === 0 ? (
        <p className="text-white/40 text-sm">No themes yet. Add tickers with themes from the admin panel.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hotlists.map((theme) => (
            <div key={theme.name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-emerald-500/20 hover:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <p className="font-semibold">{theme.name}</p>
                    <p className="text-xs text-white/30">{theme.count} {theme.count === 1 ? "stock" : "stocks"}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${theme.avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {theme.avgChange >= 0 ? "+" : ""}{theme.avgChange}%
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {theme.tickers.map((t: any) => (
                  <a
                    key={t.ticker}
                    href={`/research/stock/${t.ticker}`}
                    className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{t.ticker}</span>
                      <span className="text-xs text-white/30">{t.name}</span>
                      {t.conviction && (
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          t.conviction === "HIGH" ? "bg-emerald-500/10 text-emerald-400" :
                          t.conviction === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/5 text-white/30"
                        }`}>
                          {t.conviction}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-white/70">${t.price?.toFixed(2)}</span>
                      <span className={`ml-2 text-xs ${t.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {t.change >= 0 ? "+" : ""}{t.change}%
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== TAB: TENET AI =====
function TenetAITab() {
  return (
    <div>
      <SectionHeader title="Mezan AI Analysis" subtitle="AI-powered research on your watchlist" />
      <div className="space-y-4">
        {aiAnalyses.map((a) => (
          <div key={a.ticker} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400">
                  {a.ticker.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold">{a.ticker}</p>
                  <p className="text-xs text-white/30">{a.name}</p>
                </div>
              </div>
              <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
                a.signal === "BUY" ? "bg-emerald-500/10 text-emerald-400" :
                a.signal === "SELL" ? "bg-red-500/10 text-red-400" :
                "bg-amber-500/10 text-amber-400"
              }`}>
                {a.signal}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              <Chip label="Confidence" value={a.confidence} color="emerald" />
              <Chip label="Entry" value={`$${a.entry}`} />
              <Chip label="Stop" value={`$${a.stop}`} color="red" />
              <Chip label="Target" value={`$${a.target}`} color="emerald" />
              <Chip label="R:R" value={a.rr} />
            </div>
            <div className="mt-4 rounded-lg bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Analysis</p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{a.analysis}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TAB: NEWS =====
function NewsTab() {
  return (
    <div>
      <SectionHeader title="Breaking News" subtitle="Filtered for your halal watchlist" />
      <div className="space-y-3">
        {newsItems.map((n, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-400">
              {n.ticker}
            </div>
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
    </div>
  );
}

// ===== TAB: SENTIMENT =====
function SentimentTab() {
  return (
    <div>
      <SectionHeader title="Social Sentiment" subtitle="What the market is saying" />
      <div className="grid gap-4 md:grid-cols-2">
        {sentimentData.map((s) => (
          <div key={s.ticker} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{s.ticker}</p>
              <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
                s.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}>
                {s.sentiment}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Chip label="Mentions (24h)" value={s.mentions.toString()} />
              <Chip label="Buzz Score" value={s.buzzScore.toString()} color="emerald" />
              <Chip label="Change" value={`${s.mentionChange >= 0 ? "+" : ""}${s.mentionChange}%`} color={s.mentionChange >= 0 ? "emerald" : "red"} />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${s.sentiment === "Bullish" ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${s.bullishPct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/30">
              <span>Bullish {s.bullishPct}%</span>
              <span>Bearish {100 - s.bullishPct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TAB: INSIDER =====
function InsiderTab() {
  return (
    <div>
      <SectionHeader title="Congress & Insider Trades" subtitle="Follow the smart money" />
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Name</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Ticker</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Type</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Action</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-white/40">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Date</th>
            </tr>
          </thead>
          <tbody>
            {insiderTrades.map((t, i) => (
              <tr key={i} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-sm">{t.name}</td>
                <td className="px-5 py-3 text-sm font-semibold text-emerald-400">{t.ticker}</td>
                <td className="px-5 py-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                    t.type === "Congress" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium ${t.action === "Buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-sm text-white/70">{t.amount}</td>
                <td className="px-5 py-3 text-sm text-white/30">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== TAB: ROTATION =====
function RotationTab() {
  return (
    <div>
      <SectionHeader title="Sector Rotation Tracker" subtitle="Where institutional money is flowing" />
      <div className="grid gap-3 md:grid-cols-2">
        {sectorData.map((s) => (
          <div key={s.sector} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold">{s.sector}</p>
                <p className="text-xs text-white/30">{s.flow}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${s.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {s.change >= 0 ? "+" : ""}{s.change}%
              </p>
              <p className="text-[10px] text-white/30">1 week</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TAB: PORTFOLIO =====
function PortfolioTab() {
  return (
    <div>
      <SectionHeader title="Junaid's Portfolio" subtitle="Full transparency — every position, entry, and rationale" />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
          <p className="text-2xl font-bold text-emerald-400">$142,500</p>
          <p className="text-xs text-white/30">Portfolio Value</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
          <p className="text-2xl font-bold text-emerald-400">+18.4%</p>
          <p className="text-xs text-white/30">YTD Return</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
          <p className="text-2xl font-bold">8</p>
          <p className="text-xs text-white/30">Open Positions</p>
        </div>
      </div>

      <div className="space-y-3">
        {portfolioPositions.map((p) => (
          <div key={p.ticker} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className={`h-1.5 w-1.5 rounded-full ${p.pnl >= 0 ? "bg-emerald-400" : "bg-red-400"}`} />
              <div>
                <p className="font-semibold">{p.ticker}</p>
                <p className="text-xs text-white/30">Entry: ${p.entry} | {p.shares} shares</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${p.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {p.pnl >= 0 ? "+" : ""}{p.pnl}%
              </p>
              <p className="text-xs text-white/30">{p.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== MOCK DATA =====

type StockData = {
  ticker: string;
  name: string;
  price: number;
  change: number;
  halal: string;
  support: string;
  resistance: string;
  rsi: number;
  aiSummary?: string;
  sentiment?: string;
  aiConfidence?: string;
  insiderActivity?: string;
};

const researchStocks: StockData[] = [
  { ticker: "NVDA", name: "NVIDIA Corp", price: 218.43, change: 3.24, halal: "HALAL", support: "210.50", resistance: "225.80", rsi: 62.4, aiSummary: "Strong momentum above all EMAs. MACD accelerating with volume. Next target $225.", sentiment: "Bullish", aiConfidence: "HIGH", insiderActivity: "3 Buys" },
  { ticker: "AAPL", name: "Apple Inc", price: 273.22, change: 1.85, halal: "HALAL", support: "268.00", resistance: "280.00", rsi: 58.1, aiSummary: "Consolidating near highs. 10 EMA acting as support. Watch for breakout above $280.", sentiment: "Bullish", aiConfidence: "MEDIUM" },
  { ticker: "MSFT", name: "Microsoft Corp", price: 432.10, change: -0.45, halal: "HALAL", support: "425.00", resistance: "440.00", rsi: 52.3, aiSummary: "Pulling back to 21 EMA. MACD flattening. Wait for volume confirmation before entry.", sentiment: "Bullish", aiConfidence: "MEDIUM" },
  { ticker: "AVGO", name: "Broadcom Inc", price: 245.80, change: 2.10, halal: "HALAL", support: "238.00", resistance: "255.00", rsi: 65.7, aiSummary: "Breaking out of 2-week base. Volume increasing. AI chips theme driving momentum.", sentiment: "Bullish", aiConfidence: "HIGH", insiderActivity: "2 Buys" },
  { ticker: "CRDO", name: "Credo Technology", price: 189.49, change: 5.12, halal: "HALAL", support: "180.00", resistance: "200.00", rsi: 71.2, aiSummary: "Strong trend continuation. Extended from 10 EMA — wait for pullback.", sentiment: "Bullish", aiConfidence: "HIGH" },
  { ticker: "ARM", name: "Arm Holdings", price: 218.30, change: 4.55, halal: "HALAL", support: "205.00", resistance: "230.00", rsi: 68.9, aiSummary: "AI tailwind driving the move. Above all EMAs. RSI approaching overbought.", sentiment: "Bullish", aiConfidence: "HIGH", insiderActivity: "1 Buy" },
];

const themes = [
  { name: "AI & Semiconductors", icon: "🤖", count: 8, tickers: [
    { ticker: "NVDA", change: 3.24 }, { ticker: "AVGO", change: 2.10 }, { ticker: "ARM", change: 4.55 }, { ticker: "CRDO", change: 5.12 },
  ]},
  { name: "Healthcare Momentum", icon: "🏥", count: 5, tickers: [
    { ticker: "UNH", change: 1.20 }, { ticker: "LLY", change: 0.85 }, { ticker: "ISRG", change: 2.30 }, { ticker: "HIMS", change: 3.80 },
  ]},
  { name: "Earnings Catalysts", icon: "📊", count: 6, tickers: [
    { ticker: "MSFT", change: -0.45 }, { ticker: "META", change: 1.90 }, { ticker: "GOOGL", change: 0.70 }, { ticker: "AMZN", change: 1.15 },
  ]},
];

const aiAnalyses = [
  { ticker: "NVDA", name: "NVIDIA Corp", signal: "BUY", confidence: "HIGH", entry: "218.50", stop: "210.00", target: "235.00", rr: "1:2",
    analysis: "NVDA is showing strong institutional accumulation with price above all major EMAs. The MACD histogram is accelerating on increasing volume. RSI at 62 provides room for further upside. Key support at $210 from the 21 EMA. The AI/data center spending cycle remains in early innings. Insider buying activity in the last 30 days adds conviction. Risk: Earnings report on May 15 could create volatility." },
  { ticker: "CRDO", name: "Credo Technology", signal: "BUY", confidence: "HIGH", entry: "189.00", stop: "180.00", target: "210.00", rr: "1:2.3",
    analysis: "CRDO is in a powerful uptrend driven by AI networking demand. The stock has formed a series of higher lows with tight consolidation patterns. Volume profile confirms institutional participation. The 800G ethernet opportunity positions CRDO well for multi-year growth. Wait for a pullback to the 10 EMA for optimal entry." },
  { ticker: "MSFT", name: "Microsoft Corp", signal: "HOLD", confidence: "MEDIUM", entry: "425.00", stop: "415.00", target: "450.00", rr: "1:2.5",
    analysis: "MSFT is consolidating after a strong run. MACD is flattening which could signal either a continuation or a deeper pullback. Volume is below average suggesting indecision. The 21 EMA at $425 is the key level to watch. If it holds, look for a bounce toward $450. If it breaks, $415 (50 EMA) is next support." },
];

const newsItems = [
  { ticker: "NVDA", headline: "NVIDIA announces next-gen Blackwell Ultra chips for AI training", source: "Reuters", time: "2h ago", impact: "HIGH" as const },
  { ticker: "AAPL", headline: "Apple reportedly accelerating AI features for iPhone 18", source: "Bloomberg", time: "3h ago", impact: "MEDIUM" as const },
  { ticker: "MSFT", headline: "Microsoft Azure revenue grows 35% in Q3, beats estimates", source: "CNBC", time: "5h ago", impact: "HIGH" as const },
  { ticker: "ARM", headline: "Arm Holdings secures major design win with Samsung", source: "Nikkei", time: "6h ago", impact: "MEDIUM" as const },
  { ticker: "CRDO", headline: "Credo Technology raises guidance on strong 800G demand", source: "PR Newswire", time: "8h ago", impact: "HIGH" as const },
  { ticker: "HIMS", headline: "Hims & Hers expands GLP-1 compounding program", source: "SEC Filing", time: "1d ago", impact: "MEDIUM" as const },
];

const sentimentData = [
  { ticker: "NVDA", sentiment: "Bullish" as const, mentions: 12400, buzzScore: 94, mentionChange: 45, bullishPct: 78 },
  { ticker: "TSLA", sentiment: "Bullish" as const, mentions: 18200, buzzScore: 88, mentionChange: 120, bullishPct: 62 },
  { ticker: "AAPL", sentiment: "Bullish" as const, mentions: 8900, buzzScore: 72, mentionChange: 15, bullishPct: 70 },
  { ticker: "ARM", sentiment: "Bullish" as const, mentions: 5200, buzzScore: 81, mentionChange: 85, bullishPct: 75 },
];

const insiderTrades = [
  { name: "Nancy Pelosi", ticker: "NVDA", type: "Congress" as const, action: "Buy" as const, amount: "$1M - $5M", date: "Apr 18" },
  { name: "Dan Crenshaw", ticker: "MSFT", type: "Congress" as const, action: "Buy" as const, amount: "$500K - $1M", date: "Apr 17" },
  { name: "Jensen Huang (CEO)", ticker: "NVDA", type: "Insider" as const, action: "Buy" as const, amount: "$2.4M", date: "Apr 15" },
  { name: "Tim Cook (CEO)", ticker: "AAPL", type: "Insider" as const, action: "Buy" as const, amount: "$1.8M", date: "Apr 12" },
  { name: "Tommy Tuberville", ticker: "CRDO", type: "Congress" as const, action: "Buy" as const, amount: "$250K - $500K", date: "Apr 10" },
  { name: "Satya Nadella (CEO)", ticker: "MSFT", type: "Insider" as const, action: "Buy" as const, amount: "$3.1M", date: "Apr 8" },
];

const sectorData = [
  { sector: "Technology", icon: "💻", change: 4.2, flow: "Strong inflow" },
  { sector: "Healthcare", icon: "🏥", change: 2.8, flow: "Moderate inflow" },
  { sector: "Consumer Cyclical", icon: "🛍️", change: 1.5, flow: "Slight inflow" },
  { sector: "Industrials", icon: "🏭", change: 0.3, flow: "Neutral" },
  { sector: "Financial Services", icon: "🏦", change: -0.8, flow: "Slight outflow" },
  { sector: "Energy", icon: "⚡", change: -2.1, flow: "Outflow" },
  { sector: "Real Estate", icon: "🏠", change: -1.5, flow: "Outflow" },
  { sector: "Utilities", icon: "💡", change: -0.4, flow: "Slight outflow" },
];

const portfolioPositions = [
  { ticker: "NVDA", entry: 195.50, shares: 50, pnl: 11.7, date: "Apr 1" },
  { ticker: "AAPL", entry: 260.00, shares: 30, pnl: 5.1, date: "Mar 28" },
  { ticker: "CRDO", entry: 165.00, shares: 40, pnl: 14.8, date: "Mar 20" },
  { ticker: "ARM", entry: 190.00, shares: 25, pnl: 14.9, date: "Mar 15" },
  { ticker: "AVGO", entry: 230.00, shares: 20, pnl: 6.9, date: "Mar 10" },
  { ticker: "MSFT", entry: 420.00, shares: 15, pnl: 2.9, date: "Feb 28" },
  { ticker: "HIMS", entry: 22.00, shares: 200, pnl: 31.9, date: "Feb 15" },
  { ticker: "COST", entry: 960.00, shares: 5, pnl: 4.6, date: "Feb 10" },
];
