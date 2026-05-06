"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://compliance-check-api-223407081609.us-central1.run.app";

type ScreenerRow = {
  symbol: string;
  companyName?: string;
  price?: number;
  changePercentage?: number;
  marketCap?: number;
  sector?: string;
  imageUrl?: string;
  ema21?: number;
  ema50?: number;
  rsi?: number;
  volume?: number;
  halalStatus?: string;
};

type FilterState = {
  sector?: string;
  marketCapMin?: number | null;
  marketCapMax?: number | null;
  dividendYieldMin?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  exchange?: string;
  halalStatus?: string;
  volumeMin?: number | null;
  changePercentageMin?: number | null;
  changePercentageMax?: number | null;
  aboveEma21?: boolean;
  aboveEma50?: boolean;
  inUptrend?: boolean;
  rsiMin?: number | null;
  rsiMax?: number | null;
};

const DEFAULT_FILTERS: FilterState = {
  halalStatus: "HALAL",
  exchange: "All",
  sector: "All",
};

const SECTORS = [
  "All", "Technology", "Healthcare", "Financial Services", "Consumer Cyclical",
  "Consumer Defensive", "Communication Services", "Industrials", "Basic Materials",
  "Energy", "Real Estate", "Utilities",
];

const EXCHANGES = ["All", "NASDAQ", "NYSE", "AMEX", "OTC"];

// Preset scans — each one resets and applies a filter combo.
const PRESETS: { id: string; label: string; emoji: string; filters: FilterState }[] = [
  {
    id: "above-21-ema",
    label: "Halal · Above 21 EMA",
    emoji: "📈",
    filters: { halalStatus: "HALAL", aboveEma21: true, marketCapMin: 1_000_000_000 },
  },
  {
    id: "uptrend",
    label: "Halal · In Uptrend",
    emoji: "🚀",
    filters: { halalStatus: "HALAL", inUptrend: true, marketCapMin: 2_000_000_000 },
  },
  {
    id: "rsi-sweet-spot",
    label: "Halal · RSI 50-70 (Strong Trend)",
    emoji: "🎯",
    filters: { halalStatus: "HALAL", rsiMin: 50, rsiMax: 70, marketCapMin: 1_000_000_000 },
  },
  {
    id: "mega-caps",
    label: "Halal · Mega Caps",
    emoji: "🏛️",
    filters: { halalStatus: "HALAL", marketCapMin: 200_000_000_000 },
  },
  {
    id: "dividend-payers",
    label: "Halal · Dividend Payers",
    emoji: "💰",
    filters: { halalStatus: "HALAL", dividendYieldMin: 2.5, marketCapMin: 10_000_000_000 },
  },
  {
    id: "midcap-growth",
    label: "Halal · Mid-Cap Setups",
    emoji: "🌱",
    filters: {
      halalStatus: "HALAL", marketCapMin: 2_000_000_000, marketCapMax: 10_000_000_000,
      aboveEma21: true, rsiMin: 50,
    },
  },
];

