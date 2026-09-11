import { createClient } from "@/lib/supabase/server";
import UploadForm from "./UploadForm";
import styles from "./app.module.css";

export default async function UploadPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <h1 className={styles.heading}>Upload a document</h1>
          <p className={styles.notice}>
            No account system is connected yet. Uploading will work once a
            Supabase project is set up for this app.
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
          <h1 className={styles.heading}>Upload a document</h1>
          <p className={styles.notice}>Sign in to upload a document.</p>
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
        <h1 className={styles.heading}>Upload a document</h1>
        <p className={styles.notice}>
          Pick the contract or agreement you were sent. Redline reads it in
          your browser: only the text gets saved, never the file itself. It
          accepts .txt, .pdf, and .docx. Scanned PDFs won&rsquo;t work, since
          there&rsquo;s no text on the page for Redline to read.
        </p>
        <UploadForm />
        <p className={styles.notice}>
          <a className={styles.link} href="/red-lines">
            Edit what Redline flags for you
          </a>
        </p>
      </div>
    </main>
  );
}
