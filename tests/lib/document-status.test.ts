import { describe, expect, it } from "vitest";
import { documentStatusLabel } from "@/lib/document-status";

describe("documentStatusLabel", () => {
  it("reports not-analyzed when summary is null", () => {
    expect(documentStatusLabel(null)).toBe("Not analyzed yet");
  });

  it("reports analyzed when a summary string is present", () => {
    expect(documentStatusLabel("This lease runs month to month.")).toBe("Analyzed");
  });

  it("treats an empty string summary as analyzed, not null", () => {
    // documents.summary is either null (never analyzed) or the exact text
    // analyzeDocument produced -- an empty string isn't a value runAnalysis
    // would ever write, but this pins the function to checking null
    // specifically, not falsiness, so it can't be broken by conflating the
    // two later.
    expect(documentStatusLabel("")).toBe("Analyzed");
  });
});
