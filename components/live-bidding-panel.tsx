"use client";

import { useActionState, useEffect, useState } from "react";
import { placeBid, type BidState } from "@/app/auctions/[id]/actions";
import { createClient } from "@/lib/supabase/client";

export type Bid = { id: string; bidderId: string; amount: number; createdAt: string; bidderName: string };

const initialState: BidState = {};

export function LiveBiddingPanel({ auctionId, currentPrice, status, endsAt, initialBids }: { auctionId: string; currentPrice: number; status: string; endsAt: string; initialBids: Bid[] }) {
  const [state, formAction, isPending] = useActionState(placeBid, initialState);
  const [price, setPrice] = useState(currentPrice);
  const [bids, setBids] = useState(initialBids);
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  const isOpen = status === "active" && remaining > 0;

  useEffect(() => {
    setPrice(currentPrice);
    setBids(initialBids);
  }, [currentPrice, initialBids]);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  useEffect(() => {
    if (!state.submittedAmount) return;
    setPrice((previous) => Math.max(previous, state.submittedAmount ?? previous));
  }, [state.submittedAmount]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`auction-bids-${auctionId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "bids", filter: `auction_id=eq.${auctionId}` }, (payload: { new: unknown }) => {
      const bid = payload.new as { id: string; bidder_id: string; amount: number | string; created_at: string };
      setPrice(Number(bid.amount));
      setBids((current) => current.some((entry) => entry.id === bid.id) ? current : [{ id: bid.id, bidderId: bid.bidder_id, amount: Number(bid.amount), createdAt: bid.created_at, bidderName: "New bidder" }, ...current].slice(0, 20));
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [auctionId]);

  const timeLabel = remaining === 0 ? "Closed" : `${Math.floor(remaining / 3_600_000)}h ${Math.floor((remaining % 3_600_000) / 60_000)}m ${Math.floor((remaining % 60_000) / 1000)}s`;

  return <section className="bid-panel" aria-live="polite"><dl className="auction-stats"><div><dt>Current price</dt><dd>${price.toFixed(2)}</dd></div><div><dt>Time remaining</dt><dd>{timeLabel}</dd></div></dl><form className="bid-form" action={formAction}><input type="hidden" name="auctionId" value={auctionId} /><label htmlFor="bid-amount">Your bid<input id="bid-amount" name="amount" type="number" min={(price + 0.01).toFixed(2)} step="0.01" placeholder={`Minimum $${(price + 0.01).toFixed(2)}`} required disabled={!isOpen || isPending} /></label>{state.error && <p className="form-message form-error" role="alert">{state.error}</p>}<button className="primary-button" type="submit" disabled={!isOpen || isPending}>{isPending ? "Placing bid..." : isOpen ? "Place bid" : "Bidding unavailable"}</button></form><div className="bid-history"><h2>Bid history</h2>{bids.length ? <ol>{bids.map((bid) => <li key={bid.id}><span>{bid.bidderName}</span><strong>${bid.amount.toFixed(2)}</strong><time dateTime={bid.createdAt}>{new Date(bid.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></li>)}</ol> : <p>No bids yet. Be the first to set the pace.</p>}</div></section>;
}