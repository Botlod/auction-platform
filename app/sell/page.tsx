import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateListingForm } from "@/components/create-listing-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Create listing | Auction House" };

export default async function SellPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) redirect("/login");

  return <main className="workspace-page"><header className="dashboard-header"><Link className="wordmark" href="/">Auction House</Link><Link className="text-link" href="/dashboard">Dashboard</Link></header><section className="workspace-intro"><p className="eyebrow">Seller workspace</p><h1>Offer a new lot.</h1><p>Set your opening price and auction window. Listings are published only after an administrator has reviewed them.</p></section><section className="workspace-form"><CreateListingForm userId={userId} /></section></main>;
}