# 02: Counter-offers are one dense block

**Status:** needs-triage

**What the reader sees now:** each counter-offer is a single paragraph. A note to the reader, a draft email and the replacement clause run together, with their labels buried in the sentences ("Draft email text to accompany the redline:", "Draft redline text (drop-in contract language):"). The reader has to find the part to send.

**Change:** show three labelled blocks: the proposed clause, the draft email, and the note.

**Why this is not a small fix:** the model returns one text string, and `counter_offers` has a single `text` column. Splitting that string on the marker phrases after the fact would break whenever the model words a label differently, and I would not do it. Doing it properly means:
1. `draftCounterOffer` (`lib/seams/draft-counter-offer.ts`) returns three fields, with its prompt and JSON schema updated.
2. A migration adds columns to `counter_offers` (or a structured column), and existing rows need a fallback so old counter-offers still render as one block.
3. The invariant "states only what the document says" still has to hold for all three parts, and tests must cover the new shape.

**Decision needed from the owner:** whether to change the model's output shape and the table. This is the most expensive ticket on the list.

**Check:** a document analysed after the change shows three blocks per flag. A document analysed before it still renders its single block.

**Copy:** the three block labels go through the humanizer.

## Comments
