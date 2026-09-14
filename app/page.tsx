import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <nav className="site-nav">
        <Link className="wordmark" href="/">Auction House</Link>
        <div className="nav-actions">
          <Link className="text-link" href="/auctions">Browse lots</Link>
          <Link className="text-link" href="/login">Sign in</Link>
          <Link className="primary-button nav-button" href="/register">Create account</Link>
        </div>
      </nav>
      <section className="home-hero">
        <p className="eyebrow">The catalogue opens soon</p>
        <h1>Every lot has a story.</h1>
        <p>Register now to follow the first release of verified lots, bid in real time, and keep your auction history together.</p>
        <Link className="primary-button" href="/register">Join the auction</Link>
      </section>
      <section className="home-ticker" aria-label="Platform details">
        <span>Live bidding</span><span>Verified listings</span><span>Secure checkout</span>
      </section>
    </main>
  );
}
