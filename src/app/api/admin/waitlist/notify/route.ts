import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "admin-local-key-123";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.WAITLIST_FROM_EMAIL || "Mezan Research <hello@mezaninvesting.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mezaninvesting.com";

let cachedClient: MongoClient | null = null;
async function getMongo() {
  if (!cachedClient) cachedClient = await MongoClient.connect(MONGO_URI);
  return cachedClient.db("mezan");
}

function checkAuth(req: Request): boolean {
  return req.headers.get("X-Admin-Key") === ADMIN_KEY;
}

function buildEmailHtml(plan: string, name: string | null) {
  const planLabel = plan === "monthly" ? "Monthly ($15.99/mo)" : "Annual ($149.99/yr)";
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Mezan Research is open</title></head>
<body style="margin:0;padding:0;background:#0c1118;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:linear-gradient(135deg,#0c1118 0%,#0a1f15 100%);border:1px solid rgba(16,185,129,0.2);border-radius:16px;padding:32px;">
      <div style="font-size:13px;color:#10B981;letter-spacing:2px;font-weight:bold;">MEZAN RESEARCH</div>
      <h1 style="color:#fff;font-size:24px;margin:12px 0 6px 0;">Your spot just opened.</h1>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        ${greeting} You joined the waitlist for the ${planLabel} plan — and we&apos;re reopening sign-ups now.
      </p>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px 0;">
        Spots are limited. To claim yours, visit the link below and complete checkout.
      </p>
      <a href="${SITE_URL}/elite#pricing" style="display:inline-block;background:linear-gradient(135deg,#10B981,#34d399);color:#000;text-decoration:none;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:12px;">
        Subscribe now →
      </a>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;line-height:1.6;margin:32px 0 0 0;">
        If the button above doesn&apos;t work, paste this in your browser:<br>
        <span style="color:rgba(255,255,255,0.6);">${SITE_URL}/elite#pricing</span>
      </p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0;">
      <p style="color:rgba(255,255,255,0.3);font-size:11px;line-height:1.6;margin:0;">
        You received this because you signed up for the Mezan Research waitlist. If you no longer want updates,
        reply &quot;unsubscribe&quot; and we&apos;ll remove you.
      </p>
    </div>
  </div>
</body></html>`;
}

async function sendOne(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return { ok: false, dryRun: true };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan || "").toLowerCase();
    const dryRun = Boolean(body.dryRun);

    if (plan !== "monthly" && plan !== "annual" && plan !== "all") {
      return NextResponse.json({ error: "plan must be monthly | annual | all" }, { status: 400 });
    }

    const db = await getMongo();
    const filter: any = { status: "pending" };
    if (plan !== "all") filter.plan = plan;

    const entries = await db.collection("research_waitlist").find(filter).toArray();

    if (entries.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No pending entries match." });
    }

    if (!RESEND_KEY && !dryRun) {
      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY not configured. Set RESEND_API_KEY env var, or pass { dryRun: true } to preview the recipient list.",
          recipientCount: entries.length,
        },
        { status: 400 },
      );
    }

    const results: { email: string; ok: boolean; error?: string }[] = [];
    let sent = 0;
    let failed = 0;

    for (const e of entries) {
      const subject =
        e.plan === "monthly"
          ? "Mezan Research Monthly is open — your spot is ready"
          : "Mezan Research Annual is open — your spot is ready";
      const html = buildEmailHtml(e.plan, e.name || null);

      if (dryRun) {
        results.push({ email: e.email, ok: true });
        sent++;
        continue;
      }

      const r = await sendOne(e.email, subject, html);
      if (r.ok) {
        sent++;
        await db.collection("research_waitlist").updateOne(
          { _id: e._id },
          {
            $set: {
              status: "notified",
              notifiedAt: new Date(),
              lastSubject: subject,
            },
          },
        );
        results.push({ email: e.email, ok: true });
      } else {
        failed++;
        results.push({ email: e.email, ok: false, error: r.error });
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      total: entries.length,
      dryRun,
      results,
    });
  } catch (e: any) {
    console.error("waitlist notify error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
