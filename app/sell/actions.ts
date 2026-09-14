"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ListingState = { error?: string };

function readPrice(value: FormDataEntryValue | null) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export async function createListing(_: ListingState, formData: FormData): Promise<ListingState> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return { error: "Please sign in before creating a listing." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startingPrice = readPrice(formData.get("startingPrice"));
  const reserveValue = String(formData.get("reservePrice") ?? "").trim();
  const reservePrice = reserveValue ? readPrice(reserveValue) : null;
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  let imagePaths: string[] = [];

  try {
    imagePaths = JSON.parse(String(formData.get("imagePaths") ?? "[]"));
  } catch {
    return { error: "The uploaded image information is invalid. Please try again." };
  }

  if (!title || title.length > 160) return { error: "Enter a title of up to 160 characters." };
  if (startingPrice === null || startingPrice <= 0) return { error: "Enter a starting price greater than zero." };
  if (reserveValue && (reservePrice === null || reservePrice < startingPrice)) return { error: "Reserve price must be at least the starting price." };
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return { error: "Choose an end time after the start time." };
  if (!imagePaths.every((path) => path.startsWith(`${userId}/`))) return { error: "One or more images do not belong to your account." };

  const { data: item, error: itemError } = await supabase
    .from("items")
    .insert({ seller_id: userId, title, description: description || null, image_urls: imagePaths, starting_price: startingPrice, reserve_price: reservePrice })
    .select("id")
    .single();
  if (itemError) return { error: itemError.message };

  const { error: auctionError } = await supabase
    .from("auctions")
    .insert({ item_id: item.id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), current_price: startingPrice });
  if (auctionError) return { error: auctionError.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateItemStatus(itemId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("You must be signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") throw new Error("Only administrators can review listings.");

  const { error } = await supabase.from("items").update({ status }).eq("id", itemId).eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/items");
  revalidatePath("/auctions");
}