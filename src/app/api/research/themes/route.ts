import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Powers the Hot Lists tab on /research — returns the list of themes +
// (when ?theme= is set) the enriched ticker rows for that theme. Reads
// everything from MongoDB; no external API calls. Cached 5 min by Next.

export const dynamic = "force-dynamic";
export const revalidate = 300;

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

// Theme metadata — labels + icons + display order.
// Tickers per theme are managed in the `theme_tickers` collection (seeded
// via /api/admin/research/seed-themes).
const THEMES = [
  { id: "infrastructure", label: "Infrastructure", icon: "🏗️", description: "Semiconductors, data centers, networking — the AI compute stack." },
  { id: "saas",           label: "SaaS",           icon: "☁️", description: "Cloud software — recurring revenue, AI productivity, dev tools." },
  { id: "drones",         label: "Drones",         icon: "🚁", description: "Defense drones, eVTOL, autonomous aerial." },
  { id: "healthcare",     label: "Healthcare",     icon: "🩺", description: "Biotech, medical devices, GLP-1, oncology." },
  { id: "crypto",         label: "Crypto",         icon: "₿",  description: "Equities with direct crypto exposure — miners, custodians, BTC ETFs." },
  { id: "batteries",      label: "Batteries",      icon: "🔋", description: "Battery makers, energy storage, lithium, solid-state." },
];

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const themeId = url.searchParams.get("theme");

    const db = await getMongo();

    // Always return theme summary list (counts per theme, fast aggregation)
    const themeAgg = await db
      .collection("theme_tickers")
      .aggregate([
        { $group: { _id: "$theme", count: { $sum: 1 } } },
      ])
      .toArray();
    const countMap = new Map<string, number>();
    for (const row of themeAgg) countMap.set(String(row._id), row.count);

    const themes = THEMES.map((t) => ({
      ...t,
      count: countMap.get(t.id) ?? 0,
    }));

    // If no theme requested, just return the list (sidebar selector view)
    if (!themeId) {
      return NextResponse.json({ themes, rows: null });
    }

    // Resolve tickers for the requested theme
    const themeRows = await db
      .collection("theme_tickers")
      .find({ theme: themeId })
      .toArray();
    const tickers = themeRows.map((r) => String(r.ticker).toUpperCase());

    if (tickers.length === 0) {
      return NextResponse.json({
        themes,
        selectedTheme: themeId,
        rows: [],
      });
    }

    // Bulk-join the data already maintained by other jobs
    const [dailyDocs, enrichDocs, levelsDocs, halalDocs, logoDocs, bulkDocs] = await Promise.all([
      db.collection("daily_stock_data").find({ symbol: { $in: tickers } }).toArray(),
      db.collection("ticker_enrichment").find({ _id: { $in: tickers } as any }).toArray(),
      db.collection("ticker_levels").find({ _id: { $in: tickers } as any }).toArray(),
      db.collection("halal_compliance").find({ ticker: { $in: tickers } }).toArray(),
      db.collection("symbolImages").find({ _id: { $in: tickers } as any }).toArray(),
      db.collection("financial_bulk").find({ ticker: { $in: tickers } }).toArray(),
    ]);

    const dailyMap = new Map<string, any>();
    for (const d of dailyDocs) dailyMap.set((d.symbol || "").toUpperCase(), d);
    const enrichMap = new Map<string, any>();
    for (const d of enrichDocs) enrichMap.set(String(d._id), d);
    const levelsMap = new Map<string, any>();
    for (const d of levelsDocs) levelsMap.set(String(d._id), d);
    const halalMap = new Map<string, any>();
    for (const d of halalDocs) halalMap.set((d.ticker || "").toUpperCase(), d);
    const logoMap = new Map<string, any>();
    for (const d of logoDocs) logoMap.set(String(d._id).toUpperCase(), d);
    const bulkMap = new Map<string, any>();
    for (const d of bulkDocs) bulkMap.set((d.ticker || "").toUpperCase(), d);

    // YTD% — compute from yearLow/yearHigh isn't accurate. Skip for now; mark "—".
    // (Wire BQ-based YTD in a follow-up if needed.)
    const rows = tickers.map((t) => {
      const d = dailyMap.get(t) ?? {};
      const e = enrichMap.get(t) ?? {};
      const l = levelsMap.get(t) ?? {};
      const h = halalMap.get(t) ?? {};
      const logo = logoMap.get(t) ?? {};
      const bulk = bulkMap.get(t) ?? {};

      const sentiment = l?.sentiment?.shortTerm || null; // "Strong" | "Weak" | "Neutral"
      let trend: "Bullish" | "Bearish" | "Neutral" = "Neutral";
      if (sentiment === "Strong") trend = "Bullish";
      else if (sentiment === "Weak") trend = "Bearish";

      const price = Number(d.price) || 0;
      const changePct = Number(d.changePercentage) ?? null;
      const marketCap = Number(d.marketCap) || 0;
      const volume = Number(d.volume) || 0;
      const revGrowth = e?.growth?.revenueGrowthYoY ?? null;

      return {
        ticker: t,
        companyName: e?.companyName ?? d?.name ?? null,
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
        sentimentScore: l?.sentiment?.shortTermScore ?? null,
        halalStatus: h?.finalStatus ?? null,
        logoUrl: logo?.imageUrl ?? logo?.url ?? null,
        cacheStatus: {
          quoteUpdatedAt: d?.lastUpdatedAt ? new Date(d.lastUpdatedAt).toISOString() : null,
          enrichmentRefreshedAt: e?.refreshedAt ? new Date(e.refreshedAt).toISOString() : null,
        },
      };
    });

    return NextResponse.json({
      themes,
      selectedTheme: themeId,
      rows,
    });
  } catch (e: any) {
    console.error("themes error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
