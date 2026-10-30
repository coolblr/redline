// No network, no model. A gold-set sentence that has drifted would report a
// miss the model never made, so every one must appear exactly once in its
// document, character for character. Also pins the eval's matching helpers.

import { describe, expect, it } from "vitest";
import {
  GOLD_TO_PRODUCT,
  characterClasses,
  countOccurrences,
  isGrounded,
  loadGoldSet,
  spansOverlap,
} from "../../eval/lib";
import { ClauseTypeSchema } from "../../lib/domain-types";

describe("gold set", () => {
  const gold = loadGoldSet();

  it("has nine documents, forty planted clauses and three clean documents", () => {
    expect(gold).toHaveLength(9);
    expect(gold.flatMap((d) => d.planted)).toHaveLength(40);
    expect(gold.filter((d) => d.benign)).toHaveLength(3);
  });

  it("has every gold sentence exactly once in its document", () => {
    for (const doc of gold) {
      for (const sentence of doc.goldSentences) {
        expect(
          countOccurrences(doc.text, sentence),
          `${doc.id}: ${sentence.slice(0, 60)}`
        ).toBe(1);
      }
    }
  });

  it("maps gold types only onto clause types this product has", () => {
    const productTypes = new Set<string>(ClauseTypeSchema.options);
    for (const mapped of Object.values(GOLD_TO_PRODUCT)) {
      if (mapped !== null) expect(productTypes.has(mapped)).toBe(true);
    }
    for (const doc of gold) {
      for (const p of doc.planted) {
        expect(p.clauseType in GOLD_TO_PRODUCT, p.clauseType).toBe(true);
      }
    }
  });
});

describe("eval helpers", () => {
  it("finds the characters a model tends to retype", () => {
    expect(characterClasses("Don’t — ever")).toEqual(["curly quote", "em dash"]);
    expect(characterClasses("a b  c ﬁ")).toEqual([
      "non-breaking space",
      "fi/fl ligature",
      "double space",
    ]);
    expect(characterClasses("plain sentence.")).toEqual([]);
  });

  it("grounds a quote only on a character-for-character match", () => {
    const doc = "She said “yes” today.";
    expect(isGrounded(doc, "“yes”")).toBe(true);
    expect(isGrounded(doc, "\"yes\"")).toBe(false);
  });

  it("counts a flag as on a planted clause when their spans share a character", () => {
    const doc = "One. Two is here. Three.";
    expect(spansOverlap(doc, "Two is here.", "Two is here.")).toBe(true);
    expect(spansOverlap(doc, "One. Two is", "Two is here.")).toBe(true);
    expect(spansOverlap(doc, "One.", "Three.")).toBe(false);
  });
});