const fmtMc = (n?: number) => {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
};
const fmtPct = (n?: number) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`);
const fmtPrice = (n?: number) => (n == null ? "—" : `$${n.toFixed(2)}`);

export default function ScreenerPage() {
  const router = useRouter();
  const { user, loading, hasResearchAccess } = useAuth();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<ScreenerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!hasResearchAccess) {
      router.push("/research");
    }
  }, [loading, user, hasResearchAccess, router]);

  const cleanFilters = useMemo(() => {
    const out: any = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v === null || v === undefined || v === "" || v === "All") continue;
      out[k] = v;
    }
    return out;
  }, [filters]);

  const fetchResults = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND}/api/v1/stock-info/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: cleanFilters,
          page,
          sort: { field: sortField, direction: sortDir },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.content || []);
      setTotal(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load");
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !hasResearchAccess) return;
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortDir, user, hasResearchAccess]);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
    setActivePreset(presetId);
    setPage(0);
    setTimeout(() => fetchResults(), 0);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setActivePreset(null);
    setPage(0);
    setTimeout(() => fetchResults(), 0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-sm text-white/40">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white">
      {/* HEADER */}
      <div className="border-b border-white/[0.06] bg-[var(--card)]/30 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Stock Screener</h1>
              <p className="mt-1 text-sm text-white/40">
                Filter halal-compliant US stocks by fundamentals & technicals.
              </p>
            </div>
            <a href="/research" className="text-sm text-emerald-400 hover:underline">
              ← Back to Research
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* PRESET SCAN BUTTONS */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Quick Scans</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  activePreset === p.id
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <span className="mr-1.5">{p.emoji}</span>
                {p.label}
              </button>
            ))}
            <button
              onClick={resetFilters}
              className="rounded-xl border border-white/5 px-4 py-2 text-sm text-white/40 hover:text-white/70"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* SIDEBAR FILTERS */}
          <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Filters</p>
            <div className="space-y-4">
              <Field label="Halal Status">
                <select
                  value={filters.halalStatus || "HALAL"}
                  onChange={(e) => setFilters({ ...filters, halalStatus: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                >
                  <option value="HALAL">HALAL only</option>
                  <option value="QUESTIONABLE">QUESTIONABLE</option>
                  <option value="NOT_HALAL">NOT_HALAL</option>
                  <option value="ALL">All (any status)</option>
                </select>
              </Field>

              <Field label="Sector">
                <select
                  value={filters.sector || "All"}
                  onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                >
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Exchange">
                <select
                  value={filters.exchange || "All"}
                  onChange={(e) => setFilters({ ...filters, exchange: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                >
                  {EXCHANGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Market Cap (USD)">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.marketCapMin ?? ""}
                    onChange={(e) => setFilters({ ...filters, marketCapMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                  <input type="number" placeholder="Max" value={filters.marketCapMax ?? ""}
                    onChange={(e) => setFilters({ ...filters, marketCapMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                </div>
              </Field>

              <Field label="Price ($)">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.priceMin ?? ""}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                  <input type="number" placeholder="Max" value={filters.priceMax ?? ""}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                </div>
              </Field>

              <Field label="Volume Min (shares)">
                <input type="number" placeholder="e.g. 1000000" value={filters.volumeMin ?? ""}
                  onChange={(e) => setFilters({ ...filters, volumeMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
              </Field>

              <Field label="Today's Change %">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.changePercentageMin ?? ""}
                    onChange={(e) => setFilters({ ...filters, changePercentageMin: e.target.value !== "" ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                  <input type="number" placeholder="Max" value={filters.changePercentageMax ?? ""}
                    onChange={(e) => setFilters({ ...filters, changePercentageMax: e.target.value !== "" ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                </div>
              </Field>

              <Field label="Dividend Yield Min (%)">
                <input type="number" placeholder="e.g. 2" value={filters.dividendYieldMin ?? ""}
                  onChange={(e) => setFilters({ ...filters, dividendYieldMin: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
              </Field>

              <div className="border-t border-white/5 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">Technicals</p>
                <div className="space-y-2">
                  <Toggle label="Above 21 EMA" checked={!!filters.aboveEma21}
                    onChange={(v) => setFilters({ ...filters, aboveEma21: v })} />
                  <Toggle label="Above 50 EMA" checked={!!filters.aboveEma50}
                    onChange={(v) => setFilters({ ...filters, aboveEma50: v })} />
                  <Toggle label="In Uptrend (10>21>50)" checked={!!filters.inUptrend}
                    onChange={(v) => setFilters({ ...filters, inUptrend: v })} />
                </div>
                <div className="mt-3">
                  <Field label="RSI Range">
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.rsiMin ?? ""}
                        onChange={(e) => setFilters({ ...filters, rsiMin: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                      <input type="number" placeholder="Max" value={filters.rsiMax ?? ""}
                        onChange={(e) => setFilters({ ...filters, rsiMax: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm" />
                    </div>
                  </Field>
                </div>
              </div>

              <button
                onClick={() => { setPage(0); fetchResults(); setActivePreset(null); }}
                className="mt-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 transition"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* RESULTS */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-white/50">
                {isLoading ? "Loading…" : `${total.toLocaleString()} stocks match`}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                    <Th>Ticker</Th>
                    <Th onClick={() => handleSort("price")} active={sortField === "price"} dir={sortDir}>Price</Th>
                    <Th onClick={() => handleSort("change")} active={sortField === "change"} dir={sortDir}>Chg %</Th>
                    <Th onClick={() => handleSort("marketCap")} active={sortField === "marketCap"} dir={sortDir}>Mkt Cap</Th>
                    <Th>Sector</Th>
                    <Th>RSI</Th>
                    <Th>21 EMA</Th>
                    <Th>50 EMA</Th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 && !isLoading && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-white/30">No matches. Loosen the filters.</td></tr>
                  )}
                  {results.map((r) => (
                    <tr
                      key={r.symbol}
                      onClick={() => router.push(`/research/stock/${r.symbol}`)}
                      className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt="" className="h-7 w-7 rounded-full object-contain bg-white/5" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                              {r.symbol?.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">{r.symbol}</div>
                            <div className="text-[10px] text-white/40 line-clamp-1">{r.companyName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{fmtPrice(r.price)}</td>
                      <td className={`px-4 py-3 font-semibold ${(r.changePercentage ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPct(r.changePercentage)}
                      </td>
                      <td className="px-4 py-3 text-white/70">{fmtMc(r.marketCap)}</td>
                      <td className="px-4 py-3 text-white/60">{r.sector || "—"}</td>
                      <td className="px-4 py-3 text-white/70">{r.rsi != null ? r.rsi.toFixed(1) : "—"}</td>
                      <td className="px-4 py-3 text-white/70">{r.ema21 != null ? `$${r.ema21.toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-3 text-white/70">{r.ema50 != null ? `$${r.ema50.toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-white/10 px-4 py-1.5 text-white/70 disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-white/40">Page {page + 1} of {Math.ceil(total / 20)}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 20 >= total}
                  className="rounded-lg border border-white/10 px-4 py-1.5 text-white/70 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
      <span className="text-sm text-white/70">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-emerald-500" />
    </label>
  );
}

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick?: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 ${onClick ? "cursor-pointer hover:text-white/80" : ""} ${active ? "text-emerald-400" : ""}`}
    >
      {children} {active && (dir === "asc" ? "↑" : "↓")}
    </th>
  );
}
