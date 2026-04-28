import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const FMP_KEY = "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";
const FMP = "https://financialmodelingprep.com/api/v3";

let cachedClient: MongoClient | null = null;

async function getMongo() {
  if (!cachedClient) {
    cachedClient = await MongoClient.connect(MONGO_URI);
  }
  return cachedClient.db("mezan");
}

const THEME_ICONS: Record<string, string> = {
  "AI & Semiconductors": "🤖",
  "Healthcare": "🏥",
  "Healthcare Momentum": "🏥",
  "Clean Energy": "⚡",
  "Fintech": "🏦",
  "Cybersecurity": "🔒",
  "Cloud & SaaS": "☁️",
  "Consumer": "🛍️",
  "Industrials": "🏭",
  "Earnings Catalysts": "📊",
  "Breakout Setups": "📈",
  "Momentum": "🔥",
  "Value": "💎",
};

export async function GET() {
  try {
    const db = await getMongo();

    // Get all research picks that have a theme
    const picks = await db
      .collection("research_picks")
      .find({ theme: { $exists: true, $ne: null, $ne: "" } })
      .sort({ addedAt: -1 })
      .toArray();

    if (picks.length === 0) {
      return NextResponse.json([]);
    }

    // Get all tickers for batch quote
    const allTickers = picks.map((p) => p.ticker);

    // Fetch live quotes
    const quotesRes = await fetch(
      `${FMP}/quote/${allTickers.join(",")}?apikey=${FMP_KEY}`,
      { next: { revalidate: 300 } }
    );
    const quotes = await quotesRes.json();
    const quoteMap = new Map(
      (quotes || []).map((q: any) => [q.symbol, q])
    );

    // Group by theme
    const themeMap = new Map<string, any[]>();
    for (const pick of picks) {
      const theme = pick.theme;
      if (!themeMap.has(theme)) {
        themeMap.set(theme, []);
      }

      const quote = quoteMap.get(pick.ticker) || ({} as any);
      themeMap.get(theme)!.push({
        ticker: pick.ticker,
        name: quote.name || pick.name || pick.ticker,
        price: quote.price || 0,
        change: Math.round((quote.changesPercentage || 0) * 100) / 100,
        marketCap: quote.marketCap || 0,
        conviction: pick.conviction || null,
      });
    }

    // Build response
    const hotlists = Array.from(themeMap.entries()).map(([theme, tickers]) => ({
      name: theme,
      icon: THEME_ICONS[theme] || "📌",
      count: tickers.length,
      avgChange: Math.round(
        (tickers.reduce((sum, t) => sum + t.change, 0) / tickers.length) * 100
      ) / 100,
      tickers,
    }));

    // Sort by ticker count descending
    hotlists.sort((a, b) => b.count - a.count);

    return NextResponse.json(hotlists);
  } catch (e) {
    console.error("Hotlists error:", e);
    return NextResponse.json([], { status: 500 });
  }
}
