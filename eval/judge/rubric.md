# Rubric: is this flag right?

You will be given flags from a contract-review product. Each flag has a number, a document name, a clause type, a severity, one quoted sentence, and the paragraph around it. For each flag, decide PASS or FAIL and give one sentence on why.

The product serves a freelancer or small business owner who has been sent a contract and is deciding whether to sign it. A flag is a warning to that reader, so a wrong flag wastes their time.

## The rule

**PASS** if the quoted sentence really is the kind of clause the flag names, and it really costs the reader something. Both must be true.

**FAIL** otherwise: the sentence is a different kind of clause, or it costs the reader nothing.

Judge only these two things. Do not judge the severity, and do not check whether the quote appears in the document. Both are handled elsewhere.

## What each clause type means

Use these meanings for the clause type the flag names.

- **indemnification**: the reader must cover the other party's losses or legal costs. It is worst when the exposure is uncapped and one-sided, because a single meritless third-party claim can exceed an entire project's fee, and commercial liability insurance often does not cover it. It is least worrying when capped and mutual.
- **ip-assignment**: who owns the work, and when ownership transfers. Transfer before or independent of payment is the dangerous pattern, because the freelancer can lose rights to work they have not been paid for.
- **limitation-of-liability**: a cap or exclusion on what a party can be made to pay. An asymmetric cap (the other party's liability is capped, the reader's is not) is the pattern to watch.
- **non-compete**: a restriction on the reader working for others, or in their field, after or during the deal. Danger scales with duration and with geographic or industry scope. A broad enough one can block the reader from working in their field at all.
- **unilateral-termination**: one party can end the deal, for any reason, without notice. The danger is being cut off mid-project with no minimum notice and no kill fee.
- **scope-creep**: unlimited revisions or an open-ended scope of work. This is the weakest-evidenced type, so be slightly more willing to FAIL a flag here that rests on thin wording.
- **arbitration**: arbitration in place of court, or a waiver of class actions. It costs the reader the right to a day in court or to a class action. It is nearly universal boilerplate, but being standard does not stop it costing the reader something.

## What "costs the reader something" means

The sentence, as written, puts a concrete burden or loss on the reader. Examples of a real cost:

- the reader becomes financially responsible for something, such as someone else's claims or legal fees;
- the reader can lose the job, the service, the pay or the rights to their work with little or no protection;
- the reader is blocked from doing something they would otherwise be free to do;
- the reader gives up a legal right.

A sentence that is only descriptive, procedural or housekeeping costs the reader nothing, even when it sits next to a costly clause.

## General rules for hard cases

- **Judge the sentence, not its neighbours or its heading.** A sentence that only supports or refers to a restriction (how a term is defined, how information is handled, how notice is delivered) is not itself that restriction, even if the paragraph around it is. Decide what this sentence does.
- **The type must match what the sentence does.** If the sentence is about something else (information handling, payment timing, definitions), FAIL, even if a related clause type is nearby.
- **Notice or mutuality does not by itself make a clause costless.** A termination or similar right that applies to both sides, or that comes with a notice period, still counts if the reader is left without a guaranteed term or other protection.
- **Do not use the severity label to decide.** A flag with a severity you disagree with can still PASS.
- **Do not reward length or confidence.** A flag passes on what the quoted sentence says, not on how it is described.
- **Use only the quoted sentence and its paragraph.** Do not assume terms that the text does not state.

## What to return

For each flag, in order: the flag's number, PASS or FAIL, and one sentence on why.
