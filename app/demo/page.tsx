import { createClient } from "@/lib/supabase/server";
import DemoForm from "./DemoForm";
import styles from "./demo.module.css";

export default async function DemoPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <h1 className={styles.heading}>OpenRouter demo</h1>
          <p className={styles.notice}>
            No account system is connected yet. This page needs a signed-in
            User once one exists.
          </p>
        </div>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <h1 className={styles.heading}>OpenRouter demo</h1>
          <p className={styles.notice}>Sign in to try this.</p>
          <a className={styles.link} href="/login">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <a className={styles.wordmark} href="/">
        Redline
      </a>
      <div className={styles.card}>
        <h1 className={styles.heading}>OpenRouter demo</h1>
        <p className={styles.notice}>
          Signed in as {user.email}. This sends a small test request through
          the OpenRouter wrapper and shows what comes back.
        </p>
        <DemoForm />
        <form className={styles.signOutForm} action="/auth/signout" method="post">
          <button className={styles.secondaryButton} type="submit">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
