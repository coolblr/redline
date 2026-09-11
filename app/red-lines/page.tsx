import { createClient } from "@/lib/supabase/server";
import { getOrSeedRedLines } from "@/lib/red-lines-store";
import RedLinesEditor from "./RedLinesEditor";
import styles from "./red-lines.module.css";

export default async function RedLinesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <h1 className={styles.heading}>My red lines</h1>
          <p className={styles.notice}>
            No account system is connected yet. Editing your red lines will
            work once a Supabase project is set up for this app.
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
          <h1 className={styles.heading}>My red lines</h1>
          <p className={styles.notice}>Sign in to view and edit your red lines.</p>
          <a className={styles.link} href="/login">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  const redLines = await getOrSeedRedLines(supabase, user.id);

  return (
    <main className={styles.page}>
      <a className={styles.wordmark} href="/">
        Redline
      </a>
      <div className={styles.card}>
        <h1 className={styles.heading}>My red lines</h1>
        <p className={styles.notice}>
          These are the clause types Redline checks for and what to look for
          within each one. Turn one off if you don&rsquo;t want it flagged,
          or edit the guidance to change what counts as worth flagging.
          Changes take effect the next time you run analysis on a document.
        </p>
        <RedLinesEditor redLines={redLines} />
      </div>
    </main>
  );
}
