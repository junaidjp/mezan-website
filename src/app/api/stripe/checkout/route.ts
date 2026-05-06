import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

const PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_RESEARCH_MONTHLY || "";
const PRICE_ANNUAL = process.env.STRIPE_PRICE_ID_RESEARCH_ANNUAL || "";
const SUCCESS_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Create a Stripe checkout session for Mezan Research subscription.
 * Body: { uid, email, plan }
 *
 * Subscriptions are temporarily closed to new sign-ups. Set
 * `SUBSCRIPTIONS_OPEN=true` env var to reopen.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.SUBSCRIPTIONS_OPEN !== "true") {
      return NextResponse.json(
        {
          error: "subscriptions_closed",
          message:
            "Mezan Research is temporarily closed to new subscribers. Email support@mezaninvesting.com or DM Junaid in his WhatsApp group to be notified when we reopen.",
        },
        { status: 503 },
      );
    }
    const stripe = getStripe();
    const { uid, email, plan } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    const PRICE_ID = plan === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY;
    if (!PRICE_ID) {
      return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
    }

    // Create or retrieve Stripe customer for this Firebase user
    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid: uid },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${SUCCESS_URL}/research?subscribed=true`,
      cancel_url: `${SUCCESS_URL}/research`,
      metadata: { firebaseUid: uid },
      subscription_data: {
        metadata: { firebaseUid: uid },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("Stripe checkout error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
