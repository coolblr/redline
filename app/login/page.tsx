"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" }
    | { kind: "working" }
    | { kind: "error"; text: string }
    | { kind: "check-email" }
  >({ kind: "idle" });
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setSignedInEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  if (!supabase) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <p className={styles.notice}>
            No account system is connected yet. Sign-in will work once a
            Supabase project is set up for this app.
          </p>
        </div>
      </main>
    );
  }

  if (signedInEmail) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <p className={styles.notice}>Signed in as {signedInEmail}.</p>
          <div className={styles.row}>
            <a className={styles.link} href="/demo">
              Go to the demo
            </a>
            <form action="/auth/signout" method="post">
              <button className={styles.secondaryButton} type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setStatus({ kind: "working" });

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus({ kind: "error", text: error.message });
        return;
      }
      router.push("/demo");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus({ kind: "error", text: error.message });
      return;
    }
    setStatus({ kind: "check-email" });
  }

  return (
    <main className={styles.page}>
      <a className={styles.wordmark} href="/">
        Redline
      </a>

      <div className={styles.card}>
        <h1 className={styles.heading}>
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {status.kind === "error" && (
            <p className={styles.error}>{status.text}</p>
          )}
          {status.kind === "check-email" && (
            <p className={styles.notice}>
              Check your email to confirm the account, then sign in.
            </p>
          )}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={status.kind === "working"}
          >
            {status.kind === "working"
              ? "Working…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          className={styles.toggle}
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setStatus({ kind: "idle" });
          }}
        >
          {mode === "sign-in"
            ? "Need an account? Create one."
            : "Already have an account? Sign in."}
        </button>
      </div>
    </main>
  );
}
