# 05: Sharp-treatment tuning for IP-assignment & indemnification

**What to build:** Harden IP-assignment/ownership-before-payment and indemnification detection to the sharp-treatment bar PRD.md holds them to. No change to the Flag shape — this is detection/prompting quality plus a dedicated eval fixture set for these two clause types.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] A known-severe indemnification fixture (uncapped, one-sided) resolves to top severity
- [ ] A known-severe IP-assignment fixture (ownership transfers before or independent of payment) resolves to the correct severity tier
- [ ] treatmentDepth is recorded as `sharp` for these two clause types' flags, `generic` for the other four
- [ ] Sharp-treatment fixtures are held to a stricter correctness bar than the generic-treatment fixtures already covered in 04, and this distinction is visible in the eval results as separate numbers, not one blended accuracy figure (ADR-0004)
