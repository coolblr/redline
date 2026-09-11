"use client";

import { useState, useTransition } from "react";
import { saveRedLine } from "./actions";
import type { RedLine } from "@/lib/red-lines";
import type { ClauseType } from "@/lib/domain-types";
import styles from "./red-lines.module.css";

const CLAUSE_LABELS: Record<ClauseType, string> = {
  indemnification: "Indemnification",
  "ip-assignment": "IP Assignment",
  "limitation-of-liability": "Limitation of Liability",
  "non-compete": "Non-Compete",
  "unilateral-termination": "Unilateral Termination",
  "scope-creep": "Scope Creep",
  arbitration: "Arbitration",
};

type RowState = {
  guidance: string;
  enabled: boolean;
  status: "idle" | "saving" | "saved" | "error";
  errorText?: string;
};

function initialRowState(redLine: RedLine): RowState {
  return { guidance: redLine.guidance, enabled: redLine.enabled, status: "idle" };
}

type Props = {
  redLines: RedLine[];
};

export default function RedLinesEditor({ redLines }: Props) {
  const [rows, setRows] = useState<Record<ClauseType, RowState>>(() =>
    Object.fromEntries(
      redLines.map((redLine) => [redLine.clauseType, initialRowState(redLine)])
    ) as Record<ClauseType, RowState>
  );
  const [, startTransition] = useTransition();

  function updateRow(clauseType: ClauseType, patch: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [clauseType]: { ...prev[clauseType], ...patch },
    }));
  }

  function handleSave(clauseType: ClauseType) {
    const row = rows[clauseType];
    updateRow(clauseType, { status: "saving", errorText: undefined });
    startTransition(async () => {
      const result = await saveRedLine(clauseType, row.guidance, row.enabled);
      if ("error" in result) {
        updateRow(clauseType, { status: "error", errorText: result.error });
        return;
      }
      updateRow(clauseType, { status: "saved" });
    });
  }

  return (
    <div className={styles.list}>
      {redLines.map((redLine) => {
        const row = rows[redLine.clauseType];
        return (
          <div className={styles.row} key={redLine.clauseType}>
            <div className={styles.rowHead}>
              <p className={styles.clauseName}>{CLAUSE_LABELS[redLine.clauseType]}</p>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={row.enabled}
                  onChange={(e) =>
                    updateRow(redLine.clauseType, {
                      enabled: e.target.checked,
                      status: "idle",
                    })
                  }
                />
                Flag this clause type
              </label>
            </div>

            <textarea
              className={styles.textarea}
              value={row.guidance}
              disabled={!row.enabled}
              onChange={(e) =>
                updateRow(redLine.clauseType, {
                  guidance: e.target.value,
                  status: "idle",
                })
              }
              rows={3}
            />

            <div className={styles.rowFoot}>
              <button
                type="button"
                className={styles.saveButton}
                disabled={row.status === "saving" || row.guidance.trim() === ""}
                onClick={() => handleSave(redLine.clauseType)}
              >
                {row.status === "saving" ? "Saving…" : "Save"}
              </button>
              {row.status === "saved" && <p className={styles.status}>Saved.</p>}
              {row.status === "error" && (
                <p className={`${styles.status} ${styles.statusError}`}>
                  {row.errorText}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
