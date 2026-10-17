// Citation-fidelity eval: real OpenRouter calls (like scripts/eval-sharp.ts).
// For every flag and defect analyzeDocument surfaces, classify its citation
// against the hand-labelled sentences in the fixtures' .expected.json:
//   exact       -- identical to a labelled sentence
//   fragment    -- strictly inside a labelled sentence
//   merged      -- contains a labelled sentence plus extra text
//   other       -- resolves in the document but matches no labelled sentence
//                  (needs human review: could be a legitimate extra flag)
// Also counts candidates the resolver dropped (via console.warn).

import { readFileSync } from "node:fs";
import path from "node:path";
import { analyzeDocument } from "../lib/seams/analyze-document";
import { DEFAULT_RED_LINES } from "../lib/red-lines";

function loadEnvLocal() {
  let contents: string;
  try {
    contents = readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const fx = (n: string) => path.join(__dirname, "..", "tests", "fixtures", n);

type Kind = "exact" | "fragment" | "merged" | "other";

function classify(citation: string, labelled: string[]): Kind {
  const c = norm(citation);
  if (labelled.some((l) => norm(l) === c)) return "exact";
  if (labelled.some((l) => norm(l).includes(c))) return "fragment";
  if (labelled.some((l) => c.includes(norm(l)))) return "merged";
  return "other";
}

async function run(label: string, txt: string, json: string) {
  const text = readFileSync(fx(txt), "utf-8");
  const expected = JSON.parse(readFileSync(fx(json), "utf-8")) as {
    flags: { sourceSentence: string }[];
    defects: { sourceSentence: string }[];
  };
  const labelled = [...expected.flags, ...expected.defects].map((x) => x.sourceSentence);

  let dropped = 0;
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (String(args[0]).includes("dropped") || String(args[0]).includes("did not resolve")) dropped++;
  };
  let result;
  try {
    result = await analyzeDocument(text, DEFAULT_RED_LINES);
  } finally {
    console.warn = origWarn;
  }

  const cites = [
    ...result.flags.map((f) => ({ what: `flag:${f.clauseType}`, c: f.citation })),
    ...result.documentDefects.map((d) => ({ what: `defect:${d.defectType}`, c: d.citation })),
  ];
  const counts: Record<Kind, number> = { exact: 0, fragment: 0, merged: 0, other: 0 };
  console.log(`\n== ${label}: ${cites.length} surfaced, ${dropped} dropped by resolver, ${labelled.length} labelled`);
  for (const { what, c } of cites) {
    const k = classify(c, labelled);
    counts[k]++;
    if (k !== "exact") console.log(`  [${k}] ${what}\n     ${JSON.stringify(c)}`);
  }
  const surfacedNorm = new Set(cites.map((x) => norm(x.c)));
  const missed = labelled.filter((l) => !surfacedNorm.has(norm(l)));
  console.log("  counts:", counts);
  console.log(`  labelled sentences not surfaced exactly: ${missed.length}`);
  for (const m of missed) console.log(`     ${JSON.stringify(m.slice(0, 110))}...`);
}

async function main() {
  loadEnvLocal();
  await run("adhesion-contract", "adhesion-contract.txt", "adhesion-contract.expected.json");
  await run("clean-contract", "clean-contract.txt", "clean-contract.expected.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
