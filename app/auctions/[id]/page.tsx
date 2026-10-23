import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveBiddingPanel, type Bid } from "@/components/live-bidding-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AuctionDetailPage({ params }: PageProps<"/auctions/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  await supabase.rpc("process_auction_lifecycle");
  const [{ data: auction }, { data: bids }] = await Promise.all([
    supabase.from("auctions").select("id, current_price, status, starts_at, ends_at, items(title, description, image_urls, starting_price)").eq("id", id).single(),
    supabase.from("bids").select("id, bidder_id, amount, created_at, profiles(full_name)").eq("auction_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!auction) notFound();
  const item = (Array.isArray(auction.items) ? auction.items[0] : auction.items) as { title: string; description: string | null; image_urls: string[]; starting_price: number } | null;
  const imagePath = item?.image_urls?.[0];
  const imageUrl = imagePath ? supabase.storage.from("item-images").getPublicUrl(imagePath).data.publicUrl : null;
  const initialBids: Bid[] = (bids ?? []).map((bid) => {
    const profile = Array.isArray(bid.profiles) ? bid.profiles[0] : bid.profiles;
    return { id: bid.id, bidderId: bid.bidder_id, amount: Number(bid.amount), createdAt: bid.created_at, bidderName: profile?.full_name ?? "Anonymous bidder" };
  });

  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/auctions">All lots</Link></header><section className="lot-detail">{imageUrl && <img src={imageUrl} alt={item?.title ?? "Auction lot"} />}<div><p className="eyebrow">{auction.status} lot</p><h1>{item?.title ?? "Untitled lot"}</h1><p>{item?.description || "No description provided."}</p><LiveBiddingPanel auctionId={auction.id} currentPrice={Number(auction.current_price)} status={auction.status} endsAt={auction.ends_at} initialBids={initialBids} /></div></section></main>;
}