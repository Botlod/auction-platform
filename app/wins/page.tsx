import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My wins | Auction House" };

export default async function WinsPage({ searchParams }: PageProps<"/wins">) {
  const { payment } = await searchParams;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, status, created_at, auctions(items(title))")
    .eq("buyer_id", session.user.id)
    .order("created_at", { ascending: false });

  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/dashboard">Dashboard</Link></header><section className="workspace-intro"><p className="eyebrow">Purchases</p><h1>My winning lots.</h1><p>{payment === "success" ? "Payment received. It may take a moment to appear as paid." : payment === "cancelled" ? "Payment was cancelled. Your winning lot remains available to pay." : "Complete payment for auction lots you have won."}</p></section><section className="review-list">{transactions?.length ? transactions.map((transaction) => { const auction = Array.isArray(transaction.auctions) ? transaction.auctions[0] : transaction.auctions; const item = auction && (Array.isArray(auction.items) ? auction.items[0] : auction.items); return <article className="review-item" key={transaction.id}><div><h2>{item?.title ?? "Auction lot"}</h2><p>{transaction.status}</p><strong>${Number(transaction.amount).toFixed(2)}</strong></div>{transaction.status === "pending" && <form action="/api/checkout" method="post"><input type="hidden" name="transactionId" value={transaction.id} /><button className="primary-button" type="submit">Pay now</button></form>}</article>; }) : <p className="empty-message">You have not won an auction yet.</p>}</section></main>;
}