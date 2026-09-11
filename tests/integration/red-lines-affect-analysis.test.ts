// Proves ticket 07's core acceptance criterion -- "editing red lines
// visibly changes Flag[]" -- deterministically, with a stub OpenRouterClient
// rather than live model variability.
//
// analyzeDocument itself has no `enabled` concept (that filtering happens
// outside the seam, see lib/red-lines.ts). So the proof here is two steps,
// matching how app/documents/[id]/actions.ts actually calls them: get the
// full flag set analyzeDocument returns for a fixed stub response, then
// apply filterFlagsByRedLines with one clause type disabled and assert that
// clause type's flags -- and only that clause type's flags -- disappear.

import { describe, expect, it } from "vitest";
import { analyzeDocument } from "@/lib/seams/analyze-document";
import { DEFAULT_RED_LINES, filterFlagsByRedLines, type RedLine } from "@/lib/red-lines";
import { createStubClient } from "../support/stub-openrouter-client";

const DOCUMENT_TEXT = `This Agreement is between Acme Client Corp and Jordan Freelancer.

Contractor shall indemnify Client against any and all claims without limitation as to amount.

Contractor shall not perform similar work for any competitor of Client anywhere in the United States for a period of three years after termination.

Client may request unlimited revisions to the deliverables at no additional cost, at Client's sole discretion.`;

const INDEMNIFICATION_CITATION =
  "Contractor shall indemnify Client against any and all claims without limitation as to amount.";
const NON_COMPETE_CITATION =
  "Contractor shall not perform similar work for any competitor of Client anywhere in the United States for a period of three years after termination.";
const SCOPE_CREEP_CITATION =
  "Client may request unlimited revisions to the deliverables at no additional cost, at Client's sole discretion.";

const STUB_RESPONSE = {
  summary: "A freelance services agreement between Acme Client Corp and Jordan Freelancer.",
  candidateFlags: [
    {
      clauseType: "indemnification",
      citation: INDEMNIFICATION_CITATION,
      isExposureCapped: false,
      isMutual: false,
      ipAssignmentTiming: null,
      standardOrUnusual: "unusual",
      rationale: "States an uncapped, one-sided indemnification obligation.",
    },
    {
      clauseType: "non-compete",
      citation: NON_COMPETE_CITATION,
      isExposureCapped: true,
      isMutual: false,
      ipAssignmentTiming: null,
      standardOrUnusual: "unusual",
      rationale: "States a broad, multi-year, nationwide non-compete restriction.",
    },
    {
      clauseType: "scope-creep",
      citation: SCOPE_CREEP_CITATION,
      isExposureCapped: true,
      isMutual: false,
      ipAssignmentTiming: null,
      standardOrUnusual: "standard",
      rationale: "States an open-ended revisions obligation gated only by Client's discretion.",
    },
  ],
  candidateDefects: [],
};

describe("editing red lines visibly changes Flag[] (deterministic, stub-backed)", () => {
  it("returns all three clause types in the baseline (fully-enabled) case", async () => {
    const client = createStubClient(STUB_RESPONSE);
    const { flags } = await analyzeDocument(DOCUMENT_TEXT, DEFAULT_RED_LINES, { client });

    expect(flags.map((f) => f.clauseType).sort()).toEqual(
      ["indemnification", "non-compete", "scope-creep"].sort()
    );
  });

  it("drops exactly the disabled clause type's flags after filtering, leaving the rest untouched", async () => {
    const client = createStubClient(STUB_RESPONSE);
    const { flags: baselineFlags } = await analyzeDocument(DOCUMENT_TEXT, DEFAULT_RED_LINES, {
      client,
    });

    const redLinesWithNonCompeteDisabled: RedLine[] = DEFAULT_RED_LINES.map((redLine) =>
      redLine.clauseType === "non-compete" ? { ...redLine, enabled: false } : redLine
    );

    const filtered = filterFlagsByRedLines(baselineFlags, redLinesWithNonCompeteDisabled);

    expect(filtered.some((f) => f.clauseType === "non-compete")).toBe(false);
    expect(filtered.some((f) => f.clauseType === "indemnification")).toBe(true);
    expect(filtered.some((f) => f.clauseType === "scope-creep")).toBe(true);
    expect(filtered).toHaveLength(baselineFlags.length - 1);
  });

  it("disabling a different clause type drops a different, visibly distinct Flag[]", async () => {
    const client = createStubClient(STUB_RESPONSE);
    const { flags: baselineFlags } = await analyzeDocument(DOCUMENT_TEXT, DEFAULT_RED_LINES, {
      client,
    });

    const redLinesWithScopeCreepDisabled: RedLine[] = DEFAULT_RED_LINES.map((redLine) =>
      redLine.clauseType === "scope-creep" ? { ...redLine, enabled: false } : redLine
    );

    const filtered = filterFlagsByRedLines(baselineFlags, redLinesWithScopeCreepDisabled);

    expect(filtered.some((f) => f.clauseType === "scope-creep")).toBe(false);
    expect(filtered.some((f) => f.clauseType === "non-compete")).toBe(true);
    expect(filtered.some((f) => f.clauseType === "indemnification")).toBe(true);
    expect(filtered).toHaveLength(baselineFlags.length - 1);

    // The two disabled-clause-type runs above produced different Flag[]
    // outputs from the same baseline -- editing which clause type is
    // disabled visibly changes the result, not just whether something
    // changed.
    const nonCompeteDisabledClauseTypes = baselineFlags
      .filter((f) => f.clauseType !== "non-compete")
      .map((f) => f.clauseType)
      .sort();
    const scopeCreepDisabledClauseTypes = filtered.map((f) => f.clauseType).sort();
    expect(scopeCreepDisabledClauseTypes).not.toEqual(nonCompeteDisabledClauseTypes);
  });
});
