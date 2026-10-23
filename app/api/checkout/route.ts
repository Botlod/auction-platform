import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });

  const formData = await request.formData();
  const transactionId = String(formData.get("transactionId") ?? "");
  if (!transactionId) return NextResponse.json({ error: "The payment could not be identified." }, { status: 400 });

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id, auction_id, amount, status, auctions(items(title))")
    .eq("id", transactionId)
    .eq("buyer_id", session.user.id)
    .single();
  if (error || !transaction) return NextResponse.json({ error: "This payment is unavailable." }, { status: 404 });
  if (transaction.status !== "pending") return NextResponse.json({ error: "This auction has already been paid for or cannot be paid." }, { status: 409 });

  const auction = Array.isArray(transaction.auctions) ? transaction.auctions[0] : transaction.auctions;
  const item = auction && (Array.isArray(auction.items) ? auction.items[0] : auction.items);
  const stripe = new Stripe(stripeSecretKey);
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email,
    line_items: [{ price_data: { currency: "usd", product_data: { name: item?.title ?? "Auction purchase" }, unit_amount: Math.round(Number(transaction.amount) * 100) }, quantity: 1 }],
    metadata: { transactionId: transaction.id, auctionId: transaction.auction_id },
    success_url: `${request.nextUrl.origin}/wins?payment=success`,
    cancel_url: `${request.nextUrl.origin}/wins?payment=cancelled`,
  });

  if (!checkout.url) return NextResponse.json({ error: "Stripe could not start checkout." }, { status: 502 });
  return NextResponse.redirect(checkout.url, 303);
}