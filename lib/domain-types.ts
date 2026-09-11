// Shared domain types for the analysis output shapes defined in
// .scratch/redline-v1/spec.md ("Implementation Decisions") and enforced by
// ADR-0004 (sharp vs. generic treatment depth), ADR-0005 (severity model),
// and ADR-0008 (document defects are a separate category from flags).
//
// This file is schema/types only (ticket 03, a prefactor). It does not
// implement analyzeDocument, draftCounterOffer, or answerQuestion — those
// are later seam tickets (04/06/08/09) that import from here.
//
// The seven clause types below are the full set this schema supports:
// indemnification and ip-assignment get "sharp" treatment depth (ADR-0004);
// limitation-of-liability, non-compete, unilateral-termination, scope-creep,
// and arbitration get "generic" treatment depth. Arbitration is always
// flagged regardless of depth (PRD.md, spec.md user story 24).

import { z } from "zod";

export const ClauseTypeSchema = z.enum([
  "indemnification",
  "ip-assignment",
  "limitation-of-liability",
  "non-compete",
  "unilateral-termination",
  "scope-creep",
  "arbitration",
]);
export type ClauseType = z.infer<typeof ClauseTypeSchema>;

// Three-tier exposure test (ADR-0005): top = uncapped + one-sided,
// middle = capped but still one-sided, cite-only = capped + mutual.
export const SeverityTierSchema = z.enum(["top", "middle", "cite-only"]);
export type SeverityTier = z.infer<typeof SeverityTierSchema>;

// Independent of severity tier — whether the clause is expected boilerplate
// for this document type or atypical (ADR-0005).
export const StandardOrUnusualSchema = z.enum(["standard", "unusual"]);
export type StandardOrUnusual = z.infer<typeof StandardOrUnusualSchema>;

// "sharp" for indemnification and ip-assignment, "generic" for the other
// five clause types (ADR-0004).
export const TreatmentDepthSchema = z.enum(["sharp", "generic"]);
export type TreatmentDepth = z.infer<typeof TreatmentDepthSchema>;

export const FlagSchema = z.object({
  clauseType: ClauseTypeSchema,
  severityTier: SeverityTierSchema,
  standardOrUnusual: StandardOrUnusualSchema,
  treatmentDepth: TreatmentDepthSchema,
  // Must resolve as an exact substring of the document's documentText.
  // Validated by the caller (seam 04, analyzeDocument), not here — this
  // file only defines shape, not the citation-resolution invariant.
  citation: z.string().min(1),
  // States the pattern, never predicts the outcome (ADR-0007). Scope-creep
  // flags carry an explicit lower-confidence marker in this text.
  rationale: z.string().min(1),
});
export type Flag = z.infer<typeof FlagSchema>;

// dangling-reference: the document points at a schedule/exhibit that isn't
// in the extracted text. ambiguous-term: a defined term (e.g. "Contractor")
// whose referent isn't resolvable from the text. Always a distinct
// collection from Flag[], never merged into it (ADR-0008).
export const DefectTypeSchema = z.enum(["dangling-reference", "ambiguous-term"]);
export type DefectType = z.infer<typeof DefectTypeSchema>;

export const DocumentDefectSchema = z.object({
  defectType: DefectTypeSchema,
  description: z.string().min(1),
  // The location in documentText this defect concerns — same exact-substring
  // contract as Flag.citation, validated by the caller.
  citation: z.string().min(1),
});
export type DocumentDefect = z.infer<typeof DocumentDefectSchema>;

export const CounterOfferSchema = z.object({
  text: z.string().min(1),
});
export type CounterOffer = z.infer<typeof CounterOfferSchema>;

export const AnswerSchema = z.object({
  text: z.string().min(1),
  // false when the document doesn't address the question — see spec.md's
  // answerQuestion seam and user story 17 (say plainly when the document
  // doesn't address the question).
  addressedByDocument: z.boolean(),
});
export type Answer = z.infer<typeof AnswerSchema>;
