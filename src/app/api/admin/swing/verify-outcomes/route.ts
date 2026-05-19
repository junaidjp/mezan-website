import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { BigQuery } from "@google-cloud/bigquery";

// Verifies every swingTradeIdea outcome against actual BigQuery OHLCV.
// Walks each alert chronologically from postedAt forward. Whichever level
// (stop low or target high) is crossed first in time is the truth.
//
// Writes results to NEW fields so the original tradeStatus / exitDate are
// preserved as an audit trail:
//   verifiedStatus      TARGET_HIT | STOP_HIT | STOP_HIT_AMBIGUOUS | ACTIVE | EXPIRED | NO_DATA
//   verifiedExitDate    ISO date the level was crossed (null if ACTIVE / NO_DATA)
//   verifiedExitPrice   the level that was crossed (stop or target)
//   verifiedHoldDays    trading days from postedAt to exit (or to today if ACTIVE)
//   verifiedPerformancePercent  (exitPrice - entryPrice) / entryPrice * 100
//   verifiedAt          when this verification ran
//
// Call:
//   curl -X POST '<host>/api/admin/swing/verify-outcomes' \
//     -H 'X-Admin-Key: ...'
//   curl -X POST '<host>/api/admin/swing/verify-outcomes?ticker=SNDK&dryRun=1' \
//     -H 'X-Admin-Key: ...'

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "admin-local-key-123";
const BQ_PROJECT = "learn-trading-app";
const BQ_TABLE = "learn-trading-app.market_data.ohlcv";
const EXPIRY_TRADING_DAYS = 60;

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

type Bar = { date: string; high: number; low: number; close: number };
type Verified = {
  verifiedStatus: "TARGET_HIT" | "STOP_HIT" | "STOP_HIT_AMBIGUOUS" | "ACTIVE" | "EXPIRED" | "NO_DATA";
  verifiedExitDate: string | null;
  verifiedExitPrice: number | null;
  verifiedHoldDays: number;
  verifiedPerformancePercent: number | null;
  verifiedAt: Date;
};

function isoDate(d: any): string {
  if (typeof d === "string") return d.slice(0, 10);
  if (d?.value) return String(d.value).slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

function classify(
  bars: Bar[],
  entry: number,
  stop: number,
  target: number,
): Verified {
  const now = new Date();
  if (!bars || bars.length === 0) {
    return {
      verifiedStatus: "NO_DATA",
      verifiedExitDate: null,
      verifiedExitPrice: null,
      verifiedHoldDays: 0,
      verifiedPerformancePercent: null,
      verifiedAt: now,
    };
  }

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const stopTouched = b.low <= stop;
    const targetTouched = b.high >= target;

    if (stopTouched && targetTouched) {
      // Same-day ambiguity. We can't know intraday order from daily OHLC.
      // Be conservative: book as stop hit (this is the SNDK case the user
      // flagged — "looked like target but stop was hit too").
      return {
        verifiedStatus: "STOP_HIT_AMBIGUOUS",
        verifiedExitDate: b.date,
        verifiedExitPrice: stop,
        verifiedHoldDays: i + 1,
        verifiedPerformancePercent: ((stop - entry) / entry) * 100,
        verifiedAt: now,
      };
    }
    if (stopTouched) {
      return {
        verifiedStatus: "STOP_HIT",
        verifiedExitDate: b.date,
        verifiedExitPrice: stop,
        verifiedHoldDays: i + 1,
        verifiedPerformancePercent: ((stop - entry) / entry) * 100,
        verifiedAt: now,
      };
    }
    if (targetTouched) {
      return {
        verifiedStatus: "TARGET_HIT",
        verifiedExitDate: b.date,
        verifiedExitPrice: target,
        verifiedHoldDays: i + 1,
        verifiedPerformancePercent: ((target - entry) / entry) * 100,
        verifiedAt: now,
      };
    }
  }

  // Neither hit. If we have ≥ EXPIRY_TRADING_DAYS of data, call it expired.
  // Otherwise still active.
  const last = bars[bars.length - 1];
  const expired = bars.length >= EXPIRY_TRADING_DAYS;
  return {
    verifiedStatus: expired ? "EXPIRED" : "ACTIVE",
    verifiedExitDate: expired ? last.date : null,
    verifiedExitPrice: expired ? last.close : null,
    verifiedHoldDays: bars.length,
    verifiedPerformancePercent: ((last.close - entry) / entry) * 100,
    verifiedAt: now,
  };
}

