// Gold-set eval (npm run eval). Runs every document in the gold set's
// manifest.json through analyzeDocument, the same function npm run smoke
// calls, with DEFAULT_RED_LINES and the OpenRouter settings in .env.local.
// Changes no app code, prompt or model setting.
//
// Real model calls: costs a few cents per run. Not part of npm test.
// Method and decisions: eval/README.md. Definitions: PRD.md "How we measure it".

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyzeDocument } from "../lib/seams/analyze-document";
import { openRouterClient, type OpenRouterClient } from "../lib/openrouter";
import { DEFAULT_RED_LINES } from "../lib/red-lines";
import {
  GOLD_TO_PRODUCT,
  OUT_OF_SCOPE_REASON,
  characterClasses,
  isGrounded,
  loadGoldSet,
  rate,
  spansOverlap,
  type GoldDocument,
} from "./lib";

// Same tiny .env.local loader as scripts/smoke.ts -- no dotenv dependency.
function loadEnvLocal() {
  let contents: string;
  try {
    contents = readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8");
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

interface RawCandidate {
  clauseType: string;
  citation: string;
}

interface FlagRecord {
  document: string;
  clauseType: string;
  severity: string;
  quotedSentence: string;
  matchedPlanted: boolean;
  matchedPlantedId: string | null;
  matchedGoldType: string | null;
  namedRightType: boolean | null;
}

interface PlantedRecord {
  document: string;
  id: string;
  goldType: string;
  productType: string | null;
  inScope: boolean;
  found: boolean;
  namedRightType: boolean | null;
  characterClasses: string[];
  sentence: string;
}

interface DocumentRecord {
  document: string;
  benign: boolean;
  status: "ok" | "failed";
  error?: string;
  rawCandidates: Array<RawCandidate & { grounded: boolean; survivedResolver: boolean }>;
  surfacedFlags: number;
  droppedByResolver: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function analyzeWithCapture(doc: GoldDocument) {
  let captured: RawCandidate[] = [];
  const client: OpenRouterClient = {
    async complete(args) {
      const raw = (await openRouterClient.complete(args)) as {
        candidateFlags?: RawCandidate[];
      };
      captured = (raw.candidateFlags ?? []).map((c) => ({
        clauseType: c.clauseType,
        citation: c.citation,
      }));
      return raw as never;
    },
  };

  // A 429 is the provider being busy, not the product being wrong. Retry
  // twice; if it still fails the document is left out of every denominator.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await analyzeDocument(doc.text, DEFAULT_RED_LINES, { client });
      return { result, captured };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("429")) break;
      await sleep(8000);
    }
  }
  throw lastError;
}

