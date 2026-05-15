import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// 15-minute server-side cache. The underlying daily_stock_data collection is
// refreshed every 20 minutes by market-cap-batch, so a 15-min revalidate window
// keeps the page within one batch cycle of fresh data.
export const revalidate = 900;

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
      return NextResponse.json({ quotes: {}, asOf: null });
    }

    const db = await getMongo();
    const docs = await db
      .collection("daily_stock_data")
      .find({ symbol: { $in: symbols } })
      .toArray();

    type Quote = {
      symbol: string;
      price: number;
      priceLabel: string;
      marketCap: number;
      marketCapLabel: string;
      changePercentage: number;
      dayHigh: number | null;
      dayLow: number | null;
      lastUpdatedAt: string | null;
    };

    const quotes: Record<string, Quote> = {};
    let mostRecent: Date | null = null;

    for (const d of docs) {
      const sym = (d.symbol || "").toUpperCase();
      if (!sym) continue;
      const price = Number(d.price) || 0;
      const marketCap = Number(d.marketCap) || 0;
      quotes[sym] = {
        symbol: sym,
        price,
        priceLabel: price > 0 ? `$${price.toFixed(2)}` : "—",
        marketCap,
        marketCapLabel: fmtMcap(marketCap),
        changePercentage: Number(d.changePercentage) || 0,
        dayHigh: d.dayHigh != null ? Number(d.dayHigh) : null,
        dayLow: d.dayLow != null ? Number(d.dayLow) : null,
        lastUpdatedAt: d.lastUpdatedAt ? new Date(d.lastUpdatedAt).toISOString() : null,
      };
      if (d.lastUpdatedAt) {
        const t = new Date(d.lastUpdatedAt);
        if (!mostRecent || t > mostRecent) mostRecent = t;
      }
    }

    return NextResponse.json({
      quotes,
      asOf: mostRecent ? mostRecent.toISOString() : null,
      requested: symbols,
      found: Object.keys(quotes),
      missing: symbols.filter((s) => !quotes[s]),
    });
  } catch (e: any) {
    console.error("sndk-dna quotes error:", e);
    return NextResponse.json({ error: e.message || "Failed to load quotes" }, { status: 500 });
  }
}
