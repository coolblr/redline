import { describe, expect, it } from "vitest";
import { DEFAULT_RED_LINES, filterFlagsByRedLines, type RedLine } from "@/lib/red-lines";
import type { ClauseType, Flag } from "@/lib/domain-types";

function makeFlag(clauseType: ClauseType, citation: string): Flag {
  return {
    clauseType,
    severityTier: "top",
    standardOrUnusual: "unusual",
    treatmentDepth: "generic",
    citation,
    rationale: "States a pattern worth flagging.",
  };
}

function makeRedLine(clauseType: ClauseType, enabled: boolean): RedLine {
  return { clauseType, guidance: "Some guidance.", enabled };
}

describe("DEFAULT_RED_LINES", () => {
  it("has one enabled entry per ClauseType (all seven types)", () => {
    expect(DEFAULT_RED_LINES).toHaveLength(7);
    for (const redLine of DEFAULT_RED_LINES) {
      expect(redLine.enabled).toBe(true);
    }
  });
});

describe("filterFlagsByRedLines", () => {
  it("filters out a flag whose clause type is disabled", () => {
    const flags = [makeFlag("non-compete", "A non-compete sentence.")];
    const redLines = [makeRedLine("non-compete", false)];

    expect(filterFlagsByRedLines(flags, redLines)).toEqual([]);
  });

  it("keeps a flag whose clause type is enabled", () => {
    const flag = makeFlag("indemnification", "An indemnification sentence.");
    const redLines = [makeRedLine("indemnification", true)];

    expect(filterFlagsByRedLines([flag], redLines)).toEqual([flag]);
  });

  it("keeps a flag whose clause type has no matching red-line entry (default-enabled)", () => {
    const flag = makeFlag("arbitration", "An arbitration sentence.");
    // No red line for "arbitration" at all -- a User's customized list
    // that's missing an entry shouldn't silently drop that clause type.
    const redLines = [makeRedLine("indemnification", true)];

    expect(filterFlagsByRedLines([flag], redLines)).toEqual([flag]);
  });

  it("filters multiple clause types independently", () => {
    const indemnificationFlag = makeFlag("indemnification", "Indemnification sentence.");
    const nonCompeteFlag = makeFlag("non-compete", "Non-compete sentence.");
    const scopeCreepFlag = makeFlag("scope-creep", "Scope-creep sentence.");

    const redLines: RedLine[] = [
      makeRedLine("indemnification", true),
      makeRedLine("non-compete", false),
      makeRedLine("scope-creep", true),
    ];

    const result = filterFlagsByRedLines(
      [indemnificationFlag, nonCompeteFlag, scopeCreepFlag],
      redLines
    );

    expect(result).toContainEqual(indemnificationFlag);
    expect(result).toContainEqual(scopeCreepFlag);
    expect(result).not.toContainEqual(nonCompeteFlag);
    expect(result).toHaveLength(2);
  });

  it("returns an empty array when every matching clause type is disabled", () => {
    const flags = [
      makeFlag("indemnification", "Indemnification sentence."),
      makeFlag("ip-assignment", "IP assignment sentence."),
    ];
    const redLines: RedLine[] = [
      makeRedLine("indemnification", false),
      makeRedLine("ip-assignment", false),
    ];

    expect(filterFlagsByRedLines(flags, redLines)).toEqual([]);
  });
});
