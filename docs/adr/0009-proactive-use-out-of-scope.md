# 0009. Proactive self-audit is out of scope for v1

## Decision
Redline v1 serves only reactive use: a User who has been sent a contract by a Client and is deciding whether to sign it. It does not serve proactive use — a freelancer auditing their own outgoing contract template before sending it to clients.

## Alternatives
- Let proactive use "just work" by allowing a User to upload their own template through the same flow: rejected. The counter-offer-per-flag feature has no target on a self-authored document — there's no counterparty clause to push back against, so the output would be a risk flag with a drafted counter-offer that has nowhere to send it.
- Explicitly support proactive use as a named v1 use case: rejected for now, because what it actually requires isn't a variant of the risk-flagging engine already scoped in this brief. It requires **absent-clause detection** — noticing that a clause which *should* be in the document isn't there at all. That's a distinct, undesigned capability: risk-flagging evaluates clauses that exist; absent-clause detection has to reason about what a good contract of this kind would normally include, which is a different, open-ended task with no severity model, no red-line list, and no eval surface built for it anywhere in this brief.

## Why
The research names this as a real, separate failure mode, not a hypothetical: "I didn't have a clause on late payment in my contract and I wish I did so I could enforce some type of late fee" (Dana Nicole, freelancer). `research/summary.md` calls this out directly: *"This is a slightly different failure mode than 'risky clause I didn't notice' — it's absent protection the person didn't know to ask for. Worth noting for scope: a pure clause-flagging tool doesn't address it; a counter-offer/drafting feature partially does."* That gap was left unresolved when the reactive/proactive question was first accepted without pushback (Q3 of the original grill) — this ADR closes it explicitly instead of leaving it implied by the User definition in CONTEXT.md.

The freelancer auditing their own template, worried about what's missing rather than what's dangerous, is not served by v1 — the same way ADR-0003 already says the personal-guarantee victim isn't served. Both are real, sympathetic populations research surfaced; both are excluded on purpose, not by oversight.

## Consequences
- If a User uploads their own draft template anyway, the product should not silently produce a confusing result (flags with unsendable counter-offers). This needs a stated behavior — at minimum, treating it as a reactive-mode document like any other, with the understanding that "missing" protections won't be caught, and the counter-offer output may not make sense for a self-authored clause. That behavior is not designed here and needs its own decision before it's encountered in practice.
- Absent-clause detection, if built later, needs its own design and its own eval suite — it cannot be bolted onto the existing severity/red-line model, because it isn't evaluating clause content at all.
