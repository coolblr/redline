# 0006. Optimize against misses, not false alarms

## Decision
When the flagging logic has to trade off between the two kinds of error, Redline accepts more false alarms (a harmless clause gets flagged) to reduce misses (a dangerous clause gets through silently).

## Alternatives
- Optimize against false alarms, keeping the flagged list short and high-confidence: rejected because a miss is a silent failure the User never learns about, while a false alarm is cheap for the User to dismiss — they read the cited sentence, see it's fine, and move on. The asymmetry in how each error is discovered, not just how often each occurs, is what settles this.

## Why
The product's entire premise is catching what someone would otherwise sign without noticing. A tool tuned to look confident by staying quiet defeats its own purpose the one time a real risk is in the document.

## Consequences
- The flagged list will be noisier than a precision-optimized tool's, especially early on — this needs to be an accepted, stated trade-off in the PRD, not something that reads as a bug to fix later.
- Severity tiering (ADR-0005) and the standard/unusual label carry more of the burden for keeping the noisier list usable, since volume alone isn't being suppressed.
- The eval suite (PRD.md, "what good looks like") should weight miss rate on known-risky documents more heavily than false-alarm rate on clean ones.
