# 0001. Every flag cites its source

## Decision
Every risk flag Redline produces must include the exact sentence from the uploaded document it was derived from. A flag whose source sentence cannot be shown is a bug, not a formatting preference — it does not ship, regardless of how plausible the flag itself sounds.

## Alternatives
- Let the model describe the risk in its own words, with no quoted sentence attached.
- Quote a paraphrase or a nearby passage rather than the exact source sentence.
- Show the source sentence only when convenient, and fall back to an unsourced summary otherwise.
All three were rejected: each lets a flag exist that the reader cannot check against the document in front of them.

## Why
A reader can take any flag Redline shows them and find that exact sentence in their own document. They don't have to trust our judgment about what's risky — they can verify it themselves, in seconds, against the source. That verification step is the product's only real claim to being trustworthy rather than merely plausible-sounding.

## Consequences
- The model can no longer freely paraphrase; every flag needs a traceable pointer into the document's text, which constrains prompting and output format.
- Flag generation and citation extraction can't be fully decoupled — a flag isn't complete until its source sentence resolves.
- Testing must check citations against the actual document text, not just check that output "looks like" a reasonable flag.
- Some real risks that are implicit or spread across multiple sentences, rather than stated in one, will be harder to flag under this rule — and may be missed rather than flagged without a clean citation.
- This rules out any future feature that surfaces a risk without a document-grounded quote, unless a separate ADR revisits this decision.
