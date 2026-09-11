"use client";

import { useState, useTransition } from "react";
import { runOpenRouterDemo } from "./actions";
import styles from "./demo.module.css";

export default function DemoForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { kind: "idle" } | { kind: "message"; text: string } | { kind: "error"; text: string }
  >({ kind: "idle" });

  function handleClick() {
    startTransition(async () => {
      const response = await runOpenRouterDemo();
      if ("error" in response) {
        setResult({ kind: "error", text: response.error });
      } else {
        setResult({ kind: "message", text: response.message });
      }
    });
  }

  return (
    <div>
      <button
        className={styles.button}
        type="button"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Sending…" : "Send a test message"}
      </button>

      {result.kind === "message" && (
        <p className={styles.response}>{result.text}</p>
      )}
      {result.kind === "error" && (
        <p className={styles.error}>{result.text}</p>
      )}
    </div>
  );
}
