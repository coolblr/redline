// Builds the input for judging every flag in the newest eval run: only flags
// the reader would be shown (quote in the document character for character).
// Writes eval/judge/all-flags-input.json, with no match results and no labels.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const runFile = readdirSync(path.join(root, "eval-runs")).filter((f) => f.endsWith(".json")).sort().pop();
const run = JSON.parse(readFileSync(path.join(root, "eval-runs", runFile), "utf-8"));
const corpus = path.join(root, "eval", "gold-set", "corpus");
const manifest = JSON.parse(readFileSync(path.join(corpus, "manifest.json"), "utf-8"));
const texts = Object.fromEntries(manifest.documents.map((d) => [d.id, readFileSync(path.join(corpus, d.document), "utf-8")]));

const paragraphOf = (text, sentence) => {
  const at = text.indexOf(sentence);
  const start = text.lastIndexOf("\n", at) + 1;
  const end = text.indexOf("\n", at + sentence.length);
  return text.slice(start, end === -1 ? text.length : end);
};

const flags = run.flags
  .filter((f) => texts[f.document].includes(f.quotedSentence))
  .map((f, i) => ({
    number: i + 1,
    document: f.document,
    clauseType: f.clauseType,
    severity: f.severity,
    quotedSentence: f.quotedSentence,
    paragraph: paragraphOf(texts[f.document], f.quotedSentence),
  }));

writeFileSync(path.join(here, "all-flags-input.json"), JSON.stringify({ run: runFile, flags }, null, 2) + "\n");
console.log(`${flags.length} of ${run.flags.length} flags in ${runFile}`);
for (const x of flags) {
  console.log(`\n### Flag ${x.number}\nDocument: ${x.document}\nClause type: ${x.clauseType}\nSeverity: ${x.severity}\nQuoted sentence: ${x.quotedSentence}\nParagraph: ${x.paragraph}`);
}
