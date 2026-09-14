import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard | Auction House" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();
  const displayName = profile?.full_name || session.user.email?.split("@")[0] || "Bidder";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="wordmark" href="/">Auction House</Link>
        <div className="nav-actions"><Link className="text-link" href="/auctions">Browse lots</Link><Link className="primary-button nav-button" href="/sell">Create listing</Link></div>
      </header>
      <section className="dashboard-intro">
        <p className="eyebrow">{profile?.role ?? "bidder"} dashboard</p>
        <h1>Good to see you, {displayName}.</h1>
        <p>Your account is ready. Active bids, won lots, listings, and notifications will appear here as we build the auction flow.</p>
      </section>
      <section className="dashboard-empty" aria-label="Auction activity">
        <span>01</span>
        <div>
          <h2>No auction activity yet</h2>
          <p>Browse the catalogue or submit a lot for administrator review.</p>
        </div>
      </section>
    </main>
  );
}