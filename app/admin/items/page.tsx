import Link from "next/link";
import { redirect } from "next/navigation";
import { updateItemStatus } from "@/app/sell/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Listing review | Auction House" };

export default async function AdminItemsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: items } = await supabase.from("items").select("id, title, description, starting_price, created_at").eq("status", "pending").order("created_at", { ascending: true });

  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/dashboard">Dashboard</Link></header><section className="workspace-intro"><p className="eyebrow">Administrator</p><h1>Listing review.</h1><p>{items?.length ?? 0} pending {items?.length === 1 ? "listing" : "listings"}.</p></section><section className="review-list">{items?.length ? items.map((item) => <article className="review-item" key={item.id}><div><h2>{item.title}</h2><p>{item.description || "No description provided."}</p><strong>${Number(item.starting_price).toFixed(2)}</strong></div><div className="review-actions"><form action={async () => { "use server"; await updateItemStatus(item.id, "approved"); }}><button className="primary-button" type="submit">Approve</button></form><form action={async () => { "use server"; await updateItemStatus(item.id, "rejected"); }}><button className="secondary-button" type="submit">Reject</button></form></div></article>) : <p className="empty-message">There are no listings awaiting review.</p>}</section></main>;
}