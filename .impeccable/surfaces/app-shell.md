---
version: 1
slug: "app-shell"
primary_target: "app-shell"
related_targets: []
---

## Scope & mode

App shell, behind sign-in. Mode: Operate. Not built this session — brief only, per explicit instruction. The frame that holds: paste or upload a document, the result (summary, ranked flags, clean verdict), the question box, the reader's red lines, and the library.

## Audience, job, action, proof, constraints

Audience: the same User as the landing page, now signed in and working the tool. Job: decide whether to sign, with room to dig into any one flag, ask a question, adjust their own red lines, and come back to a past document later. Action/task: upload/paste → read the result → optionally ask a question, edit red lines, or pull up a counter-offer per flag → save to the library. Constraints: same product truth as PRD.md — a "clean verdict" states counts and tiers, never a signing recommendation; every flag still resolves to an exact citation; document defects render before the flag list, not folded into it (ADR-0008).

## Direction contract

THESIS: The same ledger, now a working tool — one continuous document pane beside its ledger of flags, with Q&A and red lines as panels off that same spine, never modal overlays that hide the source underneath them.

OWN-WORLD: Same palette as the landing page — Paper `#F7F4EE`, Ink `#1C2733`, Slate `#5B6572`, Flag `#B3452E` reserved only for an actual severity finding. Spectral for document/quoted text, Archivo for UI and the ledger. Status (open / reviewed / dismissed, resolved / unresolved) is drawn by rule pattern and ink weight, never by color — the discipline raised from the declined normalled-jackfield challenger in the direction round, and earmarked there specifically for this surface.

STORY: The reader uploads or pastes a document. They see it summarized with ranked flags beside their exact citations, a plain verdict line ("2 flags above cite-only" / "nothing above cite-only"), document defects surfaced first when present. They can ask the document a question, edit their own red lines and watch the ledger re-flag in front of them, open a counter-offer per flag, and later return to this analysis from a library instead of re-uploading.

FIRST VIEWPORT (primary "result" screen): two-pane layout. Left: the document text, scrollable, citations highlighted only where an active flag references them (never pre-highlighted everywhere). Right: the flags ledger, same Clause / Exposure / Tier columns as the landing page, each row carrying a rule-pattern status mark and an expand action for its counter-offer. A slim top bar holds the wordmark, the document's name, and entry points to red lines and the library. The question box docks as a persistent input at the foot of the ledger pane, not a modal.

FORM: extends the world locked on the landing page (Line-Item Ledger, seed key `a205479c`, chosen as IMPECCABLE'S PICK over the roll) into Operate mode, per new-work.md's "create a whole surface inside an established world" — no second direction round, since the round already run was asked to cover both surfaces.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. (Recorded here as the standard the eventual build must clear — not discharged today, since this surface is brief-only.)

## Memorable moment

The ledger's verdict line and row set updating live and visibly the moment the reader edits a red line — proof that the red lines are real inputs, not settings that quietly do nothing.

## Unresolved decisions

- Exact two-pane proportions and behavior at narrower app-window widths (not a phone-first surface, but the shell still needs a workable narrow state).
- Whether the document pane's scroll position syncs to the active/selected flag row, or scrolls independently.
- The library's own list layout and how a saved analysis reopens into this same shell.
- This surface is not built yet; only this brief is recorded, per this session's explicit scope.
