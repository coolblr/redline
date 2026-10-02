# 05: Red-line editor: unstable card order, no length limit, unexplained disabled Save

**Status:** ready-for-agent

**Correction (2026-10-02):** this ticket was first written as "red-line saves give no feedback", copied from the testing agent's report (FINDINGS.md findings 7 and 8) without checking the code. That headline was wrong. `app/red-lines/RedLinesEditor.tsx` already shows "Saved." after a successful save and the server's error text after a failed one. The ticket now covers only what the code actually shows.

**What is true now:**
- **Card order is not fixed.** `getOrSeedRedLines` (`lib/red-lines-store.ts`) selects the user's rows with no `ORDER BY`, so the database may return them in a different order after one is updated. The testing agent saw the cards reorder after a save. Not reproduced by hand yet; the missing `ORDER BY` is the likely cause.
- **No length limit.** The textareas have no `maxLength`, and `saveRedLine` (`app/red-lines/actions.ts`) only rejects empty text. The agent saved about 3,000 characters. This text is sent to the model on every analysis.
- **Save is disabled with no explanation** when the box is empty (`RedLinesEditor.tsx`, the `disabled` condition on the Save button). Nothing silently reverts, because the button can't be clicked, but a reader gets no hint why.

**Change:**
1. Order the select in `getOrSeedRedLines` by the fixed clause order used by `DEFAULT_RED_LINES` (or by clause type), so the cards never move.
2. Add a sensible maximum length, enforced in `saveRedLine` and shown on the textarea. The number is new behaviour on the analysis input, so confirm it with the owner first.
3. When Save is disabled because the box is empty, show a short hint.

**Check:** reload `/red-lines`, edit and save two different cards, reload again: the order is the same each time. Type past the limit: the editor says so and the server refuses. Clear a box: the hint explains the disabled Save. A unit test can cover the ordering and the length check on the server action's logic.

**Copy:** the limit message and the empty-box hint go through the humanizer.

## Comments
