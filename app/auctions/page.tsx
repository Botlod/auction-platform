import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Browse auctions | Auction House" };

type AuctionItem = { title: string; image_urls: string[] };

export default async function AuctionsPage() {
  const supabase = await createClient();
  const { data: auctions } = await supabase.from("auctions").select("id, item_id, current_price, status, ends_at, items(title, image_urls)").in("status", ["scheduled", "active"]).order("ends_at", { ascending: true });
  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/dashboard">Dashboard</Link></header><section className="workspace-intro"><p className="eyebrow">Auction catalogue</p><h1>Lots worth watching.</h1><p>Approved auction lots, with live bidding to follow in the next phase.</p></section><section className="auction-grid">{auctions?.length ? auctions.map((auction) => { const item = (Array.isArray(auction.items) ? auction.items[0] : auction.items) as AuctionItem | null; return <Link className="auction-card" key={auction.id} href={`/auctions/${auction.id}`}><span className="lot-number">Lot</span><h2>{item?.title ?? "Untitled lot"}</h2><p>Current price</p><strong>${Number(auction.current_price).toFixed(2)}</strong><small>{auction.status}</small></Link>; }) : <p className="empty-message">The catalogue is being prepared. Check back soon.</p>}</section></main>;
}