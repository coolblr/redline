# 05: Red-line saves give no feedback

**Status:** ready-for-agent

**What the reader sees now (testing agent, FINDINGS.md findings 7 and 8, not yet reproduced by hand):**
- Save greys out briefly and shows no message. Nothing says the edit was stored.
- Saving an empty guidance box is refused by the server ("Guidance can't be empty.") but the page shows nothing, and after a reload the old text is back.
- After a save, the cards changed order.
- The textareas have no length limit, so about 3,000 characters can be saved. This is the text that drives the analysis.

**Change:** show a short "Saved" or error line next to the card that was edited, surface the server's "can't be empty" message, keep the card order fixed, and add a sensible maximum length with a visible limit. The length limit is new behaviour on the analysis input, so confirm the number with the owner.

**Check:** edit a red line and save: a confirmation appears. Clear it and save: the error appears and the old text stays. Reload: the order is unchanged.

**Copy:** all three messages go through the humanizer.

## Comments