async function main() {
  loadEnvLocal();
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.error("OPENROUTER_API_KEY and OPENROUTER_MODEL must be set in .env.local.");
    process.exit(1);
  }

  const startedAt = new Date();
  const gold = loadGoldSet();

  // analyzeDocument logs every dropped candidate with console.warn. The
  // eval counts drops from the raw model output instead, so keep it quiet.
  const originalWarn = console.warn;
  console.warn = () => {};

  const documents: DocumentRecord[] = [];
  const flags: FlagRecord[] = [];
  const planted: PlantedRecord[] = [];

  for (const doc of gold) {
    process.stdout.write(`${doc.id} ... `);
    try {
      const { result, captured } = await analyzeWithCapture(doc);
      const surfaced = new Set(result.flags.map((f) => f.citation));
      const raw = captured.map((c) => ({
        ...c,
        grounded: isGrounded(doc.text, c.citation),
        survivedResolver: surfaced.has(c.citation),
      }));

      // Flags the reader would be shown, matched against planted clauses.
      for (const flag of result.flags) {
        const hit = doc.planted.find((p) =>
          spansOverlap(doc.text, flag.citation, p.sourceSentence)
        );
        const mapped = hit ? GOLD_TO_PRODUCT[hit.clauseType] : null;
        flags.push({
          document: doc.id,
          clauseType: flag.clauseType,
          severity: flag.severityTier,
          quotedSentence: flag.citation,
          matchedPlanted: Boolean(hit),
          matchedPlantedId: hit?.id ?? null,
          matchedGoldType: hit?.clauseType ?? null,
          namedRightType: hit && mapped ? flag.clauseType === mapped : null,
        });
      }

      for (const p of doc.planted) {
        const productType = GOLD_TO_PRODUCT[p.clauseType] ?? null;
        const overlapping = result.flags.filter((f) =>
          spansOverlap(doc.text, f.citation, p.sourceSentence)
        );
        planted.push({
          document: doc.id,
          id: p.id,
          goldType: p.clauseType,
          productType,
          inScope: productType !== null,
          found: overlapping.length > 0,
          namedRightType:
            productType !== null && overlapping.length > 0
              ? overlapping.some((f) => f.clauseType === productType)
              : null,
          characterClasses: characterClasses(p.sourceSentence),
          sentence: p.sourceSentence,
        });
      }

      documents.push({
        document: doc.id,
        benign: doc.benign,
        status: "ok",
        rawCandidates: raw,
        surfacedFlags: result.flags.length,
        droppedByResolver: raw.filter((c) => !c.survivedResolver).length,
      });
      console.log(`ok (${result.flags.length} flags)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      documents.push({
        document: doc.id,
        benign: doc.benign,
        status: "failed",
        error: message.slice(0, 300),
        rawCandidates: [],
        surfacedFlags: 0,
        droppedByResolver: 0,
      });
      console.log(`FAILED (${message.slice(0, 80)})`);
    }
  }
  console.warn = originalWarn;

  const ok = documents.filter((d) => d.status === "ok");
  const failed = documents.filter((d) => d.status === "failed");
  const okIds = new Set(ok.map((d) => d.document));

  // --- Numbers -------------------------------------------------------------
  const inScope = planted.filter((p) => p.inScope && okIds.has(p.document));
  const outOfScope = planted.filter((p) => !p.inScope && okIds.has(p.document));
  const found = inScope.filter((p) => p.found);
  const typeRight = found.filter((p) => p.namedRightType);

  const raws = ok.flatMap((d) => d.rawCandidates);
  const groundedCount = raws.filter((c) => c.grounded).length;
  const dropped = raws.filter((c) => !c.survivedResolver).length;

  const cleanDocs = ok.filter((d) => d.benign);
  const cleanFlags = cleanDocs.reduce((sum, d) => sum + d.surfacedFlags, 0);

  const withChars = inScope.filter((p) => p.characterClasses.length > 0);
  const plain = inScope.filter((p) => p.characterClasses.length === 0);

  const lines: string[] = [];
  const out = (s = "") => lines.push(s);

  out(`Redline gold-set eval, started ${startedAt.toISOString()}`);
  out(`Model: ${process.env.OPENROUTER_MODEL}`);
  out(`Documents: ${ok.length} ran, ${failed.length} left out of every denominator (failed model call)`);
  for (const d of failed) out(`  left out: ${d.document}: ${d.error}`);
  out();
  out("RECALL (planted clauses of types PRD.md says this product flags)");
  out(`  found:                 ${rate(found.length, inScope.length)}`);
  out(`  named the right type:  ${rate(typeRight.length, found.length)} of those found`);
  const goldTypes = [...new Set(planted.map((p) => p.goldType))];
  for (const t of goldTypes) {
    const rows = planted.filter((p) => p.goldType === t && okIds.has(p.document));
    if (GOLD_TO_PRODUCT[t] === null) continue;
    out(`  ${t} -> ${GOLD_TO_PRODUCT[t]}: ${rate(rows.filter((p) => p.found).length, rows.length)}`);
  }
  out();
  out(`OUT OF SCOPE (${outOfScope.length} planted clauses, never counted as misses)`);
  for (const t of goldTypes) {
    if (GOLD_TO_PRODUCT[t] !== null) continue;
    const rows = outOfScope.filter((p) => p.goldType === t);
    out(`  ${t}: ${rows.length} planted, ${rows.filter((p) => p.found).length} had a flag on them anyway. ${OUT_OF_SCOPE_REASON[t]}`);
  }
  out();
  out("GROUNDEDNESS (quotes in the document character for character, of every flag the model returned)");
  out(`  ${rate(groundedCount, raws.length)}`);
  out(`  dropped by the product's resolver before showing: ${dropped} of ${raws.length}`);
  out(`  flags shown to the reader: ${ok.reduce((s, d) => s + d.surfacedFlags, 0)}`);
  out();
  out("CLEAN DOCUMENTS (flags on documents that should come back clean; target 0)");
  out(`  ${cleanFlags} flags across ${cleanDocs.length} clean documents`);
  for (const d of cleanDocs) out(`  ${d.document}: ${d.surfacedFlags}`);
  out();
  out("CHARACTER SPLIT (recall on in-scope planted sentences)");
  out(`  with curly quote, non-breaking space, fi/fl ligature, em dash or double space: ${rate(withChars.filter((p) => p.found).length, withChars.length)}`);
  out(`  plain:                                                                         ${rate(plain.filter((p) => p.found).length, plain.length)}`);
  out();
  out("MISSED (in-scope planted clauses with no flag on them)");
  for (const p of inScope.filter((x) => !x.found)) {
    out(`  ${p.document} ${p.id} ${p.goldType}${p.characterClasses.length ? ` [${p.characterClasses.join(", ")}]` : ""}`);
  }
  out();
  out("FLAGS WITH NO PLANTED CLAUSE UNDER THEM");
  const unmatched = flags.filter((f) => !f.matchedPlanted);
  out(`  ${unmatched.length} of ${flags.length} flags shown`);
  for (const f of unmatched) out(`  ${f.document} ${f.clauseType} ${f.severity}`);
  out();
  out("Limit: a model wrote the gold set, so these are an upper bound, never a promise to a reader.");

  const text = lines.join("\n");
  console.log("\n" + text);

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const dir = path.join(__dirname, "..", "eval-runs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${stamp}.txt`), text + "\n");
  writeFileSync(
    path.join(dir, `${stamp}.json`),
    JSON.stringify(
      {
        startedAt: startedAt.toISOString(),
        model: process.env.OPENROUTER_MODEL,
        summary: {
          documentsRan: ok.length,
          documentsLeftOut: failed.length,
          recall: { found: found.length, of: inScope.length },
          namedRightType: { right: typeRight.length, of: found.length },
          groundedness: { grounded: groundedCount, of: raws.length },
          droppedByResolver: dropped,
          cleanDocumentFlags: cleanFlags,
          characterSplit: {
            withCharacters: { found: withChars.filter((p) => p.found).length, of: withChars.length },
            plain: { found: plain.filter((p) => p.found).length, of: plain.length },
          },
        },
        documents,
        flags,
        planted,
      },
      null,
      2
    ) + "\n"
  );
  console.log(`\nSaved eval-runs/${stamp}.txt and .json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
