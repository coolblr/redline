// answerQuestion: its own seam, unchanged from the original proposal
// (spec.md "Implementation Decisions"). See
// .scratch/redline-v1/issues/09-qa-seam.md.
//
// Answers a free-text question scoped to one document, strictly from what
// documentText supports. If the document doesn't address the question, the
// model must say so plainly and set addressedByDocument: false rather than
// inferring or guessing an answer to fill the gap (PRD.md user story 17,
// spec.md's known-absent-answer testing bar).
//
// No citation-resolution check happens here (same reasoning as
// draftCounterOffer, see lib/seams/draft-counter-offer.ts). Answer has no
// citation field -- a Q&A answer may reasonably synthesize across multiple
// parts of the document rather than quoting one sentence, so there's
// nothing to resolve against documentText the way a Flag's citation is.

import { AnswerSchema, type Answer } from "@/lib/domain-types";
import { openRouterClient, type OpenRouterClient } from "@/lib/openrouter";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";

// --- JSON schema passed to OpenRouter -----------------------------------
// AnswerSchema (lib/domain-types.ts) already matches this shape exactly --
// { text: string, addressedByDocument: boolean } -- with no computed
// fields layered on afterward, so the raw model response is validated
// directly against it below rather than against a separate "raw" schema
// (same pattern as draftCounterOffer; contrast analyzeDocument, which
// computes severityTier/treatmentDepth after the model call).

const ANSWER_JSON_SCHEMA = {
  name: "redline_answer",
  schema: {
    type: "object",
    properties: {
      text: { type: "string" },
      addressedByDocument: { type: "boolean" },
    },
    required: ["text", "addressedByDocument"],
    additionalProperties: false,
  },
} as const;

// --- Prompt --------------------------------------------------------------

const SYSTEM_PROMPT = `You are answering a question for Redline, a tool that helps a freelancer or small business owner (the User) understand a contract someone sent them.

You are given the full text of the document and a free-text question the User asked about it. Answer strictly from what the document text supports.

Rules:
- addressedByDocument is about whether the specific clause, provision, or topic the question asks about actually appears in the document -- it is not about whether you're able to compose a confident true/false answer using other, unrelated parts of the document. If the thing asked about is genuinely present, set addressedByDocument to true and answer directly, grounded in what the document actually says. You may draw on and synthesize more than one part of the document to answer -- you are not limited to a single sentence.
- If the document does not contain what's being asked about, set addressedByDocument to false, even if the document covers the same general area a different way. For example, if asked whether the contract includes an arbitration clause and the document instead sends disputes to ordinary court litigation with no arbitration provision anywhere, set addressedByDocument to false -- the document doesn't address arbitration, even though it does address dispute resolution in general. Say so plainly in the text field (for example, "This document doesn't include an arbitration clause. Disputes are instead handled through ordinary court litigation."). A brief, grounded mention of what the document does instead is fine; inferring, guessing, or improvising what an absent clause would say is not. Never imply the document contains something it doesn't.
- State the pattern, never predict an outcome. Acceptable: "this pattern is usually unfavorable to the party with less negotiating leverage." Forbidden: "you would win/lose," "this clause is unenforceable," or any other forecast of what a court or the other party would actually do. Answer what the document says, not what would happen because of it.
- Stay scoped to the question asked. Don't summarize the whole document, and don't answer a different question than the one asked.

Respond with the answer as structured JSON matching the schema.`;

function buildUserMessage(documentText: string, question: string): string {
  return `Question: ${question}

Document text:
${documentText}`;
}

// --- The seam --------------------------------------------------------------

export async function answerQuestion(
  documentText: string,
  question: string,
  opts?: { client?: OpenRouterClient }
): Promise<Answer> {
  const client = opts?.client ?? openRouterClient;

  const raw = await client.complete({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(documentText, question) },
    ],
    jsonSchema: ANSWER_JSON_SCHEMA,
  });

  // Throws on a zod-invalid raw response (e.g. missing `addressedByDocument`,
  // or `addressedByDocument` as a non-boolean) rather than silently
  // returning something malformed -- there's no computed-field step to
  // repair it afterward the way analyzeDocument's flags/defects loops do.
  const answer = AnswerSchema.parse(raw);

  // ADR-0007 copy check: log any hit for visibility, but don't throw or
  // regenerate -- same non-blocking pattern as the other two seams.
  const hits = findOutcomePredictionPhrases(answer.text);
  if (hits.length > 0) {
    console.warn(
      "answerQuestion: answer text contains outcome-prediction language (ADR-0007).",
      { question, hits }
    );
  }

  return answer;
}
