import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;

async function getMongo() {
  if (!cachedClient) {
    cachedClient = await MongoClient.connect(MONGO_URI);
  }
  return cachedClient.db("mezan");
}

const fmt2 = (n: number | null | undefined) =>
  n == null || isNaN(n) ? "—" : n.toFixed(2);

function deriveSignal(price: number, ema21: number, ema50: number, ema200: number, rsi: number) {
  const above21 = ema21 > 0 && price > ema21;
  const above50 = ema50 > 0 && price > ema50;
  const above200 = ema200 > 0 && price > ema200;
  const stack = ema21 > ema50 && ema50 > ema200;

  if (above21 && above50 && stack && rsi > 45 && rsi < 75) return "BUY";
  if (!above21 && rsi < 50) return "SELL";
  return "HOLD";
}

function deriveConfidence(shortScore: number, midScore: number) {
  const total = (shortScore || 0) + (midScore || 0);
  if (total >= 10) return "HIGH";
  if (total >= 5) return "MEDIUM";
  return "LOW";
}

function deriveStop(price: number, ema21: number, ema50: number, supports: number[]) {
  // Stop: nearest EMA below price; fallback to nearest support; final fallback 5% below
  if (ema21 > 0 && ema21 < price) return ema21;
  if (ema50 > 0 && ema50 < price) return ema50;
  const lowerSupport = (supports || [])
    .filter((s) => s > 0 && s < price)
    .sort((a, b) => b - a)[0];
  if (lowerSupport) return lowerSupport;
  return price * 0.95;
}

function deriveTarget(price: number, resistances: number[]) {
  // Target: nearest resistance above price; fallback +8%
  const higher = (resistances || [])
    .filter((r) => r > 0 && r > price)
    .sort((a, b) => a - b)[0];
  if (higher) return higher;
  return price * 1.08;
}

function buildAnalysis(t: {
  ticker: string;
  price: number;
  ema21: number;
  ema50: number;
  ema200: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  adx: number;
  shortTerm: string;
  midTerm: string;
  supports: number[];
  resistances: number[];
}) {
  const parts: string[] = [];

  // Trend
  if (t.price > t.ema21 && t.price > t.ema50 && t.ema21 > t.ema50) {
    parts.push(`${t.ticker} is trending up — price is above the 21 EMA ($${fmt2(t.ema21)}) and 50 EMA ($${fmt2(t.ema50)}) with the EMAs stacked bullishly.`);
  } else if (t.price < t.ema21 && t.price < t.ema50) {
    parts.push(`${t.ticker} is trading below both the 21 EMA ($${fmt2(t.ema21)}) and 50 EMA ($${fmt2(t.ema50)}) — trend is weak or rolling over.`);
  } else {
    parts.push(`${t.ticker} is in transition — price near the 21 EMA ($${fmt2(t.ema21)}). Watch for a clean reclaim or rejection.`);
  }

  // Momentum
  if (t.rsi >= 70) {
    parts.push(`RSI at ${fmt2(t.rsi)} is overbought — extended; wait for a pullback.`);
  } else if (t.rsi <= 30) {
    parts.push(`RSI at ${fmt2(t.rsi)} is oversold — bounce potential, but trend must confirm.`);
  } else if (t.rsi >= 50) {
    parts.push(`RSI at ${fmt2(t.rsi)} sits in the bullish zone with room to run.`);
  } else {
    parts.push(`RSI at ${fmt2(t.rsi)} is below 50 — momentum is soft.`);
  }

  // MACD
  if (t.macd > t.macdSignal) {
    parts.push(`MACD is bullish (${fmt2(t.macd)} above signal).`);
  } else if (t.macd < t.macdSignal) {
    parts.push(`MACD is bearish (${fmt2(t.macd)} below signal).`);
  }

  // Trend strength
  if (t.adx > 25) {
    parts.push(`ADX at ${fmt2(t.adx)} confirms a strong trend.`);
  } else if (t.adx > 0) {
    parts.push(`ADX at ${fmt2(t.adx)} suggests a weak / choppy trend.`);
  }

  // Levels
  const support = (t.supports || []).filter((s) => s > 0 && s < t.price).sort((a, b) => b - a)[0];
  const resistance = (t.resistances || []).filter((r) => r > 0 && r > t.price).sort((a, b) => a - b)[0];
  if (support && resistance) {
    parts.push(`Key levels: support $${fmt2(support)}, resistance $${fmt2(resistance)}.`);
  }

  // Sentiment
  if (t.shortTerm && t.midTerm) {
    parts.push(`Short-term: ${t.shortTerm}. Mid-term: ${t.midTerm}.`);
  }

  return parts.join(" ");
}

