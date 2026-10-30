// Pure helpers for the gold-set eval (npm run eval). No network and no model:
// everything here is testable on its own (tests/lib/eval-gold-set.test.ts).

import { readFileSync } from "node:fs";
import path from "node:path";

export const GOLD_CORPUS_DIR = path.join(__dirname, "gold-set", "corpus");

// The gold set's seven clause types, and how this product's seven map onto
// them. Written into eval/README.md as well; the code is the source.
export const GOLD_TO_PRODUCT: Record<string, string | null> = {
  "arbitration-and-class-action-waiver": "arbitration",
  "non-compete": "non-compete",
  "limitation-of-liability": "limitation-of-liability",
  indemnification: "indemnification",
  // PRD.md "My red lines": not part of v1's core red-line set.
  "auto-renewal": null,
  "fee-escalators-and-late-fees": null,
  // The product flags unilateral termination, not unilateral modification.
  // Different clause, so it is out of scope here, not a near miss.
  "unilateral-modification": null,
};

export const OUT_OF_SCOPE_REASON: Record<string, string> = {
  "auto-renewal":
    "PRD.md red lines: auto-renewal is not part of v1's core red-line set (consumer ToS territory, ADR-0002 and ADR-0003).",
  "fee-escalators-and-late-fees":
    "PRD.md red lines: junk fees are not part of v1's core red-line set (ADR-0002 and ADR-0003).",
  "unilateral-modification":
    "The product flags unilateral termination (ending the deal), not unilateral modification (rewriting its terms). Different clause.",
};

export interface PlantedClause {
  id: string;
  clauseType: string;
  sourceSentence: string;
}

export interface GoldDocument {
  id: string;
  benign: boolean;
  text: string;
  planted: PlantedClause[];
  unusualButHarmless: string[];
  // Every sentence the gold set says must appear exactly once in `text`.
  goldSentences: string[];
}

interface ManifestEntry {
  id: string;
  document: string;
  sidecar: string;
  questions?: string;
  benign: boolean;
  unusualButHarmless: string[];
}

export function loadGoldSet(corpusDir: string = GOLD_CORPUS_DIR): GoldDocument[] {
  const manifest = JSON.parse(
    readFileSync(path.join(corpusDir, "manifest.json"), "utf-8")
  ) as { documents: ManifestEntry[] };

  return manifest.documents.map((entry) => {
    const text = readFileSync(path.join(corpusDir, entry.document), "utf-8");
    const sidecar = JSON.parse(
      readFileSync(path.join(corpusDir, entry.sidecar), "utf-8")
    ) as {
      plantedClauses: Array<
        PlantedClause & { exit: { sourceSentence: string } | null }
      >;
    };

    const goldSentences: string[] = [];
    for (const p of sidecar.plantedClauses) {
      goldSentences.push(p.sourceSentence);
      if (p.exit) goldSentences.push(p.exit.sourceSentence);
    }
    goldSentences.push(...entry.unusualButHarmless);

    if (entry.questions) {
      const q = JSON.parse(
        readFileSync(path.join(corpusDir, entry.questions), "utf-8")
      ) as { grounded: Array<{ expectedSourceSentence: string }> };
      for (const g of q.grounded) goldSentences.push(g.expectedSourceSentence);
    }

    return {
      id: entry.id,
      benign: entry.benign,
      text,
      planted: sidecar.plantedClauses.map((p) => ({
        id: p.id,
        clauseType: p.clauseType,
        sourceSentence: p.sourceSentence,
      })),
      unusualButHarmless: entry.unusualButHarmless,
      goldSentences,
    };
  });
}

export function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    count++;
  }
  return count;
}

// The character classes a model tends to retype instead of copy.
export function characterClasses(sentence: string): string[] {
  const found: string[] = [];
  if (/[‘’“”]/.test(sentence)) found.push("curly quote");
  if (/ /.test(sentence)) found.push("non-breaking space");
  if (/[ﬁﬂ]/.test(sentence)) found.push("fi/fl ligature");
  if (/—/.test(sentence)) found.push("em dash");
  if (/ {2}/.test(sentence)) found.push("double space");
  return found;
}

// A quote is grounded when it appears in the document character for
// character. No normalisation: this is the strict reading.
export function isGrounded(documentText: string, quote: string): boolean {
  return quote.length > 0 && documentText.includes(quote);
}

function collapseWithOrigin(text: string): { collapsed: string; origin: number[] } {
  let collapsed = "";
  const origin: number[] = [];
  let lastWasSpace = true;
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]);
    if (isSpace) {
      if (lastWasSpace) continue;
      collapsed += " ";
      origin.push(i);
      lastWasSpace = true;
    } else {
      collapsed += text[i];
      origin.push(i);
      lastWasSpace = false;
    }
  }
  return { collapsed, origin };
}

// Where a sentence sits in the document, as [start, end), or null. Exact
// match first; whitespace-collapsed match as a fallback.
export function locate(documentText: string, sentence: string): [number, number] | null {
  const exact = documentText.indexOf(sentence);
  if (exact !== -1) return [exact, exact + sentence.length];
  const { collapsed, origin } = collapseWithOrigin(documentText);
  const wanted = collapseWithOrigin(sentence).collapsed.trim();
  if (!wanted) return null;
  const at = collapsed.indexOf(wanted);
  if (at === -1) return null;
  return [origin[at], origin[at + wanted.length - 1] + 1];
}

// "Overlaps" means the two spans share at least one character of the
// document.
export function spansOverlap(
  documentText: string,
  a: string,
  b: string
): boolean {
  const spanA = locate(documentText, a);
  const spanB = locate(documentText, b);
  if (!spanA || !spanB) return false;
  return spanA[0] < spanB[1] && spanB[0] < spanA[1];
}

export function rate(numerator: number, denominator: number): string {
  if (denominator === 0) return `${numerator}/${denominator} (n/a)`;
  return `${numerator}/${denominator} (${Math.round((100 * numerator) / denominator)}%)`;
}
