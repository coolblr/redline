# 06: Q&A shows stray markdown and can double-submit

**Status:** needs-info

**Blocked by:** reproducing both by hand

**What the testing agent reported (FINDINGS.md finding 6 and the "Seen once" list):**
- Double-clicking Ask quickly recorded the question twice, so two model calls ran. The Ask form already disables itself while a request is pending, so this may not reproduce.
- One answer showed literal `**Indemnification (Section 7):**` and `- ` list markers. The agent saw it once.

**Change, once reproduced:** render answers as plain text with the markers removed, or render the markdown, whichever fits `DESIGN.md`. If the double-submit reproduces, guard the form against a second submit before the first returns.

**Check:** ask two questions. Click Ask twice quickly on one of them and confirm a single entry. Read the answers for stray symbols.

**Copy:** none.

## Comments
