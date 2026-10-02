# 01: The Exposure column says "Uncapped" for any Top flag

**Status:** needs-info

**Blocked by:** owner decision on FINDINGS.md finding 2 (the severity rule for uncapped-and-mutual clauses)

**What the reader sees now:** `exposureLabel` in `app/documents/[id]/page.tsx` returns "Uncapped" whenever the tier is Top and "Capped" otherwise. The exposure value isn't stored, so it is inferred from the tier. An IP-assignment or scope-creep flag that reaches Top therefore reads "Uncapped", though caps have nothing to do with it (the testing agent also saw this on a French non-compete).

**Change:** show the Exposure value only for clause types where a cap is meaningful (indemnification, limitation of liability), and show nothing in that cell for the others. If the owner changes the severity rule, store the real `isExposureCapped` and `isMutual` facts instead of inferring them.

**Check:** open an analysed document that has an IP-assignment or scope-creep flag at Top. The Exposure cell should be empty for those rows and still read "Uncapped" for an uncapped indemnification.

**Copy:** none new if the cell is simply left empty. If a replacement label is added, run it through the humanizer.

## Comments
