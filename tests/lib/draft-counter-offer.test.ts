import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { draftCounterOffer } from "@/lib/seams/draft-counter-offer";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";
import { createStubClient } from "../support/stub-openrouter-client";
import type { Flag } from "@/lib/domain-types";

// draftCounterOffer's own quality bar is deliberately lighter than
// analyzeDocument's (spec.md "Testing Decisions"): these tests confirm it
// completes without error and produces pattern-stated (not
// outcome-predicting) text across a representative few clause types --
// not a quality bar on the drafted language itself.

const DOCUMENT_TEXT =
  "This Agreement is between Acme Retail Group LLC (\"Client\") and Jordan Ruiz d/b/a Ruiz Digital Studio (\"Contractor\"). Contractor shall indemnify, defend, and hold harmless Client from any and all third-party claims, without limitation as to amount.";

function makeFlag(overrides: Partial<Flag>): Flag {
  return {
    clauseType: "indemnification",
    severityTier: "top",
    standardOrUnusual: "unusual",
    treatmentDepth: "sharp",
    citation:
      "Contractor shall indemnify, defend, and hold harmless Client from any and all third-party claims, without limitation as to amount.",
    rationale:
      "States an indemnification obligation running only from Contractor to Client, with no dollar cap.",
    ...overrides,
  };
}

const INDEMNIFICATION_FLAG = makeFlag({});

const IP_ASSIGNMENT_FLAG = makeFlag({
  clauseType: "ip-assignment",
  severityTier: "top",
  treatmentDepth: "sharp",
  citation: "Ownership of the deliverables vests in Client upon creation.",
  rationale:
    "States that ownership vests in Client upon creation, independent of whether Client has paid.",
});

// A generic-treatment clause type (ADR-0004), distinct from the two sharp
// types above.
const NON_COMPETE_FLAG = makeFlag({
  clauseType: "non-compete",
  severityTier: "middle",
  treatmentDepth: "generic",
  citation:
    "Contractor shall not work for any competing business for three years following termination.",
  rationale: "States a three-year, industry-wide restriction on Contractor.",
});

describe("draftCounterOffer", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("completes without error across a representative few clause types", () => {
    it.each([
      ["indemnification", INDEMNIFICATION_FLAG],
      ["ip-assignment", IP_ASSIGNMENT_FLAG],
      ["non-compete (generic treatment)", NON_COMPETE_FLAG],
    ])("returns a valid CounterOffer for a %s flag", async (_label, flag) => {
      const client = createStubClient({
        text: "Propose capping Contractor's indemnification obligation at the total fees paid under this Agreement, and make the obligation mutual.",
      });

      const counterOffer = await draftCounterOffer(DOCUMENT_TEXT, flag, { client });

      expect(counterOffer).toEqual({
        text: "Propose capping Contractor's indemnification obligation at the total fees paid under this Agreement, and make the obligation mutual.",
      });
      expect(typeof counterOffer.text).toBe("string");
      expect(counterOffer.text.length).toBeGreaterThan(0);
    });
  });

  describe("outcome-prediction copy check (ADR-0007)", () => {
    it("finds zero hits and does not warn for clean, pattern-stated text", async () => {
      const client = createStubClient({
        text: "Propose that the indemnification obligation be capped at total fees paid and apply equally to both parties -- this pattern is usually unfavorable to the party with less negotiating leverage.",
      });

      const counterOffer = await draftCounterOffer(DOCUMENT_TEXT, INDEMNIFICATION_FLAG, {
        client,
      });

      expect(findOutcomePredictionPhrases(counterOffer.text)).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("actually runs findOutcomePredictionPhrases against the result and warns on a hit", async () => {
      const client = createStubClient({
        text: "Propose a mutual cap on indemnification -- you would win this dispute if it ever went to court.",
      });

      const counterOffer = await draftCounterOffer(DOCUMENT_TEXT, INDEMNIFICATION_FLAG, {
        client,
      });

      // Prove the check actually ran against this seam's own output, not
      // just that the function exists.
      const hits = findOutcomePredictionPhrases(counterOffer.text);
      expect(hits.length).toBeGreaterThan(0);
      expect(warnSpy).toHaveBeenCalled();
      const warnCall = warnSpy.mock.calls.find((call) =>
        String(call[0]).includes("outcome-prediction")
      );
      expect(warnCall).toBeDefined();
    });
  });

  describe("zod validation of the raw response", () => {
    it("throws when the raw response is missing `text`", async () => {
      const client = createStubClient({ notText: "oops" });

      await expect(
        draftCounterOffer(DOCUMENT_TEXT, INDEMNIFICATION_FLAG, { client })
      ).rejects.toThrow();
    });

    it("throws when `text` is an empty string", async () => {
      const client = createStubClient({ text: "" });

      await expect(
        draftCounterOffer(DOCUMENT_TEXT, INDEMNIFICATION_FLAG, { client })
      ).rejects.toThrow();
    });
  });
});
