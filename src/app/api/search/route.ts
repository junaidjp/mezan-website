import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=8&exchange=NASDAQ,NYSE&apikey=${FMP_KEY}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();

    const results = (data || []).map((item: any) => ({
      ticker: item.symbol,
      name: item.name,
      exchange: item.exchangeShortName || item.stockExchange,
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
