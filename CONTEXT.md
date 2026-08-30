# Redline

Redline analyzes a contract a user has been sent and is deciding whether to sign, flags risky clauses with exact source citations, and drafts a counter-offer per flag.

## Language

**User**:
A freelancer or small business owner who has been sent a contract by a Client and is deciding whether to sign it. Redline serves this person in v1 — not the party who drafted the document, and not an individual consumer clicking through a ToS.
_Avoid_: consumer, customer, reader.

**Client**:
The other party to the document under review — the one who drafted or sent the contract the User is deciding whether to sign. Redline does not analyze anything on the Client's behalf.
_Avoid_: counterparty, the other side.

**Contract**:
The wedge document type for v1: a freelance or service agreement the Client sent the User. Leases, ToS, and other document types named in the product's scope are not the v1 priority — see ADR-0003.
_Avoid_: agreement (too generic on its own), document (used only when speaking generically across future document types).

**Severity tier**:
A flagged clause's rank, driven by cost-if-it-bites: top tier is uncapped exposure and one-sided; middle tier is capped exposure but still one-sided; cite-only is capped and mutual. See ADR-0005.
_Avoid_: risk level, priority (both used loosely elsewhere — severity tier is the one specific, scored field).

**Standard / unusual**:
A label on a flag, independent of severity tier, marking whether a clause is expected boilerplate for this document type or atypical. A clause can be top-severity and standard (e.g. arbitration) or top-severity and unusual — the label changes how the flag is presented, not its severity. See ADR-0005.
_Avoid_: common, rare (used only informally; "standard" and "unusual" are the canonical pair).

**Document defect**:
An internal inconsistency or gap in the document itself — a clause referencing a schedule/exhibit that isn't in the extracted text, or an ambiguous defined term that could refer to more than one party. Distinct from a risk flag: a defect is about whether the document can be trusted to mean what it says, not about a clause's content. Surfaced as its own section, before the severity-ranked flag list. See ADR-0008.
_Avoid_: error, issue (too generic — "document defect" is the specific term for this category).
