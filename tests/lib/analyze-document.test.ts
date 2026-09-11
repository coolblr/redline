import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeDocument,
  NOTHING_ABOVE_CITE_ONLY_SENTENCE,
  SCOPE_CREEP_HEDGE_MARKER,
} from "@/lib/seams/analyze-document";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";
import { DEFAULT_RED_LINES } from "@/lib/red-lines";
import { createStubClient } from "../support/stub-openrouter-client";
import type { ClauseType, SeverityTier, StandardOrUnusual } from "@/lib/domain-types";
import adhesionExpected from "../fixtures/adhesion-contract.expected.json";

function fixtureText(name: string): string {
  return readFileSync(path.join(__dirname, "..", "fixtures", name), "utf-8");
}

const adhesionText = fixtureText("adhesion-contract.txt");
const cleanText = fixtureText("clean-contract.txt");

// Inverts computeSeverityTier: given the expected tier from the fixture's
// .expected.json, derive the isExposureCapped/isMutual facts a stub payload
// would need to report for analyzeDocument to arrive back at that tier.
function factsForTier(tier: SeverityTier): { isExposureCapped: boolean; isMutual: boolean } {
  if (tier === "top") return { isExposureCapped: false, isMutual: false };
  if (tier === "middle") return { isExposureCapped: true, isMutual: false };
  return { isExposureCapped: true, isMutual: true };
}

type ExpectedFixtureFlag = {
  clauseType: string;
  sourceSentence: string;
  expectedSeverityTier: SeverityTier;
  expectedStandardOrUnusual: StandardOrUnusual;
  expectedTreatmentDepth: string;
};

// Inverts computeIpAssignmentSeverityTier: given the expected tier, derive
// the ipAssignmentTiming fact a stub payload would need to report for
// analyzeDocument to arrive back at that tier.
function ipAssignmentTimingForTier(
  tier: SeverityTier
): "on-creation" | "on-delivery" | "on-full-payment" {
  if (tier === "top") return "on-creation";
  if (tier === "middle") return "on-delivery";
  return "on-full-payment";
}

function candidateFromExpected(expected: ExpectedFixtureFlag, rationale: string) {
  const facts = factsForTier(expected.expectedSeverityTier);
  return {
    clauseType: expected.clauseType as ClauseType,
    citation: expected.sourceSentence,
    isExposureCapped: facts.isExposureCapped,
    isMutual: facts.isMutual,
    ipAssignmentTiming:
      expected.clauseType === "ip-assignment"
        ? ipAssignmentTimingForTier(expected.expectedSeverityTier)
        : null,
    standardOrUnusual: expected.expectedStandardOrUnusual,
    rationale,
  };
}

const adhesionFlags = adhesionExpected.flags as ExpectedFixtureFlag[];
const byClauseType = Object.fromEntries(
  adhesionFlags.map((flag) => [flag.clauseType, flag])
) as Record<string, ExpectedFixtureFlag>;

// A candidate flag whose citation is NOT an exact substring of the
// document text -- a slightly invented/paraphrased sentence, standing in
// for a model hallucination. Used to prove the ADR-0001 drop actually
// happens.
const BROKEN_CITATION =
  "Client may terminate this Agreement immediately for any reason without notice or a kill fee.";

function buildAdhesionCandidateFlags() {
  return [
    candidateFromExpected(
      byClauseType["indemnification"],
      "States an indemnification obligation running only from Contractor to Client, with no dollar cap and no matching duty from Client."
    ),
    candidateFromExpected(
      byClauseType["ip-assignment"],
      "States that ownership of the deliverables vests in Client upon creation, independent of whether Client has paid the fees then due."
    ),
    candidateFromExpected(
      byClauseType["limitation-of-liability"],
      "States a liability cap of $25,000 for Client while leaving Contractor's liability uncapped -- an asymmetric arrangement."
    ),
    candidateFromExpected(
      byClauseType["non-compete"],
      "States a three-year, nationwide, industry-wide restriction on Contractor working for a competing business."
    ),
    candidateFromExpected(
      byClauseType["arbitration"],
      "States that both parties waive the right to a jury trial and to participate in a class action."
    ),
    candidateFromExpected(
      byClauseType["scope-creep"],
      "States an unlimited-revisions obligation gated only by Client's sole discretion, at no added cost to Contractor."
    ),
    {
      clauseType: "unilateral-termination" as ClauseType,
      citation: BROKEN_CITATION,
      isExposureCapped: true,
      isMutual: false,
      ipAssignmentTiming: null,
      standardOrUnusual: "unusual" as StandardOrUnusual,
      rationale: "States a termination pattern with no notice period and no kill fee.",
    },
  ];
}

const ADHESION_STUB_RESPONSE = {
  summary:
    "This is a web-development services agreement between Acme Retail Group LLC and Jordan Ruiz d/b/a Ruiz Digital Studio.",
  candidateFlags: buildAdhesionCandidateFlags(),
};

const CLEAN_STUB_RESPONSE = {
  summary:
    "This is a design services agreement between Harbor & Finch Consulting LLC and Priya Nakamura d/b/a Nakamura Design Co, covering a brand style guide and related marketing materials.",
  candidateFlags: [
    {
      clauseType: "indemnification" as ClauseType,
      citation:
        "Each party's obligation to indemnify the other under this Section 7 shall not exceed the total fees paid or payable under this Agreement.",
      isExposureCapped: true,
      isMutual: true,
      ipAssignmentTiming: null,
      standardOrUnusual: "standard" as StandardOrUnusual,
      rationale: "States a liability cap shared equally by both parties, with no asymmetry.",
    },
    {
      clauseType: "limitation-of-liability" as ClauseType,
      citation:
        "In no event shall either party's total liability arising out of or relating to this Agreement exceed the total fees paid or payable under this Agreement.",
      isExposureCapped: true,
      isMutual: true,
      ipAssignmentTiming: null,
      standardOrUnusual: "standard" as StandardOrUnusual,
      rationale: "States a liability cap that applies equally to both parties.",
    },
  ],
};

