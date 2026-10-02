"use client";

// The "Run analysis" form on the document page. The model call takes a while,
// so the button reads the form's pending state (useFormStatus) and disables
// itself: without that the page looks frozen and a second click starts a
// second paid analysis. If the analysis fails, runAnalysisAction (see
// ./actions.ts) returns a short message, shown under the button, instead of
// letting the error take the page down.

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { runAnalysisAction } from "./actions";
import type { AnalysisActionState } from "@/lib/analysis-errors";
import styles from "./document.module.css";

function RunAnalysisButton() {
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

export function RunAnalysisForm({ documentId }: { documentId: string }) {
  const [state, formAction] = useActionState<AnalysisActionState, FormData>(
    runAnalysisAction.bind(null, documentId),
    { error: null }
  );

  return (
    <form action={formAction}>
      <RunAnalysisButton />
      {state.error ? (
        <p className={styles.runError} role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
