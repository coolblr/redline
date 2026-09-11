import { describe, expect, it } from "vitest";
import { computeSeverityTier, computeTreatmentDepth } from "@/lib/seams/severity";
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
