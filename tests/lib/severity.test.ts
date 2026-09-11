import { describe, expect, it } from "vitest";
import {
  computeIpAssignmentSeverityTier,
  computeSeverityTier,
  computeTreatmentDepth,
} from "@/lib/seams/severity";
import { ClauseTypeSchema } from "@/lib/domain-types";

describe("computeSeverityTier", () => {
  // ADR-0005's exact three-tier exposure test, all four boolean combinations.
  it("uncapped + one-sided (isMutual: false) -> top", () => {
    expect(computeSeverityTier(false, false)).toBe("top");
  });

  it("uncapped + mutual (isMutual: true) -> top (uncapped dominates regardless of mutuality)", () => {
    expect(computeSeverityTier(false, true)).toBe("top");
  });

  it("capped + one-sided -> middle (the case ADR-0005 names as most likely to be miscategorized)", () => {
    expect(computeSeverityTier(true, false)).toBe("middle");
  });

  it("capped + mutual -> cite-only", () => {
    expect(computeSeverityTier(true, true)).toBe("cite-only");
  });
});

describe("computeIpAssignmentSeverityTier", () => {
  // PRD.md's own three-way timing test for ip-assignment (My red lines):
  // "severity depends on when ownership transfers -- on creation, on
  // delivery, or only on full payment. Transfer that happens before or
  // independent of payment is the dangerous pattern."
  it("on-creation -> top (rights transfer before any work product exists)", () => {
    expect(computeIpAssignmentSeverityTier("on-creation")).toBe("top");
  });

  it("on-delivery -> middle (transfers before payment, but after completed work)", () => {
    expect(computeIpAssignmentSeverityTier("on-delivery")).toBe("middle");
  });

  it("on-full-payment -> cite-only (matches the User's interest, the safe pattern)", () => {
    expect(computeIpAssignmentSeverityTier("on-full-payment")).toBe("cite-only");
  });
});

describe("computeTreatmentDepth", () => {
  it("assigns sharp to indemnification and ip-assignment, generic to every other clause type", () => {
    const allClauseTypes = ClauseTypeSchema.options;
    const sharpTypes = new Set(["indemnification", "ip-assignment"]);

    for (const clauseType of allClauseTypes) {
      const expected = sharpTypes.has(clauseType) ? "sharp" : "generic";
      expect(computeTreatmentDepth(clauseType)).toBe(expected);
    }
  });

  it("covers all seven ClauseType values", () => {
    expect(ClauseTypeSchema.options).toHaveLength(7);
  });
});
