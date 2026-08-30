# Redline — Brief for v1

This is the brief for the first version. It's written against `research/summary.md`, not assumed — every claim below either cites that research or says plainly that it doesn't. The decisions here are recorded as ADRs in `docs/adr/` (0002–0008) and the vocabulary they introduce lives in `CONTEXT.md`; this document is the narrative version of both.

## Who this is for, specifically, and what they do today instead

The User is a freelancer or small business owner who has been sent a contract by a Client and is deciding whether to sign it. Redline does not serve the party who drafted the document, and it does not serve individual consumers reviewing a ToS, subscription, or personal lease — that's a different segment with weaker willingness-to-pay evidence and a regulatory exposure Redline isn't built to carry yet (ADR-0002).

Today, this person does one of three things: signs without reading closely, because reading a contract carefully with no legal training is slow and the risk feels abstract until it isn't; pays a lawyer, which 51–67% of small businesses avoid specifically because of cost or complexity (LegalShield/Decision Analyst survey); or uses a generalist tool — Rocket Lawyer's $239.88/year subscription, or QwickContractReview.com's $99-per-document plain-English summary — neither of which drafts a counter-offer or answers questions scoped to the specific document in front of them.

## The problem

> "I naively thought that being a partner and early executive member meant that the draft contract (not finalized) meant something." — Tina Morales, freelancer

That's a real quote, but it's worth being honest about what it is and isn't: the research's own "honesty check" flags the first-person pain evidence as the weakest part of the four research passes — five sourced quotes, thin because Reddit-native search didn't work in that pass, several only loosely on-thesis. This one is closer to "didn't register the weight of a document" than "missed a specific dangerous clause." The stronger evidence is quantified, not anecdotal: 47% of small businesses lost $500 or more from an unreviewed legal issue, 19% lost $5,000 or more, some up to $100,000 (LegalShield/Decision Analyst). That population-level cost, not a single dramatic story, is the actual backbone of the problem statement.

## What the first version does

1. Accept an uploaded freelance or service agreement; parse it in the browser; store only the extracted text, never the original file.
2. Produce a plain-English summary of the document.
3. Produce severity-ranked risk flags. Every flag cites its exact source sentence. Severity is a three-tier test — top: uncapped exposure and one-sided; middle: capped exposure but still one-sided; cite-only: capped and mutual — and each flag separately carries a standard-or-unusual label describing whether it's expected boilerplate for this document type (ADR-0005).
4. Apply sharp, tuned detection to two clause types: IP assignment / ownership-before-payment, and indemnification. Apply generic detection to non-compete, limitation-of-liability, unilateral-termination, and scope-creep clauses (ADR-0004).
5. Surface document defects — a clause referencing a schedule or exhibit that isn't in the extracted text, an ambiguous defined term that could mean more than one party — as their own section, before the flag list, not mixed into it (ADR-0008).
6. Draft a counter-offer for each flagged clause. The counter-offer and every other piece of generated text states the pattern, never predicts the outcome (ADR-0007).
7. Provide a document-scoped Q&A box that answers only from what the uploaded document supports.
8. Provide an editable list of the User's own red lines, which drives which risks get flagged — the default red-line set and severity logic is what this brief defines; the User can change it per document.
9. Save a library of the User's past documents.

That's the complete list for v1. Nothing beyond it.

## What good looks like

