import { describe, expect, it } from "vitest";
import { findOutcomePredictionPhrases } from "@/lib/copy-checks";

describe("findOutcomePredictionPhrases", () => {
  it("flags a predicted courtroom loss", () => {
    const hits = findOutcomePredictionPhrases(
      "Given this clause, you would lose in court over this."
    );
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a predicted courtroom win", () => {
    const hits = findOutcomePredictionPhrases("You will win if this ever goes to court.");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a declared enforceability verdict", () => {
    const hits = findOutcomePredictionPhrases("This clause is unenforceable.");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a forecast of what a court will do", () => {
    const hits = findOutcomePredictionPhrases(
      "The court will side with you on this point."
    );
    expect(hits.length).toBeGreaterThan(0);
  });

  it("flags a forecast of what a judge would do", () => {
    const hits = findOutcomePredictionPhrases("A judge would strike this clause down.");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("returns no hits for pattern-stated, acceptable language", () => {
    const hits = findOutcomePredictionPhrases(
      "This pattern is usually unfavorable to the party with less negotiating leverage."
    );
    expect(hits).toEqual([]);
  });

  it("returns no hits for a flat restatement of document text", () => {
    const hits = findOutcomePredictionPhrases(
      "This clause states that Contractor indemnifies Client for any and all claims, with no cap."
    );
    expect(hits).toEqual([]);
  });

  it("returns no hits for plain factual text unrelated to legal outcomes", () => {
    const hits = findOutcomePredictionPhrases(
      "The Agreement was entered into on March 3, 2026, between Client and Contractor."
    );
    expect(hits).toEqual([]);
  });
});
