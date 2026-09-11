# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router), TypeScript, npm. Supabase for auth and database. Deployed on Vercel. Model calls go through OpenRouter, never a direct provider SDK. (Settled in CLAUDE.md — not open for reinterpretation.)

## Users

The User: a freelancer or small business owner who has been sent a contract by a Client and is deciding whether to sign it — reactive use only. Not served: the party who drafted the document, individual consumers reviewing a ToS/subscription/personal lease, or someone auditing their own outgoing template before sending it (ADR-0002, ADR-0009).

## Product Purpose

Redline analyzes a contract the User has been sent, so they can decide whether to sign it without paying for a lawyer or signing blind. It produces a plain-English summary, severity-ranked risk flags with exact source citations, a drafted counter-offer per flag, a document-scoped Q&A box, an editable list of the User's own red lines that drives the analysis, and a saved library of past documents. Success means every claim traces back to an exact sentence in the User's own document, so they can verify it rather than merely trust it (ADR-0001).

## Positioning

No profiled competitor combines severity-ranked, citation-backed flagging with a drafted counter-offer and document-scoped Q&A (PRD.md). Closest comparables: Rocket Lawyer ($239.88/yr subscription) and QwickContractReview.com ($99/document plain-English summary) — neither drafts a counter-offer or answers questions scoped to the specific document. Redline's mechanism is citation-first: every flag, summary claim, and Q&A answer states only what the document text supports, and never predicts an outcome (ADR-0007).

## Operating Context

Upload a freelance/service agreement → browser parses it, only extracted text is stored, never the original file → summary, document defects, and severity-ranked flags render → a counter-offer is available per flag → a document-scoped Q&A box is available → the User's editable red-line list drives future analyses → a saved library holds past documents for return visits.

## Capabilities and Constraints

- The uploaded file is parsed in the browser; only extracted text is ever stored (CLAUDE.md invariant).
- Every risk flag must resolve to an exact source sentence; a flag that can't is a bug, not a missing feature (ADR-0001).
- Severity is a three-tier exposure test (top / middle / cite-only) plus an independent standard-vs-unusual label (ADR-0005).
- Sharp (tuned) detection: IP-assignment/ownership-before-payment and indemnification. Generic detection: non-compete, limitation-of-liability, unilateral-termination, scope creep (ADR-0004) — a stated depth gap, not an oversight.
- Optimized against misses over false alarms: a noisier flagged list is an accepted trade-off (ADR-0006).
- Document defects (dangling schedule/exhibit references, ambiguous defined terms) are a separate category, shown before the flag list, never folded into it (ADR-0008).
- All generated text states the pattern, never predicts the outcome — no "you would win," no legal verdicts (ADR-0007).
- Document type: freelance/service agreements only. Explicitly not leases, personal-guarantee contracts, or consumer ToS/subscriptions (ADR-0002, ADR-0003).
- Explicitly out of scope: payments/billing, OCR for scanned documents, sharing a document between users, proactive self-audit / absent-clause detection (CLAUDE.md, ADR-0009).
- Every piece of user-facing copy (landing page, UI labels, error messages, empty states) must pass through the humanizer skill before commit; copy that reads as AI-written is a defect (CLAUDE.md).
- Terminology is fixed by CONTEXT.md: User, Client, Contract, Severity tier, Standard/unusual, Document defect. Avoid "consumer," "reader," "counterparty," "risk level," "priority," or "error/issue" as substitutes.

## Brand Commitments

- Name: Redline. Tagline: "Know what you're signing." (BRAND.md)
- Voice: confident about what the document says, hedged about what it means — no exclamation points, no alarm language (BRAND.md, ADR-0007).
- Direction is "clinical trust": precise and restrained, reflecting the product's actual behavior (cite and rank, not reassure) rather than the name's literal red-pen metaphor. Visual specifics (palette, etc.) belong in DESIGN.md, not here.

## Evidence on Hand

- `research/summary.md` and its supporting files (`competitors.md`, `what-goes-wrong.md`, `who-would-pay.md`, `whos-hurting.md`) hold the sourced research: 47% of small businesses lost $500+ to an unreviewed legal issue, 19% lost $5,000+ (LegalShield/Decision Analyst); 51–67% of small businesses avoid lawyers on cost/complexity grounds; QwickContractReview.com ($99/doc) and Rocket Lawyer ($239.88/yr) as priced comparables.
- The first-person pain evidence (the Tina Morales and Dana Nicole quotes in PRD.md) is flagged by the research's own "honesty check" as its weakest pass — thin, and only loosely on-thesis in places. Treat it as illustrative, not load-bearing.
- No testimonials, case studies, or press exist yet for Redline itself — future work must not fabricate them.
- Whether job seekers, small landlords, renters, or gig workers would pay is explicitly unresolved (PRD.md) — silence on this is not evidence they wouldn't.

## Product Principles

1. State only what the document supports — for summaries, flags, counter-offers, and Q&A alike.
2. Every claim must be independently verifiable by the User against their own document — that verification, not the model's judgment, is the product's actual claim to trust.
3. Optimize against silent misses, not against noisy false alarms — a flag the User can dismiss in seconds is cheap; a risk that never surfaces is not.
4. Depth is deliberately uneven across clause types (sharp vs. generic), and this is stated plainly to the User, never implied to be uniform quality.
5. Reactive use only — Redline evaluates what's in a document the User was sent, not what's missing from one they wrote.

## Accessibility & Inclusion

No accessibility standard has been committed to for v1 — left explicitly undecided rather than assumed. Don't treat this silence as evidence no standard applies.
