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

          {/* Features list */}
          <ul className="mt-6 space-y-2 text-left text-sm text-white/50 mx-auto max-w-md">
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 300+ growth companies + 140+ liquid stocks</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Daily support, resistance & technicals</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Mezan AI analysis with bull/risk cases</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Analyst ratings & price targets</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Sales & EPS growth data</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Social sentiment tracking</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> App Elite access included</li>
          </ul>

          {/* Subscriptions temporarily closed */}
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-6 text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Subscriptions Currently Closed
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              We&apos;re paused for new sign-ups while we put final touches on the platform. Existing subscribers continue to have full access — nothing changes for you.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              We&apos;ll reopen soon. To be notified or request early access, email{" "}
              <a href="mailto:support@mezaninvesting.com?subject=Mezan%20Research%20-%20Notify%20when%20open" className="text-emerald-400 hover:underline">
                support@mezaninvesting.com
              </a>{" "}
              or DM Junaid in his WhatsApp group.
            </p>
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
            <a href="/" className="text-lg font-semibold tracking-tight transition hover:opacity-80" title="Back to home">
              Mezan <span className="text-emerald-400">Investing</span>
            </a>
            <nav className="hidden items-center gap-1 md:flex">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.route) {
                      router.push(t.route);
                    } else {
                      setActiveTab(t.id);
                    }
                  }}
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
        <MacroPulse />
        {activeTab === "research" && <ResearchListsTab />}
        {activeTab === "hotlists" && <HotListsTab />}
        {activeTab === "ai" && <MezanAITab />}
        {activeTab === "news" && <NewsTab />}
        {activeTab === "sentiment" && <SentimentTab />}
        {activeTab === "insider" && <InsiderTab />}
        {activeTab === "congress" && <CongressTab />}
        {activeTab === "rotation" && <RotationTab />}
      </div>
    </main>
  );
}

