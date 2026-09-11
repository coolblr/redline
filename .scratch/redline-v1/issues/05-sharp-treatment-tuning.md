# 05: Sharp-treatment tuning for IP-assignment & indemnification

**What to build:** Harden IP-assignment/ownership-before-payment and indemnification detection to the sharp-treatment bar PRD.md holds them to. No change to the Flag shape — this is detection/prompting quality plus a dedicated eval fixture set for these two clause types.

**Blocked by:** 04

**Status:** done

- [x] A known-severe indemnification fixture (uncapped, one-sided) resolves to top severity — plus two more isolated indemnification cases (capped+one-sided → middle, capped+mutual → cite-only), all 3/3 correct against the live model
- [x] A known-severe IP-assignment fixture (ownership transfers before or independent of payment) resolves to the correct severity tier — IP-assignment now gets its own timing-based severity test (`computeIpAssignmentSeverityTier`: on-creation → top, on-delivery → middle, on-full-payment → cite-only, a reasoned judgment call not fully pinned down by PRD.md), 3/3 correct against the live model
- [x] treatmentDepth is recorded as `sharp` for these two clause types' flags, `generic` for the other four (unchanged, deterministic since ticket 04)
- [x] Sharp-treatment fixtures are held to a stricter correctness bar than the generic-treatment fixtures already covered in 04, and this distinction is visible in the eval results as separate numbers (`npm run eval:sharp`): "Sharp-treatment: 6/6 correct tier" / "Generic-treatment recall: 4/4 clause types flagged"
