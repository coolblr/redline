# 0003. Freelance/service agreements are the wedge document, not leases or personal-guarantee contracts

## Decision
Redline v1's primary document type is a freelance or service agreement a Client has sent the User. Equipment leases and personal-guarantee-backed contracts — despite being the single most severe harm documented in the research (Northern Leasing: 29,000+ default judgments) — are not the wedge.

## Alternatives
- Lead with equipment leases / personal-guarantee contracts, since that's where the worst documented harm (personal financial ruin) sits.
Rejected: those documents are typically presented take-it-or-leave-it by a leasing company, with no realistic negotiating path for the signer. A drafted counter-offer — one of Redline's four core features — has nowhere to go on a document like that. Building the wedge around a document type where half the product's feature set is unusable isn't a v1 bet worth making.

## Why
Freelance and service agreements are routinely negotiated in practice — pushing back on a clause is a normal, expected move for this document type, which is what makes risk-flagging plus a drafted counter-offer a coherent, usable pair of features rather than a hypothetical one.

## Consequences
- The severity model and initial red-line set (see PRD.md) are tuned for clauses that actually show up in freelance/service agreements, not lease-specific or personal-guarantee-specific clauses.
- The most severe harm in the research (personal-guarantee-driven financial ruin) is explicitly not what v1 is built to catch. This needs to be stated plainly in the PRD rather than implied.
- If leases become a future wedge, the counter-offer feature likely needs a different design for take-it-or-leave-it documents (e.g., "here's what to ask about" rather than "here's your redraft").
