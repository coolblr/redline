// Deterministic severity tiering (ADR-0005) and treatment depth (ADR-0004).
//
// Both are computed here in plain TypeScript, never self-reported by the
// model. ADR-0005's own "Consequences" section names the capped-but-
// one-sided case as "the case most likely to be miscategorized by a naive
// implementation" -- the fix is to not ask the model for a tier label at
// all. The model reports two structured facts per candidate flag
// (isExposureCapped, isMutual); analyzeDocument (lib/seams/analyze-document.ts)
// calls computeSeverityTier on those facts after citation resolution.

import type { ClauseType, SeverityTier, TreatmentDepth } from "@/lib/domain-types";

/**
 * Three-tier exposure test (ADR-0005):
 * - top: uncapped exposure. Uncapped is the primary cost signal regardless
 *   of mutuality (ADR-0005: cost-if-it-bites is the primary axis; ADR-0006:
 *   optimize against misses) -- this covers both the uncapped+one-sided
 *   case ADR-0005 names explicitly and the uncapped+mutual combination it
 *   doesn't name explicitly.
 * - middle: capped but still one-sided -- ADR-0005's named "most likely to
 *   be miscategorized" case. Asymmetry alone earns real severity even
 *   though a cap exists.
 * - cite-only: capped and mutual (bounded, symmetric exposure).
 */
export function computeSeverityTier(
  isExposureCapped: boolean,
  isMutual: boolean
): SeverityTier {
  if (!isExposureCapped) return "top";
  if (isExposureCapped && !isMutual) return "middle";
  return "cite-only";
}

/**
 * "sharp" for indemnification and ip-assignment -- the two clause types
 * ADR-0004 judges both freelance-specific and highest-consequence.
 * "generic" for the other five clause types in v1.
 */
export function computeTreatmentDepth(clauseType: ClauseType): TreatmentDepth {
  return clauseType === "indemnification" || clauseType === "ip-assignment"
    ? "sharp"
    : "generic";
}
