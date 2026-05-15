"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type CriterionKey = "marketcap" | "inflection" | "catalyst" | "sponsorship" | "price";

const CRITERIA: {
  id: CriterionKey;
  label: string;
  icon: string;
  description: string;
  weight: number;
}[] = [
  {
    id: "marketcap",
    label: "Market Cap Sweet Spot",
    icon: "💰",
    description:
      "Under $5B — small enough to 10x but real enough to survive. Bonus for spinoff/IPO in last 2 years (low institutional memory).",
    weight: 1,
  },
  {
    id: "inflection",
    label: "Earnings Inflection",
    icon: "⬆️",
    description:
      "Losses narrowing or flipping to profits. This is the SNDK setup: massive operating leverage when revenue hits. Look for EPS going from -$2 to +$5.",
    weight: 1.5,
  },
  {
    id: "catalyst",
    label: "AI Demand Catalyst",
    icon: "⚡",
    description:
      "Direct, not tangential. \"AI helps our business\" = bad. \"AI hyperscalers must buy our product\" = good. Supply/demand imbalance is the dream.",
    weight: 1.5,
  },
  {
    id: "sponsorship",
    label: "Low But Growing Inst. Ownership",
    icon: "🏛️",
    description:
      "Institutions starting to build — not crowded yet. Early sponsorship from 1-2 quality funds is bullish. Avoid stocks already 80%+ institutionally owned.",
    weight: 1,
  },
  {
    id: "price",
    label: "Price Action / Base",
    icon: "📈",
    description:
      "Forming a base or early-stage breakout. Not extended. High RS rank. Volume dry-up in the base. Avoid stocks that are already up 300%+ from the low.",
    weight: 1,
  },
];

type Stock = {
  ticker: string;
  name: string;
  price: string;
  marketCap: string;
  sector: string;
  thesis: string;
  risk: string;
  scores: Record<CriterionKey, number>;
  sndk_similarity: string;
  upcoming: string;
  badge?: string;
};

const STOCKS: Stock[] = [
  {
    ticker: "SKYT",
    name: "SkyWater Technology",
    price: "$14.20",
    marketCap: "~$940M",
    sector: "Semiconductor Foundry",
    thesis:
      "Only US-owned open-access semiconductor foundry. Partners with quantum computing companies (IonQ, D-Wave, etc.) and AI chip startups. Revenue from quantum customers hit record highs in Q3 2025. Unique: they work with MULTIPLE quantum approaches, so they win regardless of which wins. CHIPS Act beneficiary.",
    risk: "Quantum computing is still pre-commercial. Revenue lumpy. May need more capital.",
    scores: { marketcap: 5, inflection: 4, catalyst: 4, sponsorship: 3, price: 3 },
    sndk_similarity:
      "Cyclical trough → inflection. Under-owned. Direct hardware play on next compute wave.",
    upcoming: "Next earnings Q2 2026",
  },
  {
    ticker: "PLAB",
    name: "Photronics",
    price: "$28.50",
    marketCap: "~$1.5B",
    sector: "Chip Manufacturing Supplies",
    thesis:
      "Makes photomasks — the \"blueprints\" used by ASML to etch circuits on every advanced chip. Every AI chip needs photomasks. Photronics is investing aggressively in new manufacturing capacity, signaling strong demand conviction. Profitable, under the radar. Beat both sales and EPS in recent quarters.",
    risk: "Dependent on fab utilization. If AI chip orders slow, demand drops. Not a hypergrowth story.",
    scores: { marketcap: 4, inflection: 4, catalyst: 4, sponsorship: 3, price: 3 },
    sndk_similarity:
      "Profitable, direct AI supply chain, under-owned. Similar to SNDK pre-discovery.",
    upcoming: "Capacity expansion announcement expected mid-2026",
  },
  {
    ticker: "CEVA",
    name: "CEVA Inc.",
    price: "$38.00",
    marketCap: "~$600M",
    sector: "Semiconductor IP",
    thesis:
      "Licenses AI signal-processing engines and DSP cores used in edge AI chips — every sensor, camera, and IoT device. Revenue is royalty-based (scales with volume). Recently embedded into Microchip Technology's huge microcontroller line, moving from consumer gadgets into industrial/automotive. Edge AI is the NEXT wave after cloud AI.",
    risk: "Licensing model means revenue lags design wins by 12-24 months. Long sales cycle.",
    scores: { marketcap: 5, inflection: 3, catalyst: 5, sponsorship: 3, price: 4 },
    sndk_similarity:
      "Tiny market cap. Direct AI chip IP play. Revenue inflection coming as designs ship.",
    upcoming: "Microchip royalties start flowing H2 2026",
  },
  {
    ticker: "AIP",
    name: "Arteris Inc.",
    price: "$9.50",
    marketCap: "~$280M",
    sector: "Semiconductor IP",
    thesis:
      "Sells the \"traffic control system\" for complex AI chips — Network-on-Chip (NoC) interconnect IP. As chips pack more processors together, internal data routing becomes a bottleneck Arteris solves. Dominant in automotive (Mobileye, Bosch). Now expanding into AI data center ASICs. Tiny float. If design wins accelerate, revenue could triple.",
    risk: "Very small, pre-profitability. Customer concentration risk. Slow design win cycles.",
    scores: { marketcap: 5, inflection: 3, catalyst: 4, sponsorship: 2, price: 4 },
    sndk_similarity:
      "Smallest market cap on the list. Highest upside potential IF the catalyst hits.",
    upcoming: "ASIC design win announcements expected 2026",
  },
  {
    ticker: "APLD",
    name: "Applied Digital",
    price: "$7.20",
    marketCap: "~$950M",
    sector: "AI Data Centers",
    thesis:
      "Builds AI-optimized data centers and signs 15-year leases with hyperscalers. More REIT-like than neocloud. Long-term contracted revenue gives earnings visibility. Direct beneficiary of $700B annual chip spending requiring data center infrastructure. Much smaller than CoreWeave/NBIS but same demand driver.",
    risk: "Heavy capex. Dependent on hyperscaler contract renewals. NBIS/CRWV more sophisticated competitors.",
    scores: { marketcap: 5, inflection: 3, catalyst: 4, sponsorship: 3, price: 4 },
    sndk_similarity:
      "Small cap infrastructure play on AI demand. REIT model = earnings inflection once leases kick in.",
    upcoming: "New facility lease announcement pending",
  },
  {
    ticker: "IREN",
    name: "Iren (neocloud)",
    price: "$11.40",
    marketCap: "~$2.2B",
    sector: "AI Cloud / GPU-as-a-Service",
    thesis:
      "GPU cloud provider renting Nvidia compute to AI builders. Down 31% in the last 6 months vs NBIS which is up 110% — potential catch-up trade. Lower multiple than peers. Q3 earnings due May 7 — catalyst event. GPU-as-a-service demand still early innings.",
    risk: "Competing directly with NBIS, CoreWeave, Lambda Labs. May lack differentiation long-term.",
    scores: { marketcap: 4, inflection: 3, catalyst: 4, sponsorship: 2, price: 5 },
    sndk_similarity:
      "Beaten-down neocloud while peers rally. Classic under-ownership setup if earnings catalyze.",
    upcoming: "Next earnings — see detail",
  },
];

