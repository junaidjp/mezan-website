import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "admin-local-key-123";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

function checkAuth(req: Request): boolean {
  const h = req.headers.get("X-Admin-Key");
  return h === ADMIN_KEY;
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getMongo();
    const url = new URL(req.url);
    const plan = url.searchParams.get("plan");
    const status = url.searchParams.get("status");

    const filter: any = {};
    if (plan) filter.plan = plan;
    if (status) filter.status = status;

    const entries = await db
      .collection("research_waitlist")
      .find(filter)
      .sort({ addedAt: -1 })
      .limit(1000)
      .toArray();

    const counts = await db
      .collection("research_waitlist")
      .aggregate([
        { $group: { _id: { plan: "$plan", status: "$status" }, count: { $sum: 1 } } },
      ])
      .toArray();

    const summary: Record<string, Record<string, number>> = { monthly: {}, annual: {} };
    for (const c of counts) {
      const p = c._id.plan;
      const s = c._id.status;
      if (!summary[p]) summary[p] = {};
      summary[p][s] = c.count;
    }

    return NextResponse.json({ entries, summary, total: entries.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Mark a single entry as removed (e.g., spam, duplicate)
export async function DELETE(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const db = await getMongo();
    await db.collection("research_waitlist").deleteOne({ _id: id as any });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
