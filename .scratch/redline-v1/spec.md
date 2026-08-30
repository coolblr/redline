# Redline v1 — Spec

Status: ready-for-agent

## Problem Statement

A freelancer or small business owner (the User) gets sent a contract by a Client and has to decide whether to sign it. Today they either sign without reading closely (the risk feels abstract until it isn't), pay a lawyer — which 51–67% of small businesses avoid specifically because of cost or complexity — or use a generic AI summarizer that doesn't rank risk by severity, doesn't draft pushback, and can't answer questions scoped to their specific document.

## Solution

Redline: the User uploads a freelance or service agreement (parsed in the browser; only the extracted text is ever stored). Redline produces a plain-English summary, severity-ranked risk flags each citing the exact source sentence, a separate list of document defects (places the document itself is inconsistent or incomplete), a drafted counter-offer per flag, and a document-scoped Q&A box. The User maintains an editable list of red lines that drives which risks get flagged, and can return to a saved library of past documents.

## User Stories

1. As a User, I want to upload a freelance/service agreement, so that I can get an analysis of it before deciding whether to sign.
2. As a User, I want the document parsed in my browser rather than uploaded as a file to a server, so that I know the original file itself is never stored anywhere.
3. As a User, I want a plain-English summary of the contract, so that I can quickly understand what I'm being asked to agree to before reading the dense legal language myself.
4. As a User, I want every risk flag to cite the exact sentence it came from, so that I can verify the flag against my own document instead of trusting the tool's judgment blindly.
5. As a User, I want risk flags ranked by severity, so that I know which issues to address first instead of treating every flag as equally urgent.
6. As a User, I want to see whether a flagged clause is standard boilerplate or unusual for this kind of agreement, so that I know whether to expect it or whether it's worth closer attention even if I've seen the clause type before.
7. As a User, I want indemnification clauses evaluated by whether they're capped or uncapped and mutual or one-sided, so that I understand exactly how much financial exposure I'm taking on.
8. As a User, I want IP-assignment/ownership clauses evaluated by when ownership actually transfers (creation, delivery, or full payment), so that I know whether I risk losing rights to work I haven't been paid for.
9. As a User, I want non-compete, limitation-of-liability, unilateral-termination, and scope-creep clauses flagged even though they get less precise treatment than indemnification and IP-assignment, so that I'm not blindsided by a risk just because it wasn't one of the two sharpest-tuned clause types.
10. As a User, I want to be told when a flag's underlying evidence is weaker (e.g. scope-creep clauses), so that I calibrate my trust in that specific flag rather than treating every flag as equally certain.
11. As a User, I want to be warned if the document references a schedule or exhibit that isn't included in what I uploaded, so that I know my analysis might be incomplete instead of mistakenly trusting a full read.
12. As a User, I want to be warned if a defined term (like "Contractor") is ambiguous about which party it refers to, so that I don't rely on an analysis built on a misreading.
13. As a User, I want document defects shown separately from, and before, the risk-flag list, so that I know upfront how much to trust everything below it.
14. As a User, I want a drafted counter-offer for each flagged clause, so that I have a concrete starting point for pushing back instead of drafting language myself from scratch.
15. As a User, I want flags and counter-offers to describe patterns rather than predict outcomes, so that I'm never misled into overconfidence about a legal question the tool can't actually answer.
16. As a User, I want to ask questions about the specific document I uploaded, so that I can get clarification without re-reading the whole thing myself.
17. As a User, I want the Q&A to say plainly when my document doesn't address my question, so that I never get an answer that sounds authoritative but isn't grounded in my actual document.
18. As a User, I want to maintain my own editable list of red lines, so that the analysis reflects what matters to me specifically, not just a generic rule set.
19. As a User, I want my red lines to actually change which risks get flagged, so that editing them has a real, visible effect on future analyses.
20. As a User, I want a saved library of documents I've previously analyzed, so that I can return to a past analysis without re-uploading and re-running it.
21. As a User, I want to see a plain statement when nothing in my document reaches top or middle severity, so that a clean contract doesn't get an artificially alarming result just because the tool always tries to find something.
22. As a User, I want the full clause list shown even on a clean document, so that I can see everything that was actually checked, not just take the tool's word that nothing is wrong.
23. As a User, I want the tool to err toward flagging more rather than missing a real risk, so that I'm not given false confidence by an artificially quiet result.
24. As a User, I want an arbitration or class-action-waiver clause flagged at high severity every time it appears, even though it's common boilerplate, so that I don't get desensitized to a clause that actually strips a real legal right.
25. As a User, I want every claim Redline makes to be traceable back to my actual document, so that I can trust it rather than merely find it plausible-sounding.

## Implementation Decisions

- **Three seams**, each the only place its concern is implemented:
  - `analyzeDocument(documentText, redLines) → { Summary, Flag[], DocumentDefect[] }` — the hardened seam. Owns citation resolution, severity tiering, and document-defect detection. Nearly every case in PRD.md's "What good looks like" lands here.
  - `draftCounterOffer(documentText, flag) → CounterOffer` — a separate, deliberately isolated seam, scoped to one flag at a time. PRD.md states outright that counter-offer quality/safety is an unresolved, build-and-test question, not something the brief settled — keeping it separate means `analyzeDocument` can be hardened and tested independently, and this seam can be reworked or gated off later without touching anything that depends on it.
  - `answerQuestion(documentText, question) → Answer` — its own seam, unchanged from the original proposal.
- All three seams are the only places an OpenRouter call happens anywhere in the codebase (CLAUDE.md: model calls go through OpenRouter, never a direct provider SDK).
- `Flag` shape: clause type; `severityTier` (`top` / `middle` / `cite-only`, per ADR-0005's uncapped+one-sided / capped+one-sided / capped+mutual test); `standardOrUnusual` label, independent of tier; a citation that resolves to an exact substring of `documentText`; a `treatmentDepth` marker (`sharp` for indemnification and IP-assignment/ownership-before-payment, `generic` for the other four clause types, per ADR-0004); rationale text that states the pattern, never predicts the outcome (ADR-0007). Scope-creep flags carry an explicit lower-confidence marker in their rationale.
- `analyzeDocument` must validate that every returned flag's citation actually resolves against the input `documentText` before returning it. A flag that fails this check is a bug per ADR-0001 and must not be returned, not merely flagged as low-confidence.
- `DocumentDefect` shape: a defect type (`dangling-reference` / `ambiguous-term`), a description, and a location in `documentText`. Always a distinct output collection from `Flag[]`, never merged into it (ADR-0008).
- Red lines are a user-editable list passed into `analyzeDocument` alongside `documentText`. They're persisted in Supabase; their exact schema (per-user vs. per-document scope, shape of a red-line entry) is a build-time decision this spec doesn't fix.
- The document library persists, per analyzed document: the extracted text (never the original file) plus the outputs of all three seams tied to it.
- The copy rule from ADR-0007 (state the pattern, never predict the outcome) applies to generated text from all three seams — enforced through prompt design and the copy-review eval pass, not by seam boundaries alone.

## Testing Decisions

- Tests target each seam's external behavior — input in, output shape and content out — not internal prompt wording. A test should not break because a prompt was reworded if the resulting output is still correct.
- `analyzeDocument`: fixture-based tests (realistic freelance-agreement text) against recorded or mocked OpenRouter responses, covering:
  - a known-severe IP-assignment or indemnification clause resolves to the correct severity tier (the sharp-treatment bar);
  - a known-severe non-compete, limitation-of-liability, unilateral-termination, or scope-creep clause is at least flagged, even if tiering is less precise (the generic-treatment bar — recall matters more than exact tier here);
  - a capped-but-one-sided clause lands in the middle tier specifically — the case ADR-0005 names as most likely to be miscategorized by a naive implementation;
  - a clean, well-drafted document produces a plain "nothing above cite-only" result with the full (mostly cite-only) list still returned;
  - a dangling schedule/exhibit reference and an ambiguous defined term each produce a `DocumentDefect`, not a flag built on a guess;
  - every flag's citation resolves against the input `documentText` — asserted programmatically, not eyeballed.
- `draftCounterOffer`: tested more lightly than `analyzeDocument`, matching its unsettled quality bar. Tests confirm it produces pattern-stated (not outcome-predicting) text and completes without error across flag types — not a quality bar on the drafted language itself, since PRD.md doesn't set one.
- `answerQuestion`: tested against known-absent-answer cases (a question about a clause type that isn't in the document) to confirm it says the document doesn't address the question rather than inferring an answer.
- The outcome-prediction copy check (ADR-0007) can be one shared assertion applied to all three seams' text output, rather than reimplemented per seam.
- No test framework exists in this repo yet (it's greenfield) — this spec doesn't prescribe one; that choice is left to implementation, informed by the Next.js/TypeScript stack already settled in CLAUDE.md.

## Out of Scope

- Individual consumer ToS/subscription review (ADR-0002).
- Leases and personal-guarantee-backed contracts (ADR-0003).
- Equal-depth (sharp) detection for non-compete, limitation-of-liability, unilateral-termination, and scope-creep — generic treatment only in v1 (ADR-0004).
- Proactive self-audit and absent-clause detection (ADR-0009).
- Outcome prediction or legal verdicts of any kind (ADR-0007).
- OCR for scanned documents, payments/billing, sharing a document between users (CLAUDE.md — excluded on purpose, not deferred).
- A settled quality bar for `draftCounterOffer`'s actual output. This spec isolates it as its own seam precisely because that bar isn't set yet.

## Further Notes

- PRD.md's "What good looks like" section is meant to become this feature's eval suite — nearly every criterion there maps directly to one of the test cases above.
- PRD.md is explicit that counter-offer drafting and document-scoped Q&A are the two features no competitor was confirmed to have, and whether they're safe and well-differentiated is unresolved. `draftCounterOffer`'s seam isolation exists specifically so that finding doesn't block or contaminate the rest of the system.
- CONTEXT.md's vocabulary (User, Client, Contract, Severity tier, Standard/unusual, Document defect) should be used verbatim in code identifiers and UI copy where practical, consistent with the domain-modeling work already done on this project.
