import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Powers the Hot Lists tab on /research. Pulls tickers from `research_picks`
// (grouped by their `theme` field), then enriches each row with the same
// Mongo joins the Themes screener uses (price, mcap, halal, trend, logo, etc).
// Cached 5 min by Next.

export const dynamic = "force-dynamic";
export const revalidate = 300;

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

const THEME_ICONS: Record<string, string> = {
  "AI & Semiconductors": "🤖",
  "Technology": "📌",
  "Cloud & Software": "☁️",
  "Cloud & SaaS": "☁️",
  "Financials": "🏦",
  "Fintech": "🏦",
  "Healthcare": "🏥",
  "Healthcare Momentum": "🏥",
  "Biotech & Pharma": "💊",
  "Clean Energy": "⚡",
  "Energy": "⛽",
  "Cybersecurity": "🔒",
  "Consumer": "🛍️",
  "Industrials": "🏭",
  "Materials & Mining": "⛏️",
  "Aerospace & Defense": "🚀",
  "EV & Auto": "🚗",
  "Internet & E-Commerce": "🌐",
  "Earnings Catalysts": "📊",
  "Breakout Setups": "📈",
  "Momentum": "🔥",
  "Value": "💎",
  "Drones": "🚁",
  "Batteries": "🔋",
  "Crypto": "₿",
  "SaaS": "☁️",
  "Infrastructure": "🏗️",
};

const fmtMcap = (n: number | null | undefined): string => {
  if (!n || n <= 0) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
};

const fmtVol = (n: number | null | undefined): string => {
  if (!n || n <= 0) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
};

export async function GET() {
  try {
    const db = await getMongo();

    const picks = await db
      .collection("research_picks")
      .find({ theme: { $exists: true, $nin: [null, ""] } })
      .sort({ addedAt: -1 })
      .toArray();

    if (picks.length === 0) {
      return NextResponse.json({ themes: [], rowsByTheme: {} });
    }

    const allTickersSet = new Set<string>();
    for (const p of picks) allTickersSet.add(String(p.ticker).toUpperCase());
    const allTickers = Array.from(allTickersSet);

    const [dailyDocs, enrichDocs, levelsDocs, halalDocs, logoDocs, bulkDocs] = await Promise.all([
      db.collection("daily_stock_data").find({ symbol: { $in: allTickers } }).toArray(),
      db.collection("ticker_enrichment").find({ _id: { $in: allTickers } as any }).toArray(),
      db.collection("ticker_levels").find({ _id: { $in: allTickers } as any }).toArray(),
      db.collection("halal_compliance").find({ ticker: { $in: allTickers } }).toArray(),
      db.collection("symbolImages").find({ _id: { $in: allTickers } as any }).toArray(),
      db.collection("financial_bulk").find({ ticker: { $in: allTickers } }).toArray(),
    ]);

    const dailyMap = new Map<string, any>();
    for (const d of dailyDocs) dailyMap.set((d.symbol || "").toUpperCase(), d);
    const enrichMap = new Map<string, any>();
    for (const d of enrichDocs) enrichMap.set(String(d._id).toUpperCase(), d);
    const levelsMap = new Map<string, any>();
    for (const d of levelsDocs) levelsMap.set(String(d._id).toUpperCase(), d);
    const halalMap = new Map<string, any>();
    for (const d of halalDocs) halalMap.set((d.ticker || "").toUpperCase(), d);
    const logoMap = new Map<string, any>();
    for (const d of logoDocs) logoMap.set(String(d._id).toUpperCase(), d);
    const bulkMap = new Map<string, any>();
    for (const d of bulkDocs) bulkMap.set((d.ticker || "").toUpperCase(), d);

    const buildRow = (ticker: string, pickName: string | null) => {
      const d = dailyMap.get(ticker) ?? {};
      const e = enrichMap.get(ticker) ?? {};
      const l = levelsMap.get(ticker) ?? {};
      const h = halalMap.get(ticker) ?? {};
      const logo = logoMap.get(ticker) ?? {};
      const bulk = bulkMap.get(ticker) ?? {};

      const sentiment = l?.sentiment?.shortTerm || null;
      let trend: "Bullish" | "Bearish" | "Neutral" = "Neutral";
      if (sentiment === "Strong") trend = "Bullish";
      else if (sentiment === "Weak") trend = "Bearish";

      const price = Number(d.price) || 0;
      const changePct = d.changePercentage != null ? Number(d.changePercentage) : null;
      const marketCap = Number(d.marketCap) || 0;
      const volume = Number(d.volume) || 0;
      const revGrowth = e?.growth?.revenueGrowthYoY ?? null;

      return {
        ticker,
        companyName: e?.companyName ?? d?.name ?? pickName ?? null,
        industry: bulk?.industry ?? null,
        sector: bulk?.sector ?? null,
        price,
        priceLabel: price > 0 ? `$${price.toFixed(2)}` : "—",
        changePercentage: changePct,
        marketCap,
        marketCapLabel: fmtMcap(marketCap),
        volume,
        volumeLabel: fmtVol(volume),
        revenueGrowthYoY: revGrowth,
        trend,
        halalStatus: h?.finalStatus ?? null,
        logoUrl: logo?.imageUrl ?? logo?.url ?? null,
      };
    };

    // Group rows by theme
    const rowsByTheme: Record<string, any[]> = {};
    const seenPerTheme: Record<string, Set<string>> = {};
    for (const p of picks) {
      const theme = String(p.theme);
      const ticker = String(p.ticker).toUpperCase();
      if (!rowsByTheme[theme]) {
        rowsByTheme[theme] = [];
        seenPerTheme[theme] = new Set();
      }
      if (seenPerTheme[theme].has(ticker)) continue;
      seenPerTheme[theme].add(ticker);
      rowsByTheme[theme].push(buildRow(ticker, p.name ?? null));
    }

    const themes = Object.keys(rowsByTheme).map((name) => {
      const rows = rowsByTheme[name];
      const changes = rows.map((r) => r.changePercentage).filter((c) => typeof c === "number") as number[];
      const avgChange = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
      return {
        id: name,
        label: name,
        icon: THEME_ICONS[name] || "📌",
        count: rows.length,
        avgChange: Math.round(avgChange * 100) / 100,
      };
    }).sort((a, b) => b.count - a.count);

    return NextResponse.json({ themes, rowsByTheme });
  } catch (e: any) {
    console.error("hotlists error:", e);
    return NextResponse.json({ error: e.message, themes: [], rowsByTheme: {} }, { status: 500 });
  }
}
