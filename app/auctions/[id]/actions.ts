"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BidState = { error?: string; submittedAmount?: number };

export async function placeBid(_: BidState, formData: FormData): Promise<BidState> {
  const auctionId = String(formData.get("auctionId") ?? "");
  const amount = Number(formData.get("amount"));

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(auctionId)) return { error: "This auction could not be identified." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a bid greater than zero." };

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { error: "Please sign in before placing a bid." };

  const { error } = await supabase.from("bids").insert({ auction_id: auctionId, bidder_id: session.user.id, amount });
  if (error) return { error: error.message };

  revalidatePath(`/auctions/${auctionId}`);
  revalidatePath("/auctions");
  return { submittedAmount: amount };
}