describe("analyzeDocument", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("sharp-treatment bar (ADR-0004)", () => {
    it("resolves the indemnification flag to top severity and sharp depth", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

      const flag = flags.find((f) => f.clauseType === "indemnification");
      expect(flag).toBeDefined();
      expect(flag?.severityTier).toBe("top");
      expect(flag?.treatmentDepth).toBe("sharp");
    });

    it("resolves the ip-assignment flag to its expected severity tier and sharp depth", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

      const flag = flags.find((f) => f.clauseType === "ip-assignment");
      expect(flag).toBeDefined();
      expect(flag?.severityTier).toBe(byClauseType["ip-assignment"].expectedSeverityTier);
      expect(flag?.treatmentDepth).toBe("sharp");
    });
  });

  it("resolves the capped-but-one-sided limitation-of-liability flag to middle, not cite-only (ADR-0005's named case)", async () => {
    const client = createStubClient(ADHESION_STUB_RESPONSE);
    const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

    const flag = flags.find((f) => f.clauseType === "limitation-of-liability");
    expect(flag).toBeDefined();
    expect(flag?.severityTier).toBe("middle");
  });

  describe("recall bar (ADR-0006) -- generic-treatment clause types are at least flagged", () => {
    it("returns a non-compete flag", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });
      expect(flags.some((f) => f.clauseType === "non-compete")).toBe(true);
    });

    it("returns a scope-creep flag", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });
      expect(flags.some((f) => f.clauseType === "scope-creep")).toBe(true);
    });

    it("returns an arbitration flag", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });
      expect(flags.some((f) => f.clauseType === "arbitration")).toBe(true);
    });
  });

  it("keeps standardOrUnusual independent of severity tier (arbitration: top-severity + standard)", async () => {
    const client = createStubClient(ADHESION_STUB_RESPONSE);
    const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

    const flag = flags.find((f) => f.clauseType === "arbitration");
    expect(flag).toBeDefined();
    expect(flag?.severityTier).toBe("top");
    expect(flag?.standardOrUnusual).toBe("standard");
  });

  describe("clean-document path", () => {
    it("appends the deterministic 'nothing above cite-only' sentence and returns only cite-only flags", async () => {
      const client = createStubClient(CLEAN_STUB_RESPONSE);
      const { summary, flags } = await analyzeDocument(cleanText, DEFAULT_RED_LINES, { client });

      expect(summary).toContain(NOTHING_ABOVE_CITE_ONLY_SENTENCE);
      expect(flags.length).toBeGreaterThan(0);
      for (const flag of flags) {
        expect(flag.severityTier).toBe("cite-only");
      }
    });
  });

  describe("citation-resolution enforcement (ADR-0001)", () => {
    it("drops a candidate flag whose citation is not an exact substring of documentText", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

      expect(flags.some((f) => f.citation === BROKEN_CITATION)).toBe(false);
      expect(flags.some((f) => f.clauseType === "unilateral-termination")).toBe(false);
      // The other six legitimate candidates still made it through.
      expect(flags).toHaveLength(6);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  it("carries the scope-creep lower-confidence marker in its rationale", async () => {
    const client = createStubClient(ADHESION_STUB_RESPONSE);
    const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

    const flag = flags.find((f) => f.clauseType === "scope-creep");
    expect(flag).toBeDefined();
    expect(flag?.rationale).toContain(SCOPE_CREEP_HEDGE_MARKER);
  });

  describe("outcome-prediction copy check (ADR-0007)", () => {
    it("finds zero outcome-prediction hits across the adhesion fixture's flags and summary", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { summary, flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, {
        client,
      });

      expect(findOutcomePredictionPhrases(summary)).toEqual([]);
      for (const flag of flags) {
        expect(findOutcomePredictionPhrases(flag.rationale)).toEqual([]);
      }
    });

    it("finds zero outcome-prediction hits across the clean fixture's flags and summary", async () => {
      const client = createStubClient(CLEAN_STUB_RESPONSE);
      const { summary, flags } = await analyzeDocument(cleanText, DEFAULT_RED_LINES, { client });

      expect(findOutcomePredictionPhrases(summary)).toEqual([]);
      for (const flag of flags) {
        expect(findOutcomePredictionPhrases(flag.rationale)).toEqual([]);
      }
    });
  });

  describe("all returned flag citations resolve against documentText (ADR-0001, general form)", () => {
    it("holds for every flag returned from the adhesion fixture", async () => {
      const client = createStubClient(ADHESION_STUB_RESPONSE);
      const { flags } = await analyzeDocument(adhesionText, DEFAULT_RED_LINES, { client });

      expect(flags.length).toBeGreaterThan(0);
      for (const flag of flags) {
        expect(adhesionText.includes(flag.citation)).toBe(true);
      }
    });

    it("holds for every flag returned from the clean fixture", async () => {
      const client = createStubClient(CLEAN_STUB_RESPONSE);
      const { flags } = await analyzeDocument(cleanText, DEFAULT_RED_LINES, { client });

      expect(flags.length).toBeGreaterThan(0);
      for (const flag of flags) {
        expect(cleanText.includes(flag.citation)).toBe(true);
      }
    });
  });
});
