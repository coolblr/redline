import { describe, expect, it, vi } from "vitest";
import { analyzeDocument } from "@/lib/seams/analyze-document";
import { DEFAULT_RED_LINES } from "@/lib/red-lines";
import { createStubClient } from "../support/stub-openrouter-client";

// Adversarial probe of the citation resolver (ADR-0001). The desired
// contract: a surfaced flag's citation is one complete sentence of the
// document, byte-for-byte (modulo whitespace). Each case states the model
// output and what the product should do with it.

const S1 = "Contractor shall indemnify Client against all claims, without limitation as to amount.";
const S2 = "Client shall pay each invoice within thirty days of receipt.";
const S3 = "Client may terminate this Agreement on written notice.";
const S3_DUP = "Client may terminate this Agreement on written notice.";
const DOC = `1. Indemnity. ${S1} 2. Payment. ${S2} 3. Term. ${S3}\n4. Renewal. ${S3_DUP}`;
const WRAPPED = DOC.replace(S2, "Client shall pay each invoice\n   within thirty days  of receipt.");

function candidate(citation: string) {
  return {
    clauseType: "indemnification",
    citation,
    isExposureCapped: false,
    isMutual: false,
    ipAssignmentTiming: null,
    standardOrUnusual: "unusual",
    rationale: "States an uncapped one-way obligation.",
  };
}

async function surfaced(documentText: string, citation: string): Promise<string[]> {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const stub = createStubClient({
    summary: "A short agreement.",
    candidateFlags: [candidate(citation)],
    candidateDefects: [],
  });
  const result = await analyzeDocument(documentText, DEFAULT_RED_LINES, { client: stub });
  return result.flags.map((f) => f.citation);
}

describe("citation resolver: should surface", () => {
  it("an exact whole sentence", async () => {
    expect(await surfaced(DOC, S1)).toEqual([S1]);
  });

  it("a whole sentence re-flowed onto one line, returning the document's own wording", async () => {
    const out = await surfaced(WRAPPED, S2);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("\n"); // document's wording, not the model's
  });
});

describe("citation resolver: should drop", () => {
  it("a paraphrase", async () => {
    expect(await surfaced(DOC, "Contractor must cover all of Client's claims with no cap.")).toEqual([]);
  });

  it("curly vs straight quote mismatch is dropped, not guessed at", async () => {
    const doc = "Contractor's duty is unlimited.";
    expect(await surfaced(doc, "Contractor’s duty is unlimited.")).toEqual([]);
  });
});

describe("citation resolver: fragments and spans (desired: drop)", () => {
  it("drops a truncated sentence", async () => {
    expect(await surfaced(DOC, "Contractor shall indemnify Client against all claims")).toEqual([]);
  });

  it("drops a single word", async () => {
    expect(await surfaced(DOC, "Client")).toEqual([]);
  });

  it("drops a quote spanning two sentences", async () => {
    expect(await surfaced(DOC, `${S1} 2. Payment. ${S2}`)).toEqual([]);
  });

  it("drops the tail of a sentence that starts mid-way", async () => {
    expect(await surfaced(DOC, "without limitation as to amount.")).toEqual([]);
  });

  it("drops a section heading used as a citation", async () => {
    expect(await surfaced(DOC, "2. Payment.")).toEqual([]);
  });
});

describe("citation resolver: ambiguity", () => {
  it("a duplicated sentence resolves to the text, but cannot say which occurrence", async () => {
    // Documented limitation: the citation is a string, not a position.
    expect(await surfaced(DOC, S3)).toEqual([S3]);
  });
});
