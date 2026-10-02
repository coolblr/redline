import { describe, expect, it } from "vitest";
import {
  ANALYSIS_BUSY_MESSAGE,
  ANALYSIS_FAILED_MESSAGE,
  friendlyAnalysisError,
} from "@/lib/analysis-errors";

// What lib/openrouter.ts throws for a rate-limited provider, trimmed from the
// real message seen on 2026-10-02.
const RATE_LIMITED = new Error(
  'OpenRouter request failed with status 429: {"error":{"message":"Provider returned error","code":429,"metadata":{"raw":"z-ai/glm-5.3-flash is temporarily rate-limited upstream.","retry_after_seconds":5}}}'
);

describe("friendlyAnalysisError", () => {
  it("says the service is busy when the provider is rate-limited", () => {
    expect(friendlyAnalysisError(RATE_LIMITED)).toBe(ANALYSIS_BUSY_MESSAGE);
  });

  it("never shows the reader the provider's raw response", () => {
    const shown = friendlyAnalysisError(RATE_LIMITED);

    expect(shown).not.toMatch(/openrouter|429|fireworks|\{|glm/i);
  });

  it("gives a generic message for any other provider failure", () => {
    const serverError = new Error("OpenRouter request failed with status 502: bad gateway");

    expect(friendlyAnalysisError(serverError)).toBe(ANALYSIS_FAILED_MESSAGE);
  });

  it("gives a generic message when the model's reply cannot be parsed, without leaking the details", () => {
    const parseError = new Error('[{"code":"invalid_type","path":["summary"],"message":"Required"}]');

    expect(friendlyAnalysisError(parseError)).toBe(ANALYSIS_FAILED_MESSAGE);
  });

  it("keeps the app's own plain-language messages", () => {
    expect(friendlyAnalysisError(new Error("Sign in to run analysis."))).toBe(
      "Sign in to run analysis."
    );
    expect(
      friendlyAnalysisError(new Error("Couldn't save the flagged clauses. Try again."))
    ).toBe("Couldn't save the flagged clauses. Try again.");
  });

  it("gives a generic message when something that is not an Error was thrown", () => {
    expect(friendlyAnalysisError("boom")).toBe(ANALYSIS_FAILED_MESSAGE);
    expect(friendlyAnalysisError(undefined)).toBe(ANALYSIS_FAILED_MESSAGE);
  });
});
