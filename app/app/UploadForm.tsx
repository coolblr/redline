"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseDocumentFile } from "@/lib/parse-document";
import { saveDocument } from "./actions";
import styles from "./app.module.css";

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "warning"; filename: string; text: string; warning: string }
  | { kind: "saving" }
  | { kind: "error"; text: string };

export default function UploadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function persist(filename: string, text: string) {
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const result = await saveDocument({ filename, text });
      if ("error" in result) {
        setStatus({ kind: "error", text: result.error });
        return;
      }
      router.push(`/documents/${result.id}`);
    });
  }

  async function handleFile(file: File) {
    setStatus({ kind: "reading" });
    try {
      const { text, warning } = await parseDocumentFile(file);
      if (warning) {
        setStatus({ kind: "warning", filename: file.name, text, warning });
        return;
      }
      persist(file.name, text);
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Couldn't read that file.",
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isBusy = status.kind === "reading" || status.kind === "saving" || isPending;

  return (
    <div>
      {status.kind !== "warning" && (
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <p className={styles.dropzoneText}>
            Drag a file here, or choose one from your device.
          </p>
          <button
            type="button"
            className={styles.button}
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {status.kind === "reading"
              ? "Reading…"
              : status.kind === "saving"
                ? "Saving…"
                : "Choose a file"}
          </button>
          <input
            ref={inputRef}
            className={styles.hiddenInput}
            type="file"
            accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleInputChange}
            disabled={isBusy}
          />
        </div>
      )}

      {status.kind === "error" && (
        <p className={styles.error}>{status.text}</p>
      )}

      {status.kind === "warning" && (
        <div className={styles.warningBox}>
          <p className={styles.warning}>{status.warning}</p>
          <div className={styles.row}>
            <button
              type="button"
              className={styles.button}
              disabled={isPending}
              onClick={() => persist(status.filename, status.text)}
            >
              {isPending ? "Saving…" : "Save it anyway"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={() => setStatus({ kind: "idle" })}
            >
              Choose a different file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
