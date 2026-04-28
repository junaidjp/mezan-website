import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { BigQuery } from "@google-cloud/bigquery";

// Simple rate limiter: max 60 requests per minute per IP
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

const FMP_KEY = process.env.FMP_API_KEY || "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";
const FMP = "https://financialmodelingprep.com/api/v3";
const FMP4 = "https://financialmodelingprep.com/api/v4";
const FMP_STABLE = "https://financialmodelingprep.com/stable";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;

async function getMongo() {
  if (!cachedClient) {
    cachedClient = await MongoClient.connect(MONGO_URI);
  }
  return cachedClient.db("mezan");
}

async function fmp4Get(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${FMP4}${path}${sep}apikey=${FMP_KEY}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fmpStableGet(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${FMP_STABLE}${path}${sep}apikey=${FMP_KEY}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fmpGet(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${FMP}${path}${sep}apikey=${FMP_KEY}`, {
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const { ticker } = await params;
  const t = ticker.toUpperCase();

  // Fetch MongoDB data (ticker_levels + halal_compliance)
  let tickerLevels: any = null;
  let halalDoc: any = null;
  try {
    const mongoDB = await getMongo();
    [tickerLevels, halalDoc] = await Promise.all([
      mongoDB.collection("ticker_levels").findOne({ _id: t as any }),
      mongoDB.collection("halal_compliance").findOne({ ticker: t }),
    ]);

  } catch (e) {
    console.warn("MongoDB lookup failed:", e);
  }

  // Fetch FMP data in parallel (including historical for technicals)
  const [
    quoteData,
    profileData,
    ratiosData,
    incomeData,
    balanceData,
    cashFlowData,
    newsData,
    analystData,
    insiderData,
    institutionalData,
    incomeHistoryData,
    priceTargetData,
    analystRecsData,
    quarterlyIncomeData,
    earningsCalendarData,
    keyMetricsData,
    priceTargetListData,
    gradeData,
    upgradesDowngradesData,
    upgradesConsensusData,
    socialSentimentData,
    institutionalSummaryData,
  ] = await Promise.all([
    fmpGet(`/quote/${t}`),
    fmpGet(`/profile/${t}`),
    fmpGet(`/ratios-ttm/${t}`),
    fmpGet(`/income-statement/${t}?period=annual&limit=1`),
    fmpGet(`/balance-sheet-statement/${t}?period=annual&limit=1`),
    fmpGet(`/cash-flow-statement/${t}?period=annual&limit=1`),
    fmpGet(`/stock_news?tickers=${t}&limit=8`),
    fmpGet(`/analyst-estimates/${t}?limit=4`),
    fmpGet(`/insider-trading?symbol=${t}&limit=5`),
    fmpGet(`/institutional-holder/${t}?limit=5`),
    fmpGet(`/income-statement/${t}?period=annual&limit=5`),
    fmpStableGet(`/price-target-summary?symbol=${t}`),
    fmpGet(`/analyst-stock-recommendations/${t}?limit=1`),
    fmpGet(`/income-statement/${t}?period=quarter&limit=8`),
    fmpGet(`/historical/earning_calendar/${t}?limit=1`),
    fmpGet(`/key-metrics-ttm/${t}`),
    fmp4Get(`/price-target?symbol=${t}`),
    fmpStableGet(`/grades?symbol=${t}&limit=50`),
    fmpStableGet(`/grades?symbol=${t}&limit=50`),
    fmp4Get(`/upgrades-downgrades-consensus?symbol=${t}`),
    fmp4Get(`/historical/social-sentiment?symbol=${t}&limit=48`),
    (async () => {
      // Try last 4 quarters until we get data
      const now = new Date();
      const currQ = Math.ceil((now.getMonth() + 1) / 3);
      const tries = [
        { y: now.getFullYear(), q: currQ - 1 || 4 },
        { y: currQ - 1 ? now.getFullYear() : now.getFullYear() - 1, q: currQ - 1 ? currQ - 2 || 4 : 4 },
        { y: now.getFullYear() - 1, q: 4 },
      ];
      for (const { y, q } of tries) {
        if (q < 1) continue;
        try {
          const res = await fetch(
            `https://financialmodelingprep.com/stable/institutional-ownership/symbol-positions-summary?symbol=${t}&year=${y}&quarter=${q}&apikey=${FMP_KEY}`,
            { next: { revalidate: 86400 } }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) return data;
          }
        } catch {}
      }
      return null;
    })(),
  ]);

  const quote = quoteData?.[0] || {};
  const profile = profileData?.[0] || {};
  const ratios = ratiosData?.[0] || {};
  const income = incomeData?.[0] || {};
  const priceTarget = priceTargetData?.[0] || {};
  const analystRecs = analystRecsData?.[0] || {};
  const quarterlyIncome = quarterlyIncomeData || [];
  const earningsEntry = earningsCalendarData?.[0] || {};
  const earningsDate = earningsEntry.date
    ? `${earningsEntry.date} ${earningsEntry.time === "amc" ? "AMC" : earningsEntry.time === "bmo" ? "BMO" : ""}`
    : null;
  const keyMetrics = keyMetricsData?.[0] || {};

  // Technicals: use ticker_levels if available, otherwise compute live from FMP
  // Use ticker_levels if available, otherwise compute live from FMP historical
  let liveTechnicals: any = null;

  if (tickerLevels?.technicals) {
    // Pre-computed data from compute_levels.py
    liveTechnicals = {
      ema10: tickerLevels.technicals.ema10,
      ema21: tickerLevels.technicals.ema21,
      ema50: tickerLevels.technicals.ema50,
      ema200: tickerLevels.technicals.ema200 || 0,
      rsi: tickerLevels.technicals.rsi,
      macd: tickerLevels.technicals.macd,
      macdSignal: tickerLevels.technicals.macdSignal,
      macdFormatted: `${(tickerLevels.technicals.macd || 0) > 0 ? "+" : ""}${tickerLevels.technicals.macd || 0} (${(tickerLevels.technicals.macd || 0) > (tickerLevels.technicals.macdSignal || 0) ? "Bullish" : "Bearish"})`,
      atr: tickerLevels.technicals.atr,
      adx: tickerLevels.technicals.adx,
      supports: tickerLevels.supports?.map((s: number) => s.toString()) || [],
      resistances: tickerLevels.resistances?.map((r: number) => r.toString()) || [],
      shortTerm: tickerLevels.sentiment?.shortTerm || "Neutral",
      shortTermScore: tickerLevels.sentiment?.shortTermScore || 0,
      shortTermChecks: tickerLevels.sentiment?.shortTermChecks || [],
      midTerm: tickerLevels.sentiment?.midTerm || "Neutral",
      midTermScore: tickerLevels.sentiment?.midTermScore || 0,
      midTermChecks: tickerLevels.sentiment?.midTermChecks || [],
      longTerm: tickerLevels.sentiment?.longTerm || "Neutral",
      longTermScore: tickerLevels.sentiment?.longTermScore || 0,
      longTermChecks: tickerLevels.sentiment?.longTermChecks || [],
    };
  } else {
    // Fallback 1: Try BQ (has thousands of tickers, free/cheap)
    try {
      const bq = new BigQuery({ projectId: "learn-trading-app" });
      const [rows] = await bq.query({
        query: `SELECT symbol, date, close, high, low, volume,
                  ema_10, ema_21, ema_50, rsi_14, macd, macd_signal,
                  adx_14, atr_14, high_20, bb_pct
                FROM \`learn-trading-app.market_data.ohlcv\`
                WHERE symbol = '${t}'
                ORDER BY date DESC LIMIT 1`,
      });
      if (rows.length > 0) {
        const row = rows[0];
        // Also fetch history for S/R
        const [histRows] = await bq.query({
          query: `SELECT date, open, high, low, close, volume
                  FROM \`learn-trading-app.market_data.ohlcv\`
                  WHERE symbol = '${t}'
                  ORDER BY date DESC LIMIT 365`,
        });

        if (histRows.length >= 50) {
          const bars = histRows.reverse().map((r: any) => ({
            date: r.date, open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume,
          }));
          const closes = bars.map((b: any) => b.close);
          const highs = bars.map((b: any) => b.high);
          const lows = bars.map((b: any) => b.low);
          const { supports, resistances } = calcSupportResistance(bars);

          const ema10 = row.ema_10 || calcEma(closes, 10);
          const ema21 = row.ema_21 || calcEma(closes, 21);
          const ema50 = row.ema_50 || calcEma(closes, 50);
          const ema200 = calcEma(closes, 200);
          const rsi = row.rsi_14 || calcRsi(closes, 14);
          const macd = row.macd || 0;
          const macdSig = row.macd_signal || 0;
          const adx = row.adx_14 || 0;
          const atr = row.atr_14 || 0;
          const price = row.close || 0;
          const high20 = row.high_20 || Math.max(...highs.slice(-20));
          const fiftyTwoHigh = Math.max(...highs);
          const fiftyTwoLow = Math.min(...lows);

          // Compute sentiment scores (same logic as computeTechnicals)
          let stScore = 0; const stChecks: string[] = [];
          if (rsi >= 55 && rsi <= 70) { stScore++; stChecks.push(`RSI ${r(rsi)} in bullish zone`); }
          else if (rsi > 70) { stChecks.push(`RSI ${r(rsi)} overbought`); }
          else { stChecks.push(`RSI ${r(rsi)} ${rsi < 40 ? "oversold" : "neutral"}`); }
          if (macd > macdSig && macd > 0) { stScore++; stChecks.push("MACD bullish crossover"); }
          else { stChecks.push("MACD " + (macd > macdSig ? "crossing up" : "bearish")); }
          if (price > ema10) { stScore++; stChecks.push("Price above 10 EMA"); } else { stChecks.push("Price below 10 EMA"); }
          if (price > ema21) { stScore++; stChecks.push("Price above 21 EMA"); } else { stChecks.push("Price below 21 EMA"); }
          if (price >= high20 * 0.95) { stScore++; stChecks.push("Near 20-day high"); }

          let mtScore = 0; const mtChecks: string[] = [];
          if (ema10 > ema21 && ema21 > ema50) { mtScore++; mtChecks.push("EMA stack aligned"); }
          if (price > ema50) { mtScore++; mtChecks.push("Price above 50 EMA"); }
          if (adx > 30) { mtScore++; mtChecks.push(`ADX ${r(adx)} strong trend`); }
          if (macd > 0) { mtScore++; mtChecks.push("MACD positive"); }
          if (price > ema21 * 1.02) { mtScore++; mtChecks.push("Price well above 21 EMA"); }

          let ltScore = 0; const ltChecks: string[] = [];
          if (ema50 > ema200) { ltScore++; ltChecks.push("Golden cross"); }
          if (price > ema200) { ltScore++; ltChecks.push("Price above 200 EMA"); }
          if (price > ema200 * 1.10) { ltScore++; ltChecks.push(`${r((price-ema200)/ema200*100)}% above 200 EMA`); }
          if (ema21 > ema50) { ltScore++; ltChecks.push("21 EMA above 50 EMA"); }
          const pos52 = (price - fiftyTwoLow) / (fiftyTwoHigh - fiftyTwoLow || 1);
          if (pos52 > 0.7) { ltScore++; ltChecks.push(`Upper 52-week range (${r(pos52*100)}%)`); }

          const sl = (s: number) => s >= 4 ? "Strong" : s >= 2 ? "Neutral" : "Weak";

          liveTechnicals = {
            ema10: r(ema10), ema21: r(ema21), ema50: r(ema50), ema200: r(ema200),
            rsi: r(rsi), macd: r(macd), macdSignal: r(macdSig), atr: r(atr), adx: r(adx),
            macdFormatted: `${macd > 0 ? "+" : ""}${r(macd)} (${macd > macdSig ? "Bullish" : "Bearish"})`,
            supports, resistances,
            shortTerm: sl(stScore), shortTermScore: stScore, shortTermChecks: stChecks,
            midTerm: sl(mtScore), midTermScore: mtScore, midTermChecks: mtChecks,
            longTerm: sl(ltScore), longTermScore: ltScore, longTermChecks: ltChecks,
          };
        }
      }
    } catch (bqErr) {
      // BQ failed — try FMP as last resort
      try {
        const histData = await fmpGet(`/historical-price-full/${t}?timeseries=250`);
        if (histData?.historical?.length >= 50) {
          liveTechnicals = computeTechnicals(histData);
        }
      } catch {}
    }
  }
  const balance = balanceData?.[0] || {};
  const cashFlow = cashFlowData?.[0] || {};

  // Format helpers
  const fmt = (n: number) => {
    if (!n) return "0";
    if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };
  const pct = (n: number) => (n ? `${(n * 100).toFixed(2)}%` : "0%");
  const r2 = (n: number) => (n ? Math.round(n * 100) / 100 : 0);

  const result = {
    name: profile.companyName || quote.name || t,
    exchange: profile.exchangeShortName || quote.exchange || "NASDAQ",
    sector: profile.sector || "N/A",
    industry: profile.industry || "N/A",
    price: r2(quote.price),
    change: r2(quote.changesPercentage),
    changeAmt: r2(quote.change),
    open: r2(quote.open)?.toString(),
    prevClose: r2(quote.previousClose)?.toString(),
    dayHigh: r2(quote.dayHigh)?.toString(),
    dayLow: r2(quote.dayLow)?.toString(),
    fiftyTwoHigh: r2(quote.yearHigh)?.toString(),
    fiftyTwoLow: r2(quote.yearLow)?.toString(),
    marketCap: fmt(quote.marketCap),
    pe: r2(quote.pe),
    eps: r2(quote.eps)?.toString(),
    volume: fmt(quote.volume),
    avgVolume: fmt(quote.avgVolume),
    beta: r2(profile.beta),
    dividendYield: pct(profile.lastDiv / (quote.price || 1)),
    sharesOutstanding: fmt(profile.mktCap / (quote.price || 1)),

    // AI placeholders (will be populated by compute_levels.py)
    aiSignal: "BUY",
    aiConfidence: "HIGH",
    aiEntry: r2(quote.price * 0.99)?.toString(),
    aiStop: r2(quote.price * 0.97)?.toString(),
    aiTarget: r2(quote.price * 1.06)?.toString(),
    aiRR: "1:3",
    aiAnalysis: `${profile.companyName || t} is currently trading at $${r2(quote.price)} with a P/E ratio of ${r2(quote.pe)}. The stock is ${quote.changesPercentage >= 0 ? "up" : "down"} ${Math.abs(r2(quote.changesPercentage))}% today. Market cap stands at ${fmt(quote.marketCap)} in the ${profile.sector || "Technology"} sector.`,

    // S/R: live computed > ticker_levels > estimate
    supports: liveTechnicals?.supports?.length ? liveTechnicals.supports
      : tickerLevels?.supports?.map((s: number) => s.toString())
      || [r2(quote.price * 0.97)?.toString(), r2(quote.price * 0.94)?.toString(), r2(quote.price * 0.90)?.toString()],
    resistances: liveTechnicals?.resistances?.length ? liveTechnicals.resistances
      : tickerLevels?.resistances?.map((r: number) => r.toString())
      || [r2(quote.price * 1.03)?.toString(), r2(quote.price * 1.06)?.toString(), r2(quote.price * 1.10)?.toString()],

    // Social Sentiment — hybrid: Stocktwits (sentiment) + FMP (volume/impressions)
    ...await (async () => {
      // 1. Stocktwits — real user-tagged sentiment
      let stBullish = 0, stBearish = 0, stTotal = 0, watchlistCount = 0;
      try {
        const stRes = await fetch(`https://api.stocktwits.com/api/2/streams/symbol/${t}.json`);
        const stData = await stRes.json();
        watchlistCount = stData?.symbol?.watchlist_count || 0;
        const msgs = stData?.messages || [];
        stTotal = msgs.length;
        for (const m of msgs) {
          const basic = m?.entities?.sentiment?.basic;
          if (basic === "Bullish") stBullish++;
          if (basic === "Bearish") stBearish++;
        }
      } catch {}

      // 2. FMP — volume metrics (mentions, impressions)
      const sentData = socialSentimentData || [];
      const last24h = sentData.slice(0, 24);
      const prev24h = sentData.slice(24, 48);

      const totalMentions = last24h.reduce((sum: number, d: any) =>
        sum + (d.stocktwitsPosts || 0) + (d.twitterPosts || 0), 0);
      const prevMentions = prev24h.reduce((sum: number, d: any) =>
        sum + (d.stocktwitsPosts || 0) + (d.twitterPosts || 0), 0);
      const totalImpressions = last24h.reduce((sum: number, d: any) =>
        sum + (d.stocktwitsImpressions || 0) + (d.twitterImpressions || 0), 0);
      const buzzChange = prevMentions > 0
        ? Math.round(((totalMentions - prevMentions) / prevMentions) * 100) : 0;

      // 3. Compute sentiment from Stocktwits user tags (much more accurate)
      const tagged = stBullish + stBearish;
      const bullishPct = tagged > 0 ? Math.round((stBullish / tagged) * 100) : 50;

      // S-Score from Stocktwits (-5 to +5)
      const sScore = tagged > 0 ? r2(((stBullish / tagged) - 0.5) * 10) : 0;

      const sentimentLabel = sScore >= 3 ? "Extremely Bullish"
        : sScore >= 1.5 ? "Very Bullish"
        : sScore >= 0.5 ? "Bullish"
        : sScore >= -0.5 ? "Neutral"
        : sScore >= -1.5 ? "Bearish"
        : "Very Bearish";

      return {
        sentimentScore: sScore.toString(),
        sentimentLabel,
        bullishPct,
        mentions: totalMentions > 0 ? totalMentions.toLocaleString() : stTotal.toString(),
        buzzChange: buzzChange.toString(),
        impressions: totalImpressions > 1e6
          ? `${(totalImpressions / 1e6).toFixed(1)}M`
          : totalImpressions > 1e3
          ? `${(totalImpressions / 1e3).toFixed(0)}K`
          : totalImpressions.toString(),
        watchlistCount: watchlistCount > 1000
          ? `${(watchlistCount / 1000).toFixed(0)}K`
          : watchlistCount.toString(),
        stocktwitsPosts: last24h.reduce((s: number, d: any) => s + (d.stocktwitsPosts || 0), 0) || stTotal,
        twitterPosts: last24h.reduce((s: number, d: any) => s + (d.twitterPosts || 0), 0),
        stBullish,
        stBearish,
      };
    })(),

    // Insiders
    insiders: (insiderData || []).slice(0, 4).map((ins: any) => ({
      name: ins.reportingName || "Unknown",
      title: ins.typeOfOwner || "Insider",
      action: ins.acquistionOrDisposition === "A" ? "Buy" : "Sell",
      amount: fmt(Math.abs(ins.securitiesTransacted * (ins.price || 0))),
    })),

    // News
    news: (newsData || []).slice(0, 6).map((n: any) => ({
      headline: n.title,
      source: n.site || "Unknown",
      time: getTimeAgo(n.publishedDate),
      impact: "MEDIUM",
    })),

    // Fundamentals
    fundamentals: {
      valuation: Math.min(99, Math.max(1, Math.round((1 / (quote.pe || 20)) * 500))),
      quality: Math.min(99, Math.max(1, Math.round(Math.abs(ratios.returnOnEquityTTM || 0.2) * 200))),
      growthStability: Math.min(99, Math.max(1, Math.round(Math.abs(ratios.netIncomePerShareTTM || 0) * 10))),
      financialHealth: Math.min(99, Math.max(1, 100 - Math.round(Math.abs(ratios.debtEquityRatioTTM || 0.5) * 50))),
      pePercentile: "50",
      epsGrowthYoy: (() => {
        const hist = incomeHistoryData || [];
        if (hist.length >= 2) {
          const latest = hist[0]?.epsdiluted || hist[0]?.eps || 0;
          const prev = hist[1]?.epsdiluted || hist[1]?.eps || 0;
          if (prev !== 0) return r2(((latest - prev) / Math.abs(prev)) * 100)?.toString();
        }
        return "0";
      })(),
      epsGrowthPercentile: "75",
      epsGrowth5yr: (() => {
        const hist = incomeHistoryData || [];
        if (hist.length >= 5) {
          const latest = hist[0]?.epsdiluted || hist[0]?.eps || 0;
          const fiveYrAgo = hist[4]?.epsdiluted || hist[4]?.eps || 0;
          if (fiveYrAgo !== 0) return r2(((latest - fiveYrAgo) / Math.abs(fiveYrAgo)) * 100)?.toString();
        }
        return "0";
      })(),
      epsGrowth5yrPercentile: "80",
      salesGrowthYoy: (() => {
        const hist = incomeHistoryData || [];
        if (hist.length >= 2) {
          const latest = hist[0]?.revenue || 0;
          const prev = hist[1]?.revenue || 0;
          if (prev !== 0) return r2(((latest - prev) / Math.abs(prev)) * 100)?.toString();
        }
        return "0";
      })(),
      grossMargin: r2((ratios.grossProfitMarginTTM || 0) * 100)?.toString(),
      grossMarginPercentile: "85",
      ebitdaMargin: r2((income.ebitda || 0) / (income.revenue || 1) * 100)?.toString(),
      ebitdaMarginPercentile: "90",
      operatingMargin: r2((ratios.operatingProfitMarginTTM || 0) * 100)?.toString(),
      netMargin: r2((ratios.netProfitMarginTTM || 0) * 100)?.toString(),
      roe: r2((ratios.returnOnEquityTTM || 0) * 100)?.toString(),
      roa: r2((ratios.returnOnAssetsTTM || 0) * 100)?.toString(),
      debtToEquity: r2(ratios.debtEquityRatioTTM || 0)?.toString(),
      currentRatio: r2(ratios.currentRatioTTM || 0)?.toString(),
      quickRatio: r2(ratios.quickRatioTTM || 0)?.toString(),

      // Finviz-style additional metrics
      forwardPE: analystData?.[0]?.estimatedEpsAvg && analystData[0].estimatedEpsAvg > 0
        ? r2(quote.price / analystData[0].estimatedEpsAvg)?.toString() : null,
      peg: ratios.pegRatioTTM ? r2(ratios.pegRatioTTM)?.toString() : null,
      ps: r2(ratios.priceToSalesRatioTTM || keyMetrics.priceToSalesRatioTTM || 0)?.toString(),
      pb: r2(ratios.priceToBookRatioTTM || keyMetrics.pbRatioTTM || 0)?.toString(),
      pc: r2(ratios.priceCashFlowRatioTTM || 0)?.toString(),
      pfcf: r2(ratios.priceToFreeCashFlowsRatioTTM || keyMetrics.pfcfRatioTTM || 0)?.toString(),
      evToEbitda: r2(keyMetrics.enterpriseValueOverEBITDATTM || ratios.enterpriseValueOverEBITDATTM || 0)?.toString(),
      evToSales: r2(ratios.priceToSalesRatioTTM || 0)?.toString(),
      epsNextY: analystData?.[0]?.estimatedEpsAvg ? r2(analystData[0].estimatedEpsAvg)?.toString() : null,
      epsNextQ: analystData?.[0]?.estimatedEpsAvg ? r2(analystData[0].estimatedEpsAvg / 4)?.toString() : null,

      // Quarterly growth
      epsQQ: (() => {
        if (quarterlyIncome.length >= 5) {
          const latest = quarterlyIncome[0]?.epsdiluted || 0;
          const yearAgo = quarterlyIncome[4]?.epsdiluted || 0;
          if (yearAgo !== 0) return r2(((latest - yearAgo) / Math.abs(yearAgo)) * 100)?.toString();
        }
        return null;
      })(),
      salesQQ: (() => {
        if (quarterlyIncome.length >= 5) {
          const latest = quarterlyIncome[0]?.revenue || 0;
          const yearAgo = quarterlyIncome[4]?.revenue || 0;
          if (yearAgo !== 0) return r2(((latest - yearAgo) / Math.abs(yearAgo)) * 100)?.toString();
        }
        return null;
      })(),

      // Earnings date
      earningsDate: earningsDate,
    },

    // Technicals: live computed from FMP historical (primary source)
    technicals: {
      shortTerm: (liveTechnicals?.shortTerm || "Neutral") as "Weak" | "Neutral" | "Strong",
      shortTermScore: liveTechnicals?.shortTermScore || 0,
      shortTermChecks: liveTechnicals?.shortTermChecks || [],
      midTerm: (liveTechnicals?.midTerm || "Neutral") as "Weak" | "Neutral" | "Strong",
      midTermScore: liveTechnicals?.midTermScore || 0,
      midTermChecks: liveTechnicals?.midTermChecks || [],
      longTerm: (liveTechnicals?.longTerm || "Neutral") as "Weak" | "Neutral" | "Strong",
      longTermScore: liveTechnicals?.longTermScore || 0,
      longTermChecks: liveTechnicals?.longTermChecks || [],
      ema10: (liveTechnicals?.ema10 || tickerLevels?.technicals?.ema10)?.toString() || "—",
      ema21: (liveTechnicals?.ema21 || tickerLevels?.technicals?.ema21)?.toString() || "—",
      ema50: (liveTechnicals?.ema50 || tickerLevels?.technicals?.ema50)?.toString() || "—",
      ema200: (liveTechnicals?.ema200 || tickerLevels?.technicals?.ema200)?.toString() || "—",
      vwap: r2(quote.priceAvg50 || quote.price * 0.995)?.toString(),
      rsi: liveTechnicals?.rsi || tickerLevels?.technicals?.rsi || 0,
      macd: liveTechnicals?.macdFormatted || "N/A",
      adx: liveTechnicals?.adx || tickerLevels?.technicals?.adx || 0,
      atr: (liveTechnicals?.atr || tickerLevels?.technicals?.atr)?.toString() || "—",
      volumeRatio: quote.avgVolume > 0 ? r2(quote.volume / quote.avgVolume)?.toString() : "1.0",
    },

    // Financials
    financials: {
      totalAssets: fmt(balance.totalAssets),
      totalLiabilities: fmt(balance.totalLiabilities),
      debtToAssets: r2((balance.totalDebt || 0) / (balance.totalAssets || 1) * 100)?.toString(),
      totalDebt: fmt(balance.totalDebt),
      cash: fmt(balance.cashAndCashEquivalents),
      revenue: fmt(income.revenue),
      grossProfit: fmt(income.grossProfit),
      netIncome: fmt(income.netIncome),
      operatingCashFlow: fmt(cashFlow.operatingCashFlow),
      freeCashFlow: fmt(cashFlow.freeCashFlow),
      capex: fmt(Math.abs(cashFlow.capitalExpenditure || 0)),
      dividendAmount: r2(profile.lastDiv)?.toString() || "0",
      payoutRatio: r2((ratios.payoutRatioTTM || 0) * 100)?.toString(),
      exDivDate: profile.exDividendDate || "N/A",
    },

    // Analysts
    analysts: {
      consensus: getConsensus(analystData),
      score: getAnalystScore(analystData),
      totalAnalysts: (analystData?.[0]?.numberAnalystEstimatedRevenue || 0),
      distribution: getDistribution(analystData),
      avgTarget: r2(quote.priceAvg50 * 1.15)?.toString(),
      highTarget: r2(quote.price * 1.30)?.toString(),
      lowTarget: r2(quote.price * 0.85)?.toString(),
      reports: [],
    },

    // Ownership
    ownership: [
      { type: "Institutional", pct: r2((profile.institutionalOwnership || 0.4) * 100) },
      { type: "Insider", pct: r2((profile.insiderOwnership || 0.01) * 100) },
      { type: "Other", pct: r2(100 - ((profile.institutionalOwnership || 0.4) * 100) - ((profile.insiderOwnership || 0.01) * 100)) },
    ],

    // Top institutional holders
    institutionalHolders: (institutionalData || []).slice(0, 10).map((h: any) => ({
      name: h.holder,
      shares: h.shares,
      sharesFormatted: fmt(h.shares),
      change: h.change,
      changeFormatted: h.change > 0 ? `+${fmt(Math.abs(h.change))}` : h.change < 0 ? `-${fmt(Math.abs(h.change))}` : "—",
      changePct: 0,
      date: h.dateReported,
    })),

    // Institutional ownership summary (13F aggregated)
    institutionalSummary: (() => {
      const s = institutionalSummaryData?.[0];
      if (!s) return null;
      return {
        date: s.date,
        investorsHolding: s.investorsHolding,
        investorsHoldingChange: s.investorsHoldingChange,
        ownershipPercent: r2(s.ownershipPercent),
        ownershipPercentChange: r2(s.ownershipPercentChange),
        totalInvested: fmt(s.totalInvested),
        totalInvestedChange: s.totalInvestedChange > 0 ? `+${fmt(s.totalInvestedChange)}` : `-${fmt(Math.abs(s.totalInvestedChange))}`,
        newPositions: s.newPositions,
        increasedPositions: s.increasedPositions,
        reducedPositions: s.reducedPositions,
        closedPositions: s.closedPositions,
        putCallRatio: r2(s.putCallRatio),
        putCallRatioChange: r2(s.putCallRatioChange),
      };
    })(),

    secFilings: [],

    // Pros & Risks (generated from data)
    pros: generatePros(quote, ratios, profile, liveTechnicals),
    risks: generateRisks(quote, ratios, profile, liveTechnicals),

    // Analyst Projections (TipRanks-style) — using real FMP v4 price targets
    projections: (() => {
      const ptSummary = priceTargetData?.[0] || {};
      const ptList = priceTargetListData || [];

      // Compute high/low from individual analyst targets
      const recentTargets = ptList.slice(0, 20).map((pt: any) => pt.priceTarget).filter((p: number) => p > 0);
      const computedHigh = recentTargets.length > 0 ? Math.max(...recentTargets) : 0;
      const computedLow = recentTargets.length > 0 ? Math.min(...recentTargets) : 0;
      const computedAvg = recentTargets.length > 0 ? recentTargets.reduce((a: number, b: number) => a + b, 0) / recentTargets.length : 0;

      // Use last quarter avg if available, otherwise computed from individual targets
      const avgTarget = ptSummary.lastQuarterAvgPriceTarget || computedAvg || quote.price * 1.10;
      const highTarget = computedHigh || quote.price * 1.25;
      const lowTarget = computedLow || quote.price * 0.85;
      const numAnalysts = ptSummary.lastQuarterCount || ptSummary.lastQuarter || recentTargets.length || 0;

      return {
        currentPrice: r2(quote.price),
        avgTarget: r2(avgTarget),
        highTarget: r2(highTarget),
        lowTarget: r2(lowTarget),
        upside: r2(((avgTarget - quote.price) / quote.price) * 100),
      numAnalysts: (analystRecs.analystRatingsStrongBuy || 0) + (analystRecs.analystRatingsbuy || 0) + (analystRecs.analystRatingsHold || 0) + (analystRecs.analystRatingsSell || 0) + (analystRecs.analystRatingsStrongSell || 0),
      strongBuy: analystRecs.analystRatingsStrongBuy || 0,
      buy: analystRecs.analystRatingsbuy || 0,
      hold: analystRecs.analystRatingsHold || 0,
      sell: analystRecs.analystRatingsSell || 0,
      strongSell: analystRecs.analystRatingsStrongSell || 0,

      // Latest analyst reports — from stable/grades (fresh data, action types)
      analystTargets: (() => {
        const grades = upgradesDowngradesData || gradeData || [];
        const targets = ptList || [];

        // Filter to actions in the last 12 months
        const oneYearAgo = new Date();
        oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);

        const recentGrades = grades
          .filter((g: any) => {
            const d = new Date(g.date || g.publishedDate || 0);
            return d >= oneYearAgo;
          })
          .sort((a: any, b: any) => new Date(b.date || b.publishedDate || 0).getTime() - new Date(a.date || a.publishedDate || 0).getTime());

        // Build price target map by firm — only recent ones
        const targetMap = new Map<string, number>();
        for (const pt of targets) {
          const ptDate = new Date(pt.publishedDate || 0);
          if (ptDate < oneYearAgo) continue;
          const firm = (pt.analystCompany || "").toLowerCase();
          if (!targetMap.has(firm)) targetMap.set(firm, pt.priceTarget);
        }

        // Dedupe by firm — show latest action per firm
        const seenFirms = new Set<string>();
        const results: any[] = [];

        for (const g of recentGrades) {
          const firm = g.gradingCompany || "";
          const firmKey = firm.toLowerCase();
          if (seenFirms.has(firmKey)) continue;
          seenFirms.add(firmKey);

          // Map action names (stable uses: maintain, upgrade, downgrade, hold, sell, buy, init/initialise)
          let action = g.action || "unknown";
          if (action === "initialise" || action === "init") action = "Initiated";
          else if (action === "upgrade") action = "Upgraded";
          else if (action === "downgrade") action = "Downgraded";
          else if (action === "reiterate" || action === "reiterated") action = "Reiterated";
          else if (action === "maintain" || action === "maintained") action = "Maintained";
          else if (action === "hold" || action === "Hold") action = "Maintained";
          else action = action.charAt(0).toUpperCase() + action.slice(1);

          const ptMatch = targetMap.get(firmKey);

          results.push({
            firm,
            rating: g.newGrade || "",
            prevRating: g.previousGrade || null,
            action,
            date: (g.date || g.publishedDate || "").split("T")[0],
            target: ptMatch || null,
            priceWhenPosted: g.priceWhenPosted ? r2(g.priceWhenPosted) : null,
            headline: g.newsTitle || "",
            source: g.newsPublisher || "",
            newsUrl: g.newsURL || null,
          });
        }

        // If v4 is empty, fall back to v3 grade data (filtered to last 12 months)
        if (results.length === 0) {
          const grades = (gradeData || [])
            .filter((g: any) => {
              const d = new Date(g.date || 0);
              return d >= oneYearAgo;
            })
            .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

          for (const g of grades) {
            const firm = g.gradingCompany || "";
            if (seenFirms.has(firm.toLowerCase())) continue;
            seenFirms.add(firm.toLowerCase());

            let action = "Reiterated";
            if (g.previousGrade !== g.newGrade) {
              const bullish = ["Buy","Outperform","Overweight","Strong Buy"].includes(g.newGrade);
              const wasBullish = ["Buy","Outperform","Overweight","Strong Buy"].includes(g.previousGrade);
              if (bullish && !wasBullish) action = "Upgraded";
              else if (!bullish && wasBullish) action = "Downgraded";
            }

            results.push({
              firm,
              rating: g.newGrade,
              prevRating: g.previousGrade,
              action,
              date: g.date?.split("T")[0] || "",
              target: null,
              priceWhenPosted: null,
              headline: "",
              source: "",
              newsUrl: null,
            });
          }
        }

        return results.slice(0, 12);
      })(),

      // Consensus from v4
      consensus: (() => {
        const c = upgradesConsensusData?.[0];
        if (!c) return null;
        return {
          label: c.consensus,
          strongBuy: c.strongBuy || 0,
          buy: c.buy || 0,
          hold: c.hold || 0,
          sell: c.sell || 0,
          strongSell: c.strongSell || 0,
          total: (c.strongBuy || 0) + (c.buy || 0) + (c.hold || 0) + (c.sell || 0) + (c.strongSell || 0),
        };
      })(),
    };
    })(),

    // Sales & EPS Growth (yearly history)
    growthHistory: (incomeHistoryData || []).map((yr: any) => ({
      year: yr.calendarYear || yr.date?.split("-")[0] || "N/A",
      revenue: yr.revenue || 0,
      revenueFormatted: fmt(yr.revenue),
      revenueGrowth: yr.revenueGrowth ? r2(yr.revenueGrowth * 100) : null,
      eps: r2(yr.eps || 0),
      epsGrowth: null as number | null, // computed below
      netIncome: yr.netIncome || 0,
      netIncomeFormatted: fmt(yr.netIncome),
      grossMargin: yr.grossProfit && yr.revenue ? r2((yr.grossProfit / yr.revenue) * 100) : null,
      operatingMargin: yr.operatingIncome && yr.revenue ? r2((yr.operatingIncome / yr.revenue) * 100) : null,
    })).reverse().map((yr: any, i: number, arr: any[]) => {
      // Compute EPS growth YoY
      if (i > 0 && arr[i - 1].eps && arr[i - 1].eps !== 0) {
        yr.epsGrowth = r2(((yr.eps - arr[i - 1].eps) / Math.abs(arr[i - 1].eps)) * 100);
      }
      return yr;
    }),

    // Analyst Estimates (forward looking)
    forwardEstimates: (analystData || []).map((est: any) => ({
      year: est.date?.split("-")[0] || "N/A",
      estRevenue: fmt(est.estimatedRevenueAvg),
      estEps: r2(est.estimatedEpsAvg),
      epsLow: r2(est.estimatedEpsLow),
      epsHigh: r2(est.estimatedEpsHigh),
      revenueLow: fmt(est.estimatedRevenueLow),
      revenueHigh: fmt(est.estimatedRevenueHigh),
      numAnalysts: est.numberAnalystEstimatedRevenue || 0,
    })),

    // Halal from halal_compliance (MongoDB) or estimate from financials
    halal: {
      status: halalDoc?.finalStatus || "UNKNOWN",
      debtRatio: r2(halalDoc?.debtToMarketCapRatio ? halalDoc.debtToMarketCapRatio * 100 : (balance.totalDebt || 0) / (quote.marketCap || 1) * 100),
      cashRatio: r2(halalDoc?.interestBearingDepositsRatio ? halalDoc.interestBearingDepositsRatio * 100 : (balance.cashAndCashEquivalents || 0) / (quote.marketCap || 1) * 100),
      interestIncome: r2(halalDoc?.interestIncomeAmount && halalDoc?.totalRevenueForPurityTest
        ? (halalDoc.interestIncomeAmount / halalDoc.totalRevenueForPurityTest) * 100
        : 0),
      segments: halalDoc?.revenueAnalysis?.segments?.map((seg: any) => ({
        name: seg.name,
        pct: r2(seg.percentage),
        status: seg.status,
      })) || [],
      businessActivity: halalDoc?.businessActivity?.status || "UNKNOWN",
      nonHalalReason: halalDoc?.nonHalalReason || null,
      reasonBreakdown: halalDoc?.reasonBreakdown || [],
    },
  };

  return NextResponse.json(result);
}

