// Saves one judge run to eval/judge/run-<n>.json and prints the comparison
// with eval/labels/labels.json. Usage: node eval/judge/save-run.mjs <n> <verdicts.json>
// verdicts.json is a list of { number, verdict, reason } from the judge.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [n, verdictsFile] = process.argv.slice(2);
const verdicts = JSON.parse(readFileSync(verdictsFile, "utf-8"));
const flags = JSON.parse(readFileSync(path.join(here, "..", "labels", "flags.json"), "utf-8"));
const labels = JSON.parse(readFileSync(path.join(here, "..", "labels", "labels.json"), "utf-8")).labels;

writeFileSync(
  path.join(here, `run-${n}.json`),
  JSON.stringify(
    {
      run: Number(n),
      judgedAt: new Date().toISOString(),
      flagsFrom: flags.run,
      rubric: readFileSync(path.join(here, "rubric.md"), "utf-8"),
      verdicts,
    },
    null,
    2
  ) + "\n"
);

const table = { PP: 0, PF: 0, FP: 0, FF: 0 };
for (const v of verdicts) table[labels[v.number].label[0] + v.verdict[0]]++;
console.log(table);
for (const v of verdicts) {
  const mine = labels[v.number];
  if (mine.label !== v.verdict) {
    const f = flags.flags.find((x) => x.number === v.number);
    console.log(`#${v.number} ${f.clauseType} | ${f.quotedSentence.slice(0, 60)} | you ${mine.label}: ${mine.note.trim()} | judge ${v.verdict}: ${v.reason}`);
  }
}
