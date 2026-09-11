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
 * IP-assignment's own severity test (ticket 05), separate from the
 * liability/exposure test above. Indemnification and limitation-of-liability
 * are liability/exposure clauses in ADR-0005's own scoping ("clauses
 * involving liability/exposure... severity is ranked by [caps/mutuality]");
 * ip-assignment isn't -- PRD.md's red line for it is explicitly a timing
 * question ("severity depends on when ownership transfers -- on creation,
 * on delivery, or only on full payment. Transfer that happens before or
 * independent of payment is the dangerous pattern"), not a caps/mutuality
 * one. Reusing computeSeverityTier for ip-assignment would ask the model to
 * force a timing fact through a cap/mutual lens it doesn't fit.
 *
 * The three-way timing-to-tier mapping below is this ticket's own judgment
 * call -- PRD.md pins down the ordering (before/independent of payment is
 * dangerous) but not these exact tier assignments:
 * - on-creation -> top: the most dangerous reading. Rights transfer before
 *   any work product exists to withhold as leverage for payment.
 * - on-delivery -> middle: still transfers before payment, so the same
 *   leverage problem exists, but only after the work is actually done --
 *   real severity, but a narrower window of exposure than on-creation.
 * - on-full-payment -> cite-only: the safe pattern PRD.md names by name;
 *   ownership only moves once Client has already paid.
 */
export function computeIpAssignmentSeverityTier(
  timing: "on-creation" | "on-delivery" | "on-full-payment"
): SeverityTier {
  if (timing === "on-creation") return "top";
  if (timing === "on-delivery") return "middle";
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
