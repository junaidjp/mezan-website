import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Read-only path: serves the SNDK-DNA enriched dataset entirely from MongoDB.
// FMP is hit by /api/admin/research/refresh-enrichment (run once per day).
//
// Sources:
//   ticker_enrichment   ← slow-moving fundamentals/analyst/insider/earnings
//   daily_stock_data    ← live price + change% (refreshed every ~20 min)
//   ticker_levels       ← EMAs, RSI (refreshed by compute_levels job)

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5-min Next.js cache; underlying Mongo is the source of truth

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

const fmtMcap = (n: number | null | undefined): string => {
  if (!n || n <= 0) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
};

// ─── Score calculators (computed live from cached data) ──────────────────

function scoreMarketCap(mcap: number): number {
  if (!mcap || mcap <= 0) return 3;
  if (mcap < 250e6) return 4;
  if (mcap < 2.5e9) return 5;
  if (mcap < 5e9) return 4;
  if (mcap < 10e9) return 3;
  if (mcap < 50e9) return 2;
  return 1;
}

function scoreInflection(growth: any | null): number {
  if (!growth) return 3;
  const epsG = growth.epsGrowthYoY ?? 0;
  const revG = growth.revenueGrowthYoY ?? 0;
  const niG = growth.netIncomeGrowthYoY ?? 0;
  if (revG > 0.4 && (epsG > 1.0 || niG > 1.0)) return 5;
  if (revG > 0.25 && epsG > 0.5) return 4;
  if (revG > 0.10) return 3;
  if (revG > 0) return 2;
  return 1;
}

function scoreSponsorship(institutionalPct: number | null | undefined): number {
  if (institutionalPct == null) return 3;
  // institutionalPct is a fraction: 0.42 = 42% institutional ownership
  if (institutionalPct < 0.25) return 5;
  if (institutionalPct < 0.50) return 4;
  if (institutionalPct < 0.70) return 3;
  if (institutionalPct < 0.85) return 2;
  return 1;
}

function scorePriceAction(opts: {
  price: number;
  ema21?: number | null;
  ema50?: number | null;
  rsi?: number | null;
  yearHigh?: number | null;
  yearLow?: number | null;
}): number {
  const { price, ema21, ema50, rsi, yearHigh, yearLow } = opts;
  if (!price) return 3;

  let pts = 0;
  if (ema21 && ema50 && price > ema21 && ema21 > ema50) pts += 2;
  else if (ema21 && price > ema21) pts += 1;

  if (rsi != null && rsi >= 50 && rsi <= 70) pts += 1;
  else if (rsi != null && rsi > 70) pts -= 1;

  if (yearHigh && yearLow && yearHigh > yearLow) {
    const pos = (price - yearLow) / (yearHigh - yearLow);
    if (pos >= 0.4 && pos <= 0.85) pts += 2;
    else if (pos < 0.4) pts += 1;
    else pts -= 1;
  }

  return Math.max(1, Math.min(5, 3 + pts - 1));
}