- Every flag resolves to an exact sentence in the document. This is already a non-negotiable invariant (CLAUDE.md, ADR-0001); the eval suite treats any flag that doesn't resolve as a failing test, not a quality issue to track.
- On a held-out test set of documents with a known severe IP-assignment or indemnification clause, Redline must flag it at the correct severity tier. This is the sharp-treatment bar (ADR-0004) and is held to a higher standard than the other four clause types.
- On documents with a known severe non-compete, limitation-of-liability, unilateral-termination, or scope-creep clause, Redline must at least flag it — correct tiering matters less here than not missing it entirely. This is the generic-treatment bar, and the gap between it and the sharp-treatment bar should be visible in the eval results, not hidden behind one blended accuracy number.
- Miss rate on the known-risky test set is weighted more heavily than false-alarm rate on clean documents (ADR-0006) — a tool tuned to look quiet is failing even if its false-alarm rate looks good.
- A test set specifically targeting the severity middle tier — capped exposure, still one-sided — must be classified into the middle tier, not dropped to cite-only. This is the case ADR-0005 names as most likely to be miscategorized by a naive implementation, so it needs its own cases, not incidental coverage.
- A "clean" test document — well-drafted, nothing above cite-only severity — must produce a plain statement that nothing reached top or middle severity, with the full (mostly cite-only) list still shown. This has to be a named eval case, not a stated design intention: it's easy to build and test against dramatic documents and never verify the boring path renders correctly.
- A test set with a dangling schedule/exhibit reference or an ambiguous defined term must produce a document-defect entry, not a flag that silently guesses what the missing reference or ambiguous term means.
- A copy-review pass over flags, summaries, and counter-offers must find zero instances of outcome-prediction language ("you would win," "this is unenforceable") — only pattern-stated language ("this pattern is usually unfavorable to the party with less negotiating leverage").
- Q&A answers tested against a set of questions with known-absent answers ("does this contract include a non-compete?" on a document that doesn't have one) must say the document doesn't address it, not infer an answer.

## My red lines

- **Indemnification** (sharp treatment): top severity when uncapped and one-sided; middle when capped but still one-sided; cite-only when capped and mutual. This matters because a single meritless third-party claim can exceed an entire project's fee, and commercial liability insurance often doesn't cover it — the sharpest quantified freelance-specific harm in the research after personal guarantees (which v1 doesn't serve — see below).
- **IP assignment / ownership-before-payment** (sharp treatment): severity depends on when ownership transfers — on creation, on delivery, or only on full payment. Transfer that happens before or independent of payment is the dangerous pattern, because the freelancer can lose rights to work they haven't been paid for.
- **Limitation of liability** (generic treatment): same exposure test as indemnification where it applies — an asymmetric cap (Client's liability capped, User's isn't) is the pattern to watch.
- **Non-compete / TRAP clauses** (generic treatment): danger scales with duration and geographic/industry scope — a broad enough one can block someone from working in their field at all, not just for one Client.
- **Unilateral termination** ("for any reason, without notice") (generic treatment): danger is being cut off mid-project with no minimum notice and no kill fee.
- **Scope creep / unlimited revisions** (generic treatment, lower-confidence framing): the weakest-evidenced clause type in the research — two supporting statistics couldn't be verified and were excluded. Flagged, but the tool should not sound as certain about this one as about the others.
- **Arbitration / class-action waivers**: ranked by what they actually strip (the right to a day in court, to a class action), not discounted for being boilerplate. Labeled standard rather than unusual, since it's nearly universal — but the label changes presentation, not severity (ADR-0005, Q6).
- **Auto-renewal, personal guarantees, junk fees**: not part of v1's core red-line set. These are the clause types most central to consumer ToS and lease/personal-guarantee documents, which v1 doesn't serve (ADR-0002, ADR-0003). If one appears incidentally in a freelance retainer agreement, it gets generic or no tuned treatment.

## The calls I made and what I gave up

1. **Serve freelancers/small business, not individual consumers.** Chosen against: consumers reviewing ToS and subscriptions, where the single most evidenced clause type in the research (auto-renewal, 100,000+ FTC complaints) actually lives. Worse off: someone with a gym-membership or streaming-subscription auto-renewal problem — v1 doesn't help them.
2. **Freelance/service agreements as the wedge, not leases or personal-guarantee contracts.** Chosen against: leading with the single most severe documented harm in the entire research set (Northern Leasing: 29,000+ default judgments, personal financial ruin). Worse off: a small business owner facing a predatory equipment-lease personal guarantee — the worst-off population in the research gets no help from v1, on purpose, because the counter-offer feature has nowhere to go on a take-it-or-leave-it document.
3. **Sharp treatment for IP assignment and indemnification only.** Chosen against: equal depth across all six clause types. Worse off: someone whose contract's real danger is a severe non-compete, limitation-of-liability, or unilateral-termination clause gets a shallower read than someone whose risk is ownership or indemnification.
4. **Optimize against misses, accept more false alarms.** Chosen against: a quieter, higher-precision tool. Worse off: nobody in particular is harmed, but every User gets a longer list to individually check than a precision-tuned competitor might show them.
5. **State the pattern, never predict the outcome.** Chosen against: a more directly actionable verdict ("this clause is unenforceable," "you'd win this"). Worse off: a User who wants a definitive answer instead of a pattern-based caution still has to exercise their own judgment, or consult a lawyer, for a genuinely high-stakes call.
6. **Severity as two independent fields (tier + standard/unusual), not one blended score.** Chosen against: a simpler single-score model. Nobody is worse off from the model itself — the cost is entirely engineering complexity, a harder data model and a harder eval suite, not user harm.
7. **Document defects as their own category, surfaced before the flag list.** Chosen against: folding a defect in as a low-severity flag, which is a simpler data model. Nobody is directly worse off from the choice itself, but it means v1 needs a second output category built and tested before shipping, which a simpler model wouldn't have required.
8. **Reactive use only, not proactive self-audit.** Chosen against: supporting a freelancer who uploads their own outgoing template to check it before sending. Worse off: the freelancer worried about what's *missing* from their own paperwork rather than what's dangerous in someone else's — exactly the person who said "I didn't have a clause on late payment... I wish I did." What they need is absent-clause detection, a distinct, undesigned capability with no eval surface built for it anywhere in this brief, not a variant of the risk-flagging engine already scoped (ADR-0009).

## What we are not building, and why

- **Individual consumer ToS/subscription review.** Weaker willingness-to-pay evidence than the freelance/small-business segment, and it sits in the same regulatory territory the FTC already fined DoNotPay over for the same category of feature (ADR-0002).
- **Leases and personal-guarantee-backed contracts.** These are typically presented take-it-or-leave-it, with no realistic negotiating path — half of v1's feature set (the counter-offer) would have nowhere to go (ADR-0003).
- **Equal-depth detection across all six clause types.** Effort is concentrated on the two clause types that are both freelance-specific and highest-consequence; the rest are flagged but not tuned (ADR-0004).
- **Outcome prediction or legal verdicts.** Redline states patterns in the text, never what a court or counterparty would actually do — the same liability line that got a close consumer-facing analog fined (ADR-0007).
- **Proactive self-audit** — a freelancer checking their own outgoing contract template before sending it, rather than deciding whether to sign one someone sent them. This isn't a smaller version of the risk-flagging engine already scoped; it needs absent-clause detection, an open-ended, undesigned capability that reasons about what a good contract *should* include rather than evaluating clauses that exist. The research names this as a real, separate failure mode ("I didn't have a clause on late payment... I wish I did," Dana Nicole) and says outright that a pure clause-flagging tool doesn't address it. That freelancer is not served by v1, on purpose (ADR-0009).
- **Payments/billing, OCR for scanned documents, sharing a document between users.** Already excluded per CLAUDE.md. OCR in particular is excluded on purpose, not as a future roadmap item: a citation is worthless if the text it points at was misread, and this version exists to prove the analysis can be trusted.

## What the research could not tell us

- Whether job seekers (offer letters) or small landlords would actually pay: both have price anchors in the market ($420, $706 average lawyer-review fees) but no first-person pain or willingness-to-pay testimony was found for either segment specifically. A price existing in the market for lawyer review isn't the same as evidence someone would pay Redline.
- Anything specific about renters or gig workers: they're covered only by general justice-gap statistics, not contract-specific pain or pricing evidence at all.
- Whether the scope-creep/unlimited-revisions clause type is actually as common a problem as it feels — two of the statistics behind it couldn't be verified and were excluded from the research, which is part of why it stays generic-treatment rather than sharp.
- Whether counter-offer drafting and document-scoped Q&A — the two features no profiled competitor was confirmed to have — are safe, well-differentiated features or are hard to do well precisely because they require taking a normative stance on what's "fair." This brief resolves *scope* (which segment, which document, which clauses) but does not resolve whether the counter-offer feature as designed is safe to ship. The research flagged this as the open question the PRD needs to resolve, not paper over, and it remains open after this brief — it's a build-and-test question, not a research one.
