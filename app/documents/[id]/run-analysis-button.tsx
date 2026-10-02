"use client";

// Submit button for the "Run analysis" form on the document page. Reads the
// form's pending state with useFormStatus so the button disables and says
// what it's doing while runAnalysis (a Server Action, see ./actions.ts) is
// in flight. The model call takes a while, and without this the page looks
// frozen and a second click starts a second paid analysis.

import { useFormStatus } from "react-dom";
import styles from "./document.module.css";

export function RunAnalysisButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.runButton}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Analyzing…" : "Run analysis"}
    </button>
  );
}
