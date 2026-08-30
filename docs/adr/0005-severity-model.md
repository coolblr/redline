# 0005. Severity is a three-tier exposure test, tagged separately with standard-vs-unusual

## Decision
For clauses involving liability/exposure (indemnification, limitation-of-liability, and similar), severity is ranked by a three-tier test:
- **Top tier**: uncapped exposure AND one-sided (only the User is exposed, not mutual).
- **Middle tier**: capped exposure but still one-sided. Asymmetry alone earns real severity — it does not get dropped to the bottom just because a cap exists.
- **Cite-only tier**: capped AND mutual (bounded, symmetric exposure).

Independently of this tier, every flag also carries a **standard-vs-unusual** label: whether the clause is expected boilerplate for this document type, or atypical. This label does not change the severity tier — it changes how the flag is presented, so a top-tier-but-standard clause (e.g. arbitration) reads differently from a top-tier-and-unusual one.

## Alternatives
- Uncapped-and-one-sided as the only high-severity criterion, everything else (including capped-but-asymmetric) falling to a single low tier: rejected because the research's actual red flag is the asymmetry itself (client's liability capped, contractor's isn't), independent of whether a cap exists at all.
- Rank severity by how unusual a clause is for the document type, rather than by cost-if-it-bites: rejected — an arbitration clause is boilerplate but still strips a real legal right, and severity has to reflect actual cost, not just surprise value.
- Fold standard-vs-unusual into the severity score itself (e.g. downgrade boilerplate clauses automatically): rejected — that would under-rank clauses that are dangerous precisely because they're boilerplate and easy to sign past. Keeping the two signals separate lets a clause be both "cite every time" and "you've seen this before."

## Why
Cost-if-it-bites has to be the primary axis, or the tool would under-rank universally-present but genuinely rights-stripping clauses like arbitration. But cost alone risks training the user to stop reading flags once every document surfaces the same boilerplate warnings at the top — citation-based trust only works if someone is still paying attention when they read it. The standard-vs-unusual label is the fix: it keeps cost as the ranking signal while giving the User a reason to keep reading past clause types they've seen before.

## Consequences
- The flag data model needs two independent fields per flag: a severity tier and a standard/unusual label — not one collapsed score.
- The eval suite (see PRD.md, "what good looks like") needs test cases for the middle tier specifically (capped-but-asymmetric clauses), since that's the case most likely to be miscategorized by a naive implementation that only checks for uncapped exposure.
- Determining "standard for this document type" requires some notion of what's typical in a freelance/service agreement — this needs its own definition before implementation, not left to per-document judgment calls.
