import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FMP_KEY = process.env.FMP_API_KEY || "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";
const FMP = "https://financialmodelingprep.com/api/v3";

const TICKERS = ["SKYT", "PLAB", "CEVA", "AIP", "APLD", "IREN"];

export async function GET() {
  try {
    const res = await fetch(
      `${FMP}/quote/${TICKERS.join(",")}?apikey=${FMP_KEY}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Quote fetch failed: ${res.status}` },
        { status: 502 }
      );
    }
    const quotes = await res.json();
    const map = new Map<string, any>(
      (Array.isArray(quotes) ? quotes : []).map((q: any) => [q.symbol, q])
    );

    const out = TICKERS.map((t) => {
      const q = map.get(t) || {};
      return {
        ticker: t,
        price: typeof q.price === "number" ? q.price : null,
        change: typeof q.changesPercentage === "number" ? q.changesPercentage : null,
        marketCap: typeof q.marketCap === "number" ? q.marketCap : null,
        name: q.name || null,
      };
    });

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
