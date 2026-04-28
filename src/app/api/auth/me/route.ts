import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const BACKEND_URL = process.env.BACKEND_URL || "https://compliance-check-api-223407081609.us-central1.run.app";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

/**
 * Proxy the /subscription/me call through our Next.js server.
 * Also enforces single-session per user.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = req.headers.get("X-Session-Id");

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/subscription/me`, {
      headers: {
        Authorization: authHeader,
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Access check failed" }, { status: res.status });
    }

    const data = await res.json();

    // Enforce single session if sessionId provided
    if (sessionId) {
      try {
        const db = await getMongo();
        // Extract UID from the token (it's in the backend response or we parse it)
        const uid = data.uid || authHeader.replace("Bearer ", "").split(".")[1];

        const existing = await db.collection("research_sessions").findOne({ uid });

        if (existing && existing.sessionId !== sessionId) {
          // Different session — this login is from another device
          return NextResponse.json({
            ...data,
            sessionConflict: true,
            message: "Your account is active on another device. Please log out there first.",
          });
        }
      } catch {}
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/auth/me — register a session on login
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, sessionId } = await req.json();
    if (!uid || !sessionId) {
      return NextResponse.json({ error: "Missing uid or sessionId" }, { status: 400 });
    }

    const db = await getMongo();
    await db.collection("research_sessions").updateOne(
      { _id: uid as any },
      {
        $set: {
          uid,
          sessionId,
          loginAt: new Date(),
          ip: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/me — clear session on logout
 */
export async function DELETE(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

    const db = await getMongo();
    await db.collection("research_sessions").deleteOne({ _id: uid as any });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
