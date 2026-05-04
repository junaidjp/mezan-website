/**
 * Company Thesis generator + cache.
 *
 * For any ticker the user looks up, we lazily generate a 3-paragraph
 * investment thesis (business summary, bull case, bear case) via OpenAI and
 * cache it in MongoDB. Cache lasts 30 days; manual overrides (source="manual")
 * never expire and never get overwritten.
 *
 * Collection: `company_thesis`
 *   _id (ticker)
 *   businessSummary (string)
 *   bullCase (string)
 *   bearCase (string)
 *   source ("llm" | "manual")
 *   generatedAt (Date)
 */

import { Db } from "mongodb";

const REFRESH_DAYS = 30;
const OPENAI_MODEL = "gpt-4o-mini";

export type CompanyThesis = {
  ticker: string;
  businessSummary: string;
  bullCase: string;
  bearCase: string;
  source: "llm" | "manual";
  generatedAt: string;
};

type ProfileMin = {
  companyName?: string;
  industry?: string;
  sector?: string;
  description?: string;
};

/**
 * Returns thesis for a ticker. Hits MongoDB cache first; only calls OpenAI on
 * miss / expiry. Returns null if no profile data is available and no cache exists.
 */
export async function getOrGenerateCompanyThesis(
  ticker: string,
  profile: ProfileMin | null,
  mongoDB: Db,
): Promise<CompanyThesis | null> {
  const t = ticker.toUpperCase();
  const collection = mongoDB.collection("company_thesis");

  const cached = (await collection.findOne({ _id: t as any })) as any;

  // Manual override is sacred — never overwrite, never expire.
  if (cached?.source === "manual") {
    return normalizeCache(cached);
  }

  // LLM cache is fresh enough? return as-is.
  if (cached?.generatedAt) {
    const ageMs = Date.now() - new Date(cached.generatedAt).getTime();
    if (ageMs < REFRESH_DAYS * 86400000) {
      return normalizeCache(cached);
    }
  }

  // Need to (re)generate. We need profile data for that.
  if (!profile?.description) {
    // No way to generate. Return stale cache if we have it.
    return cached ? normalizeCache(cached) : null;
  }

  const generated = await generateViaOpenAI(t, profile);
  if (!generated) {
    // LLM failed — return stale cache if we have any.
    return cached ? normalizeCache(cached) : null;
  }

  const doc = {
    _id: t,
    ticker: t,
    ...generated,
    source: "llm" as const,
    generatedAt: new Date().toISOString(),
  };

  try {
    await collection.replaceOne({ _id: t as any }, doc, { upsert: true });
  } catch (e) {
    console.warn(`[thesis] cache write failed for ${t}:`, (e as Error).message);
  }

  return {
    ticker: t,
    businessSummary: doc.businessSummary,
    bullCase: doc.bullCase,
    bearCase: doc.bearCase,
    source: doc.source,
    generatedAt: doc.generatedAt,
  };
}

function normalizeCache(c: any): CompanyThesis {
  return {
    ticker: (c._id || c.ticker || "").toUpperCase(),
    businessSummary: c.businessSummary || "",
    bullCase: c.bullCase || "",
    bearCase: c.bearCase || "",
    source: c.source === "manual" ? "manual" : "llm",
    generatedAt:
      typeof c.generatedAt === "string"
        ? c.generatedAt
        : c.generatedAt instanceof Date
        ? c.generatedAt.toISOString()
        : new Date().toISOString(),
  };
}

async function generateViaOpenAI(
  ticker: string,
  profile: ProfileMin,
): Promise<{ businessSummary: string; bullCase: string; bearCase: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[thesis] OPENAI_API_KEY missing — cannot generate");
    return null;
  }

  const system =
    "You are an investment research analyst writing concise, specific company theses. Avoid fluff. Frame the bull case in terms of demand for the company's product/technology/service (current or future). Frame the bear case as risks to that demand. Do not predict prices. Do not give buy/sell recommendations.";

  const user = `Write a JSON object with three short paragraphs (about 70 words each, max 90) about ${ticker} (${profile.companyName || ticker}).

Sector: ${profile.sector || "Unknown"}
Industry: ${profile.industry || "Unknown"}
Company description: ${profile.description?.slice(0, 1500) || "Not available"}

Return JSON with keys: businessSummary, bullCase, bearCase.

- businessSummary: 1-2 sentences describing what the company actually does and their main product/service.
- bullCase: Why their product/tech/service is in demand now or will be in demand. Be specific about end markets, customers, secular trends. Avoid generic phrases.
- bearCase: Specific risks to that demand thesis. Avoid generic risks like "market volatility". Focus on the company-specific demand vulnerabilities.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
      // Don't cache LLM responses — we manage caching at the Mongo layer
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[thesis] OpenAI ${res.status} for ${ticker}`);
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (
      typeof parsed.businessSummary === "string" &&
      typeof parsed.bullCase === "string" &&
      typeof parsed.bearCase === "string"
    ) {
      return {
        businessSummary: parsed.businessSummary.trim(),
        bullCase: parsed.bullCase.trim(),
        bearCase: parsed.bearCase.trim(),
      };
    }
    console.warn(`[thesis] OpenAI returned unexpected shape for ${ticker}`);
    return null;
  } catch (e) {
    console.warn(`[thesis] OpenAI call failed for ${ticker}:`, (e as Error).message);
    return null;
  }
}
