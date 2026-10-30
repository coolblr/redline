# Eval

`npm run eval` runs the gold set through the real pipeline and prints recall, groundedness, flags on clean documents and a character split. Each run is saved to `eval-runs/` as a `.txt` and a `.json`, named for the time it started. It makes real model calls with the settings in `.env.local` and costs a few cents. `npm test` checks the gold set itself with no network.

PRD.md "How we measure it" defines the numbers. This file records the decisions made while building it, since nobody was asked.

## Decisions

1. **An eval already existed in part, and I built this one anyway.** The brief said to stop if the project already had an eval. It has `npm run eval:sharp` (tier accuracy on four fixtures in `tests/fixtures/`) and `scripts/eval-citations.ts` (the shape of each citation). Neither has a gold set with planted clauses, neither counts groundedness over everything the model returned, neither checks clean documents, and neither saves run records. They answer different questions, so this one sits beside them and changes neither. If this should have stopped, delete `eval/` and the `eval` script.
2. **Base branch.** `add-eval-suite` was cut from `tighten-citation-resolver` (PR #6, still open), not `master`. That branch holds the citation resolver the eval should measure. A PR from `add-eval-suite` will carry that commit until PR #6 merges.
3. **Same pipeline as smoke.** The eval calls `analyzeDocument(text, DEFAULT_RED_LINES)` exactly as `scripts/smoke.ts` does. It passes a thin wrapper around the real OpenRouter client that records the model's raw candidate flags before the product's resolver sees them. That is how groundedness counts flags the product later drops. App code, prompt and model settings are untouched.
4. **A 429 gets two retries** (8 seconds apart) before a document counts as failed. A 429 means the provider was busy, not that the product was wrong. Any other error leaves the document out at once.
5. **"Found" means span overlap.** A flag finds a planted clause when its quoted sentence and the planted sentence share at least one character of the document. The type is not part of finding. It is reported separately as "named the right type".
6. **Groundedness is strict.** A quote is grounded only if it is in the document character for character, with no whitespace or quote normalisation. The product's resolver is looser (it tolerates PDF line breaks), so some quotes the eval calls ungrounded still reach the reader.

## Clause type mapping

The gold set's seven types, and this product's. PRD.md "My red lines" decides which count.

| Gold set type | Planted | This product's type | Counted |
|---|---|---|---|
| `arbitration-and-class-action-waiver` | 5 | `arbitration` | yes |
| `non-compete` | 4 | `non-compete` | yes |
| `limitation-of-liability` | 4 | `limitation-of-liability` | yes |
| `indemnification` | 6 | `indemnification` | yes |
| `auto-renewal` | 6 | none | out of scope |
| `fee-escalators-and-late-fees` | 9 | none | out of scope |
| `unilateral-modification` | 6 | none | out of scope |

19 planted clauses are in scope and 21 are out of scope.

## Out of scope, and why

- **`auto-renewal`**: PRD.md names auto-renewal, personal guarantees and junk fees as not part of v1's core red-line set. They belong to consumer ToS and lease documents, which ADR-0002 and ADR-0003 leave out.
- **`fee-escalators-and-late-fees`**: the same sentence in PRD.md covers junk fees.
- **`unilateral-modification`**: the product flags unilateral termination (ending the deal), not unilateral modification (rewriting its terms). This is the pairing most open to argument. Someone could say the two are close enough to map. I kept them apart because the red line describes being cut off mid-project with no notice, which a clause that lets the other side edit the terms does not say. If you disagree, change `GOLD_TO_PRODUCT` in `eval/lib.ts` and re-run. Do not change the app.

Three of this product's types have no gold-set counterpart: `ip-assignment`, `scope-creep` and `unilateral-termination`. The gold set cannot measure their recall. A flag of one of those types still counts toward groundedness and clean-document flags, and shows up under "flags with no planted clause", where the ten-flag labelling pass picks it up.

## The gold set's mismatch with this product

The gold set was written for a build aimed at consumer documents (a gym membership, a phone plan, a storage unit). This product serves freelancers and small businesses (ADR-0002). So 7 of the 9 documents are not freelance agreements, and recall on them says how well the analysis reads those clause types, not how well it reads freelance contracts. The numbers are an upper bound for another reason too: a model wrote the gold set.

## Layout

- `eval/run.ts`: the runner. `eval/lib.ts`: loading, matching and character-class helpers (tested in `tests/lib/eval-gold-set.test.ts`).
- `eval/gold-set/corpus/` and `eval/gold-set/fixtures/`: copied from `ankitvirmani/redline` (`tests/corpus`, `tests/fixtures`) with `git clone --depth 1` and `cp`. `manifest.json` points at `../fixtures/`, so both folders must stay side by side. These are separate from this repo's own `tests/fixtures/`.
- `eval-runs/`: one `.txt` and one `.json` per run.
