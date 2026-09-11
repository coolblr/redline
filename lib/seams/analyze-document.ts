// analyzeDocument: the hardened core seam. See .scratch/redline-v1/spec.md
// ("Implementation Decisions") and .scratch/redline-v1/issues/04-analyze-document-core.md.
//
// The model's job is extraction only: a plain-English summary, plus a
// candidate flag per matching clause carrying two structured *facts*
// (isExposureCapped, isMutual) rather than a self-reported severity tier,
// plus a candidate document defect per dangling reference or ambiguous
// term it notices while reading. Everything that determines correctness --
// severity tier (ADR-0005), treatment depth (ADR-0004), citation
// resolution (ADR-0001, which applies to document defects too per
// ADR-0008), the scope-creep hedge (PRD.md), and the "nothing above
// cite-only" statement -- is computed in plain TypeScript below, not
// trusted to model output.
//
// Document defects (ticket 06) are detected in this same OpenRouter call,
// not a second round-trip, and are always returned as their own
// collection -- documentDefects -- never folded into flags (ADR-0008).

import { z } from "zod";
import {
  ClauseTypeSchema,
  DefectTypeSchema,
  DocumentDefectSchema,
  FlagSchema,
  StandardOrUnusualSchema,
  type DocumentDefect,
  type Flag,
} from "@/lib/domain-types";
import { openRouterClient, type OpenRouterClient } from "@/lib/openrouter";
import {
  computeIpAssignmentSeverityTier,
  computeSeverityTier,
  computeTreatmentDepth,
} from "@/lib/seams/severity";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";
import type { RedLine } from "@/lib/red-lines";

// --- Raw model response shape -----------------------------------------
// Distinct from FlagSchema: the model reports isExposureCapped/isMutual
// facts, not a severityTier label (that's computed after citation
// resolution, see computeSeverityTier).

const IpAssignmentTimingSchema = z.enum(["on-creation", "on-delivery", "on-full-payment"]);

const RawCandidateFlagSchema = z.object({
  clauseType: ClauseTypeSchema,
  citation: z.string().min(1),
  isExposureCapped: z.boolean(),
  isMutual: z.boolean(),
  // Meaningful only when clauseType is "ip-assignment" -- null for every
  // other clause type. Required-but-nullable (not optional) so the
  // OpenRouter json_schema `required` list stays satisfied under
  // strict: true, matching isExposureCapped/isMutual's pattern.
  ipAssignmentTiming: IpAssignmentTimingSchema.nullable(),
  standardOrUnusual: StandardOrUnusualSchema,
  rationale: z.string().min(1),
});

const RawCandidateDefectSchema = z.object({
  defectType: DefectTypeSchema,
  citation: z.string().min(1),
  description: z.string().min(1),
});

const RawAnalysisResponseSchema = z.object({
  summary: z.string().min(1),
  candidateFlags: z.array(RawCandidateFlagSchema),
  candidateDefects: z.array(RawCandidateDefectSchema),
});

// --- JSON schema passed to OpenRouter -----------------------------------

const CLAUSE_TYPE_VALUES = [
  "indemnification",
  "ip-assignment",
  "limitation-of-liability",
  "non-compete",
  "unilateral-termination",
  "scope-creep",
  "arbitration",
] as const;

const DEFECT_TYPE_VALUES = ["dangling-reference", "ambiguous-term"] as const;

const ANALYSIS_JSON_SCHEMA = {
  name: "redline_document_analysis",
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      candidateFlags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            clauseType: { type: "string", enum: [...CLAUSE_TYPE_VALUES] },
            citation: { type: "string" },
            isExposureCapped: { type: "boolean" },
            isMutual: { type: "boolean" },
            ipAssignmentTiming: {
              type: ["string", "null"],
              enum: ["on-creation", "on-delivery", "on-full-payment", null],
            },
            standardOrUnusual: { type: "string", enum: ["standard", "unusual"] },
            rationale: { type: "string" },
          },
          required: [
            "clauseType",
            "citation",
            "isExposureCapped",
            "isMutual",
            "ipAssignmentTiming",
            "standardOrUnusual",
            "rationale",
          ],
          additionalProperties: false,
        },
      },
      candidateDefects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            defectType: { type: "string", enum: [...DEFECT_TYPE_VALUES] },
            citation: { type: "string" },
            description: { type: "string" },
          },
          required: ["defectType", "citation", "description"],
          additionalProperties: false,
        },
      },
    },
    required: ["summary", "candidateFlags", "candidateDefects"],
    additionalProperties: false,
  },
} as const;

// --- Prompt --------------------------------------------------------------

