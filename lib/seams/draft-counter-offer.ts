// draftCounterOffer: a separate, deliberately isolated seam scoped to one
// flag at a time. See .scratch/redline-v1/spec.md ("Implementation
// Decisions") and .scratch/redline-v1/issues/08-counter-offer-seam.md.
//
// Unlike analyzeDocument, this seam's quality bar is explicitly unsettled
// (PRD.md, spec.md's "Testing Decisions" and "Out of Scope"). It gets its
// own OpenRouter call, own prompt, and a lighter test bar: tests confirm it
// completes without error and produces pattern-stated (not
// outcome-predicting) text, not a quality bar on the drafted language
// itself.
//
// No citation-resolution check happens here (unlike analyzeDocument's
// ADR-0001 enforcement). A counter-offer is proposed new language the User
// could send back -- it isn't a quote from documentText, so there's nothing
// to resolve it against.

import { CounterOfferSchema, type CounterOffer, type Flag } from "@/lib/domain-types";
import { openRouterClient, type OpenRouterClient } from "@/lib/openrouter";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";

// --- JSON schema passed to OpenRouter -----------------------------------
// CounterOfferSchema (lib/domain-types.ts) already matches this shape
// exactly -- { text: string } -- with no computed fields layered on
// afterward, so the raw model response is validated directly against it
// below rather than against a separate "raw" schema (contrast
// analyzeDocument, which computes severityTier/treatmentDepth after the
// model call and so needs a distinct raw shape).

const COUNTER_OFFER_JSON_SCHEMA = {
  name: "redline_counter_offer",
  schema: {
    type: "object",
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
    additionalProperties: false,
  },
} as const;

// --- Prompt --------------------------------------------------------------

const SYSTEM_PROMPT = `You are drafting a counter-offer for Redline, a tool that helps a freelancer or small business owner (the User) push back on a specific clause in a contract someone (the Client) sent them.

You are given one flagged clause from the document: its clause type, the exact sentence Redline flagged, why it was flagged, its severity tier, and whether the pattern is standard or unusual for this kind of agreement. Draft counter-offer language the User could send back to the Client in response to this specific flagged clause -- concrete enough to be a real starting point for pushing back, not a vague suggestion to "negotiate this" or "consult a lawyer."

Rules:
- Propose different contract language or terms for this clause. Write it as language the User could paste into an email or a redline back to the Client -- plain, direct, professional.
- State the pattern, never predict an outcome. Acceptable: "this pattern is usually unfavorable to the party with less negotiating leverage." Forbidden: "you would win/lose," "this clause is unenforceable," or any other forecast of what a court or the Client would actually do. A counter-offer proposes different terms; it does not forecast what a court or the Client would do.
- Stay scoped to this one clause. Don't draft counter-offers for other parts of the document, and don't restate the whole document.
- Do not add hedging disclaimers or restate the rationale you were given -- just draft the counter-offer text itself.

Respond with the counter-offer as structured JSON matching the schema.`;

function buildUserMessage(documentText: string, flag: Flag): string {
  return `Flagged clause:
Clause type: ${flag.clauseType}
Severity tier: ${flag.severityTier}
Standard or unusual: ${flag.standardOrUnusual}
Exact sentence flagged: "${flag.citation}"
Why it was flagged: ${flag.rationale}

Full document text, for context on surrounding terms:
${documentText}`;
}

// --- The seam --------------------------------------------------------------

export async function draftCounterOffer(
  documentText: string,
  flag: Flag,
  opts?: { client?: OpenRouterClient }
): Promise<CounterOffer> {
  const client = opts?.client ?? openRouterClient;

  const raw = await client.complete({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(documentText, flag) },
    ],
    jsonSchema: COUNTER_OFFER_JSON_SCHEMA,
  });

  // Throws on a zod-invalid raw response (e.g. missing `text`) rather than
  // silently returning something malformed -- there's no computed-field
  // step to repair it afterward the way analyzeDocument's flags/defects
  // loops do.
  const counterOffer = CounterOfferSchema.parse(raw);

  // ADR-0007 copy check: log any hit for visibility, but don't throw or
  // regenerate -- this seam's stated quality bar is lighter than
  // analyzeDocument's (spec.md "Testing Decisions").
  const hits = findOutcomePredictionPhrases(counterOffer.text);
  if (hits.length > 0) {
    console.warn(
      "draftCounterOffer: counter-offer text contains outcome-prediction language (ADR-0007).",
      { clauseType: flag.clauseType, hits }
    );
  }

  return counterOffer;
}