// ─── Handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbolsParam = url.searchParams.get("symbols");
    if (!symbolsParam) {
      return NextResponse.json({ error: "symbols query param required" }, { status: 400 });
    }
    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return NextResponse.json({ tickers: {}, asOf: null });
    }

    const db = await getMongo();
    const [
      enrichDocs,
      dailyDocs,
      levelsDocs,
      halalDocs,
      logoDocs,
      bulkDocs,
      analysisDocs,
    ] = await Promise.all([
      db.collection("ticker_enrichment").find({ _id: { $in: symbols } as any }).toArray(),
      db.collection("daily_stock_data").find({ symbol: { $in: symbols } }).toArray(),
      db.collection("ticker_levels").find({ _id: { $in: symbols } as any }).toArray(),
      db.collection("halal_compliance").find({ ticker: { $in: symbols } }).toArray(),
      db.collection("symbolImages").find({ _id: { $in: symbols } as any }).toArray(),
      db.collection("financial_bulk").find({ ticker: { $in: symbols } }).toArray(),
      db.collection("sndk_dna_analysis").find({ _id: { $in: symbols } as any }).toArray(),
    ]);

    const enrichMap = new Map<string, any>();
    for (const d of enrichDocs) enrichMap.set(String(d._id), d);
    const dailyMap = new Map<string, any>();
    for (const d of dailyDocs) dailyMap.set((d.symbol || "").toUpperCase(), d);
    const levelsMap = new Map<string, any>();
    for (const d of levelsDocs) levelsMap.set(String(d._id), d);
    const halalMap = new Map<string, any>();
    for (const d of halalDocs) halalMap.set((d.ticker || "").toUpperCase(), d);
    const logoMap = new Map<string, any>();
    for (const d of logoDocs) logoMap.set(String(d._id).toUpperCase(), d);
    const bulkMap = new Map<string, any>();
    for (const d of bulkDocs) bulkMap.set((d.ticker || "").toUpperCase(), d);
    const analysisMap = new Map<string, any>();
    for (const d of analysisDocs) analysisMap.set(String(d._id), d);

    const tickers: Record<string, any> = {};
    let mostRecent: Date | null = null;
    let mostRecentEnrichment: Date | null = null;

    for (const ticker of symbols) {
      const e = enrichMap.get(ticker);
      const daily = dailyMap.get(ticker);
      const levels = levelsMap.get(ticker);
      const halal = halalMap.get(ticker);
      const logo = logoMap.get(ticker);
      const bulk = bulkMap.get(ticker);
      const ai = analysisMap.get(ticker);
      const tech = levels?.technicals || {};
      const sentiment = levels?.sentiment || {};

      const price = Number(daily?.price) || 0;
      const marketCap = Number(daily?.marketCap) || 0;
      const yearHigh = e?.yearHigh ?? null;
      const yearLow = e?.yearLow ?? null;

      // Use the pre-computed sentiment scores when available — they capture
      // the same signals (EMA stack, RSI, MACD, ADX, BB position) but are
      // already validated by compute_levels. Fall back to the heuristic.
      let priceScore: number;
      const sScore = sentiment.shortTermScore != null ? Number(sentiment.shortTermScore) : null;
      const mScore = sentiment.midTermScore != null ? Number(sentiment.midTermScore) : null;
      if (sScore != null && mScore != null) {
        // Sentiment scores are 0-5 each; weight short 60% / mid 40%
        priceScore = Math.max(1, Math.min(5, Math.round(sScore * 0.6 + mScore * 0.4)));
      } else {
        priceScore = scorePriceAction({
          price,
          ema21: tech.ema21 ?? null,
          ema50: tech.ema50 ?? null,
          rsi: tech.rsi ?? null,
          yearHigh,
          yearLow,
        });
      }

      const computedScores = {
        marketcap: scoreMarketCap(marketCap),
        inflection: scoreInflection(e?.growth),
        sponsorship: scoreSponsorship(e?.institutionalPct),
        price: priceScore,
      };

      const targetMean = e?.analyst?.priceTarget ?? null;
      const targetHigh = e?.analyst?.priceTargetHigh ?? null;
      const targetLow = e?.analyst?.priceTargetLow ?? null;
      const targetMedian = e?.analyst?.priceTargetMedian ?? null;
      const targetCount = e?.analyst?.priceTargetCount ?? null;
      const upsidePct = targetMean && price ? ((targetMean - price) / price) * 100 : null;
      // Position of current price within the analyst high/low spread (0..1)
      const targetRangePos =
        targetHigh != null && targetLow != null && targetHigh > targetLow && price > 0
          ? Math.max(0, Math.min(1, (price - targetLow) / (targetHigh - targetLow)))
          : null;
      const yearRangePos =
        yearHigh && yearLow && yearHigh > yearLow
          ? Math.max(0, Math.min(1, (price - yearLow) / (yearHigh - yearLow)))
          : null;

      tickers[ticker] = {
        ticker,
        // From compliance-check-api shared collections
        halalStatus: halal?.finalStatus ?? null, // "HALAL" | "QUESTIONABLE" | "NOT_HALAL" | null
        logoUrl: logo?.imageUrl ?? logo?.url ?? null,
        industry: bulk?.industry ?? e?.industry ?? null,
        companyName: e?.companyName ?? null,
        // AI-generated thesis / risk / SNDK analog (cached 30d, manual overrides preserved)
        aiAnalysis: ai
          ? {
              thesis: ai.thesis,
              risk: ai.risk,
              sndkAnalog: ai.sndkAnalog,
              source: ai.source,
              generatedAt: ai.generatedAt,
            }
          : null,
        // Sentiment scores from ticker_levels (already battle-tested)
        sentiment: {
          shortTerm: sentiment.shortTerm ?? null,
          shortTermScore: sentiment.shortTermScore ?? null,
          midTerm: sentiment.midTerm ?? null,
          midTermScore: sentiment.midTermScore ?? null,
        },
        quote: {
          price,
          priceLabel: price > 0 ? `$${price.toFixed(2)}` : "—",
          marketCap,
          marketCapLabel: fmtMcap(marketCap),
          changePercentage: daily?.changePercentage ?? null,
          dayHigh: daily?.dayHigh ?? null,
          dayLow: daily?.dayLow ?? null,
          yearHigh,
          yearLow,
          yearRangeLabel:
            yearHigh && yearLow ? `$${yearLow.toFixed(2)} — $${yearHigh.toFixed(2)}` : "—",
          yearRangePos,
        },
        technicals: {
          ema21: tech.ema21 ?? null,
          ema50: tech.ema50 ?? null,
          rsi: tech.rsi ?? null,
        },
        computedScores,
        growth: e?.growth ?? null,
        analyst: {
          priceTarget: targetMean,
          priceTargetLabel: targetMean ? `$${targetMean.toFixed(2)}` : "—",
          priceTargetHigh: targetHigh,
          priceTargetLow: targetLow,
          priceTargetMedian: targetMedian,
          priceTargetCount: targetCount,
          targetRangePos,
          targetRangeLabel:
            targetHigh != null && targetLow != null
              ? `$${targetLow.toFixed(2)} — $${targetHigh.toFixed(2)}`
              : "—",
          upsidePct,
          upsideLabel: upsidePct != null ? `${upsidePct >= 0 ? "+" : ""}${upsidePct.toFixed(1)}%` : "—",
          recommendations: e?.analyst?.recommendations ?? {
            strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0, consensus: "—",
          },
        },
        insider: e?.insider ?? { buys: 0, sells: 0, netDollar: 0, window: "90d" },
        earnings: e?.earnings ?? { date: null, daysAway: null },
        // For debugging / front-end stamping
        cacheStatus: {
          enrichmentCachedAt: e?.refreshedAt ? new Date(e.refreshedAt).toISOString() : null,
          quoteUpdatedAt: daily?.lastUpdatedAt ? new Date(daily.lastUpdatedAt).toISOString() : null,
        },
      };

      if (daily?.lastUpdatedAt) {
        const t = new Date(daily.lastUpdatedAt);
        if (!mostRecent || t > mostRecent) mostRecent = t;
      }
      if (e?.refreshedAt) {
        const t = new Date(e.refreshedAt);
        if (!mostRecentEnrichment || t > mostRecentEnrichment) mostRecentEnrichment = t;
      }
    }

    return NextResponse.json({
      tickers,
      asOf: mostRecent ? mostRecent.toISOString() : null,
      enrichmentRefreshedAt: mostRecentEnrichment ? mostRecentEnrichment.toISOString() : null,
      missingEnrichment: symbols.filter((s) => !enrichMap.has(s)),
    });
  } catch (e: any) {
    console.error("sndk-dna enriched (cached) error:", e);
    return NextResponse.json({ error: e.message || "Failed to load" }, { status: 500 });
  }
}