const scoreColor = (score: number) => {
  if (score >= 5) return "#00ff88";
  if (score >= 4) return "#7dff7d";
  if (score >= 3) return "#ffd700";
  if (score >= 2) return "#ff8c42";
  return "#ff4d4d";
};

const scoreLabel = (score: number) => {
  if (score >= 5) return "STRONG";
  if (score >= 4) return "GOOD";
  if (score >= 3) return "OK";
  if (score >= 2) return "WEAK";
  return "POOR";
};

const getWeightedScore = (scores: Record<CriterionKey, number>) => {
  let total = 0;
  let maxTotal = 0;
  CRITERIA.forEach((c) => {
    total += scores[c.id] * c.weight;
    maxTotal += 5 * c.weight;
  });
  return Math.round((total / maxTotal) * 100);
};

type EnrichedTicker = {
  ticker: string;
  halalStatus: "HALAL" | "QUESTIONABLE" | "NOT_HALAL" | null;
  logoUrl: string | null;
  industry: string | null;
  companyName: string | null;
  aiAnalysis: {
    thesis: string;
    risk: string;
    sndkAnalog: string;
    source: "llm" | "manual";
    generatedAt: string;
  } | null;
  sentiment: {
    shortTerm: string | null;
    shortTermScore: number | null;
    midTerm: string | null;
    midTermScore: number | null;
  };
  quote: {
    price: number;
    priceLabel: string;
    marketCap: number;
    marketCapLabel: string;
    changePercentage: number | null;
    yearHigh: number | null;
    yearLow: number | null;
    yearRangeLabel: string;
    yearRangePos: number | null;
  };
  technicals: { ema21: number | null; ema50: number | null; rsi: number | null };
  computedScores: { marketcap: number; inflection: number; sponsorship: number; price: number };
  growth: { revenueGrowthYoY: number | null; epsGrowthYoY: number | null; netIncomeGrowthYoY: number | null } | null;
  analyst: {
    priceTarget: number | null;
    priceTargetLabel: string;
    priceTargetHigh: number | null;
    priceTargetLow: number | null;
    priceTargetMedian: number | null;
    priceTargetCount: number | null;
    targetRangePos: number | null;
    targetRangeLabel: string;
    upsidePct: number | null;
    upsideLabel: string;
    recommendations: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; consensus: string };
  };
  insider: { buys: number; sells: number; netDollar: number; window: string };
  earnings: { date: string | null; daysAway: number | null };
};