const tabs: Array<{ id: string; label: string; route?: string }> = [
  { id: "research", label: "Recommendations" },
  { id: "screener", label: "Screener", route: "/research/screener" },
  { id: "sweet-spot", label: "Sweet Spot", route: "/research/sweet-spot" },
  { id: "hotlists", label: "Hot Lists" },
  { id: "ai", label: "Mezan AI" },
  { id: "news", label: "News" },
  { id: "sentiment", label: "Sentiment" },
  { id: "insider", label: "Insiders" },
  { id: "congress", label: "Congress" },
  { id: "rotation", label: "Rotation" },
  { id: "tools", label: "Tools", route: "/tools" },
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

// ===== TAB: HOT LISTS — Thematic Screener: theme pills + halal filter + sortable table.
type ThemeMeta = { id: string; label: string; icon: string; count: number; avgChange?: number };
type ThemeRow = {
  ticker: string;
  companyName: string | null;
  industry: string | null;
  price: number;
  priceLabel: string;
  changePercentage: number | null;
  marketCap: number;
  marketCapLabel: string;
  volume: number;
  volumeLabel: string;
  revenueGrowthYoY: number | null;
  trend: "Bullish" | "Bearish" | "Neutral";
  halalStatus: "HALAL" | "QUESTIONABLE" | "NOT_HALAL" | null;
  logoUrl: string | null;
};
type RowSortKey = "marketCap" | "changePercentage" | "revenueGrowthYoY" | "volume" | "ticker" | "price";

function HotListsTab() {
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeMeta[]>([]);
  const [rowsByTheme, setRowsByTheme] = useState<Record<string, ThemeRow[]>>({});
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [halalOnly, setHalalOnly] = useState(true);
  const [trendFilter, setTrendFilter] = useState<"all" | "Bullish" | "Bearish" | "Neutral">("all");
  const [rowSortKey, setRowSortKey] = useState<RowSortKey>("marketCap");
  const [rowSortDir, setRowSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/research/hotlists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.themes) {
          setThemes(d.themes);
          setRowsByTheme(d.rowsByTheme || {});
          if (d.themes.length > 0 && !selectedTheme) setSelectedTheme(d.themes[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows: ThemeRow[] | null = selectedTheme ? (rowsByTheme[selectedTheme] || []) : null;

  const filteredSorted = (() => {
    let list = rows || [];
    if (halalOnly) list = list.filter((r) => r.halalStatus === "HALAL");
    if (trendFilter !== "all") list = list.filter((r) => r.trend === trendFilter);
    const dir = rowSortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (rowSortKey === "ticker") return a.ticker.localeCompare(b.ticker) * dir;
      const av = (a[rowSortKey] ?? 0) as number;
      const bv = (b[rowSortKey] ?? 0) as number;
      return (av - bv) * dir;
    });
    return list;
  })();

  const handleSort = (k: RowSortKey) => {
    if (rowSortKey === k) setRowSortDir(rowSortDir === "asc" ? "desc" : "asc");
    else { setRowSortKey(k); setRowSortDir("desc"); }
  };
  const arrow = (k: RowSortKey) => (rowSortKey === k ? (rowSortDir === "asc" ? " ↑" : " ↓") : "");

  const halalBadge = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, { color: string; bg: string; label: string }> = {
      HALAL: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "✓" },
      QUESTIONABLE: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "?" },
      NOT_HALAL: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "✗" },
    };
    return map[status] || null;
  };

  const activeTheme = themes.find((t) => t.id === selectedTheme);

  return (
    <div>
      <SectionHeader title="Hot Lists & Themes" subtitle="Curated tickers grouped by sector themes and catalysts" />

      <div className="mb-5 flex flex-wrap gap-2">
        {loading && themes.length === 0 && (
          <div className="text-xs text-white/40">Loading themes…</div>
        )}
        {themes.map((t) => {
          const active = t.id === selectedTheme;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.04] text-white/40"
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>
      {activeTheme && typeof activeTheme.avgChange === "number" && (
        <p className="mb-4 text-xs text-white/40">
          {activeTheme.label} · {activeTheme.count} {activeTheme.count === 1 ? "stock" : "stocks"} · avg{" "}
          <span className={activeTheme.avgChange >= 0 ? "text-emerald-400" : "text-red-400"}>
            {activeTheme.avgChange >= 0 ? "+" : ""}{activeTheme.avgChange}%
          </span>
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setHalalOnly(!halalOnly)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            halalOnly ? "bg-emerald-500/10 text-emerald-400" : "border border-white/10 text-white/50 hover:text-white/80"
          }`}
        >
          {halalOnly ? "✓ Halal only" : "Halal only"}
        </button>
        <span className="ml-2 text-[11px] uppercase tracking-wider text-white/40">Trend:</span>
        {(["all", "Bullish", "Bearish", "Neutral"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTrendFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              trendFilter === t ? "bg-emerald-500/10 text-emerald-400" : "border border-white/10 text-white/50 hover:text-white/80"
            }`}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-white/30">
          {filteredSorted.length} of {rows?.length ?? 0}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-left text-[10px] uppercase tracking-wider text-white/40">
                <th className="px-3 py-3 w-10">#</th>
                <th className="px-3 py-3 cursor-pointer hover:text-white" onClick={() => handleSort("ticker")}>Stock{arrow("ticker")}</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("price")}>Price{arrow("price")}</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("marketCap")}>Mkt Cap{arrow("marketCap")}</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("changePercentage")}>% Chg{arrow("changePercentage")}</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("revenueGrowthYoY")}>Rev YoY{arrow("revenueGrowthYoY")}</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("volume")}>Vol{arrow("volume")}</th>
                <th className="px-3 py-3">Trend</th>
                <th className="px-3 py-3 text-center">Halal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-white/40">Loading hot lists…</td></tr>
              )}
              {!loading && filteredSorted.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-12 text-center text-sm text-white/40">
                  No names match these filters. Try toggling Halal-only off or changing the trend filter.
                </td></tr>
              )}
              {filteredSorted.map((r, i) => {
                const badge = halalBadge(r.halalStatus);
                return (
                  <tr
                    key={r.ticker}
                    onClick={() => router.push(`/research/stock/${r.ticker}`)}
                    className="cursor-pointer border-b border-white/[0.03] transition hover:bg-white/[0.04]"
                  >
                    <td className="px-3 py-3 text-xs text-white/30 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {r.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.logoUrl} alt={r.ticker} className="h-6 w-6 rounded bg-white/[0.04] object-contain" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-white/[0.04] text-[9px] font-bold text-white/50">
                            {r.ticker.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-emerald-400">${r.ticker}</div>
                          {r.companyName && (
                            <div className="truncate text-[10px] text-white/30 max-w-[180px]">{r.companyName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums">{r.priceLabel}</td>
                    <td className="px-3 py-3 text-right text-sm text-white/70 tabular-nums">{r.marketCapLabel}</td>
                    <td className={`px-3 py-3 text-right text-sm tabular-nums ${
                      r.changePercentage == null ? "text-white/30"
                      : r.changePercentage >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {r.changePercentage == null ? "—" :
                        `${r.changePercentage >= 0 ? "+" : ""}${r.changePercentage.toFixed(2)}%`}
                    </td>
                    <td className={`px-3 py-3 text-right text-sm tabular-nums ${
                      r.revenueGrowthYoY == null ? "text-white/30"
                      : r.revenueGrowthYoY >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {r.revenueGrowthYoY == null ? "—" :
                        `${r.revenueGrowthYoY >= 0 ? "+" : ""}${(r.revenueGrowthYoY * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-white/60 tabular-nums">{r.volumeLabel}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        r.trend === "Bullish" ? "bg-emerald-500/10 text-emerald-400"
                        : r.trend === "Bearish" ? "bg-red-500/10 text-red-400"
                        : "bg-white/[0.04] text-white/40"
                      }`}>
                        {r.trend}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {badge && (
                        <span
                          className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-white/30">
        Prices refresh every ~20 min · fundamentals daily · halal screen applied by default
      </p>
    </div>
  );
}

// ===== TAB: TENET AI =====
type AIAnalysis = {
  ticker: string;
  name: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  price: number;
  change: number;
  entry: string;
  stop: string;
  target: string;
  rr: string;
  ema21: number;
  ema50: number;
  ema200: number;
  rsi: number;
  analysis: string;
  conviction?: string | null;
};

function MezanAITab() {
  const [analyses, setAnalyses] = useState<AIAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<"ALL" | "BUY" | "HOLD" | "SELL">("ALL");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/research/ai-analyses", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAnalyses(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = (analyses || []).filter((a) =>
    signalFilter === "ALL" ? true : a.signal === signalFilter
  );

  return (
    <div>
      <SectionHeader title="Mezan AI Analysis" subtitle="Computed from your research picks — live EMAs, RSI, MACD, support / resistance" />

      {analyses !== null && analyses.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {(["ALL", "BUY", "HOLD", "SELL"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSignalFilter(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                signalFilter === k
                  ? k === "BUY" ? "bg-emerald-500/10 text-emerald-400"
                  : k === "SELL" ? "bg-red-500/10 text-red-400"
                  : k === "HOLD" ? "bg-amber-500/10 text-amber-400"
                  : "bg-white/10 text-white"
                  : "border border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              {k}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-white/30">
            Showing {filtered.length} of {analyses.length}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-300">
          Could not load analyses: {error}
        </div>
      )}

      {analyses === null && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {analyses !== null && analyses.length === 0 && !error && (
        <p className="text-sm text-white/40">No research picks yet. Add tickers from the admin panel.</p>
      )}

      <div className="space-y-4">
        {filtered.map((a) => (
          <div key={a.ticker} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <a href={`/research/stock/${a.ticker}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400">
                  {a.ticker.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold">{a.ticker}</p>
                  <p className="text-xs text-white/30">{a.name}</p>
                </div>
              </a>
              <div className="flex items-center gap-3">
                {a.price > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold">${a.price.toFixed(2)}</p>
                    <p className={`text-xs ${a.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {a.change >= 0 ? "+" : ""}{a.change.toFixed(2)}%
                    </p>
                  </div>
                )}
                <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
                  a.signal === "BUY" ? "bg-emerald-500/10 text-emerald-400" :
                  a.signal === "SELL" ? "bg-red-500/10 text-red-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  {a.signal}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              <Chip label="Confidence" value={a.confidence} color="emerald" />
              <Chip label="Entry" value={`$${a.entry}`} />
              <Chip label="Stop" value={`$${a.stop}`} color="red" />
              <Chip label="Target" value={`$${a.target}`} color="emerald" />
              <Chip label="R:R" value={a.rr} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Chip label="21 EMA" value={a.ema21 > 0 ? `$${a.ema21.toFixed(2)}` : "—"} />
              <Chip label="50 EMA" value={a.ema50 > 0 ? `$${a.ema50.toFixed(2)}` : "—"} />
              <Chip label="200 EMA" value={a.ema200 > 0 ? `$${a.ema200.toFixed(2)}` : "—"} />
              <Chip label="RSI (14)" value={a.rsi > 0 ? a.rsi.toFixed(1) : "—"} />
            </div>

            <div className="mt-4 rounded-lg bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Analysis</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{a.analysis}</p>
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
type InsiderTrade = {
  ticker: string;
  name: string;
  title: string;
  type: "Insider";
  action: "Buy" | "Sell";
  amountFormatted: string;
  date: string;
  formType?: string;
  url?: string | null;
};

function InsiderTab() {
  const router = useRouter();
  const [trades, setTrades] = useState<InsiderTrade[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/research/insiders/latest?limit=100", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setTrades(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = (trades || []).filter((t) =>
    filter === "all" ? true : filter === "buy" ? t.action === "Buy" : t.action === "Sell"
  );

  return (
    <div>
      <SectionHeader title="Latest Insider Trades" subtitle="Form 4 filings, updated every 5 minutes" />

      <div className="mb-4 flex gap-2">
        {(["all", "buy", "sell"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
              filter === k
                ? "bg-emerald-500/10 text-emerald-400"
                : "border border-white/10 text-white/50 hover:text-white/80"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-300">
          Could not load insider feed: {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Name</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Ticker</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Title</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Action</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-white/40">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Date</th>
            </tr>
          </thead>
          <tbody>
            {trades === null && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-white/40">Loading…</td></tr>
            )}
            {trades !== null && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-white/40">No trades match this filter.</td></tr>
            )}
            {filtered.map((t, i) => (
              <tr
                key={i}
                onClick={() => t.ticker && t.ticker !== "—" && router.push(`/research/stock/${t.ticker}`)}
                className="cursor-pointer border-b border-white/[0.03] transition hover:bg-white/[0.04]"
              >
                <td className="px-5 py-3 text-sm">{t.name}</td>
                <td className="px-5 py-3 text-sm font-semibold text-emerald-400">{t.ticker}</td>
                <td className="px-5 py-3 text-xs text-white/50">{t.title}</td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium ${t.action === "Buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-sm text-white/70">{t.amountFormatted}</td>
                <td className="px-5 py-3 text-sm text-white/30">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== MACRO PULSE =====
type MacroSeries = {
  id: string;
  label: string;
  unit: string;
  source?: string;
  latest: number | null;
  prev: number | null;
  delta: number | null;
  asOf: string | null;
  inverted?: boolean;
};

function MacroPulse() {
  const [series, setSeries] = useState<MacroSeries[] | null>(null);
  const [curve, setCurve] = useState<MacroSeries | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/research/macro", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setError(res.status === 503 ? "FRED API key not configured" : `HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setSeries(data.series || []);
          setCurve(data.curve || null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Hide silently if not configured (don't break the page)
  if (error) return null;
  if (!series || series.length === 0) return null;

  const fmtVal = (s: MacroSeries) => {
    if (s.latest == null) return "—";
    if (s.unit === "%") return `${s.latest.toFixed(2)}%`;
    return s.latest.toFixed(2);
  };
  const fmtDelta = (s: MacroSeries) => {
    if (s.delta == null) return null;
    const sign = s.delta >= 0 ? "+" : "";
    if (s.unit === "%") return `${sign}${s.delta.toFixed(2)}pp`;
    return `${sign}${s.delta.toFixed(2)}`;
  };

  return (
    <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Market Pulse</p>
          <p className="text-[10px] text-white/30">Federal Reserve · 6-hr cache</p>
        </div>
        {curve && (
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
            curve.inverted ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
          }`}>
            Yield Curve: {curve.latest != null ? `${curve.latest.toFixed(2)}%` : "—"}
            {curve.inverted ? " · INVERTED" : ""}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {series.map((s) => {
          const delta = fmtDelta(s);
          const deltaColor = s.delta == null ? "text-white/30" : s.delta >= 0 ? "text-emerald-400" : "text-red-400";
          return (
            <div key={s.id} className="rounded-lg bg-white/[0.02] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</p>
              <p className="mt-0.5 text-base font-bold tabular-nums">{fmtVal(s)}</p>
              {delta && <p className={`text-[10px] tabular-nums ${deltaColor}`}>{delta}</p>}
              {s.source && (
                <p className="mt-1 text-[9px] text-white/25">Source: {s.source} via FRED</p>
              )}
            </div>
          );
        })}
      </div>
      {/* Required disclaimer per FRED API Terms of Use */}
      <p className="mt-3 text-[10px] italic text-white/30">
        This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.
      </p>
    </div>
  );
}

// ===== TAB: CONGRESS =====
type CongressTrade = {
  ticker: string;
  name: string;
  chamber: "Senate" | "House";
  member: string;
  state: string | null;
  type: "Purchase" | "Sale" | "Exchange" | "Other";
  amount: string;
  transactionDate: string;
  disclosureDate: string;
  link: string;
  halalStatus: "HALAL" | "QUESTIONABLE" | "NOT_HALAL" | null;
  isCompliant: boolean;
};

function CongressTab() {
  const router = useRouter();
  const [trades, setTrades] = useState<CongressTrade[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [halalOnly, setHalalOnly] = useState(true);
  const [chamberFilter, setChamberFilter] = useState<"all" | "Senate" | "House">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Purchase" | "Sale">("all");
  const [summary, setSummary] = useState<{ senate: number; house: number; halal: number; buys: number; sells: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/research/congress/latest?limit=200&halalOnly=${halalOnly}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setTrades(Array.isArray(data.trades) ? data.trades : []);
          setSummary(data.summary || null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load");
      }
    })();
    return () => { cancelled = true; };
  }, [halalOnly]);

  const filtered = (trades || []).filter((t) => {
    if (chamberFilter !== "all" && t.chamber !== chamberFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  const fmtDate = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  };

  const halalBadge = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, { color: string; bg: string; label: string }> = {
      HALAL: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "HALAL" },
      QUESTIONABLE: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "?" },
      NOT_HALAL: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "✗" },
    };
    return map[status] || null;
  };

  return (
    <div>
      <SectionHeader title="Congressional Trading" subtitle="Senators & Representatives — disclosed Form PTR filings · 30-min cache" />

      {summary && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Senate</p>
            <p className="mt-1 text-xl font-bold">{summary.senate}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">House</p>
            <p className="mt-1 text-xl font-bold">{summary.house}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400">Halal</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">{summary.halal}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Buys</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">{summary.buys}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Sells</p>
            <p className="mt-1 text-xl font-bold text-red-400">{summary.sells}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setHalalOnly(!halalOnly)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            halalOnly ? "bg-emerald-500/10 text-emerald-400" : "border border-white/10 text-white/50 hover:text-white/80"
          }`}
        >
          {halalOnly ? "✓ Halal only" : "Halal only"}
        </button>
        <span className="ml-2 text-[11px] uppercase tracking-wider text-white/40">Chamber:</span>
        {(["all", "Senate", "House"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChamberFilter(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              chamberFilter === c ? "bg-emerald-500/10 text-emerald-400" : "border border-white/10 text-white/50 hover:text-white/80"
            }`}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-wider text-white/40">Action:</span>
        {(["all", "Purchase", "Sale"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              typeFilter === t ? "bg-emerald-500/10 text-emerald-400" : "border border-white/10 text-white/50 hover:text-white/80"
            }`}
          >
            {t === "all" ? "All" : t === "Purchase" ? "🟢 Buys" : "🔴 Sells"}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-white/30">{filtered.length} trades</span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-300">
          Could not load congress feed: {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Chamber</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Ticker</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Action</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Trade Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Disclosed</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {trades === null && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-white/40">Loading…</td></tr>
            )}
            {trades !== null && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-white/40">No trades match these filters.</td></tr>
            )}
            {filtered.map((t, i) => {
              const badge = halalBadge(t.halalStatus);
              return (
                <tr
                  key={`${t.ticker}-${t.member}-${i}`}
                  onClick={() => router.push(`/research/stock/${t.ticker}`)}
                  className="cursor-pointer border-b border-white/[0.03] transition hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{t.member}</div>
                    {t.state && <div className="text-[10px] text-white/30">{t.state}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      t.chamber === "Senate" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {t.chamber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-bold text-emerald-400">{t.ticker}</span>
                    {badge && (
                      <span
                        className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    )}
                    <div className="text-[10px] text-white/30 truncate max-w-[180px]">{t.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${
                      t.type === "Purchase" ? "text-emerald-400" : t.type === "Sale" ? "text-red-400" : "text-white/40"
                    }`}>
                      {t.type === "Purchase" ? "🟢 Buy" : t.type === "Sale" ? "🔴 Sell" : t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-white/70">{t.amount}</td>
                  <td className="px-4 py-3 text-sm text-white/40">{fmtDate(t.transactionDate)}</td>
                  <td className="px-4 py-3 text-sm text-white/30">{fmtDate(t.disclosureDate)}</td>
                  <td className="px-4 py-3 text-right">
                    {t.link && (
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-white/30 hover:text-emerald-400"
                        title="View original filing"
                      >
                        ↗
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
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

