# 0007. State the pattern, never predict the outcome

## Decision
Redline is confident about what the document says and hedged about what it means. It states document facts flatly, because it's citing text: "this clause states you indemnify the Client for any and all claims, with no cap." It never predicts an outcome: it will not say "you would lose in court over this," or anything else that forecasts what would actually happen if the clause were invoked.

## Alternatives
- Hedge everything, including plain restatements of the document's text: rejected as useless — hedged language is safe but doesn't tell the User anything they couldn't get from reading the document themselves.
- State everything with full confidence, including judgments about outcomes: rejected — this is the exact feature-set risk ADR-0002 already flagged. DoNotPay was fined by the FTC specifically for overstating what its AI could do; predicting legal outcomes is a categorically different and riskier claim than describing what text says.

## Why
The confidence split runs along the same boundary that's already an invariant in this product (CLAUDE.md: every flag cites its exact source sentence). Citing text is a factual claim Redline can stand behind; predicting what a court or counterparty would do with that text is not. Keeping the split at that exact line means it doesn't need a separate confidence scale to calibrate — it inherits the citation boundary that already exists.

## Consequences
- This is a copy rule, not just an intention: prompts, UI copy, and counter-offer drafts all need to be checked against "does this state the pattern, or does it predict the outcome" before shipping any user-facing text.
- Phrases like "this pattern is usually unfavorable to the party with less negotiating leverage" are the acceptable middle ground — general and pattern-based, not a specific prediction about this User's situation.
- Anyone writing prompts for summaries, flags, or counter-offers needs this rule explicitly, not left to infer from the citation requirement alone.
