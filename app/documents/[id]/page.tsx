import { createClient } from "@/lib/supabase/server";
import { runAnalysis } from "./actions";
import styles from "./document.module.css";
import ledgerStyles from "./ledger.module.css";
import type { ClauseType, SeverityTier, StandardOrUnusual, TreatmentDepth } from "@/lib/domain-types";

type Props = {
  params: Promise<{ id: string }>;
};

type PersistedFlag = {
  id: string;
  clause_type: ClauseType;
  severity_tier: SeverityTier;
  standard_or_unusual: StandardOrUnusual;
  treatment_depth: TreatmentDepth;
  citation: string;
  rationale: string;
};

const CLAUSE_LABELS: Record<ClauseType, string> = {
  indemnification: "Indemnification",
  "ip-assignment": "IP Assignment",
  "limitation-of-liability": "Limitation of Liability",
  "non-compete": "Non-Compete",
  "unilateral-termination": "Unilateral Termination",
  "scope-creep": "Scope Creep",
  arbitration: "Arbitration",
};

const TIER_LABELS: Record<SeverityTier, string> = {
  top: "Top",
  middle: "Middle",
  "cite-only": "Cite-only",
};

const TIER_CLASS: Record<SeverityTier, string> = {
  top: ledgerStyles.tierTop,
  middle: ledgerStyles.tierMiddle,
  "cite-only": ledgerStyles.tierCiteOnly,
};

const TIER_ORDER: Record<SeverityTier, number> = {
  top: 0,
  middle: 1,
  "cite-only": 2,
};

// Exposure is derived from the tier itself: computeSeverityTier
// (lib/seams/severity.ts) guarantees "top" only occurs when exposure is
// uncapped, and both "middle" and "cite-only" only occur when it's capped.
// The mutual/one-sided half of that test isn't persisted as its own
// column, since the Tier column already carries it (middle vs. cite-only
// is exactly that distinction) -- showing it twice would be redundant.
function exposureLabel(tier: SeverityTier): string {
  return tier === "top" ? "Uncapped" : "Capped";
}

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
    .select("id, filename, extracted_text, summary, created_at")
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

  const summary = document.summary as string | null;
  const analyzed = Boolean(summary);

  // Only fetch flags once a document has been analyzed -- rendering from
  // what's persisted, never re-running analysis on a page load (ticket 10
  // depends on this; see the comment in ./actions.ts).
  let flags: PersistedFlag[] = [];
  if (analyzed) {
    const { data: flagRows } = await supabase
      .from("flags")
      .select("id, clause_type, severity_tier, standard_or_unusual, treatment_depth, citation, rationale")
      .eq("document_id", document.id);
    flags = ((flagRows as PersistedFlag[] | null) ?? []).slice().sort(
      (a, b) => TIER_ORDER[a.severity_tier] - TIER_ORDER[b.severity_tier]
    );
  }

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

        {analyzed ? (
          <>
            <p className={styles.sectionLabel}>Summary</p>
            <p className={styles.summaryText}>{summary}</p>

            <p className={styles.sectionLabel}>Flags</p>
            <section className={ledgerStyles.ledger} aria-label="Flagged clauses">
              <div className={ledgerStyles.ledgerHeader}>
                <span>Clause</span>
                <span>Exposure</span>
                <span>Tier</span>
              </div>

              {flags.length === 0 ? (
                <p className={ledgerStyles.empty}>
                  No clauses from Redline&rsquo;s red-line list turned up in this
                  document.
                </p>
              ) : (
                <>
                  {flags.map((flag) => (
                    <div className={ledgerStyles.row} key={flag.id}>
                      <div className={ledgerStyles.clauseCell}>
                        <p className={ledgerStyles.clauseName}>
                          {CLAUSE_LABELS[flag.clause_type]}
                        </p>
                        <p className={ledgerStyles.citation}>{flag.citation}</p>
                      </div>
                      <p className={ledgerStyles.exposure}>
                        {exposureLabel(flag.severity_tier)}
                      </p>
                      <p
                        className={`${ledgerStyles.tier} ${TIER_CLASS[flag.severity_tier]}`}
                      >
                        {TIER_LABELS[flag.severity_tier]}
                      </p>
                    </div>
                  ))}
                  <p className={ledgerStyles.closing}>
                    {flags.length} clause{flags.length === 1 ? "" : "s"} checked.
                  </p>
                </>
              )}
            </section>
          </>
        ) : (
          <div className={styles.runAnalysis}>
            <p className={styles.runNotice}>
              This document hasn&rsquo;t been analyzed yet. Running analysis
              produces a summary and a severity-ranked list of flagged
              clauses, cited to the exact sentence each one came from.
            </p>
            <form action={runAnalysis.bind(null, document.id as string)}>
              <button type="submit" className={styles.runButton}>
                Run analysis
              </button>
            </form>
          </div>
        )}

        <p className={styles.sectionLabel}>Extracted text</p>
        <pre className={styles.extractedText}>
          {(document.extracted_text as string) || "(No text was extracted from this file.)"}
        </pre>

        {/* Document defects, counter-offers, and Q&A render here once available */}
      </div>
    </main>
  );
}
