import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const BACKEND_URL = process.env.BACKEND_URL || "https://compliance-check-api-223407081609.us-central1.run.app";
const ADMIN_KEY = process.env.ADMIN_API_KEY!;

/**
 * Stripe webhook handler — updates researchAccess + eliteApproved
 * on subscription events.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("Stripe webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const obj: any = event.data.object;
        const uid = obj.metadata?.firebaseUid || obj.subscription_data?.metadata?.firebaseUid;
        const isActive = obj.status === "active" || obj.status === "trialing" || event.type === "checkout.session.completed";

        if (uid) {
          await updateUserAccess(uid, isActive);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const obj: any = event.data.object;
        const uid = obj.metadata?.firebaseUid;
        if (uid) {
          await updateUserAccess(uid, false);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Call backend to set researchAccess + eliteApproved flags
 */
async function updateUserAccess(uid: string, active: boolean) {
  const res = await fetch(`${BACKEND_URL}/api/v1/admin/users/${uid}/research-access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_KEY,
    },
    body: JSON.stringify({
      researchAccess: active,
      researchSource: active ? "STRIPE" : null,
      eliteApproved: active, // Stripe research subscription bypasses App Store
      eliteStatus: active ? "ACTIVE" : "INACTIVE",
    }),
  });

  if (!res.ok) {
    throw new Error(`Backend update failed: ${res.status} ${await res.text()}`);
  }
  console.log(`Updated user ${uid} research access: ${active}`);
}