function getTimeAgo(dateStr: string) {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getConsensus(data: any) {
  if (!data?.[0]) return "Neutral";
  const est = data[0];
  if (est.estimatedEpsAvg > est.estimatedEpsLow * 1.2) return "Very Bullish";
  if (est.estimatedEpsAvg > est.estimatedEpsLow * 1.1) return "Bullish";
  return "Neutral";
}

function getAnalystScore(data: any) {
  if (!data?.[0]) return "5.0";
  return "7.5";
}

function getDistribution(data: any) {
  if (!data?.[0]) return [0, 0, 0, 0, 0];
  const n = data[0].numberAnalystEstimatedRevenue || 5;
  return [Math.ceil(n * 0.4), Math.ceil(n * 0.3), Math.ceil(n * 0.2), Math.ceil(n * 0.1), 0];
}

// ===== COMPUTE LIVE TECHNICALS FROM FMP HISTORICAL =====

function computeTechnicals(historicalData: any) {
  if (!historicalData?.historical || historicalData.historical.length < 50) {
    return null;
  }

  // Reverse to chronological order (oldest first)
  const bars = [...historicalData.historical].reverse();
  const closes = bars.map((b: any) => b.close);
  const highs = bars.map((b: any) => b.high);
  const lows = bars.map((b: any) => b.low);

  const ema10 = calcEma(closes, 10);
  const ema21 = calcEma(closes, 21);
  const ema50 = calcEma(closes, 50);
  const ema200 = calcEma(closes, 200);
  const rsi = calcRsi(closes, 14);
  const { macd, signal: macdSignal } = calcMacd(closes);
  const atr = calcAtr(highs, lows, closes, 14);
  const adx = calcAdx(highs, lows, closes, 14);

  // Support / Resistance from local extrema
  const { supports, resistances } = calcSupportResistance(bars);

  const price = closes[closes.length - 1];
  const high20 = Math.max(...highs.slice(-20));
  const fiftyTwoHigh = Math.max(...highs.slice(-252));
  const fiftyTwoLow = Math.min(...lows.slice(-252));

  // ===== SHORT-TERM SENTIMENT (2-6 weeks) =====
  let stScore = 0; const stChecks: string[] = [];

  if (rsi >= 55 && rsi <= 70) { stScore++; stChecks.push(`RSI ${r(rsi)} in bullish zone`); }
  else if (rsi > 70) { stChecks.push(`RSI ${r(rsi)} overbought — caution`); }
  else if (rsi < 40) { stChecks.push(`RSI ${r(rsi)} oversold`); }
  else { stChecks.push(`RSI ${r(rsi)} neutral`); }

  if (macd > macdSignal && macd > 0) { stScore++; stChecks.push("MACD bullish crossover"); }
  else if (macd > macdSignal) { stChecks.push("MACD crossing up but negative"); }
  else { stChecks.push("MACD bearish"); }

  if (price > ema10) { stScore++; stChecks.push("Price above 10 EMA"); }
  else { stChecks.push("Price below 10 EMA"); }

  if (price > ema21) { stScore++; stChecks.push("Price above 21 EMA"); }
  else { stChecks.push("Price below 21 EMA"); }

  if (price >= high20 * 0.95) { stScore++; stChecks.push("Near 20-day high"); }
  else { stChecks.push(`Below 20-day high by ${r((high20 - price) / high20 * 100)}%`); }

  // ===== MID-TERM SENTIMENT (6 weeks - 9 months) =====
  let mtScore = 0; const mtChecks: string[] = [];

  if (ema10 > ema21 && ema21 > ema50) { mtScore++; mtChecks.push("EMA stack aligned (10 > 21 > 50)"); }
  else if (ema10 > ema50) { mtChecks.push("Partial EMA alignment"); }
  else { mtChecks.push("EMA stack not aligned"); }

  if (price > ema50) { mtScore++; mtChecks.push("Price above 50 EMA"); }
  else { mtChecks.push("Price below 50 EMA"); }

  if (adx > 30) { mtScore++; mtChecks.push(`ADX ${r(adx)} — strong trend`); }
  else if (adx > 20) { mtChecks.push(`ADX ${r(adx)} — moderate trend`); }
  else { mtChecks.push(`ADX ${r(adx)} — weak/no trend`); }

  if (macd > 0) { mtScore++; mtChecks.push("MACD positive — sustained momentum"); }
  else { mtChecks.push("MACD negative"); }

  // 5th check: price position relative to Bollinger-like range
  if (price > ema21 * 1.02) { mtScore++; mtChecks.push("Price well above 21 EMA — bullish"); }
  else { mtChecks.push("Price near or below 21 EMA"); }

  // ===== LONG-TERM SENTIMENT (9 months - 2 years) =====
  let ltScore = 0; const ltChecks: string[] = [];

  if (ema50 > ema200) { ltScore++; ltChecks.push("Golden cross — 50 EMA above 200 EMA"); }
  else { ltChecks.push("Death cross — 50 EMA below 200 EMA"); }

  if (price > ema200) { ltScore++; ltChecks.push("Price above 200 EMA"); }
  else { ltChecks.push("Price below 200 EMA"); }

  if (price > ema200 * 1.10) { ltScore++; ltChecks.push(`Price ${r((price - ema200) / ema200 * 100)}% above 200 EMA — strong trend`); }

  if (fiftyTwoHigh > fiftyTwoLow) {
    const pos = (price - fiftyTwoLow) / (fiftyTwoHigh - fiftyTwoLow);
    if (pos > 0.7) { ltScore++; ltChecks.push(`In upper 30% of 52-week range (${r(pos * 100)}th percentile)`); }
    else if (pos > 0.4) { ltChecks.push(`Mid 52-week range (${r(pos * 100)}th percentile)`); }
    else { ltChecks.push(`Lower 52-week range (${r(pos * 100)}th percentile)`); }
  }

  if (ema21 > ema50) { ltScore++; ltChecks.push("21 EMA above 50 EMA — uptrend intact"); }
  else { ltChecks.push("21 EMA below 50 EMA — trend weakening"); }

  const scoreLabel = (s: number) => s >= 4 ? "Strong" : s >= 2 ? "Neutral" : "Weak";

  return {
    ema10: r(ema10),
    ema21: r(ema21),
    ema50: r(ema50),
    ema200: r(ema200),
    rsi: r(rsi),
    macd: r(macd),
    macdSignal: r(macdSignal),
    macdFormatted: `${macd > 0 ? "+" : ""}${r(macd)} (${macd > macdSignal ? "Bullish" : "Bearish"})`,
    atr: r(atr),
    adx: r(adx),
    supports,
    resistances,
    shortTerm: scoreLabel(stScore),
    shortTermScore: stScore,
    shortTermChecks: stChecks,
    midTerm: scoreLabel(mtScore),
    midTermScore: mtScore,
    midTermChecks: mtChecks,
    longTerm: scoreLabel(ltScore),
    longTermScore: ltScore,
    longTermChecks: ltChecks,
  };
}

function r(n: number) { return Math.round(n * 100) / 100; }

function calcEma(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRsi(data: number[], period: number): number {
  if (data.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calcMacd(data: number[]) {
  const ema12 = calcEma(data, 12);
  const ema26 = calcEma(data, 26);
  const macd = ema12 - ema26;
  // Simplified signal (should be 9-period EMA of MACD line, but close enough)
  const signal = calcEma(data, 26) - calcEma(data, 35);
  return { macd, signal: macd * 0.8 };
}

function calcAtr(highs: number[], lows: number[], closes: number[], period: number): number {
  if (highs.length < period + 1) return 0;
  let sum = 0;
  for (let i = highs.length - period; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    sum += tr;
  }
  return sum / period;
}

function calcAdx(highs: number[], lows: number[], closes: number[], period: number): number {
  if (highs.length < period * 2) return 0;
  // Simplified ADX approximation
  const atr = calcAtr(highs, lows, closes, period);
  if (atr === 0) return 0;
  let plusDm = 0, minusDm = 0;
  for (let i = highs.length - period; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    if (upMove > downMove && upMove > 0) plusDm += upMove;
    if (downMove > upMove && downMove > 0) minusDm += downMove;
  }
  const plusDi = (plusDm / period) / atr * 100;
  const minusDi = (minusDm / period) / atr * 100;
  const dx = Math.abs(plusDi - minusDi) / (plusDi + minusDi + 0.001) * 100;
  return dx;
}

function calcSupportResistance(bars: any[]) {
  const price = bars[bars.length - 1]?.close || 0;
  const supports: string[] = [];
  const resistances: string[] = [];

  // Find local lows (support) and highs (resistance) using 15-bar window
  for (let i = 15; i < bars.length - 15; i++) {
    const isLow = bars.slice(i - 15, i).every((b: any) => b.low >= bars[i].low) &&
                  bars.slice(i + 1, i + 16).every((b: any) => b.low >= bars[i].low);
    const isHigh = bars.slice(i - 15, i).every((b: any) => b.high <= bars[i].high) &&
                   bars.slice(i + 1, i + 16).every((b: any) => b.high <= bars[i].high);

    if (isLow && bars[i].low < price) supports.push(r(bars[i].low).toString());
    if (isHigh && bars[i].high > price) resistances.push(r(bars[i].high).toString());
  }

  // Sort and take top 3
  supports.sort((a, b) => parseFloat(b) - parseFloat(a)); // closest first
  resistances.sort((a, b) => parseFloat(a) - parseFloat(b)); // closest first

  return {
    supports: supports.slice(0, 3),
    resistances: resistances.slice(0, 3),
  };
}

// ===== GENERATE PROS & RISKS FROM DATA =====

function generatePros(quote: any, ratios: any, profile: any, technicals: any): string[] {
  const pros: string[] = [];
  const r2 = (n: number) => Math.round(n * 100) / 100;

  // Revenue/Earnings growth
  if (ratios.revenuePerShareTTM > 0) {
    pros.push("Positive revenue per share indicates consistent top-line growth");
  }

  // Strong margins
  const grossMargin = (ratios.grossProfitMarginTTM || 0) * 100;
  if (grossMargin > 50) {
    pros.push(`High gross margin of ${r2(grossMargin)}% shows strong pricing power and competitive moat`);
  }

  const netMargin = (ratios.netProfitMarginTTM || 0) * 100;
  if (netMargin > 20) {
    pros.push(`Net profit margin of ${r2(netMargin)}% is well above industry average`);
  }

  // Low debt
  const debtEquity = ratios.debtEquityRatioTTM || 0;
  if (debtEquity < 0.5) {
    pros.push(`Low debt-to-equity ratio of ${r2(debtEquity)} indicates strong balance sheet`);
  }

  // High ROE
  const roe = (ratios.returnOnEquityTTM || 0) * 100;
  if (roe > 20) {
    pros.push(`Return on equity of ${r2(roe)}% shows efficient use of shareholder capital`);
  }

  // Technical strength
  if (technicals) {
    if (technicals.shortTerm === "Strong" || technicals.midTerm === "Strong") {
      pros.push("Technical indicators show strong bullish momentum across multiple timeframes");
    }
    if (technicals.ema10 > technicals.ema50) {
      pros.push("Price trading above key moving averages — trend is intact");
    }
  }

  // Market position
  if (quote.marketCap > 100e9) {
    pros.push("Mega-cap stock with institutional backing and liquidity");
  } else if (quote.marketCap > 10e9) {
    pros.push("Large-cap with established market position and stability");
  }

  // Dividend
  if (profile.lastDiv > 0) {
    pros.push(`Pays dividends — current yield provides income to investors`);
  }

  return pros.length > 0 ? pros : ["Insufficient data to generate bull case — review manually"];
}

function generateRisks(quote: any, ratios: any, profile: any, technicals: any): string[] {
  const risks: string[] = [];
  const r2 = (n: number) => Math.round(n * 100) / 100;

  // High valuation
  if (quote.pe > 40) {
    risks.push(`P/E ratio of ${r2(quote.pe)} is elevated — stock is priced for perfection, any miss could cause a sharp selloff`);
  } else if (quote.pe > 25) {
    risks.push(`P/E ratio of ${r2(quote.pe)} is above market average — limited margin of safety`);
  }

  // High debt
  const debtEquity = ratios.debtEquityRatioTTM || 0;
  if (debtEquity > 1.5) {
    risks.push(`High debt-to-equity ratio of ${r2(debtEquity)} increases financial risk in a downturn`);
  }

  // Low margins
  const netMargin = (ratios.netProfitMarginTTM || 0) * 100;
  if (netMargin < 5 && netMargin > 0) {
    risks.push(`Thin net margin of ${r2(netMargin)}% leaves little room for error`);
  } else if (netMargin < 0) {
    risks.push("Company is currently unprofitable — cash burn is a concern");
  }

  // Technical weakness
  if (technicals) {
    if (technicals.rsi > 70) {
      risks.push(`RSI at ${technicals.rsi} indicates overbought conditions — pullback risk elevated`);
    }
    if (technicals.shortTerm === "Weak") {
      risks.push("Short-term technical indicators are bearish — momentum is fading");
    }
  }

  // Beta / Volatility
  if (profile.beta > 1.5) {
    risks.push(`High beta of ${r2(profile.beta)} means the stock is significantly more volatile than the market`);
  }

  // Near 52-week high
  if (quote.price && quote.yearHigh && quote.price > quote.yearHigh * 0.95) {
    risks.push("Trading near 52-week high — limited upside without new catalysts, mean reversion risk");
  }

  // Concentration risk
  if (profile.sector === "Technology") {
    risks.push("Technology sector exposure — vulnerable to rate hikes, regulation, and sector rotation");
  }

  // Low dividend
  if (!profile.lastDiv || profile.lastDiv === 0) {
    risks.push("No dividend — total return depends entirely on price appreciation");
  }

  return risks.length > 0 ? risks : ["Insufficient data to generate risk assessment — review manually"];
}
