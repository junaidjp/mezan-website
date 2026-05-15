import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim().slice(0, 120);
    const plan = String(body.plan || "").trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (plan !== "monthly" && plan !== "annual") {
      return NextResponse.json({ error: "plan must be monthly or annual" }, { status: 400 });
    }

    const db = await getMongo();
    const col = db.collection("research_waitlist");

    // Compound key on (email, plan) so the same email can be on both lists.
    const key = `${email}::${plan}`;
    const now = new Date();
    await col.updateOne(
      { _id: key as any },
      {
        $set: {
          email,
          plan,
          name: name || null,
          updatedAt: now,
        },
        $setOnInsert: {
          status: "pending",
          addedAt: now,
          source: "elite-page",
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, email, plan });
  } catch (e: any) {
    console.error("waitlist join error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
