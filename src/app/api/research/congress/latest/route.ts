import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // 30-min cache (filings drip in throughout the day)

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const FMP_KEY = process.env.FMP_API_KEY || "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";
const FMP_V4 = "https://financialmodelingprep.com/api/v4";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

async function fmp(path: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${path}${sep}apikey=${FMP_KEY}`, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type CongressTrade = {
  ticker: string;
  name: string;
  chamber: "Senate" | "House";
  member: string;
  party: string | null; // FMP doesn't provide; left null
  state: string | null;
  type: "Purchase" | "Sale" | "Exchange" | "Other";
  amount: string;
  transactionDate: string;
  disclosureDate: string;
  link: string;
  halalStatus: "HALAL" | "QUESTIONABLE" | "NOT_HALAL" | null;
  isCompliant: boolean;
};

function normalizeType(t: string): CongressTrade["type"] {
  const u = (t || "").toLowerCase();
  if (u.includes("purchase") || u.includes("buy")) return "Purchase";
  if (u.includes("sale") || u.includes("sell")) return "Sale";
  if (u.includes("exchange")) return "Exchange";
  return "Other";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const halalOnly = url.searchParams.get("halalOnly") === "true";
    const tickerFilter = url.searchParams.get("ticker")?.toUpperCase();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);

    // FMP endpoint naming is confusing — `senate-trading` is Senate, `senate-disclosure` is House
    const [senateArr, houseArr] = await Promise.all([
      fmp(`${FMP_V4}/senate-trading-rss-feed?page=0`),
      fmp(`${FMP_V4}/senate-disclosure-rss-feed?page=0`),
    ]);

    const senate = Array.isArray(senateArr) ? senateArr : [];
    const house = Array.isArray(houseArr) ? houseArr : [];

    // Collect all unique tickers so we can batch the halal lookup in one Mongo query
    const allTickers = new Set<string>();
    for (const s of senate) if (s.symbol) allTickers.add(String(s.symbol).toUpperCase());
    for (const h of house) if (h.ticker) allTickers.add(String(h.ticker).toUpperCase());

    const db = await getMongo();
    const halalDocs = await db
      .collection("halal_compliance")
      .find({ ticker: { $in: Array.from(allTickers) } })
      .toArray();
    const halalMap = new Map<string, string>();
    for (const d of halalDocs) {
      if (d.ticker) halalMap.set(d.ticker.toUpperCase(), d.finalStatus);
    }

    const trades: CongressTrade[] = [];

    for (const s of senate) {
      const t = (s.symbol || "").toUpperCase();
      if (!t) continue;
      const halalStatus = (halalMap.get(t) as any) ?? null;
      trades.push({
        ticker: t,
        name: s.assetDescription || t,
        chamber: "Senate",
        member: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.office || "—",
        party: null,
        state: null,
        type: normalizeType(s.type),
        amount: s.amount || "—",
        transactionDate: s.transactionDate || s.dateRecieved || "",
        disclosureDate: s.dateRecieved || s.disclosureDate || "",
        link: s.link || "",
        halalStatus,
        isCompliant: halalStatus === "HALAL",
      });
    }

    for (const h of house) {
      const t = (h.ticker || "").toUpperCase();
      if (!t) continue;
      const halalStatus = (halalMap.get(t) as any) ?? null;
      trades.push({
        ticker: t,
        name: h.assetDescription || t,
        chamber: "House",
        member: h.representative || "—",
        party: null,
        state: h.district || null,
        type: normalizeType(h.type),
        amount: h.amount || "—",
        transactionDate: h.transactionDate || "",
        disclosureDate: h.disclosureDate || "",
        link: h.link || "",
        halalStatus,
        isCompliant: halalStatus === "HALAL",
      });
    }

    // Apply filters
    let filtered = trades;
    if (halalOnly) filtered = filtered.filter((t) => t.isCompliant);
    if (tickerFilter) filtered = filtered.filter((t) => t.ticker === tickerFilter);

    // Sort by transaction date desc; tie-break by disclosure date desc
    filtered.sort((a, b) => {
      const ta = new Date(a.transactionDate).getTime() || 0;
      const tb = new Date(b.transactionDate).getTime() || 0;
      if (tb !== ta) return tb - ta;
      const da = new Date(a.disclosureDate).getTime() || 0;
      const db = new Date(b.disclosureDate).getTime() || 0;
      return db - da;
    });

    // Aggregate stats
    const halalCount = trades.filter((t) => t.isCompliant).length;
    const buyCount = trades.filter((t) => t.type === "Purchase").length;
    const sellCount = trades.filter((t) => t.type === "Sale").length;

    return NextResponse.json({
      trades: filtered.slice(0, limit),
      total: filtered.length,
      summary: {
        senate: senate.length,
        house: house.length,
        halal: halalCount,
        buys: buyCount,
        sells: sellCount,
      },
    });
  } catch (e: any) {
    console.error("congress latest error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