export async function GET() {
  try {
    const db = await getMongo();

    // 1. Get research picks (all of them)
    const picks = await db
      .collection("research_picks")
      .find({})
      .sort({ addedAt: -1 })
      .toArray();

    if (picks.length === 0) {
      return NextResponse.json([]);
    }

    const tickers = picks.map((p) => p.ticker.toUpperCase());

    // 2. Batch fetch daily_stock_data + ticker_levels
    const [stockRows, levelsRows] = await Promise.all([
      db.collection("daily_stock_data").find({ symbol: { $in: tickers } }).toArray(),
      db.collection("ticker_levels").find({ _id: { $in: tickers } as any }).toArray(),
    ]);

    const stockMap = new Map<string, any>();
    stockRows.forEach((s: any) => stockMap.set((s.symbol || "").toUpperCase(), s));

    const levelsMap = new Map<string, any>();
    levelsRows.forEach((l: any) => levelsMap.set((l._id || "").toString().toUpperCase(), l));

    // 3. Build analyses
    const analyses = picks.map((pick: any) => {
      const ticker = pick.ticker.toUpperCase();
      const stock = stockMap.get(ticker) || {};
      const levels = levelsMap.get(ticker) || {};
      const tech = levels.technicals || {};
      const sent = levels.sentiment || {};

      const price = Number(stock.price) || 0;
      const change = Number(stock.changePercentage) || 0;
      const ema10 = Number(tech.ema10) || 0;
      const ema21 = Number(tech.ema21) || 0;
      const ema50 = Number(tech.ema50) || 0;
      const ema200 = Number(tech.ema200) || 0;
      const rsi = Number(tech.rsi) || 0;
      const macd = Number(tech.macd) || 0;
      const macdSignal = Number(tech.macdSignal) || 0;
      const adx = Number(tech.adx) || 0;
      const supports = (levels.supports || []).map((n: any) => Number(n)).filter((n: number) => n > 0);
      const resistances = (levels.resistances || []).map((n: any) => Number(n)).filter((n: number) => n > 0);

      const signal = deriveSignal(price, ema21, ema50, ema200, rsi);
      const confidence = deriveConfidence(sent.shortTermScore || 0, sent.midTermScore || 0);
      const stop = price > 0 ? deriveStop(price, ema21, ema50, supports) : 0;
      const target = price > 0 ? deriveTarget(price, resistances) : 0;
      const rrRatio = price > stop ? (target - price) / (price - stop) : 0;

      const analysis = price > 0
        ? buildAnalysis({
            ticker,
            price, ema21, ema50, ema200, rsi, macd, macdSignal, adx,
            shortTerm: sent.shortTerm || "Neutral",
            midTerm: sent.midTerm || "Neutral",
            supports, resistances,
          })
        : "Awaiting data — price and technicals not yet computed for this ticker.";

      return {
        ticker,
        name: stock.name || pick.name || ticker,
        signal,
        confidence,
        price,
        change,
        entry: fmt2(price),
        stop: fmt2(stop),
        target: fmt2(target),
        rr: rrRatio > 0 ? `1:${rrRatio.toFixed(1)}` : "—",
        ema10, ema21, ema50, ema200,
        rsi, macd, macdSignal, adx,
        supports, resistances,
        analysis,
        sector: pick.sector || null,
        conviction: pick.conviction || null,
        addedAt: pick.addedAt || null,
      };
    });

    return NextResponse.json(analyses);
  } catch (e: any) {
    console.error("AI analyses error:", e);
    return NextResponse.json({ error: e.message || "Failed to load" }, { status: 500 });
  }
}