const SYSTEM_PROMPT = `You are the extraction engine behind Redline, a tool that helps a freelancer or small business owner (the User) decide whether to sign a contract someone sent them.

Your job in this call is extraction only, not scoring. For each clause in the document that matches one of the seven clause types below, extract a candidate flag as structured facts. Do not decide how severe a clause is yourself -- severity is computed afterward from the facts you report, not something you label.

The seven clause types: indemnification, ip-assignment, limitation-of-liability, non-compete, unilateral-termination, scope-creep, arbitration.

Extract every clause that matches one of these types, including the boring, mutual, or capped ones, not just the alarming ones. The User wants the full list of what was checked, not only what looks dangerous.

For each candidate flag, report:
- clauseType: one of the seven types above.
- citation: the exact sentence from the document this flag is about, copied character for character as it appears in the source text. This is checked in code afterward -- if a citation isn't an exact match to the source text, the flag is discarded and the User never sees it, so precision here matters more than smooth paraphrase.
- isExposureCapped: true if a dollar figure or other bounded ceiling on liability appears anywhere in the clause, even if that ceiling only protects one party. false only if liability is completely open-ended with no ceiling stated for either party (for example, "without limitation as to amount").
- isMutual: true if the same treatment (a cap, or the lack of one) applies equally to both parties. false if one party gets a cap or protection the other doesn't.

Worked example, because this is the case most tools get wrong: "Client's liability shall not exceed $25,000, while Contractor's liability shall be uncapped." Report isExposureCapped: true (a $25,000 ceiling exists in the clause) and isMutual: false (the ceiling protects only the Client, not Contractor). Do not report isExposureCapped: false just because the User's own side of the clause is the uncapped one -- a cap that exists but is applied unevenly is the capped-and-one-sided pattern, not the fully-uncapped pattern. Fully uncapped means no cap appears anywhere in the clause for anyone, as in "Contractor shall indemnify Client ... without limitation as to amount."
- ipAssignmentTiming: for clauseType "ip-assignment" only -- report which of three timings the clause's own language supports: "on-creation" if ownership vests in Client as soon as the work is created (including "upon creation," work-made-for-hire language that vests immediately, or ownership stated as independent of payment), "on-delivery" if ownership vests when Contractor delivers or completes the work but before Client has paid for it, or "on-full-payment" if ownership vests only once Client has paid in full (the safe pattern). Base this only on what the clause actually says -- if it's genuinely ambiguous, pick the closest supported reading rather than guessing wildly. For every other clauseType, report ipAssignmentTiming: null.
- standardOrUnusual: "standard" if this is expected boilerplate for a freelance or service agreement, "unusual" if it's atypical for this kind of document. This is independent of how serious the clause is -- a clause can be standard and still worth real attention (arbitration is the clearest example).
- rationale: state the pattern in the clause, never predict an outcome. Acceptable: "this pattern is usually unfavorable to the party with less negotiating leverage." Forbidden: "you would lose in court over this," "this clause is unenforceable," or any other forecast of what a court or counterparty would actually do.

In this same pass, also watch for two kinds of document-level defects -- problems with the document's own internal consistency or completeness, not a risk inside a clause. Report each one you notice as a candidate defect, separately from candidate flags:
- dangling-reference: a clause references a schedule, exhibit, appendix, or attachment (for example, "as set forth in Schedule 1," "attached as Exhibit B") whose actual content does not appear anywhere else in the document text you were given. The citation is the sentence containing the reference itself, not the missing content -- by definition, that content isn't there to quote.
- ambiguous-term: a defined term (for example, "Contractor," "Company," "Party") is defined or used in a way that could plausibly refer to more than one party in the document. Only report this when the ambiguity is genuine, not just because a term is used often. The citation is the sentence where the ambiguity is most evident -- the definition itself, or a usage that could go either way.

For each candidate defect, report:
- defectType: "dangling-reference" or "ambiguous-term".
- citation: the exact sentence from the document, copied character for character, same precision rule as flag citations above -- this is checked in code afterward, and a defect you can't point to with an exact quoted sentence is discarded and the User never sees it.
- description: a plain-English explanation of what makes this a defect.

If the document has no dangling references and no ambiguous terms, report an empty candidateDefects array rather than inventing one to fill the field.

The summary field is a plain-English paragraph, no more than 4-5 sentences, describing what the document covers, who the parties are, and what it asks of each of them. State what the document says, never predict what would happen because of it. Write it as complete sentences -- do not trail off partway through a thought.

The User's own red lines -- what they specifically care about within each clause type -- follow as additional context. Use them to judge what's worth noting within a clause type; they don't change which clause types you check.`;

function buildUserMessage(documentText: string, redLines: RedLine[]): string {
  const redLineText = redLines
    .map((redLine) => `- ${redLine.clauseType}: ${redLine.guidance}`)
    .join("\n");

  return `The User's red lines:\n${redLineText}\n\nDocument text:\n${documentText}`;
}

// --- Deterministic copy fixed in code, not left to model compliance -----

export const SCOPE_CREEP_HEDGE_MARKER =
  "Redline treats this clause type with lower confidence than the others it checks. The evidence behind how common or severe scope-creep clauses are in practice is weaker than for the rest of the red-line list.";

const SCOPE_CREEP_HEDGE_PATTERNS = [
  /weaker evidence/i,
  /lower confidence/i,
  /less certain/i,
  /less confident/i,
];

function hasScopeCreepHedge(rationale: string): boolean {
  return SCOPE_CREEP_HEDGE_PATTERNS.some((pattern) => pattern.test(rationale));
}

