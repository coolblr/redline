# Redline eval report

Draft written from the repository only: `PRD.md`, `eval/README.md`, the newest run in `eval-runs/`, my labels in `eval/labels/` and my judge runs in `eval/judge/`.

## What the product does, and which clauses it promises to flag

Redline reads a freelance or service agreement a client has sent me and helps me decide whether to sign it. It gives a plain-English summary and severity-ranked risk flags, and every flag cites the exact sentence it came from. It drafts a counter-offer for each flag, answers questions scoped to the document, keeps an editable list of my red lines, and saves a library of past documents.

It promises to flag seven clause types (PRD.md, "What the first version does" and "My red lines"):

- **Sharp treatment:** indemnification, and IP assignment (ownership before payment).
- **Generic treatment:** limitation of liability, non-compete, unilateral termination, scope creep.
- **Always flagged:** arbitration and class-action waivers.

Auto-renewal, personal guarantees and junk fees are not part of v1's red lines.

## What I measured, and on what

I ran the nine-document gold set from the instructor's repository (`eval/gold-set/`) through the same function `npm run smoke` uses, with the model `z-ai/glm-5.3-flash`, on 2026-10-30. All nine documents ran; none was left out for a failed model call.

- **Documents:** `adhesion-contract`, `saas-subscription`, `offer-letter`, `storage-unit-rental`, `phone-plan-terms` and `internship-agreement` hide 40 planted clauses between them. `clean-document`, `library-volunteer-agreement` and `swim-lesson-registration` should come back clean.
- **In scope (19 planted clauses):** arbitration (5), non-compete (4), limitation of liability (4) and indemnification (6).
- **Out of scope (21 planted clauses), never counted as misses:** auto-renewal (6) and fee escalators and late fees (9), because PRD.md leaves them out of v1; unilateral modification (6), because the product flags unilateral termination, which is a different clause. The pairing for unilateral modification is the one most open to argument (see `eval/README.md`).
- **Not measurable with this gold set:** IP assignment, scope creep and unilateral termination have no gold-set counterpart, so recall for them is unknown.

## The numbers

| Measure | Result |
|---|---|
| Recall (planted clauses found, of those in scope) | 17/19 (89%) |
| Of those found, flag named the right type | 17/17 (100%) |
| Recall by type | indemnification 6/6, arbitration 5/5, limitation of liability 3/4, non-compete 3/4 |
| Groundedness (quotes in the document character for character, of every flag the model returned) | 24/25 (96%) |
| Flags the product's resolver dropped before showing | 2 of 25 |
| Flags shown to the reader | 23 |
| Flags on the three clean documents (target 0) | 1 across 3 documents |
| Character split: planted sentences with a curly quote, non-breaking space, ligature, em dash or double space | 5/6 (83%) |
| Character split: plain sentences | 12/13 (92%) |
| My ten hand labels | 7 PASS, 3 FAIL |

- **Misses:** a limitation-of-liability clause in `adhesion-contract` (it carries a curly quote, a non-breaking space and an em dash) and a non-compete in `offer-letter`.
- **Flag on a clean document:** a cite-only unilateral-termination flag on `library-volunteer-agreement`.
- **Flags on no planted clause:** 6 of the 23 shown. Five are unilateral-termination, a type the gold set has no category for, and one is a non-compete in `internship-agreement`.
- **One run only.** The same build can score differently on a second run, so a difference of one or two clauses is noise. With 4 clauses per type, one miss moves a type's recall 25 points.

## My ten hand labels

I labelled ten flags from the run, chosen so that flags on no planted clause came first. They are not a sample of the whole run. My labels changed twice on the page, and the earlier answers are kept in `labels.json`:

- **#7** (unilateral termination, phone plan): PASS to FAIL at 16:58 on 2026-10-30. My note now says it is conditional and not a unilateral termination under the rubric.
- **#10** (mutual termination, volunteer agreement): PASS to FAIL at 17:00 on 2026-10-30. My note now says it is mutual and costs the volunteer nothing real.

