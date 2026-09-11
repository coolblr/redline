import { createClient } from "@/lib/supabase/server";
import { documentStatusLabel } from "@/lib/document-status";
import styles from "./library.module.css";

type PersistedDocument = {
  id: string;
  filename: string | null;
  summary: string | null;
  created_at: string;
};

export default async function LibraryPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className={styles.page}>
        <a className={styles.wordmark} href="/">
          Redline
        </a>
        <div className={styles.card}>
          <h1 className={styles.heading}>Your documents</h1>
          <p className={styles.notice}>
            No account system is connected yet. Saved documents will show up
            here once a Supabase project is set up for this app.
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
          <h1 className={styles.heading}>Your documents</h1>
          <p className={styles.notice}>Sign in to view your saved documents.</p>
          <a className={styles.link} href="/login">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  // RLS (supabase/migrations/0001_documents.sql) already restricts this to
  // the signed-in user's own rows; filtering by user_id here too matches
  // this codebase's convention of not relying on RLS alone (see
  // app/documents/[id]/page.tsx's own query).
  const { data: documentRows } = await supabase
    .from("documents")
    .select("id, filename, summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const documents = (documentRows as PersistedDocument[] | null) ?? [];

  return (
    <main className={styles.page}>
      <a className={styles.wordmark} href="/">
        Redline
      </a>
      <div className={styles.card}>
        <h1 className={styles.heading}>Your documents</h1>

        {documents.length === 0 ? (
          <>
            <p className={styles.notice}>No documents yet.</p>
            <a className={styles.link} href="/app">
              Upload a document
            </a>
          </>
        ) : (
          <div className={styles.list}>
            {documents.map((document) => {
              const uploadedOn = new Date(document.created_at).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              );

              return (
                <a
                  className={styles.row}
                  href={`/documents/${document.id}`}
                  key={document.id}
                >
                  <div className={styles.rowHead}>
                    <p className={styles.filename}>
                      {document.filename || "Untitled document"}
                    </p>
                    <span className={styles.status}>
                      {documentStatusLabel(document.summary)}
                    </span>
                  </div>
                  <p className={styles.meta}>Uploaded {uploadedOn}</p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
