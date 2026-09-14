import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuctionDetailPage({ params }: PageProps<"/auctions/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auction } = await supabase.from("auctions").select("id, current_price, status, starts_at, ends_at, items(title, description, image_urls, starting_price)").eq("id", id).single();
  if (!auction) notFound();
  const item = (Array.isArray(auction.items) ? auction.items[0] : auction.items) as { title: string; description: string | null; image_urls: string[]; starting_price: number } | null;
  const imagePath = item?.image_urls?.[0];
  const imageUrl = imagePath ? supabase.storage.from("item-images").getPublicUrl(imagePath).data.publicUrl : null;
  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/auctions">All lots</Link></header><section className="lot-detail">{imageUrl && <img src={imageUrl} alt={item?.title ?? "Auction lot"} />}<div><p className="eyebrow">{auction.status} lot</p><h1>{item?.title ?? "Untitled lot"}</h1><p>{item?.description || "No description provided."}</p><dl><div><dt>Current price</dt><dd>${Number(auction.current_price).toFixed(2)}</dd></div><div><dt>Auction ends</dt><dd>{new Date(auction.ends_at).toLocaleString()}</dd></div></dl><p className="detail-note">Live bidding will be enabled in Phase 3.</p></div></section></main>;
}