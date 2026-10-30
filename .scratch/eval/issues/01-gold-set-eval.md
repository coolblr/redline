# 01: Gold-set eval, so we can say how often Redline is right

**What to build:** `npm run eval`, which runs the nine-document gold set in `eval/gold-set/` through `analyzeDocument` with the OpenRouter settings in `.env.local` and prints recall, groundedness, clean-document flags and a character split. No change to app code, prompt or model setting.

**Blocked by:** none

**Status:** done

- [x] Gold set copied from the instructor's repo, not retyped (curly quotes, ligatures and non-breaking spaces are in the sentences on purpose)
- [x] PRD.md has a "How we measure it" section: recall, groundedness, clean documents, and the limit
- [x] Clause type mapping and out-of-scope list written into `eval/README.md`, each with its reason
- [x] Recall counts a flag as finding a planted clause when its quoted sentence overlaps the planted one, and reports separately whether it named the right type
- [x] Groundedness counts every flag the model returned, including those the resolver drops
- [x] A failed model call leaves that document out of every denominator and says how many were left out
- [x] Recall split by whether the planted sentence has a curly quote or apostrophe, a non-breaking space, an fi/fl ligature, an em dash or a double space
- [x] Every rate printed as count/count and as a percentage; each run saved to `eval-runs/` as `.txt` and `.json`, with every flag's document, type, severity, quoted sentence and whether it matched a planted clause
- [x] A test in `npm test`, with no network, checks every gold-set sentence appears exactly once in its document (`tests/lib/eval-gold-set.test.ts`)

**Not this ticket:** `npm run eval:sharp` (tier accuracy on this repo's own four fixtures) and `scripts/eval-citations.ts` (citation shape) stay as they are. They measure different things.

## Comments
