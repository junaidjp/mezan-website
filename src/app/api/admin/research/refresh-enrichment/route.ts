import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { getOrGenerateSndkDnaAnalysis } from "@/lib/sndkDnaAnalysis";

// Admin endpoint: fetches FMP fundamentals/analyst/insider/earnings data for a
// set of tickers and upserts into the `ticker_enrichment` collection. Also
// triggers AI generation of bull thesis / risk / SNDK analog (cached 30 days).
// Designed to be called once per day by Cloud Scheduler — the front-end then
// reads everything from MongoDB instead of hitting FMP on every page load.

export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to 5 min for large refreshes

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const FMP_KEY = process.env.FMP_API_KEY || "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "admin-local-key-123";
const FMP_V3 = "https://financialmodelingprep.com/api/v3";
const FMP_V4 = "https://financialmodelingprep.com/api/v4";
const FMP_STABLE = "https://financialmodelingprep.com/stable";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

async function fmp(path: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${path}${sep}apikey=${FMP_KEY}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function summarizeRecommendations(recs: any[] | null) {
  const empty = { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0, consensus: "—" };
  if (!recs || !Array.isArray(recs) || recs.length === 0) return empty;
  const latest = recs[0];
  const sb = latest.analystRatingsStrongBuy ?? 0;
  const b = latest.analystRatingsbuy ?? latest.analystRatingsBuy ?? 0;
  const h = latest.analystRatingsHold ?? 0;
  const s = latest.analystRatingsSell ?? 0;
  const ss = latest.analystRatingsStrongSell ?? 0;
  const score = (sb * 5 + b * 4 + h * 3 + s * 2 + ss * 1) / Math.max(1, sb + b + h + s + ss);
  let consensus = "Hold";
  if (score >= 4.5) consensus = "Strong Buy";
  else if (score >= 3.75) consensus = "Buy";
  else if (score >= 2.5) consensus = "Hold";
  else if (score >= 1.75) consensus = "Sell";
  else consensus = "Strong Sell";
  return { strongBuy: sb, buy: b, hold: h, sell: s, strongSell: ss, consensus };
}

function summarizeInsider(trades: any[] | null) {
  if (!trades || !Array.isArray(trades) || trades.length === 0) {
    return { buys: 0, sells: 0, netDollar: 0, window: "90d" };
  }
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let buys = 0, sells = 0, netDollar = 0;
  for (const t of trades) {
    const date = new Date(t.transactionDate || t.filingDate || 0).getTime();
    if (date < ninetyDaysAgo) continue;
    const type = (t.transactionType || "").toUpperCase();
    const shares = Number(t.securitiesTransacted) || 0;
    const price = Number(t.price) || 0;
    if (type.startsWith("P-") || type.includes("PURCHASE")) {
      buys++;
      netDollar += shares * price;
    } else if (type.startsWith("S-") || type.includes("SALE")) {
      sells++;
      netDollar -= shares * price;
    }
  }
  return { buys, sells, netDollar, window: "90d" };
}

function nextEarningsFromCalendar(cal: any[] | null) {
  if (!cal || !Array.isArray(cal) || cal.length === 0) return { date: null, daysAway: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = cal
    .filter((e) => e.date && new Date(e.date).getTime() >= today.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (upcoming.length === 0) return { date: null, daysAway: null };
  const next = upcoming[0];
  const daysAway = Math.round((new Date(next.date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return { date: next.date, daysAway };
}

async function fetchInstitutionalPct(
  ticker: string,
  sharesOutstanding: number | null,
): Promise<{ pct: number | null; holderCount: number | null; sharesHeld: number | null }> {
  // Free-tier-friendly: list of institutional holders + their shares.
  const holders = await fmp(`${FMP_V3}/institutional-holder/${ticker}`);
  if (Array.isArray(holders) && holders.length > 0) {
    let totalShares = 0;
    for (const h of holders) {
      const s = Number(h.shares) || 0;
      if (s > 0) totalShares += s;
    }
    if (sharesOutstanding && sharesOutstanding > 0 && totalShares > 0) {
      return {
        pct: Math.min(1, totalShares / sharesOutstanding),
        holderCount: holders.length,
        sharesHeld: totalShares,
      };
    }
    return { pct: null, holderCount: holders.length, sharesHeld: totalShares };
  }
  return { pct: null, holderCount: null, sharesHeld: null };
}

async function fetchPriceTarget(ticker: string): Promise<{
  consensus: number | null;
  high: number | null;
  low: number | null;
  median: number | null;
  count: number | null;
}> {
  // /stable/price-target-consensus is the live endpoint (the older /api/v3/...
  // version returns [] for every ticker including AAPL).
  const consensusArr = await fmp(`${FMP_STABLE}/price-target-consensus?symbol=${ticker}`);
  if (Array.isArray(consensusArr) && consensusArr[0]?.targetConsensus != null) {
    return {
      consensus: consensusArr[0].targetConsensus,
      high: consensusArr[0].targetHigh ?? null,
      low: consensusArr[0].targetLow ?? null,
      median: consensusArr[0].targetMedian ?? null,
      count: null,
    };
  }
  // Fallback: /stable/price-target-summary gives last-year averages
  const summary = await fmp(`${FMP_STABLE}/price-target-summary?symbol=${ticker}`);
  if (Array.isArray(summary) && summary[0]) {
    const s = summary[0];
    const consensus = s.lastYearAvgPriceTarget || s.allTimeAvgPriceTarget || null;
    if (consensus) {
      return {
        consensus: Number(consensus),
        high: null,
        low: null,
        median: null,
        count: s.lastYearCount || s.allTimeCount || null,
      };
    }
  }
  return { consensus: null, high: null, low: null, median: null, count: null };
}

async function fetchProfile(ticker: string) {
  const arr = await fmp(`${FMP_V3}/profile/${ticker}`);
  if (Array.isArray(arr) && arr[0]) return arr[0];
  return null;
}

async function enrichOne(ticker: string, mongoDB: any) {
  const [
    quoteArr,
    growthArr,
    priceTarget,
    recsArr,
    insiderArr,
    earningsCal,
    profile,
  ] = await Promise.all([
    fmp(`${FMP_V3}/quote/${ticker}`),
    fmp(`${FMP_V3}/income-statement-growth/${ticker}?period=annual&limit=1`),
    fetchPriceTarget(ticker),
    fmp(`${FMP_V3}/analyst-stock-recommendations/${ticker}`),
    fmp(`${FMP_V4}/insider-trading?symbol=${ticker}&limit=100`),
    fmp(`${FMP_V3}/historical/earning_calendar/${ticker}?limit=8`),
    fetchProfile(ticker),
  ]);

  const q = Array.isArray(quoteArr) && quoteArr[0] ? quoteArr[0] : null;
  const growth = Array.isArray(growthArr) && growthArr[0] ? growthArr[0] : null;

  // Institutional ownership requires sharesOutstanding from the quote, so do
  // it sequentially after the quote arrives.
  const institutional = await fetchInstitutionalPct(ticker, q?.sharesOutstanding ?? null);

  // Generate AI thesis / risk / SNDK analog (cached 30 days, manual overrides preserved)
  const aiContext = {
    companyName: profile?.companyName ?? q?.name ?? null,
    industry: profile?.industry ?? null,
    sector: profile?.sector ?? null,
    description: profile?.description ?? null,
    marketCap: q?.marketCap ?? null,
    revenueGrowthYoY: growth?.growthRevenue ?? null,
    epsGrowthYoY: growth?.growthEPS ?? null,
  };
  // Fire AI generation but don't block the enrichment write on it
  getOrGenerateSndkDnaAnalysis(ticker, aiContext, mongoDB).catch((e) =>
    console.warn(`AI gen failed for ${ticker}:`, e.message),
  );

  return {
    _id: ticker,
    ticker,
    companyName: profile?.companyName ?? q?.name ?? null,
    industry: profile?.industry ?? null,
    description: profile?.description ?? null,
    yearHigh: q?.yearHigh ?? null,
    yearLow: q?.yearLow ?? null,
    eps: q?.eps ?? null,
    pe: q?.pe ?? null,
    institutionalPct: institutional.pct, // 0..1 fraction or null
    institutionalHolderCount: institutional.holderCount,
    institutionalSharesHeld: institutional.sharesHeld,
    growth: growth
      ? {
          revenueGrowthYoY: growth.growthRevenue ?? null,
          epsGrowthYoY: growth.growthEPS ?? null,
          netIncomeGrowthYoY: growth.growthNetIncome ?? null,
        }
      : null,
    analyst: {
      priceTarget: priceTarget.consensus,
      priceTargetHigh: priceTarget.high,
      priceTargetLow: priceTarget.low,
      priceTargetMedian: priceTarget.median,
      priceTargetCount: priceTarget.count,
      recommendations: summarizeRecommendations(recsArr),
    },
    insider: summarizeInsider(insiderArr),
    earnings: nextEarningsFromCalendar(earningsCal),
    refreshedAt: new Date(),
  };
}

export async function POST(request: Request) {
  const adminKey = request.headers.get("X-Admin-Key");
  if (adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const symbolsParam = url.searchParams.get("symbols");

    let symbols: string[];
    if (symbolsParam) {
      symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    } else {
      // Default: all tickers across the curated SNDK-DNA list (extend later as needed)
      symbols = ["SKYT", "PLAB", "CEVA", "AIP", "APLD", "IREN"];
    }

    const startMs = Date.now();
    const db = await getMongo();
    const col = db.collection("ticker_enrichment");

    // Run with limited concurrency so we stay under FMP's 50 RPS even on large
    // ticker lists. 6 calls per ticker × 8 in flight = 48 simultaneous.
    const concurrency = 8;
    const results: any[] = [];
    let cursor = 0;
    async function worker() {
      while (cursor < symbols.length) {
        const idx = cursor++;
        const ticker = symbols[idx];
        try {
          const doc = await enrichOne(ticker, db);
          await col.updateOne({ _id: ticker as any }, { $set: doc }, { upsert: true });
          results.push({ ticker, ok: true });
        } catch (e: any) {
          results.push({ ticker, ok: false, error: e.message });
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const elapsedMs = Date.now() - startMs;
    return NextResponse.json({
      processed: results.length,
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      elapsedMs,
      symbols,
      details: results,
    });
  } catch (e: any) {
    console.error("refresh-enrichment error:", e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
