import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteListing, reviewListing } from "@/app/admin/items/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Listing review | Auction House" };

export default async function AdminItemsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: items } = await supabase.from("items").select("id, title, description, starting_price, status, created_at, auctions(status, ends_at)").order("created_at", { ascending: false });
  const pendingItems = items?.filter((item) => item.status === "pending") ?? [];
  const reviewedItems = items?.filter((item) => item.status !== "pending") ?? [];

  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/dashboard">Dashboard</Link></header><section className="workspace-intro"><p className="eyebrow">Administrator</p><h1>Listing review.</h1><p>{pendingItems.length} pending {pendingItems.length === 1 ? "listing" : "listings"}.</p></section><section className="review-list">{pendingItems.length ? pendingItems.map((item) => <article className="review-item" key={item.id}><div><h2>{item.title}</h2><p>{item.description || "No description provided."}</p><strong>${Number(item.starting_price).toFixed(2)}</strong></div><div className="review-actions"><form action={reviewListing}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="status" value="approved" /><button className="primary-button" type="submit">Approve</button></form><form action={reviewListing}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="status" value="rejected" /><button className="secondary-button" type="submit">Reject</button></form></div></article>) : <p className="empty-message">There are no listings awaiting review.</p>}</section><section className="workspace-intro admin-history"><p className="eyebrow">Listing history</p><h2>Reviewed listings</h2></section><section className="review-list">{reviewedItems.length ? reviewedItems.map((item) => { const auction = Array.isArray(item.auctions) ? item.auctions[0] : item.auctions; return <article className="review-item" key={item.id}><div><h2>{item.title}</h2><p>{item.status} listing{auction ? ` | ${auction.status} auction` : ""}</p><strong>${Number(item.starting_price).toFixed(2)}</strong></div><form action={deleteListing}><input type="hidden" name="itemId" value={item.id} /><button className="secondary-button" type="submit">Remove</button></form></article>; }) : <p className="empty-message">No reviewed listings yet.</p>}</section></main>;
}