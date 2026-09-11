// Sharp-treatment eval (ticket 05, ADR-0004's consequence): sharp-treatment
// clauses (indemnification, ip-assignment) are held to a tier-accuracy bar;
// generic-treatment clauses are held to a recall bar. ADR-0004 requires
// this distinction to be visible in the eval results as separate numbers,
// not folded into one blended accuracy figure -- so this script prints two
// separate summaries rather than a single pass rate.
//
// Not part of `npm test` (which stubs the OpenRouter client, like
// scripts/smoke.ts) -- this makes real OpenRouter calls using the real
// OPENROUTER_API_KEY / OPENROUTER_MODEL from .env.local.

import { readFileSync } from "node:fs";
import path from "node:path";
import { analyzeDocument } from "../lib/seams/analyze-document";
import { DEFAULT_RED_LINES } from "../lib/red-lines";
import type { ClauseType, Flag, SeverityTier } from "../lib/domain-types";

// Same tiny .env.local loader as scripts/smoke.ts -- no dotenv dependency.
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  let contents: string;
  try {
    contents = readFileSync(envPath, "utf-8");
  } catch {
    return;
  }

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function fixturePath(name: string): string {
  return path.join(__dirname, "..", "tests", "fixtures", name);
}

function fixtureText(name: string): string {
  return readFileSync(fixturePath(name), "utf-8");
}

type ExpectedFlag = {
  clauseType: string;
  sourceSentence: string;
  expectedSeverityTier: SeverityTier;
  expectedStandardOrUnusual: string;
  expectedTreatmentDepth: string;
  note?: string;
};

type ExpectedFixture = { flags: ExpectedFlag[] };

function loadExpected(name: string): ExpectedFixture {
  return JSON.parse(readFileSync(fixturePath(name), "utf-8")) as ExpectedFixture;
}

// Word-overlap similarity (Jaccard over lowercase word sets), used to match
// a returned Flag back to the expected sidecar entry it corresponds to when
// several flags share a clauseType (both sharp fixtures have three each).
// Exact citation equality is the common case since the model is instructed
// to copy sentences verbatim; this is a fallback for near-matches.
function wordSet(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z0-9']+/g) ?? []);
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = wordSet(a);
  const setB = wordSet(b);
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Greedily matches each expected entry to the best-scoring, not-yet-used
// flag of the same clauseType. Returns null for an expected entry with no
// candidate flag of that clauseType at all (a straight miss).
function matchFlags(
  expectedFlags: ExpectedFlag[],
  actualFlags: Flag[]
): Array<{ expected: ExpectedFlag; actual: Flag | null }> {
  const used = new Set<number>();
  const results: Array<{ expected: ExpectedFlag; actual: Flag | null }> = [];

  for (const expected of expectedFlags) {
    let bestIndex = -1;
    let bestScore = -1;
    actualFlags.forEach((flag, index) => {
      if (used.has(index)) return;
      if (flag.clauseType !== expected.clauseType) return;
      const score =
        flag.citation === expected.sourceSentence
          ? 1
          : jaccardSimilarity(flag.citation, expected.sourceSentence);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) {
      results.push({ expected, actual: null });
    } else {
      used.add(bestIndex);
      results.push({ expected, actual: actualFlags[bestIndex] });
    }
  }

  return results;
}

async function runSharpFixture(
  label: string,
  txtFile: string,
  jsonFile: string
): Promise<{ correct: number; total: number }> {
  const documentText = fixtureText(txtFile);
  const expected = loadExpected(jsonFile);

  const { flags } = await analyzeDocument(documentText, DEFAULT_RED_LINES);
  const matches = matchFlags(expected.flags, flags);

  let correct = 0;
  console.log(`\n--- ${label} (${txtFile}) ---`);
  matches.forEach(({ expected: exp, actual }, index) => {
    const caseLabel = `case ${index + 1} (${exp.clauseType})`;
    if (!actual) {
      console.log(`FAIL ${caseLabel}: no matching flag returned at all (expected ${exp.expectedSeverityTier})`);
      return;
    }
    const pass = actual.severityTier === exp.expectedSeverityTier;
    if (pass) correct++;
    console.log(
      `${pass ? "PASS" : "FAIL"} ${caseLabel}: expected ${exp.expectedSeverityTier}, got ${actual.severityTier}` +
        (pass ? "" : ` -- citation matched: "${actual.citation}"`)
    );
  });

  return { correct, total: expected.flags.length };
}

async function runGenericRecall(): Promise<{ flagged: number; total: number }> {
  const documentText = fixtureText("adhesion-contract.txt");
  const expected = loadExpected("adhesion-contract.expected.json");

  const genericExpected = expected.flags.filter(
    (flag) => flag.expectedTreatmentDepth === "generic"
  );

  const { flags } = await analyzeDocument(documentText, DEFAULT_RED_LINES);
  const returnedClauseTypes = new Set(flags.map((flag) => flag.clauseType));

  console.log(`\n--- Generic-treatment recall (adhesion-contract.txt) ---`);
  let flaggedCount = 0;
  for (const exp of genericExpected) {
    const flagged = returnedClauseTypes.has(exp.clauseType as ClauseType);
    if (flagged) flaggedCount++;
    console.log(`${flagged ? "PASS" : "FAIL"} ${exp.clauseType}: ${flagged ? "flagged" : "NOT flagged"}`);
  }

  return { flagged: flaggedCount, total: genericExpected.length };
}

async function main() {
  loadEnvLocal();

  const [indemnification, ipAssignment] = await Promise.all([
    runSharpFixture("Indemnification", "sharp-indemnification.txt", "sharp-indemnification.expected.json"),
    runSharpFixture("IP assignment", "sharp-ip-assignment.txt", "sharp-ip-assignment.expected.json"),
  ]);

  const generic = await runGenericRecall();

  const sharpCorrect = indemnification.correct + ipAssignment.correct;
  const sharpTotal = indemnification.total + ipAssignment.total;

  console.log(`\n=== Summary ===`);
  console.log(
    `Sharp-treatment (indemnification + IP-assignment): ${sharpCorrect}/${sharpTotal} correct tier`
  );
  console.log(`Generic-treatment recall: ${generic.flagged}/${generic.total} clause types flagged`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