export async function POST(request: Request) {
  if (request.headers.get("X-Admin-Key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const tickerFilter = url.searchParams.get("ticker")?.toUpperCase();
  const limit = Number(url.searchParams.get("limit")) || 0;
  const dryRun = url.searchParams.get("dryRun") === "1";

  const startMs = Date.now();
  const db = await getMongo();
  const col = db.collection("swingTradeIdea");

  const query: any = {};
  if (tickerFilter) query.ticker = tickerFilter;
  // Skip docs missing the basics
  query.entryPrice = { $exists: true, $ne: null };
  query.stopLossPrice = { $exists: true, $ne: null };
  query.targetPrice = { $exists: true, $ne: null };
  query.postedAt = { $exists: true, $ne: null };

  let cursor = col.find(query).sort({ postedAt: 1 });
  if (limit > 0) cursor = cursor.limit(limit);
  const alerts = await cursor.toArray();

  if (alerts.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, note: "no alerts matched" });
  }

  // Compute earliest postedAt and unique tickers so we can pull OHLCV in one BQ query
  const tickers = Array.from(new Set(alerts.map((a) => String(a.ticker).toUpperCase())));
  const earliest = alerts.reduce((min: Date, a) => {
    const d = new Date(a.postedAt);
    return d < min ? d : min;
  }, new Date(alerts[0].postedAt));
  // Pull a day earlier just in case of TZ slippage
  const fromDate = new Date(earliest);
  fromDate.setUTCDate(fromDate.getUTCDate() - 1);
  const fromStr = fromDate.toISOString().slice(0, 10);

  // Single BQ pull for every ticker, every bar from earliest postedAt → today
  const bq = new BigQuery({ projectId: BQ_PROJECT });
  const tickersList = tickers.map((t) => `'${t.replace(/'/g, "")}'`).join(",");
  const [rows] = await bq.query({
    query: `
      SELECT symbol, date, high, low, close
      FROM \`${BQ_TABLE}\`
      WHERE symbol IN (${tickersList})
        AND date >= DATE('${fromStr}')
        AND high > 0 AND low > 0 AND close > 0
      ORDER BY symbol, date ASC
    `,
  });

  // Index bars by symbol
  const barsBySymbol = new Map<string, Bar[]>();
  for (const r of rows as any[]) {
    const sym = String(r.symbol).toUpperCase();
    if (!barsBySymbol.has(sym)) barsBySymbol.set(sym, []);
    barsBySymbol.get(sym)!.push({
      date: isoDate(r.date),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
    });
  }

  let processed = 0;
  let updated = 0;
  const breakdown: Record<string, number> = {};
  const sample: any[] = [];

  for (const alert of alerts) {
    processed++;
    const sym = String(alert.ticker).toUpperCase();
    const entry = Number(alert.entryPrice);
    const stop = Number(alert.stopLossPrice);
    const target = Number(alert.targetPrice);
    const postedAt = isoDate(alert.postedAt);

    const allBars = barsBySymbol.get(sym) || [];
    // Strict: only bars AFTER postedAt. A follower can't catch the same-day
    // move that triggered the alert; this gives realistic, defensible numbers.
    const relevant = allBars.filter((b) => b.date > postedAt);

    const v = classify(relevant, entry, stop, target);
    breakdown[v.verifiedStatus] = (breakdown[v.verifiedStatus] || 0) + 1;

    if (sample.length < 10 || sym === tickerFilter) {
      sample.push({
        _id: alert._id,
        ticker: sym,
        postedAt,
        entry,
        stop,
        target,
        originalStatus: alert.tradeStatus ?? null,
        verifiedStatus: v.verifiedStatus,
        verifiedExitDate: v.verifiedExitDate,
        verifiedHoldDays: v.verifiedHoldDays,
        verifiedPerformancePercent:
          v.verifiedPerformancePercent != null
            ? Number(v.verifiedPerformancePercent.toFixed(2))
            : null,
      });
    }

    if (!dryRun) {
      await col.updateOne({ _id: alert._id }, { $set: v as any });
      updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    elapsedMs: Date.now() - startMs,
    processed,
    updated,
    breakdown,
    sample,
    note: dryRun
      ? "Dry run — no Mongo writes. Drop ?dryRun=1 to persist."
      : "Wrote verified* fields to each alert. Originals preserved.",
  });
}