My final labels are 7 PASS and 3 FAIL, with two changes of mind.

I corrected #7 and #10 after realizing I was evaluating practical fairness instead of applying the rubric's strict definitions: unilateral termination requires at-will power, and cost requires a concrete loss beyond ordinary consequences. I changed them because I decided the judge had applied the rubric as written and my first labels had not.

## How far the judge agrees with me

The judge is a fresh subagent that sees only the rubric (`eval/judge/rubric.md`) and the flags. Neither judge run saw my labels.

| Run | Labels at the time | Of the flags I passed, judge passed | Of the flags I failed, judge failed |
|---|---|---|---|
| run-1 | 9 PASS, 1 FAIL | 7 of 9 | 1 of 1 |
| run-2 | 8 PASS, 2 FAIL | 7 of 8 | 2 of 2 |
| run-3 | 7 PASS, 3 FAIL (my final labels) | 7 of 7 | 3 of 3 |

- **Judge verdicts:** the judge returned the same PASS or FAIL on all ten flags in both runs. Only the wording of its reasons changed.
- **What moved between runs:** my label on #7, not the judge or the rubric.
- **After run-2:** I changed #10 to FAIL, and run-3 is a fresh judge on the same rubric and flags. Its verdicts are again identical, so my final labels and the judge agree on all ten. That agreement is not independent evidence, because I changed #7 and #10 after seeing the judge's disagreement, and the labels now match it. I have not edited the rubric.
- **My failed flags number only 3** (2 at the time of run-2), so how well the judge catches a bad flag rests on very few cases.

**Judge on every flag:** it passed 20 of the 23 flags the reader would be shown (`eval/judge/all-flags-run-1.json`). All three FAILs are flags from my ten (the phone-plan termination, the internship confidentiality sentence and the volunteer mutual termination). Every one of the 13 flags I had not labelled passed. That is an estimate of precision of 20/23, and I trust it only as far as the judge's two numbers above allow.

## The limits

- **A model wrote the gold set.** The numbers are an upper bound for real contracts. They are good for comparing this build with itself after a change, and never something to promise a reader.
- **The gold set is not my target documents.** Seven of the nine documents are consumer documents (a gym, a phone plan, a storage unit, a subscription), not freelance agreements.
- **Ten labels is only a start.** A judge needs a hundred or more labels for each kind of mistake before I would trust it.
- **One run, one model.** I have not repeated the eval to measure run-to-run variation.
- **Rubric from near-uniform notes.** Most of my notes follow the same pattern, so the rubric is close to the PRD's own wording.

## What I would fix next, and which number should move

I would fix the volunteer termination flag (#10 of my ten, #23 of the 23) next. The rubric does not say how context, such as an unpaid volunteer role, affects the "costs the reader something" test, and the judge relied on that contextual reasoning to fail it. The same wording also separates it from the mutual at-will employment flag, which the judge passed.

This is a fix to the rubric, not to the product. The number that should move is the judge's: its verdicts on flags like this one, and its PASS count over the 23 flags (20/23 now). The direction I chose: an unpaid role can still cost the reader something, so the rubric should not say that an unpaid or volunteer context means there is no concrete loss. It should say a loss can come from something owed or a promised term. An unpaid role costs nothing when nothing is owed and no term is promised, and that is why my FAIL label on this flag stands.

I have not edited the rubric yet. After I do, I would re-run the judge and look at this flag and the 20/23 PASS count. I do not yet know which way they move: the judge may keep failing this flag under the narrower rule, which would mean it already agreed with the rule I now want to write.

The same flag is the one flag the product raised on a clean document, so a product fix would move a different number: flags on clean documents (1).

Other candidates the run points to, not chosen: the two misses (the non-compete in `offer-letter` and the limitation-of-liability clause with retyped characters, which would move recall, 17/19, and the character split, 5/6), and the other five unilateral-termination flags on no planted clause.

Whichever I do, I would run the eval or the judge twice afterwards and treat a change of one or two clauses as noise.
