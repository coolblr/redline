// Shared outcome-prediction copy check (ADR-0007). Redline is confident
// about what the document says and hedged about what it means: it states
// document facts flatly, and never predicts what would actually happen if
// a clause were invoked ("you would lose in court over this" is a
// categorically different, riskier claim than "this clause states you
// indemnify the Client for any and all claims, with no cap.").
//
// Plain string in, so this stays reusable across every seam's text output
// (analyzeDocument's summary and flag rationale now; draftCounterOffer's
// and answerQuestion's output later) rather than being reimplemented per
// seam or specialized to one field shape.

/**
 * Returns every forbidden outcome-prediction phrase found in `text` (empty
 * array = clean). This is a heuristic phrase blocklist, not a semantic
 * check -- it catches the specific verdict-shaped phrasings ADR-0007 calls
 * out (a predicted win/loss, a declared enforceability verdict, a
 * forecast of what a court or judge would do) without trying to parse
 * meaning. It will miss an outcome prediction phrased a way not on this
 * list, and in rare cases could flag a sentence that happens to contain
 * one of these phrases without actually predicting an outcome. Callers
 * should treat a hit as something to log and review, not as proof the
 * text is unsafe on its own (see lib/seams/analyze-document.ts, which logs
 * rather than drops a flag on a hit, per ADR-0006's recall preference).
 */
export function findOutcomePredictionPhrases(text: string): string[] {
  const patterns: RegExp[] = [
    /\byou('?d| would) (win|lose|prevail)\b/i,
    /\byou('?ll| will) (win|lose|prevail)\b/i,
    /\bis unenforceable\b/i,
    /\bwould be unenforceable\b/i,
    /\bis illegal\b/i,
    /\bwould be illegal\b/i,
    /\bthe court will\b/i,
    /\ba court would\b/i,
    /\ba judge would\b/i,
    /\bwon'?t hold up in court\b/i,
    /\bwill hold up in court\b/i,
    /\bis (?:guaranteed|certain) to (?:win|succeed|prevail)\b/i,
    /\bwill be (?:struck down|thrown out)\b/i,
  ];

  const hits: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      hits.push(match[0]);
    }
  }
  return hits;
}