export const NOTHING_ABOVE_CITE_ONLY_SENTENCE =
  "Nothing in this document reached Redline's top or middle severity tier. Every clause below is cite-only.";

// --- The seam --------------------------------------------------------------

export async function analyzeDocument(
  documentText: string,
  redLines: RedLine[],
  opts?: { client?: OpenRouterClient }
): Promise<{ summary: string; flags: Flag[]; documentDefects: DocumentDefect[] }> {
  const client = opts?.client ?? openRouterClient;

  const raw = await client.complete({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(documentText, redLines) },
    ],
    jsonSchema: ANALYSIS_JSON_SCHEMA,
  });

  const parsed = RawAnalysisResponseSchema.parse(raw);

  const flags: Flag[] = [];

  for (const candidate of parsed.candidateFlags) {
    // ADR-0001, non-negotiable: a flag whose citation doesn't resolve
    // against the input text is a bug, not a low-confidence result. Drop
    // it entirely -- do not return it, do not throw for the whole call.
    if (!documentText.includes(candidate.citation)) {
      console.warn(
        "analyzeDocument: dropped a candidate flag because its citation " +
          "did not resolve as an exact substring of documentText (ADR-0001).",
        { clauseType: candidate.clauseType, citation: candidate.citation }
      );
      continue;
    }

    let severityTier;
    if (candidate.clauseType === "ip-assignment") {
      // IP-assignment's danger axis is timing, not exposure/mutuality
      // (PRD.md "My red lines"): ownership transfer before or independent
      // of payment is the dangerous pattern, not caps or mutual exposure.
      let timing = candidate.ipAssignmentTiming;
      if (timing === null) {
        // ADR-0006, optimize against misses: if the model didn't report a
        // timing for an ip-assignment clause despite the prompt
        // instruction, assume the most dangerous reading rather than
        // silently under-severity a flag the User needs to see.
        console.warn(
          "analyzeDocument: ip-assignment candidate flag had a null " +
            "ipAssignmentTiming; falling back to 'on-creation' (ADR-0006).",
          { citation: candidate.citation }
        );
        timing = "on-creation";
      }
      severityTier = computeIpAssignmentSeverityTier(timing);
    } else {
      severityTier = computeSeverityTier(candidate.isExposureCapped, candidate.isMutual);
    }
    const treatmentDepth = computeTreatmentDepth(candidate.clauseType);

    let rationale = candidate.rationale;
    if (candidate.clauseType === "scope-creep" && !hasScopeCreepHedge(rationale)) {
      rationale = `${rationale} ${SCOPE_CREEP_HEDGE_MARKER}`;
    }

    flags.push({
      clauseType: candidate.clauseType,
      severityTier,
      standardOrUnusual: candidate.standardOrUnusual,
      treatmentDepth,
      citation: candidate.citation,
      rationale,
    });
  }

  // ADR-0007 copy check: log any hit for visibility, but don't drop a flag
  // over it -- ADR-0006 favors recall, and this is a heuristic check, not
  // a citation-resolution-grade guarantee.
  for (const flag of flags) {
    const hits = findOutcomePredictionPhrases(flag.rationale);
    if (hits.length > 0) {
      console.warn(
        "analyzeDocument: flag rationale contains outcome-prediction language (ADR-0007).",
        { clauseType: flag.clauseType, hits }
      );
    }
  }

  let summary = parsed.summary;
  const summaryHits = findOutcomePredictionPhrases(summary);
  if (summaryHits.length > 0) {
    console.warn(
      "analyzeDocument: summary contains outcome-prediction language (ADR-0007).",
      { hits: summaryHits }
    );
  }

  // Computed from the already-computed tiers, not left to model compliance:
  // if nothing survived at top or middle, say so plainly, every time.
  const hasAboveCiteOnly = flags.some((flag) => flag.severityTier !== "cite-only");
  if (!hasAboveCiteOnly) {
    summary = `${summary} ${NOTHING_ABOVE_CITE_ONLY_SENTENCE}`;
  }

  const documentDefects: DocumentDefect[] = [];

  for (const candidate of parsed.candidateDefects) {
    // Same ADR-0001 invariant as flags, applied at the document-defect
    // level per ADR-0008: a defect whose citation doesn't resolve against
    // the input text is never returned, not merely flagged low-confidence.
    if (!documentText.includes(candidate.citation)) {
      console.warn(
        "analyzeDocument: dropped a candidate document defect because its " +
          "citation did not resolve as an exact substring of documentText " +
          "(ADR-0001, applied per ADR-0008).",
        { defectType: candidate.defectType, citation: candidate.citation }
      );
      continue;
    }

    documentDefects.push({
      defectType: candidate.defectType,
      description: candidate.description,
      citation: candidate.citation,
    });
  }

  // Hard guarantee: this should always pass given the construction above,
  // but validate anyway rather than silently returning a malformed shape.
  const validatedFlags = z.array(FlagSchema).parse(flags);
  const validatedDefects = z.array(DocumentDefectSchema).parse(documentDefects);

  return { summary, flags: validatedFlags, documentDefects: validatedDefects };
}
