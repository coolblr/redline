import { createClient } from "@/lib/supabase/server";
import styles from "./document.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <p className={styles.notice}>
            No account system is connected yet. Saved documents will work
            once a Supabase project is set up for this app.
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
          <p className={styles.notice}>Sign in to view this document.</p>
          <a className={styles.link} href="/login">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  // Row Level Security (see supabase/migrations/0001_documents.sql) already
  // restricts this select to documents owned by the signed-in user, so a
  // document that exists but belongs to someone else comes back the same
  // way as one that doesn't exist at all: no row, not an error.
  const { data: document } = await supabase
    .from("documents")
    .select("id, filename, extracted_text, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!document) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <p className={styles.notice}>
            Can&rsquo;t find that document. It may not exist, or it may
            belong to a different account.
          </p>
          <a className={styles.link} href="/app">
            Upload a document
          </a>
        </div>
      </main>
    );
  }

  const uploadedOn = new Date(document.created_at as string).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <main className={styles.page}>
      <a className={styles.wordmark} href="/">
        Redline
      </a>

      <div className={styles.card}>
        <h1 className={styles.heading}>
          {(document.filename as string | null) || "Untitled document"}
        </h1>
        <p className={styles.meta}>Uploaded {uploadedOn}</p>

        <pre className={styles.extractedText}>
          {(document.extracted_text as string) || "(No text was extracted from this file.)"}
        </pre>

        {/* Flags, defects, counter-offers, Q&A render here once available */}
      </div>
    </main>
  );
}
