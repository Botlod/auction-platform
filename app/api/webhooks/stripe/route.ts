import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = new Stripe(stripeSecretKey).webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const checkout = event.data.object as Stripe.Checkout.Session;
  const transactionId = checkout.metadata?.transactionId;
  if (!transactionId) return NextResponse.json({ error: "Missing transaction reference." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: transaction, error } = await supabase
    .from("transactions")
    .update({ status: "paid", stripe_session_id: checkout.id })
    .eq("id", transactionId)
    .eq("status", "pending")
    .select("id, buyer_id, auction_id, amount")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to record payment." }, { status: 500 });

  if (transaction) {
    await supabase.from("notifications").insert({
      user_id: transaction.buyer_id,
      type: "payment_confirmed",
      payload: { auction_id: transaction.auction_id, amount: transaction.amount },
    });
  }

  return NextResponse.json({ received: true });
}