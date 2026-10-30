# Labelling ten flags by hand

**Which run.** `eval-runs/2026-10-30T16-13-19-230Z.json`, the newest at the time. `flags.json` records the run's file name.

**How the ten were picked** (`node eval/labels/pick.mjs`). Only flags the reader would be shown, meaning the quoted sentence is in its document character for character. In this order:

1. Every flag that matched no planted clause, including any on the documents that should come back clean.
2. Every flag that matched a planted clause but named a different clause type.
3. Flags from the most severe band (top), from as many different documents as possible, then the next band down, until there are ten.

`flags.json` does not say which group a flag came from or whether it matched a planted clause, so each flag is judged by reading it. Do not re-run `pick.mjs` once you have started labelling: it rewrites `flags.json`, and `labels.json` is keyed by the flag numbers in it.

**The rule.**

> PASS if the quoted sentence really is the kind of clause the flag names and really costs the reader something. Otherwise FAIL.

Severity is not part of the rule. A flag that meets both tests with the wrong severity is a PASS, and the severity goes in the note. The page shows the PRD's "What good looks like" and "My red lines" sections, copied word for word, above the flags.

**What gets saved.** Every change goes to `labels.json` straight away. When a label changes, the earlier answer stays in that flag's `history` with the time of the change, and counts as a change of mind. The box at the end holds what changed in how you judge. The page also keeps a copy in the browser. If the server stops, the page says so and offers a button that copies the labels.

**Open the page again.**

```bash
npm run label
```

It prints an address that starts with `http://127.0.0.1`, normally port 4317. Open it in a browser. Closing Claude Code stops the server; the labels stay in `labels.json`.
