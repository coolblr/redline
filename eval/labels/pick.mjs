// Picks the ten flags to label by hand from the newest run in eval-runs/ and
// writes eval/labels/flags.json. Re-running it overwrites flags.json, so do
// not run it after you have started labelling.
//
// Order: flags that matched no planted clause, then flags that matched one but
// named a different clause type, then the most severe band, from as many
// different documents as possible, then the next band down. Flags whose quote
// is not in the document character for character are left out first.
// flags.json does not say which group a flag came from.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const runsDir = path.join(root, "eval-runs");
const corpus = path.join(root, "eval", "gold-set", "corpus");

const runFile = readdirSync(runsDir).filter((f) => f.endsWith(".json")).sort().pop();
if (!runFile) {
  console.error("No run record in eval-runs/. Run npm run eval first.");
  process.exit(1);
}
const run = JSON.parse(readFileSync(path.join(runsDir, runFile), "utf-8"));

const manifest = JSON.parse(readFileSync(path.join(corpus, "manifest.json"), "utf-8"));
const texts = Object.fromEntries(
  manifest.documents.map((d) => [d.id, readFileSync(path.join(corpus, d.document), "utf-8")])
);

const shown = run.flags.filter((f) => texts[f.document].includes(f.quotedSentence));

const docOrder = run.documents.map((d) => d.document);
const bySeverity = ["top", "middle", "cite-only"];
const byDocThenSeverity = (a, b) =>
  docOrder.indexOf(a.document) - docOrder.indexOf(b.document) ||
  bySeverity.indexOf(a.severity) - bySeverity.indexOf(b.severity);

const picked = [];
const take = (f) => picked.length < 10 && !picked.includes(f) && picked.push(f);

const unmatched = shown.filter((f) => !f.matchedPlanted).sort(byDocThenSeverity);
const wrongType = shown.filter((f) => f.matchedPlanted && f.namedRightType === false).sort(byDocThenSeverity);
// If the first two groups hold more than ten, take ten from as many documents as possible.
const spread = (list) => {
  const seen = new Map();
  return [...list].sort((a, b) => {
    const rank = (f) => { seen.set(f.document, (seen.get(f.document) ?? 0) + 1); return seen.get(f.document); };
    return rank(a) - rank(b);
  });
};
const firstTwo = [...unmatched, ...wrongType];
(firstTwo.length > 10 ? spread(firstTwo) : firstTwo).forEach(take);

for (const band of bySeverity) {
  if (picked.length >= 10) break;
  const pool = shown.filter((f) => f.severity === band && !picked.includes(f));
  const perDoc = new Map();
  for (const f of pool) perDoc.set(f.document, [...(perDoc.get(f.document) ?? []), f]);
  // Round robin: one per document, then a second, and so on.
  for (let round = 0; picked.length < 10; round++) {
    let added = false;
    for (const id of docOrder) {
      const f = perDoc.get(id)?.[round];
      if (f && picked.length < 10) { take(f); added = true; }
    }
    if (!added) break;
  }
}

picked.sort(byDocThenSeverity);

const paragraphOf = (text, sentence) => {
  const at = text.indexOf(sentence);
  const start = text.lastIndexOf("\n", at) + 1;
  const endAt = text.indexOf("\n", at + sentence.length);
  return text.slice(start, endAt === -1 ? text.length : endAt);
};

const out = picked.map((f, i) => ({
  number: i + 1,
  document: f.document,
  clauseType: f.clauseType,
  severity: f.severity,
  quotedSentence: f.quotedSentence,
  paragraph: paragraphOf(texts[f.document], f.quotedSentence),
}));

writeFileSync(path.join(here, "flags.json"), JSON.stringify({ run: runFile, flags: out }, null, 2) + "\n");
console.log(`Wrote ${out.length} flags from ${runFile}`);
