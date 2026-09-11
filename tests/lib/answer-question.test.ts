import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "@/lib/seams/answer-question";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";
import { createStubClient } from "../support/stub-openrouter-client";

// answerQuestion's own testing bar (spec.md "Testing Decisions"): tested
// against known-absent-answer cases (a question about a clause type that
// isn't in the document) to confirm it says the document doesn't address
// the question rather than inferring an answer. These are stub-level tests
// that prove the seam's plumbing faithfully carries the model's
// addressedByDocument flag through; the real known-absent-answer proof
// against a live model is scripts/smoke.ts.

const DOCUMENT_TEXT =
  "This Agreement is between Acme Retail Group LLC (\"Client\") and Jordan Ruiz d/b/a Ruiz Digital Studio (\"Contractor\"). Contractor shall indemnify, defend, and hold harmless Client from any and all third-party claims, without limitation as to amount.";

describe("answerQuestion", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("round-trips an addressed answer (addressedByDocument: true)", async () => {
    const client = createStubClient({
      text: "Yes -- Contractor indemnifies Client for any and all third-party claims, with no dollar cap.",
      addressedByDocument: true,
    });

    const answer = await answerQuestion(
      DOCUMENT_TEXT,
      "Does this contract include an indemnification clause?",
      { client }
    );

    expect(answer).toEqual({
      text: "Yes -- Contractor indemnifies Client for any and all third-party claims, with no dollar cap.",
      addressedByDocument: true,
    });
  });

  it("round-trips a known-absent answer (addressedByDocument: false) without overriding the flag", async () => {
    const client = createStubClient({
      text: "The document doesn't address this.",
      addressedByDocument: false,
    });

    const answer = await answerQuestion(
      DOCUMENT_TEXT,
      "Does this contract include an arbitration clause?",
      { client }
    );

    expect(answer).toEqual({
      text: "The document doesn't address this.",
      addressedByDocument: false,
    });
  });

  describe("outcome-prediction copy check (ADR-0007)", () => {
    it("finds zero hits and does not warn for clean, pattern-stated text", async () => {
      const client = createStubClient({
        text: "The clause caps Contractor's liability at total fees paid, applied equally to both parties.",
        addressedByDocument: true,
      });

      const answer = await answerQuestion(DOCUMENT_TEXT, "Is liability capped?", {
        client,
      });

      expect(findOutcomePredictionPhrases(answer.text)).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("actually runs findOutcomePredictionPhrases against the result and warns on a hit", async () => {
      const client = createStubClient({
        text: "This clause is unenforceable, so you would win if this went to court.",
        addressedByDocument: true,
      });

      const answer = await answerQuestion(
        DOCUMENT_TEXT,
        "Would I win a dispute over this clause?",
        { client }
      );

      // Prove the check actually ran against this seam's own output, not
      // just that the function exists.
      const hits = findOutcomePredictionPhrases(answer.text);
      expect(hits.length).toBeGreaterThan(0);
      expect(warnSpy).toHaveBeenCalled();
      const warnCall = warnSpy.mock.calls.find((call) =>
        String(call[0]).includes("outcome-prediction")
      );
      expect(warnCall).toBeDefined();
    });
  });

  describe("zod validation of the raw response", () => {
    it("throws when the raw response is missing `addressedByDocument`", async () => {
      const client = createStubClient({ text: "Some answer." });

      await expect(
        answerQuestion(DOCUMENT_TEXT, "Is there an arbitration clause?", { client })
      ).rejects.toThrow();
    });

    it("throws when `addressedByDocument` is a non-boolean", async () => {
      const client = createStubClient({
        text: "Some answer.",
        addressedByDocument: "false",
      });

      await expect(
        answerQuestion(DOCUMENT_TEXT, "Is there an arbitration clause?", { client })
      ).rejects.toThrow();
    });

    it("throws when `text` is an empty string", async () => {
      const client = createStubClient({ text: "", addressedByDocument: true });

      await expect(
        answerQuestion(DOCUMENT_TEXT, "Is there an arbitration clause?", { client })
      ).rejects.toThrow();
    });
  });
});
