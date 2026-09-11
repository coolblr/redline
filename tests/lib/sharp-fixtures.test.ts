// Stub-based coverage (ticket 05) for the dedicated sharp-treatment
// fixtures: sharp-indemnification.txt/.expected.json and
// sharp-ip-assignment.txt/.expected.json. Each fixture isolates three
// clauses of one clauseType covering all three severity tiers, so this
// verifies computeSeverityTier / computeIpAssignmentSeverityTier end-to-end
// through analyzeDocument for every tier of each clause type's own test,
// without needing a live OpenRouter call (see scripts/eval-sharp.ts for the
// real-call version of the same fixtures).

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { analyzeDocument } from "@/lib/seams/analyze-document";
import { DEFAULT_RED_LINES } from "@/lib/red-lines";
import { createStubClient } from "../support/stub-openrouter-client";
import type { ClauseType, SeverityTier, StandardOrUnusual } from "@/lib/domain-types";
import sharpIndemnificationExpected from "../fixtures/sharp-indemnification.expected.json";
import sharpIpAssignmentExpected from "../fixtures/sharp-ip-assignment.expected.json";

function fixtureText(name: string): string {
  return readFileSync(path.join(__dirname, "..", "fixtures", name), "utf-8");
}

const sharpIndemnificationText = fixtureText("sharp-indemnification.txt");
const sharpIpAssignmentText = fixtureText("sharp-ip-assignment.txt");

type ExpectedFixtureFlag = {
  clauseType: string;
  sourceSentence: string;
  expectedSeverityTier: SeverityTier;
  expectedStandardOrUnusual: StandardOrUnusual;
  expectedTreatmentDepth: string;
};

function exposureFactsForTier(tier: SeverityTier): { isExposureCapped: boolean; isMutual: boolean } {
  if (tier === "top") return { isExposureCapped: false, isMutual: false };
  if (tier === "middle") return { isExposureCapped: true, isMutual: false };
  return { isExposureCapped: true, isMutual: true };
}

function timingForTier(tier: SeverityTier): "on-creation" | "on-delivery" | "on-full-payment" {
  if (tier === "top") return "on-creation";
  if (tier === "middle") return "on-delivery";
  return "on-full-payment";
}

function indemnificationCandidate(expected: ExpectedFixtureFlag) {
  const facts = exposureFactsForTier(expected.expectedSeverityTier);
  return {
    clauseType: expected.clauseType as ClauseType,
    citation: expected.sourceSentence,
    isExposureCapped: facts.isExposureCapped,
    isMutual: facts.isMutual,
    ipAssignmentTiming: null,
    standardOrUnusual: expected.expectedStandardOrUnusual,
    rationale: `Stub rationale for the ${expected.expectedSeverityTier} indemnification case.`,
  };
}

function ipAssignmentCandidate(expected: ExpectedFixtureFlag) {
  return {
    clauseType: expected.clauseType as ClauseType,
    citation: expected.sourceSentence,
    // isExposureCapped/isMutual are irrelevant for ip-assignment's own
    // timing-based test, but the raw schema still requires them.
    isExposureCapped: true,
    isMutual: true,
    ipAssignmentTiming: timingForTier(expected.expectedSeverityTier),
    standardOrUnusual: expected.expectedStandardOrUnusual,
    rationale: `Stub rationale for the ${expected.expectedSeverityTier} ip-assignment case.`,
  };
}

describe("sharp-indemnification fixture (all three exposure combinations)", () => {
  const expectedFlags = sharpIndemnificationExpected.flags as ExpectedFixtureFlag[];

  it("resolves each of the three indemnification clauses to its expected tier and sharp depth", async () => {
    const client = createStubClient({
      summary: "Three standalone indemnification clauses for review.",
      candidateFlags: expectedFlags.map(indemnificationCandidate),
    });

    const { flags } = await analyzeDocument(sharpIndemnificationText, DEFAULT_RED_LINES, {
      client,
    });

    expect(flags).toHaveLength(3);
    for (const expected of expectedFlags) {
      const flag = flags.find((f) => f.citation === expected.sourceSentence);
      expect(flag).toBeDefined();
      expect(flag?.severityTier).toBe(expected.expectedSeverityTier);
      expect(flag?.treatmentDepth).toBe("sharp");
    }
  });
});

describe("sharp-ip-assignment fixture (all three ownership timings)", () => {
  const expectedFlags = sharpIpAssignmentExpected.flags as ExpectedFixtureFlag[];

  it("resolves each of the three ip-assignment clauses to its expected tier and sharp depth", async () => {
    const client = createStubClient({
      summary: "Three standalone ip-assignment clauses for review.",
      candidateFlags: expectedFlags.map(ipAssignmentCandidate),
    });

    const { flags } = await analyzeDocument(sharpIpAssignmentText, DEFAULT_RED_LINES, {
      client,
    });

    expect(flags).toHaveLength(3);
    for (const expected of expectedFlags) {
      const flag = flags.find((f) => f.citation === expected.sourceSentence);
      expect(flag).toBeDefined();
      expect(flag?.severityTier).toBe(expected.expectedSeverityTier);
      expect(flag?.treatmentDepth).toBe("sharp");
    }
  });

  it("falls back to 'on-creation' (top) and logs a warning when the model reports a null timing for an ip-assignment clause", async () => {
    const onCreationExpected = expectedFlags.find((f) => f.expectedSeverityTier === "top")!;
    const client = createStubClient({
      summary: "One ip-assignment clause with a missing timing fact.",
      candidateFlags: [
        {
          clauseType: "ip-assignment" as ClauseType,
          citation: onCreationExpected.sourceSentence,
          isExposureCapped: true,
          isMutual: true,
          ipAssignmentTiming: null,
          standardOrUnusual: onCreationExpected.expectedStandardOrUnusual,
          rationale: "Stub rationale with a missing timing fact.",
        },
      ],
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { flags } = await analyzeDocument(sharpIpAssignmentText, DEFAULT_RED_LINES, { client });

    expect(flags).toHaveLength(1);
    expect(flags[0].severityTier).toBe("top");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
