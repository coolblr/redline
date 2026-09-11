"use client";

// Small client component so the submit button can show a pending state
// while askQuestion (a Server Action, see ./actions.ts) is in flight, and
// so the input clears itself after a successful ask. Server Actions can be
// imported into and called directly from a Client Component -- this isn't
// a <form action={...}> because askQuestion's signature is
// (documentId, question), not (documentId, FormData), matching the plain
// two-argument shape given in the ticket.

import { useState, useTransition } from "react";
import { askQuestion } from "./actions";
import styles from "./qa.module.css";

export function QaForm({ documentId }: { documentId: string }) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await askQuestion(documentId, trimmed);
        setQuestion("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <input
          className={styles.input}
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What do you want to know?"
          aria-label="Question about this document"
          disabled={isPending}
        />
        <button type="submit" className={styles.submitButton} disabled={isPending}>
          {isPending ? "Asking…" : "Ask"}
        </button>
      </div>
      {error ? <p className={styles.formError}>{error}</p> : null}
    </form>
  );
}
