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
 * Per-plan gates:
 *   SUBSCRIPTIONS_MONTHLY_OPEN=true  → monthly available
 *   SUBSCRIPTIONS_ANNUAL_OPEN=true   → annual available
 * Anything else (unset / "false") closes that plan.
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const { uid, email, plan } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    const monthlyOpen = process.env.SUBSCRIPTIONS_MONTHLY_OPEN === "true";
    const annualOpen = process.env.SUBSCRIPTIONS_ANNUAL_OPEN === "true";

    if (plan === "annual" && !annualOpen) {
      return NextResponse.json(
        {
          error: "annual_sold_out",
          message:
            "The annual plan is sold out for now. Monthly is still available — or email support@mezaninvesting.com to join the annual waitlist.",
        },
        { status: 503 },
      );
    }
    if (plan !== "annual" && !monthlyOpen) {
      return NextResponse.json(
        {
          error: "monthly_closed",
          message:
            "Monthly subscriptions are temporarily closed. Email support@mezaninvesting.com to be notified when we reopen.",
        },
        { status: 503 },
      );
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
