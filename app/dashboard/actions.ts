"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) throw new Error("The notification could not be identified.");

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("You must be signed in.");

  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", session.user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}