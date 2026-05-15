/**
 * SNDK-DNA Analysis generator + cache.
 *
 * For each candidate stock in the SNDK-DNA screener, we generate three pieces
 * of editorial copy via OpenAI: the bull thesis, the key risks, and the
 * "SNDK analog" framing line. Results are cached in MongoDB for 30 days.
 *
 * Collection: `sndk_dna_analysis`
 *   _id (ticker)
 *   thesis (string)
 *   risk (string)
 *   sndkAnalog (string)
 *   source ("llm" | "manual")
 *   generatedAt (Date)
 *
 * Manual overrides (source="manual") are never overwritten by the LLM path.
 */

import { Db } from "mongodb";

const REFRESH_DAYS = 30;
const OPENAI_MODEL = "gpt-4o-mini";

export type SndkDnaAnalysis = {
  ticker: string;
  thesis: string;
  risk: string;
  sndkAnalog: string;
  source: "llm" | "manual";
  generatedAt: string;
};

type Context = {
  ticker: string;
  companyName?: string | null;
  industry?: string | null;
  sector?: string | null;
  description?: string | null;
  marketCap?: number | null;
  revenueGrowthYoY?: number | null;
  epsGrowthYoY?: number | null;
};

function buildPrompt(c: Context): string {
  const mcap = c.marketCap ? `$${(c.marketCap / 1e6).toFixed(0)}M` : "unknown";
  const revG = c.revenueGrowthYoY != null ? `${(c.revenueGrowthYoY * 100).toFixed(0)}%` : "unknown";
  const epsG = c.epsGrowthYoY != null ? `${(c.epsGrowthYoY * 100).toFixed(0)}%` : "unknown";

  return `You are writing for Mezan Research's "SNDK-DNA Screener" — a feature that identifies small/mid-cap AI-infrastructure stocks with the same fundamental ingredients that powered SanDisk (SNDK) from $27 to $1,400+ in 13 months: small market cap, earnings inflection, direct AI catalyst, low institutional ownership, and a clean technical base.

Write THREE short pieces of analysis for this stock:

TICKER: ${c.ticker}
COMPANY: ${c.companyName || c.ticker}
INDUSTRY: ${c.industry || "unknown"}
SECTOR: ${c.sector || "unknown"}
MARKET CAP: ${mcap}
REVENUE YoY: ${revG}
EPS YoY: ${epsG}
DESCRIPTION: ${c.description || "—"}

Output exactly this JSON shape, nothing else:
{
  "thesis": "3-5 sentences — the bull case in concrete terms. What does the company actually do? What's the AI demand driver? What's the inflection? Be specific. Avoid generic AI hype.",
  "risk": "1-2 sentences — the most credible bear case. What could break this thesis? Be honest, not boilerplate.",
  "sndkAnalog": "1 sentence — what makes this a SNDK-style setup? Frame in one of these patterns: cyclical trough → inflection / under-owned + direct catalyst / small-cap with institutional discovery ahead / sub-$2.5B with monster TAM."
}`;
}

async function callOpenAI(prompt: string): Promise<{ thesis: string; risk: string; sndkAnalog: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      console.warn("OpenAI error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (!parsed.thesis || !parsed.risk || !parsed.sndkAnalog) return null;
    return {
      thesis: String(parsed.thesis).trim(),
      risk: String(parsed.risk).trim(),
      sndkAnalog: String(parsed.sndkAnalog).trim(),
    };
  } catch (e) {
    console.warn("OpenAI call failed:", e);
    return null;
  }
}

/**
 * Returns analysis for a ticker. MongoDB cache first; only calls OpenAI on
 * miss / expiry. Manual overrides preserved.
 */
export async function getOrGenerateSndkDnaAnalysis(
  ticker: string,
  context: Omit<Context, "ticker">,
  mongoDB: Db,
): Promise<SndkDnaAnalysis | null> {
  const t = ticker.toUpperCase();
  const collection = mongoDB.collection("sndk_dna_analysis");

  const cached = await collection.findOne({ _id: t as any });
  if (cached) {
    if (cached.source === "manual") {
      return cached as any;
    }
    const ageMs = Date.now() - new Date(cached.generatedAt || 0).getTime();
    if (ageMs < REFRESH_DAYS * 24 * 60 * 60 * 1000) {
      return cached as any;
    }
  }

  const prompt = buildPrompt({ ticker: t, ...context });
  const generated = await callOpenAI(prompt);
  if (!generated) {
    // Return whatever cache we had even if stale; null only if no cache + no LLM
    return cached ? (cached as any) : null;
  }

  const doc: SndkDnaAnalysis & { _id: string } = {
    _id: t,
    ticker: t,
    thesis: generated.thesis,
    risk: generated.risk,
    sndkAnalog: generated.sndkAnalog,
    source: "llm",
    generatedAt: new Date().toISOString(),
  };

  await collection.updateOne({ _id: t as any }, { $set: doc }, { upsert: true });
  return doc;
}
