"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("You must be signed in.");

  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (error || profile?.role !== "admin") throw new Error("Only administrators can manage listings.");
  return supabase;
}

export async function reviewListing(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!itemId || (status !== "approved" && status !== "rejected")) throw new Error("The listing review request is invalid.");

  const supabase = await requireAdmin();
  const { error } = await supabase.from("items").update({ status }).eq("id", itemId).eq("status", "pending");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/items");
  revalidatePath("/auctions");
}

export async function deleteListing(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) throw new Error("The listing could not be identified.");

  const supabase = await requireAdmin();
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/items");
  revalidatePath("/auctions");
}