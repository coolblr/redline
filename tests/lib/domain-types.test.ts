import { describe, expect, it } from "vitest";
import {
  AnswerSchema,
  ClauseTypeSchema,
  CounterOfferSchema,
  DefectTypeSchema,
  DocumentDefectSchema,
  FlagSchema,
  SeverityTierSchema,
  StandardOrUnusualSchema,
  TreatmentDepthSchema,
} from "@/lib/domain-types";

describe("ClauseTypeSchema", () => {
  it("accepts each of the seven defined clause types", () => {
    const values = [
      "indemnification",
      "ip-assignment",
      "limitation-of-liability",
      "non-compete",
      "unilateral-termination",
      "scope-creep",
      "arbitration",
    ];
    for (const value of values) {
      expect(ClauseTypeSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects an unknown clause type", () => {
    const result = ClauseTypeSchema.safeParse("unconscionability");
    expect(result.success).toBe(false);
  });
});

describe("SeverityTierSchema", () => {
  it("accepts top, middle, and cite-only", () => {
    for (const value of ["top", "middle", "cite-only"]) {
      expect(SeverityTierSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects a tier outside the three defined values", () => {
    const result = SeverityTierSchema.safeParse("low");
    expect(result.success).toBe(false);
  });
});

describe("StandardOrUnusualSchema", () => {
  it("accepts standard and unusual", () => {
    for (const value of ["standard", "unusual"]) {
      expect(StandardOrUnusualSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects an unrecognized value", () => {
    const result = StandardOrUnusualSchema.safeParse("typical");
    expect(result.success).toBe(false);
  });
});

describe("TreatmentDepthSchema", () => {
  it("accepts sharp and generic", () => {
    for (const value of ["sharp", "generic"]) {
      expect(TreatmentDepthSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects an unrecognized value", () => {
    const result = TreatmentDepthSchema.safeParse("deep");
    expect(result.success).toBe(false);
  });
});

describe("FlagSchema", () => {
  const validFlag = {
    clauseType: "indemnification",
    severityTier: "top",
    standardOrUnusual: "unusual",
    treatmentDepth: "sharp",
    citation: "Contractor shall indemnify, defend, and hold harmless Client.",
    rationale: "Uncapped and one-sided indemnification exposes Contractor.",
  };

  it("parses a valid flag", () => {
    const result = FlagSchema.safeParse(validFlag);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validFlag);
    }
  });

  it("rejects an unknown clauseType", () => {
    const result = FlagSchema.safeParse({ ...validFlag, clauseType: "penalty" });
    expect(result.success).toBe(false);
  });

  it("rejects a severityTier outside the three values", () => {
    const result = FlagSchema.safeParse({ ...validFlag, severityTier: "critical" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty citation", () => {
    const result = FlagSchema.safeParse({ ...validFlag, citation: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty rationale", () => {
    const result = FlagSchema.safeParse({ ...validFlag, rationale: "" });
    expect(result.success).toBe(false);
  });
});

describe("DefectTypeSchema", () => {
  it("accepts dangling-reference and ambiguous-term", () => {
    for (const value of ["dangling-reference", "ambiguous-term"]) {
      expect(DefectTypeSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects an unrecognized defect type", () => {
    const result = DefectTypeSchema.safeParse("typo");
    expect(result.success).toBe(false);
  });
});

describe("DocumentDefectSchema", () => {
  const validDefect = {
    defectType: "dangling-reference",
    description: "References Schedule 1, which is not present in the extracted text.",
    citation: "...set forth in Schedule 1, attached hereto and incorporated by reference.",
  };

  it("parses a valid document defect", () => {
    const result = DocumentDefectSchema.safeParse(validDefect);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validDefect);
    }
  });

  it("rejects an unknown defectType", () => {
    const result = DocumentDefectSchema.safeParse({
      ...validDefect,
      defectType: "missing-signature",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty description", () => {
    const result = DocumentDefectSchema.safeParse({ ...validDefect, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty citation", () => {
    const result = DocumentDefectSchema.safeParse({ ...validDefect, citation: "" });
    expect(result.success).toBe(false);
  });
});

describe("CounterOfferSchema", () => {
  it("parses a valid counter-offer", () => {
    const result = CounterOfferSchema.safeParse({
      text: "Cap Contractor's liability at the total fees paid under this Agreement.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty text field", () => {
    const result = CounterOfferSchema.safeParse({ text: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing text field", () => {
    const result = CounterOfferSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("AnswerSchema", () => {
  it("parses a valid answer that is addressed by the document", () => {
    const result = AnswerSchema.safeParse({
      text: "The Agreement caps Client's liability at $25,000.",
      addressedByDocument: true,
    });
    expect(result.success).toBe(true);
  });

  it("parses a valid answer that is not addressed by the document", () => {
    const result = AnswerSchema.safeParse({
      text: "This document doesn't address that question.",
      addressedByDocument: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty text field", () => {
    const result = AnswerSchema.safeParse({ text: "", addressedByDocument: false });
    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean addressedByDocument", () => {
    const result = AnswerSchema.safeParse({
      text: "Some answer.",
      addressedByDocument: "false",
    });
    expect(result.success).toBe(false);
  });
});
