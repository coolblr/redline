// Real-integration smoke test for analyzeDocument. Not part of `npm test`
// (which stubs the OpenRouter client) -- this makes a real OpenRouter call
// using the real OPENROUTER_API_KEY / OPENROUTER_MODEL from .env.local, so
// it's the cheapest, earliest point to catch a real integration bug (JSON
// schema mismatch, parsing failure) before later tickets (05/06/08/09)
// build on this seam.
//
// Kept deliberately simple and easy to extend: ticket 06 will add
// document defects, 08 counter-offers, 09 Q&A to this same script.

import { readFileSync } from "node:fs";
import path from "node:path";
import { analyzeDocument } from "../lib/seams/analyze-document";
import { DEFAULT_RED_LINES } from "../lib/red-lines";

// No dotenv dependency: .env.local is a handful of KEY=VALUE lines, so a
// tiny manual loader avoids adding a dependency just for this script.
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

async function main() {
  loadEnvLocal();

  const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "adhesion-contract.txt");
  const documentText = readFileSync(fixturePath, "utf-8");

  const { summary, flags } = await analyzeDocument(documentText, DEFAULT_RED_LINES);

  console.log("=== Summary ===");
  console.log(summary);
  console.log();
  console.log("=== Flags ===");
  console.log("clauseType | severityTier | treatmentDepth | standardOrUnusual | citation");
  for (const flag of flags) {
    console.log(
      `${flag.clauseType} | ${flag.severityTier} | ${flag.treatmentDepth} | ${flag.standardOrUnusual} | ${flag.citation}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
