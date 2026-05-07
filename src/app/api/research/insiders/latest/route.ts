import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const FMP_KEY = process.env.FMP_API_KEY || "NjYxygOWKRryWrONiVhAjrH5k4CZfcm4";
const FMP_LATEST = "https://financialmodelingprep.com/stable/insider-trading/latest";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtAmount(n: number) {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function deriveAction(transactionType: string | null | undefined): "Buy" | "Sell" | null {
  if (!transactionType) return null;
  const t = transactionType.toUpperCase();
  if (t.startsWith("P-") || t.includes("PURCHASE")) return "Buy";
  if (t.startsWith("S-") || t.includes("SALE")) return "Sell";
  return null;
}

function cleanName(name: string | null | undefined) {
  if (!name) return "—";
  return name.replace(/\s+/g, " ").trim();
}

function cleanTitle(typeOfOwner: string | null | undefined) {
  if (!typeOfOwner) return "Insider";
  // FMP returns things like "officer: CEO" — clean it up
  return typeOfOwner.replace(/^officer:\s*/i, "").replace(/^director:\s*/i, "Director").trim() || "Insider";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 200);
    const page = Math.max(parseInt(url.searchParams.get("page") || "0", 10), 0);

    const fmpUrl = `${FMP_LATEST}?page=${page}&limit=${limit}&apikey=${FMP_KEY}`;
    const res = await fetch(fmpUrl, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: `FMP ${res.status}` }, { status: 502 });
    }
    const raw: any[] = await res.json();
    if (!Array.isArray(raw)) {
      return NextResponse.json([]);
    }

    const trades = raw
      .map((r) => {
        const action = deriveAction(r.transactionType);
        if (!action) return null;
        const shares = Number(r.securitiesTransacted) || 0;
        const price = Number(r.price) || 0;
        const amount = shares * price;
        if (amount < 10_000) return null; // filter sub-$10k noise

        return {
          ticker: (r.symbol || "—").toString().toUpperCase(),
          name: cleanName(r.reportingName),
          title: cleanTitle(r.typeOfOwner),
          type: "Insider" as const,
          action,
          shares,
          price,
          amount,
          amountFormatted: fmtAmount(amount),
          date: fmtDate(r.transactionDate || r.filingDate),
          formType: r.formType || "4",
          url: r.url || r.link || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json(trades);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load insiders" }, { status: 500 });
  }
}
