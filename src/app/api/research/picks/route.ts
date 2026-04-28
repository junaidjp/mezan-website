import { NextRequest, NextResponse } from "next/server";
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

/**
 * GET /api/research/picks — returns enriched research picks
 */
export async function GET() {
  try {
    const db = await getMongo();

    // Get all research picks sorted by addedAt desc
    const picks = await db
      .collection("research_picks")
      .find({})
      .sort({ addedAt: -1 })
      .toArray();

    if (picks.length === 0) {
      return NextResponse.json([]);
    }

    // Get tickers
    const tickers = picks.map((p) => p.ticker);

    // Fetch live quotes from FMP in one batch call
    const quotesRes = await fetch(
      `${FMP}/quote/${tickers.join(",")}?apikey=${FMP_KEY}`
    );
    const quotes = await quotesRes.json();
    const quoteMap = new Map(
      (quotes || []).map((q: any) => [q.symbol, q])
    );

    // Fetch halal status
    const halalDocs = await db
      .collection("halal_compliance")
      .find({ ticker: { $in: tickers } })
      .toArray();
    const halalMap = new Map(halalDocs.map((h) => [h.ticker, h.finalStatus]));

    // Fetch ticker_levels for technicals
    const levelDocs = await db
      .collection("ticker_levels")
      .find({ _id: { $in: tickers } })
      .toArray();
    const levelsMap = new Map(levelDocs.map((l) => [l._id, l]));

    // Enrich each pick
    const enriched = picks.map((pick) => {
      const quote = quoteMap.get(pick.ticker) || ({} as any);
      const levels = levelsMap.get(pick.ticker);
      const halal = halalMap.get(pick.ticker) || "UNKNOWN";

      return {
        ticker: pick.ticker,
        name: quote.name || pick.name || pick.ticker,
        price: quote.price || 0,
        change: quote.changesPercentage || 0,
        halal,
        support: levels?.supports?.[0]?.toString() || "—",
        resistance: levels?.resistances?.[0]?.toString() || "—",
        rsi: levels?.technicals?.rsi || 0,
        aiSummary: pick.notes || null,
        sentiment: pick.sentiment || null,
        aiConfidence: pick.conviction || null,
        insiderActivity: null,
        theme: pick.theme || null,
        addedAt: pick.addedAt,
      };
    });

    return NextResponse.json(enriched);
  } catch (e) {
    console.error("Research picks error:", e);
    return NextResponse.json([], { status: 500 });
  }
}

/**
 * POST /api/research/picks — add a ticker to research picks (admin)
 * Body: { ticker, notes?, theme?, conviction?, sentiment? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker, notes, theme, conviction, sentiment } = body;

    if (!ticker) {
      return NextResponse.json({ error: "ticker required" }, { status: 400 });
    }

    const db = await getMongo();
    const t = ticker.toUpperCase();

    // Check halal status
    const halalDoc = await db
      .collection("halal_compliance")
      .findOne({ ticker: t });

    if (halalDoc?.finalStatus === "NOT_HALAL") {
      return NextResponse.json(
        { error: `${t} is NOT_HALAL — cannot add to research` },
        { status: 400 }
      );
    }

    // Get name from FMP
    let name = t;
    try {
      const res = await fetch(`${FMP}/profile/${t}?apikey=${FMP_KEY}`);
      const data = await res.json();
      if (data?.[0]?.companyName) name = data[0].companyName;
    } catch {}

    await db.collection("research_picks").updateOne(
      { _id: t },
      {
        $set: {
          ticker: t,
          name,
          notes: notes || null,
          theme: theme || null,
          conviction: conviction || null,
          sentiment: sentiment || null,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          addedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ status: "added", ticker: t, name });
  } catch (e) {
    console.error("Add pick error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/research/picks — remove a ticker
 * Body: { ticker }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const t = body.ticker?.toUpperCase();
    if (!t) return NextResponse.json({ error: "ticker required" }, { status: 400 });

    const db = await getMongo();
    await db.collection("research_picks").deleteOne({ _id: t });

    return NextResponse.json({ status: "removed", ticker: t });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
