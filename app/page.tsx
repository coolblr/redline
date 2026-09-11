import styles from "./page.module.css";

type Flag = {
  clause: string;
  citation: string;
  exposure: string;
  tier: "Top" | "Middle" | "Cite-only";
};

const sampleFlags: Flag[] = [
  {
    clause: "Indemnification",
    citation:
      "You agree to indemnify, defend, and hold harmless the Client from and against any and all claims, damages, liabilities, and expenses, without limitation.",
    exposure: "Uncapped, one-sided",
    tier: "Top",
  },
  {
    clause: "Limitation of Liability",
    citation:
      "Client's total liability under this Agreement shall not exceed the fees paid in the preceding three (3) months; this limitation does not apply to Contractor.",
    exposure: "Capped, one-sided",
    tier: "Middle",
  },
  {
    clause: "Arbitration",
    citation:
      "Any dispute arising under this Agreement shall be resolved through binding arbitration, and each party waives the right to a jury trial or class action.",
    exposure: "Capped, mutual · Standard",
    tier: "Cite-only",
  },
];

const tierClass: Record<Flag["tier"], string> = {
  Top: styles.tierTop,
  Middle: styles.tierMiddle,
  "Cite-only": styles.tierCiteOnly,
};

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <p className={styles.wordmark}>Redline</p>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.headline}>Know what you&rsquo;re signing.</h1>
          <p className={styles.subhead}>
            Upload the contract you were sent. Redline finds what&rsquo;s
            worth a closer look, and shows the exact sentence it came from.
          </p>
        </div>

        <section className={styles.ledger} aria-label="Sample flagged clauses">
          <div className={styles.ledgerHeader}>
            <span>Clause</span>
            <span>Exposure</span>
            <span>Tier</span>
          </div>

          {sampleFlags.map((flag, i) => (
            <div
              className={styles.row}
              key={flag.clause}
              style={{ "--delay": `${i * 0.12}s` } as React.CSSProperties}
            >
              <div className={styles.clauseCell}>
                <p className={styles.clauseName}>{flag.clause}</p>
                <p className={styles.citation}>{flag.citation}</p>
              </div>
              <p className={styles.exposure}>{flag.exposure}</p>
              <p className={`${styles.tier} ${tierClass[flag.tier]}`}>
                {flag.tier}
              </p>
            </div>
          ))}

          <div className={styles.totals}>
            <span>3 clauses flagged: 1 top, 1 middle, 1 cite-only.</span>
          </div>
          <p className={styles.sampleNote}>
            Sample clauses, included for illustration only. Not a real
            customer&rsquo;s document.
          </p>

          <div className={styles.action}>
            <a className={styles.cta} href="/app">
              Try it on a document
            </a>
            <p className={styles.scopeLine}>
              Built to read freelance and service agreements you&rsquo;ve been
              sent. Typed or exported text only, not scans.
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerNote}>Redline</p>
        <p className={styles.footerNote}>
          States what the document says, never what a court would do.
        </p>
      </footer>
    </div>
  );
}