const halalBadge = (status: string | null | undefined) => {
  if (!status) return null;
  const map: Record<string, { color: string; bg: string; label: string }> = {
    HALAL: { color: "#00c864", bg: "rgba(0, 200, 100, 0.15)", label: "✓ HALAL" },
    QUESTIONABLE: { color: "#ffd700", bg: "rgba(255, 215, 0, 0.15)", label: "? QUESTIONABLE" },
    NOT_HALAL: { color: "#ff4d4d", bg: "rgba(255, 77, 77, 0.15)", label: "✗ NOT HALAL" },
  };
  return map[status] || null;
};

export default function SweetSpotPage() {
  const router = useRouter();
  const { user, loading, hasResearchAccess } = useAuth();

  const [selected, setSelected] = useState<Stock>(STOCKS[0]);
  const [activeTab, setActiveTab] = useState<"screener" | "framework" | "candidates">("screener");
  const [enriched, setEnriched] = useState<Record<string, EnrichedTicker>>({});
  const [asOf, setAsOf] = useState<string | null>(null);

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

  // Fetch enriched per-ticker data once on mount; server caches 15 min.
  useEffect(() => {
    if (!user || !hasResearchAccess) return;
    const symbols = STOCKS.map((s) => s.ticker).join(",");
    fetch(`/api/research/sndk-dna/enriched?symbols=${symbols}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.tickers) return;
        setEnriched(data.tickers);
        setAsOf(data.asOf || null);
      })
      .catch(() => {});
  }, [user, hasResearchAccess]);

  // Merge live data onto the static stocks (live wins when available).
  const livePrice = (s: Stock) => enriched[s.ticker]?.quote.priceLabel ?? s.price;
  const liveMcap = (s: Stock) => enriched[s.ticker]?.quote.marketCapLabel ?? s.marketCap;
  const liveChange = (s: Stock) => enriched[s.ticker]?.quote.changePercentage ?? null;

  // Score merge: catalyst stays editorial; the other 4 use computed values when present.
  const liveScores = (s: Stock) => {
    const c = enriched[s.ticker]?.computedScores;
    if (!c) return s.scores;
    return {
      marketcap: c.marketcap || s.scores.marketcap,
      inflection: c.inflection || s.scores.inflection,
      catalyst: s.scores.catalyst,        // editorial
      sponsorship: c.sponsorship || s.scores.sponsorship,
      price: c.price || s.scores.price,
    };
  };

  if (loading || !user) {
    return (
      <main style={{ background: "#080c10", color: "#c8d6e5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading…</div>
      </main>
    );
  }

  const sorted = [...STOCKS].sort(
    (a, b) => getWeightedScore(b.scores) - getWeightedScore(a.scores),
  );

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        background: "#080c10",
        color: "#c8d6e5",
        minHeight: "100vh",
        padding: 0,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
        .stock-row { transition: background 0.15s; cursor: pointer; }
        .stock-row:hover { background: #0d1f35 !important; }
        .tab-btn { cursor: pointer; transition: all 0.2s; border: none; background: none; }
        .score-bar { transition: width 0.4s ease; }
        .pulse { animation: pulse-anim 2s infinite; }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; letter-spacing: 1px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d1117", borderBottom: "1px solid #1e3a5f", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <a
              href="/"
              style={{
                fontSize: 11,
                color: "#4a7fa5",
                letterSpacing: "3px",
                marginBottom: 4,
                textDecoration: "none",
                display: "inline-block",
                cursor: "pointer",
              }}
              title="Back to home"
            >
              ← MEZAN INVESTING <span style={{ color: "#2a4a6a" }}>//</span> RESEARCH
            </a>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#e8f4fd",
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              SNDK-DNA SCREENER
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: "2px" }}>FRAMEWORK</div>
            <div style={{ fontSize: 13, color: "#00c864" }}>5 CRITERIA · 6 CANDIDATES</div>
            <div style={{ fontSize: 10, color: "#4a7fa5", marginTop: 2 }}>
              {asOf ? `LIVE · ${new Date(asOf).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : "—"}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
              <a
                href="/"
                style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: "1px", textDecoration: "none" }}
              >
                ← HOME
              </a>
              <a
                href="/research"
                style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: "1px", textDecoration: "none" }}
              >
                ← RESEARCH
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {(["screener", "framework", "candidates"] as const).map((tab) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px",
                fontSize: 11,
                letterSpacing: "1.5px",
                color: activeTab === tab ? "#00c864" : "#4a7fa5",
                borderBottom: activeTab === tab ? "2px solid #00c864" : "2px solid transparent",
                fontFamily: "'IBM Plex Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* SCREENER TAB */}
      {activeTab === "screener" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            height: "calc(100vh - 160px)",
          }}
        >
          {/* Left: Stock List */}
          <div style={{ borderRight: "1px solid #1e3a5f", overflowY: "auto" }}>
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #1e3a5f",
                fontSize: 10,
                color: "#4a7fa5",
                letterSpacing: "2px",
              }}
            >
              RANKED BY SNDK-SCORE
            </div>
            {sorted.map((stock) => {
              const score = getWeightedScore(liveScores(stock));
              const isSelected = selected.ticker === stock.ticker;
              return (
                <div
                  key={stock.ticker}
                  className="stock-row"
                  onClick={() => setSelected(stock)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #0d1f35",
                    background: isSelected ? "#0d1f35" : "transparent",
                    borderLeft: isSelected ? "3px solid #00c864" : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      {enriched[stock.ticker]?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={enriched[stock.ticker]!.logoUrl as string}
                          alt={stock.ticker}
                          style={{ width: 28, height: 28, borderRadius: 6, background: "#0d1f35", objectFit: "contain", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0d1f35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#4a7fa5", flexShrink: 0 }}>
                          {stock.ticker.slice(0, 2)}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: isSelected ? "#00c864" : "#e8f4fd",
                              fontFamily: "'Space Grotesk', sans-serif",
                            }}
                          >
                            ${stock.ticker}
                          </span>
                          <span style={{ fontSize: 11, color: "#4a7fa5", marginLeft: 8 }}>
                            {liveMcap(stock)}
                          </span>
                          {liveChange(stock) != null && (
                            <span
                              style={{
                                fontSize: 10,
                                marginLeft: 8,
                                color: (liveChange(stock) ?? 0) >= 0 ? "#00c864" : "#ff4d4d",
                              }}
                            >
                              {(liveChange(stock) ?? 0) >= 0 ? "+" : ""}
                              {(liveChange(stock) ?? 0).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        {(() => {
                          const e = enriched[stock.ticker]?.earnings;
                          if (!e?.date) return null;
                          const dt = new Date(e.date);
                          const dateLabel = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                          const days = e.daysAway;
                          const imminent = typeof days === "number" && days >= 0 && days <= 7;
                          const stampColor = imminent ? "#ffd700" : "#5b7a99";
                          return (
                            <div
                              style={{
                                fontSize: 10,
                                color: stampColor,
                                marginTop: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>📅</span>
                              <span>Earnings {dateLabel}</span>
                              {typeof days === "number" && (
                                <span style={{ color: "#4a7fa5" }}>
                                  · {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {(() => {
                        const days = enriched[stock.ticker]?.earnings?.daysAway;
                        let label: string | null = null;
                        if (days === 0) label = "EARNINGS TODAY";
                        else if (days === 1) label = "EARNINGS TOMORROW";
                        else if (typeof days === "number" && days > 1 && days <= 7) label = `EARNINGS IN ${days}D`;
                        else if (stock.badge) label = stock.badge;
                        return label ? (
                          <span
                            className="badge pulse"
                            style={{ background: "#1a3a1a", color: "#00c864", border: "1px solid #00c864" }}
                          >
                            {label}
                          </span>
                        ) : null;
                      })()}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: `conic-gradient(${scoreColor(score / 20)} ${score * 3.6}deg, #1e3a5f 0deg)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#080c10",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor(score / 20) }}>
                            {score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b8fa8", marginBottom: 8 }}>
                    {stock.name} · {stock.sector}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {CRITERIA.map((c) => {
                      const s = liveScores(stock)[c.id];
                      return (
                        <div
                          key={c.id}
                          title={c.label}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: scoreColor(s),
                            opacity: 0.7 + s * 0.06,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detail Panel */}
          <div style={{ overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {enriched[selected.ticker]?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enriched[selected.ticker]!.logoUrl as string}
                    alt={selected.ticker}
                    style={{ width: 48, height: 48, borderRadius: 8, background: "#0d1f35", objectFit: "contain", flexShrink: 0, marginTop: 2 }}
                  />
                ) : null}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#00c864",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      ${selected.ticker}
                    </div>
                    {(() => {
                      const badge = halalBadge(enriched[selected.ticker]?.halalStatus);
                      if (!badge) return null;
                      return (
                        <span
                          className="badge"
                          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}66` }}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 14, color: "#6b8fa8" }}>
                    {enriched[selected.ticker]?.companyName || selected.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#4a7fa5", marginTop: 2 }}>
                    {selected.sector}
                    {enriched[selected.ticker]?.industry && (
                      <span style={{ color: "#6b8fa8" }}> · {enriched[selected.ticker]!.industry}</span>
                    )}{" "}
                    · {liveMcap(selected)} · {livePrice(selected)}
                    {liveChange(selected) != null && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: (liveChange(selected) ?? 0) >= 0 ? "#00c864" : "#ff4d4d",
                        }}
                      >
                        {(liveChange(selected) ?? 0) >= 0 ? "+" : ""}
                        {(liveChange(selected) ?? 0).toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#4a7fa5", letterSpacing: "1px" }}>SNDK SCORE</div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: scoreColor(getWeightedScore(liveScores(selected)) / 20),
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {getWeightedScore(liveScores(selected))}
                  <span style={{ fontSize: 16 }}>/100</span>
                </div>
              </div>
            </div>

            {/* Score Bars */}
            <div style={{ marginBottom: 24 }}>
              {CRITERIA.map((c) => {
                const s = liveScores(selected)[c.id];
                return (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 12 }}>{c.icon}</span>
                        <span style={{ fontSize: 11, color: "#c8d6e5", letterSpacing: "0.5px" }}>{c.label}</span>
                        {c.weight > 1 && (
                          <span
                            className="badge"
                            style={{ background: "#1a2a1a", color: "#7dff7d", fontSize: 9 }}
                          >
                            ×{c.weight} WEIGHT
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(s) }}>
                        {scoreLabel(s)}
                      </span>
                    </div>
                    <div style={{ background: "#1e3a5f", borderRadius: 3, height: 6, overflow: "hidden" }}>
                      <div
                        className="score-bar"
                        style={{
                          width: `${s * 20}%`,
                          height: "100%",
                          background: scoreColor(s),
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Data Points */}
            {enriched[selected.ticker] && (
              <div
                style={{
                  background: "#0d1f35",
                  borderRadius: 6,
                  padding: 14,
                  marginBottom: 14,
                  border: "1px solid #1e3a5f",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "2px",
                    color: "#4a7fa5",
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📊 LIVE DATA POINTS</span>
                  <span style={{ color: "#7dff7d", letterSpacing: "1px" }}>
                    FMP · 15-MIN CACHE
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {/* Analyst target */}
                  <div>
                    <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: "1px", display: "flex", justifyContent: "space-between" }}>
                      <span>ANALYST TARGET</span>
                      {enriched[selected.ticker].analyst.priceTargetCount != null && (
                        <span style={{ color: "#6b8fa8" }}>
                          {enriched[selected.ticker].analyst.priceTargetCount} analyst{enriched[selected.ticker].analyst.priceTargetCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: "#e8f4fd", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginTop: 2 }}>
                      {enriched[selected.ticker].analyst.priceTargetLabel}{" "}
                      <span
                        style={{
                          fontSize: 11,
                          color: (enriched[selected.ticker].analyst.upsidePct ?? 0) >= 0 ? "#00c864" : "#ff4d4d",
                        }}
                      >
                        {enriched[selected.ticker].analyst.upsideLabel}
                      </span>
                    </div>
                  </div>
                  {/* Recommendation */}
                  <div>
                    {(() => {
                      const r = enriched[selected.ticker].analyst.recommendations;
                      const totalAnalysts = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
                      return (
                        <>
                          <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: "1px", display: "flex", justifyContent: "space-between" }}>
                            <span>CONSENSUS</span>
                            {totalAnalysts > 0 && (
                              <span style={{ color: "#6b8fa8" }}>
                                {totalAnalysts} analyst{totalAnalysts === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: "#7dff7d", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginTop: 2 }}>
                            {r.consensus}
                          </div>
                          <div style={{ fontSize: 9, color: "#6b8fa8", marginTop: 2 }}>
                            B {r.strongBuy + r.buy} · H {r.hold} · S {r.sell + r.strongSell}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {/* Insider activity */}
                  <div>
                    <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: "1px" }}>INSIDER (90D)</div>
                    <div style={{ fontSize: 13, color: "#e8f4fd", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginTop: 2 }}>
                      <span style={{ color: "#00c864" }}>{enriched[selected.ticker].insider.buys} buys</span>
                      <span style={{ color: "#6b8fa8", margin: "0 4px" }}>·</span>
                      <span style={{ color: "#ff8c42" }}>{enriched[selected.ticker].insider.sells} sells</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#6b8fa8", marginTop: 2 }}>
                      Net: {enriched[selected.ticker].insider.netDollar >= 0 ? "+" : "-"}$
                      {Math.abs(enriched[selected.ticker].insider.netDollar / 1000).toFixed(0)}K
                    </div>
                  </div>
                  {/* Revenue growth */}
                  <div>
                    <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: "1px" }}>REVENUE YoY</div>
                    <div style={{ fontSize: 13, color: "#e8f4fd", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, marginTop: 2 }}>
                      {enriched[selected.ticker].growth?.revenueGrowthYoY != null
                        ? `${(enriched[selected.ticker].growth!.revenueGrowthYoY! * 100) >= 0 ? "+" : ""}${(enriched[selected.ticker].growth!.revenueGrowthYoY! * 100).toFixed(1)}%`
                        : "—"}
                    </div>
                    <div style={{ fontSize: 9, color: "#6b8fa8", marginTop: 2 }}>
                      EPS YoY: {enriched[selected.ticker].growth?.epsGrowthYoY != null
                        ? `${(enriched[selected.ticker].growth!.epsGrowthYoY! * 100) >= 0 ? "+" : ""}${(enriched[selected.ticker].growth!.epsGrowthYoY! * 100).toFixed(0)}%`
                        : "—"}
                    </div>
                  </div>
                </div>
                {/* 52-week range bar */}
                {enriched[selected.ticker].quote.yearRangePos != null && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: "1px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                      <span>52-WEEK RANGE</span>
                      <span style={{ color: "#6b8fa8" }}>{enriched[selected.ticker].quote.yearRangeLabel}</span>
                    </div>
                    <div style={{ background: "#1e3a5f", height: 6, borderRadius: 3, position: "relative", overflow: "visible" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: `${(enriched[selected.ticker].quote.yearRangePos ?? 0) * 100}%`,
                          top: -3,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: "#00c864",
                          border: "2px solid #080c10",
                          transform: "translateX(-50%)",
                          boxShadow: "0 0 8px rgba(0, 200, 100, 0.6)",
                        }}
                      />
                    </div>
                  </div>
                )}
                {/* Analyst target range bar — current price vs analyst high/low spread */}
                {enriched[selected.ticker].analyst.priceTargetHigh != null &&
                  enriched[selected.ticker].analyst.priceTargetLow != null && (() => {
                    const a = enriched[selected.ticker].analyst;
                    const price = enriched[selected.ticker].quote.price;
                    const consensus = a.priceTarget;
                    const high = a.priceTargetHigh!;
                    const low = a.priceTargetLow!;
                    // Render width in the bar for the price marker.
                    // If price is outside [low, high] we clamp but show a visual cue.
                    const rawPos = high > low ? (price - low) / (high - low) : 0.5;
                    const clampedPos = Math.max(0, Math.min(1, rawPos));
                    const aboveRange = price > high;
                    const belowRange = price < low;
                    // Consensus marker position (within [low, high])
                    const consensusPos = consensus != null && high > low
                      ? Math.max(0, Math.min(1, (consensus - low) / (high - low)))
                      : null;
                    return (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 9, color: "#4a7fa5", letterSpacing: "1px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                          <span>ANALYST TARGET RANGE</span>
                          <span style={{ color: "#6b8fa8" }}>
                            {a.targetRangeLabel}
                            {a.priceTargetCount != null && (
                              <span style={{ color: "#4a7fa5", marginLeft: 6 }}>· {a.priceTargetCount} analysts</span>
                            )}
                          </span>
                        </div>
                        <div style={{ background: "#1e3a5f", height: 6, borderRadius: 3, position: "relative", overflow: "visible" }}>
                          {/* Consensus tick (gray) */}
                          {consensusPos != null && (
                            <div
                              style={{
                                position: "absolute",
                                left: `${consensusPos * 100}%`,
                                top: -2,
                                width: 2,
                                height: 10,
                                background: "#8aacbf",
                                transform: "translateX(-50%)",
                              }}
                              title={`Consensus $${consensus?.toFixed(2)}`}
                            />
                          )}
                          {/* Current price marker — color hints upside vs downside */}
                          <div
                            style={{
                              position: "absolute",
                              left: `${clampedPos * 100}%`,
                              top: -3,
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: belowRange ? "#00c864" : aboveRange ? "#ff8c42" : "#ffd700",
                              border: "2px solid #080c10",
                              transform: "translateX(-50%)",
                              boxShadow:
                                belowRange
                                  ? "0 0 8px rgba(0, 200, 100, 0.6)"
                                  : aboveRange
                                  ? "0 0 8px rgba(255, 140, 66, 0.6)"
                                  : "0 0 8px rgba(255, 215, 0, 0.5)",
                            }}
                            title={`Current $${price.toFixed(2)} · ${
                              belowRange ? "below low target" : aboveRange ? "above high target" : "within range"
                            }`}
                          />
                        </div>
                        <div style={{ marginTop: 6, fontSize: 9, color: "#6b8fa8", display: "flex", justifyContent: "space-between" }}>
                          <span>Low: ${low.toFixed(2)}</span>
                          {consensus != null && (
                            <span style={{ color: "#8aacbf" }}>Consensus: ${consensus.toFixed(2)}</span>
                          )}
                          <span>High: ${high.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Thesis — AI-generated when available, hardcoded fallback */}
            <div
              style={{
                background: "#0d1f35",
                borderRadius: 6,
                padding: 16,
                marginBottom: 14,
                border: "1px solid #1e3a5f",
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: "2px", color: "#4a7fa5", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>BULL THESIS</span>
                {enriched[selected.ticker]?.aiAnalysis && (
                  <span style={{ color: "#7dff7d", letterSpacing: "1px", fontSize: 9 }}>
                    {enriched[selected.ticker]!.aiAnalysis!.source === "manual" ? "EDITORIAL" : "AI · 30D CACHE"}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#c8d6e5", lineHeight: 1.7 }}>
                {enriched[selected.ticker]?.aiAnalysis?.thesis || selected.thesis}
              </div>
            </div>

            {/* SNDK Analog */}
            <div
              style={{
                background: "#0a1f15",
                borderRadius: 6,
                padding: 14,
                marginBottom: 14,
                border: "1px solid #1a4a2a",
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: "2px", color: "#00c864", marginBottom: 6 }}>
                ⚡ SNDK ANALOG
              </div>
              <div style={{ fontSize: 12, color: "#7dff7d", lineHeight: 1.6 }}>
                {enriched[selected.ticker]?.aiAnalysis?.sndkAnalog || selected.sndk_similarity}
              </div>
            </div>

            {/* Risk */}
            <div
              style={{
                background: "#1f100d",
                borderRadius: 6,
                padding: 14,
                marginBottom: 14,
                border: "1px solid #4a2a1a",
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: "2px", color: "#ff8c42", marginBottom: 6 }}>
                ⚠ KEY RISKS
              </div>
              <div style={{ fontSize: 12, color: "#ffb380", lineHeight: 1.6 }}>
                {enriched[selected.ticker]?.aiAnalysis?.risk || selected.risk}
              </div>
            </div>

            {/* Upcoming */}
            <div
              style={{
                background: "#0d1117",
                borderRadius: 6,
                padding: "12px 14px",
                border: "1px solid #1e3a5f",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: "1.5px" }}>NEXT CATALYST</span>
              <span style={{ fontSize: 12, color: "#ffd700" }}>
                {(() => {
                  const e = enriched[selected.ticker]?.earnings;
                  if (e?.date) {
                    const dt = new Date(e.date);
                    const dayLabel = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    if (e.daysAway === 0) return `Earnings TODAY · ${dayLabel}`;
                    if (e.daysAway === 1) return `Earnings TOMORROW · ${dayLabel}`;
                    if (e.daysAway != null) return `Earnings in ${e.daysAway}d · ${dayLabel}`;
                    return `Earnings · ${dayLabel}`;
                  }
                  return selected.upcoming;
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FRAMEWORK TAB */}
      {activeTab === "framework" && (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ fontSize: 11, color: "#4a7fa5", letterSpacing: "3px", marginBottom: 8 }}>
            WHAT MADE SNDK A 40X
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#e8f4fd",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            The 5 Ingredients to Replicate
          </div>
          <div style={{ fontSize: 12, color: "#4a7fa5", marginBottom: 32, lineHeight: 1.6 }}>
            SNDK went from $27.89 (Apr 2025) → $1,400+ (May 2026). That&apos;s a{" "}
            <span style={{ color: "#00c864" }}>4,000%+ gain in 13 months</span>. It wasn&apos;t random.
            Each factor below was present. The more boxes a new stock checks, the higher the probability of
            a similar move.
          </div>

          {CRITERIA.map((c, i) => (
            <div
              key={c.id}
              style={{
                marginBottom: 20,
                borderLeft: "3px solid #1e3a5f",
                paddingLeft: 20,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -13,
                  top: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#0d1117",
                  border: "2px solid #00c864",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#00c864",
                }}
              >
                {i + 1}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 14 }}>{c.icon}</span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#e8f4fd",
                      marginLeft: 8,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {c.label}
                  </span>
                </div>
                {c.weight > 1 && (
                  <span
                    className="badge"
                    style={{ background: "#1a2a1a", color: "#00c864", border: "1px solid #00c864" }}
                  >
                    HIGH WEIGHT ×{c.weight}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#8aacbf", lineHeight: 1.8 }}>{c.description}</div>
              <div style={{ marginTop: 10, background: "#0d1f35", borderRadius: 4, padding: "8px 12px" }}>
                <span style={{ fontSize: 10, color: "#4a7fa5", letterSpacing: "1px" }}>SNDK EXAMPLE › </span>
                <span style={{ fontSize: 11, color: "#7dff7d" }}>
                  {c.id === "marketcap" &&
                    "Spun off at $7B market cap — ignored by large funds, fresh story"}
                  {c.id === "inflection" &&
                    "Went from -$1.6B losses to massive profitability on NAND pricing surge"}
                  {c.id === "catalyst" &&
                    "AI hyperscalers demanded NAND. Supply was structurally short. No substitute."}
                  {c.id === "sponsorship" &&
                    "Institutions had zero history with SNDK as standalone — built fresh"}
                  {c.id === "price" && "Broke out of a tight base after hitting $27 low. RS rank surged."}
                </span>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 32,
              background: "#0a1f15",
              borderRadius: 8,
              padding: 20,
              border: "1px solid #1a4a2a",
            }}
          >
            <div style={{ fontSize: 10, color: "#00c864", letterSpacing: "2px", marginBottom: 8 }}>
              IMPORTANT DISCLAIMER
            </div>
            <div style={{ fontSize: 11, color: "#7dff7d", lineHeight: 1.8 }}>
              This is a research framework, not financial advice. Every stock on this list carries
              significant risk of loss. The SNDK move was exceptional — most stocks that fit this
              framework will NOT replicate it. Always size positions appropriately, do your own due
              diligence, and consider consulting a financial advisor.
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATES TAB */}
      {activeTab === "candidates" && (
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 11, color: "#4a7fa5", letterSpacing: "2px", marginBottom: 16 }}>
            ALL CANDIDATES // COMPARISON VIEW
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "#4a7fa5",
                      fontSize: 10,
                      letterSpacing: "1.5px",
                      fontWeight: 400,
                    }}
                  >
                    TICKER
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "#4a7fa5",
                      fontSize: 10,
                      letterSpacing: "1.5px",
                      fontWeight: 400,
                    }}
                  >
                    MKT CAP
                  </th>
                  {CRITERIA.map((c) => (
                    <th
                      key={c.id}
                      style={{
                        textAlign: "center",
                        padding: "8px 12px",
                        color: "#4a7fa5",
                        fontSize: 10,
                        letterSpacing: "1px",
                        fontWeight: 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.icon} {c.label.split(" ").slice(0, 2).join(" ")}
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      color: "#4a7fa5",
                      fontSize: 10,
                      letterSpacing: "1.5px",
                      fontWeight: 400,
                    }}
                  >
                    SCORE
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((stock) => {
                  const score = getWeightedScore(stock.scores);
                  return (
                    <tr
                      key={stock.ticker}
                      className="stock-row"
                      onClick={() => {
                        setSelected(stock);
                        setActiveTab("screener");
                      }}
                      style={{ borderBottom: "1px solid #0d1f35" }}
                    >
                      <td style={{ padding: "14px 12px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#00c864",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          ${stock.ticker}
                        </div>
                        <div style={{ fontSize: 10, color: "#4a7fa5", marginTop: 2 }}>{livePrice(stock)}</div>
                      </td>
                      <td style={{ padding: "14px 12px", color: "#8aacbf" }}>{liveMcap(stock)}</td>
                      {CRITERIA.map((c) => {
                        const s = stock.scores[c.id];
                        return (
                          <td key={c.id} style={{ padding: "14px 12px", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                width: 28,
                                height: 28,
                                lineHeight: "28px",
                                borderRadius: "50%",
                                background: scoreColor(s) + "22",
                                border: `1px solid ${scoreColor(s)}66`,
                                color: scoreColor(s),
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              {s}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: "14px 12px", textAlign: "center" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: scoreColor(score / 20),
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {score}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {[
              { label: "Score 80+", desc: "High conviction, all criteria met", color: "#00ff88" },
              { label: "Score 60-79", desc: "Strong setup, minor gaps", color: "#ffd700" },
              { label: "Score <60", desc: "Speculative, higher risk", color: "#ff8c42" },
            ].map((tier) => (
              <div
                key={tier.label}
                style={{
                  background: "#0d1117",
                  border: `1px solid ${tier.color}33`,
                  borderRadius: 6,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: tier.color, marginBottom: 4 }}>
                  {tier.label}
                </div>
                <div style={{ fontSize: 11, color: "#4a7fa5" }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
