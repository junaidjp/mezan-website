import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Seeds the `theme_tickers` collection with the curated Mezan theme universe.
// Idempotent — safe to re-run; uses upserts on (theme, ticker) compound key.
//
// Run:
//   curl -X POST http://localhost:3000/api/admin/research/seed-themes \
//     -H "X-Admin-Key: REPLACE_WITH_BACKEND_ADMIN_KEY"

export const dynamic = "force-dynamic";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "admin-local-key-123";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

// Curated initial universe — designed so Mezan's halal-screening filter still
// narrows it. The screener UI will show halal status per row so users see
// which names pass the screen.
const SEED: Record<string, string[]> = {
  infrastructure: [
    "NVDA", "AMD", "AVGO", "MRVL", "ASML", "AMAT", "LRCX", "TSM", "ARM",
    "ANET", "DELL", "HPE", "SMCI", "MU", "SNDK", "WDC", "STX",
    "CRDO", "AAOI", "APLD", "IREN", "VRT", "PLAB", "SKYT",
  ],
  saas: [
    "CRM", "NOW", "SNOW", "MDB", "DDOG", "NET", "WDAY", "ADBE", "INTU",
    "CRWD", "ZS", "PANW", "OKTA", "TEAM", "VEEV", "HUBS", "PLTR",
    "BILL", "S",
  ],
  drones: [
    "KTOS", "AVAV", "RKLB", "ACHR", "JOBY", "EH", "ONDS", "LMT", "NOC",
  ],
  healthcare: [
    "LLY", "NVO", "VRTX", "REGN", "ISRG", "BSX", "TMO", "DHR",
    "GILD", "AMGN", "BMY", "AZN", "ABBV", "NVS", "MDT", "SYK",
    "MRNA", "AXSM", "JAZZ",
  ],
  crypto: [
    "MSTR", "COIN", "IBIT", "FBTC", "ARKB", "BITB",
    "MARA", "RIOT", "CLSK", "HUT", "WULF", "BTBT",
    "HOOD", "GLXY", "BKKT", "CIFR", "BTDR", "CAN",
  ],
  batteries: [
    "TSLA", "ALB", "PLUG", "ENPH", "FLNC", "EOSE", "QS", "BE", "FREY",
    "AMPX", "SLDP", "MVST",
  ],
};

export async function POST(req: Request) {
  if (req.headers.get("X-Admin-Key") !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getMongo();
    const col = db.collection("theme_tickers");

    // Compound unique-ish key: theme:ticker
    let inserted = 0;
    let updated = 0;
    const now = new Date();
    for (const [theme, tickers] of Object.entries(SEED)) {
      for (const ticker of tickers) {
        const _id = `${theme}::${ticker}`;
        const res = await col.updateOne(
          { _id: _id as any },
          {
            $set: { theme, ticker, updatedAt: now },
            $setOnInsert: { addedAt: now },
          },
          { upsert: true },
        );
        if (res.upsertedCount > 0) inserted++;
        else if (res.modifiedCount > 0) updated++;
      }
    }

    // Summary per theme
    const counts: Record<string, number> = {};
    for (const theme of Object.keys(SEED)) {
      counts[theme] = await col.countDocuments({ theme });
    }

    return NextResponse.json({ ok: true, inserted, updated, counts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
