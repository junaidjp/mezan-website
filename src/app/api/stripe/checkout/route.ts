import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

const PRICE_ID = process.env.STRIPE_PRICE_ID_RESEARCH_MONTHLY!;
const SUCCESS_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Create a Stripe checkout session for Mezan Research $13.99/mo subscription
 * Body: { uid, email }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
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
