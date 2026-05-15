import { NextResponse } from "next/server";

// Macro Pulse — pulls key economic series from the Federal Reserve (FRED).
// Free API, requires an API key (fred.stlouisfed.org/docs/api/api_key.html).
// 6-hour Next cache because FRED data updates daily / weekly at most.

export const dynamic = "force-dynamic";
export const revalidate = 21600;

const FRED_KEY = process.env.FRED_API_KEY || "";

// Series we track. Each tile shows latest value + delta vs previous reading.
// Source attribution per FRED Terms of Use: each series carries the original
// publisher so we can render "Source: X via FRED" on the tile.
const SERIES = [
  { id: "FEDFUNDS", label: "Fed Funds Rate", unit: "%", source: "Federal Reserve" },
  { id: "DGS10", label: "10Y Treasury", unit: "%", source: "U.S. Treasury" },
  { id: "DGS2", label: "2Y Treasury", unit: "%", source: "U.S. Treasury" },
  { id: "VIXCLS", label: "VIX", unit: "", source: "CBOE" },
  { id: "UNRATE", label: "Unemployment", unit: "%", source: "BLS" },
  { id: "CPIAUCSL", label: "CPI", unit: "", computeYoY: true, source: "BLS" },
];

async function fetchSeries(id: string): Promise<{ date: string; value: number }[]> {
  if (!FRED_KEY) return [];
  // Pull last 25 observations — enough for YoY (12 monthly or so) and previous-value deltas
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=25`;
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const obs = (data?.observations || [])
      .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))
      .filter((o: any) => !isNaN(o.value));
    return obs;
  } catch {
    return [];
  }
}

export async function GET() {
  if (!FRED_KEY) {
    return NextResponse.json(
      {
        error: "FRED_API_KEY not configured",
        howTo:
          "Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html and set FRED_API_KEY env var",
      },
      { status: 503 },
    );
  }

  try {
    const series = await Promise.all(
      SERIES.map(async (s) => {
        const obs = await fetchSeries(s.id);
        if (obs.length === 0) {
          return { id: s.id, label: s.label, unit: s.unit, source: s.source, latest: null, prev: null, delta: null, asOf: null };
        }
        const latest = obs[0];

        // For CPI: report YoY % change instead of raw index value
        if (s.computeYoY) {
          // FRED CPI is monthly; YoY = compare to ~12 observations back
          const yoyTarget = obs[12] || obs[obs.length - 1];
          const prevYoyTarget = obs[13] || obs[obs.length - 1];
          const yoyPct = yoyTarget ? ((latest.value - yoyTarget.value) / yoyTarget.value) * 100 : null;
          const prevYoyPct =
            prevYoyTarget && obs[1]
              ? ((obs[1].value - prevYoyTarget.value) / prevYoyTarget.value) * 100
              : null;
          return {
            id: s.id,
            label: `${s.label} YoY`,
            unit: "%",
            source: s.source,
            latest: yoyPct,
            prev: prevYoyPct,
            delta: yoyPct != null && prevYoyPct != null ? yoyPct - prevYoyPct : null,
            asOf: latest.date,
          };
        }

        const prev = obs[1]?.value ?? null;
        return {
          id: s.id,
          label: s.label,
          unit: s.unit,
          source: s.source,
          latest: latest.value,
          prev,
          delta: prev != null ? latest.value - prev : null,
          asOf: latest.date,
        };
      }),
    );

    // Yield curve spread (10Y - 2Y) as a derived series
    const ten = series.find((s) => s.id === "DGS10")?.latest;
    const two = series.find((s) => s.id === "DGS2")?.latest;
    const curve =
      ten != null && two != null
        ? {
            id: "CURVE",
            label: "10Y - 2Y Spread",
            unit: "%",
            latest: ten - two,
            prev: null,
            delta: null,
            asOf: series.find((s) => s.id === "DGS10")?.asOf ?? null,
            inverted: ten - two < 0,
          }
        : null;

    return NextResponse.json({
      series,
      curve,
      asOf: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("macro error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
