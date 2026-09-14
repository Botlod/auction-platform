"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";

  async function clearSession() {
    setError(null);
    setNotice(null);
    await createClient().auth.signOut({ scope: "local" });
    window.location.reload();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const supabase = createClient();
    const result = isRegistering
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(formData.get("fullName")) },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (isRegistering && !result.data.session) {
      setNotice("Check your email to confirm your account, then return here to sign in.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="wordmark" href="/">Auction House</Link>
        <p className="eyebrow">Live lots. Clear terms. Serious bidding.</p>
        <h1>{isRegistering ? "Create your bidder account." : "Welcome back."}</h1>
        <p className="auth-copy">
          {isRegistering
            ? "Join the room to follow lots, place bids, and keep every purchase in one place."
            : "Sign in to follow the auctions and lots that matter to you."}
        </p>
      </section>
      <section className="auth-panel" aria-labelledby="auth-heading">
        <div>
          <p className="eyebrow">{isRegistering ? "New account" : "Account access"}</p>
          <h2 id="auth-heading">{isRegistering ? "Start bidding" : "Sign in"}</h2>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Full name
              <input name="fullName" type="text" autoComplete="name" required />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={6} required />
          </label>
          {error && <p className="form-message form-error" role="alert">{error}</p>}
          {notice && <p className="form-message form-notice" role="status">{notice}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Working..." : isRegistering ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          {isRegistering ? "Already registered?" : "New to Auction House?"}{" "}
          <Link href={isRegistering ? "/login" : "/register"}>{isRegistering ? "Sign in" : "Create an account"}</Link>
        </p>
        {!isRegistering && <button className="session-reset" type="button" onClick={clearSession}>Clear saved session</button>}
      </section>
    </main>
  );
}