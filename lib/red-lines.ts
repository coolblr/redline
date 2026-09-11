// Minimal version of red lines for this ticket. A RedLine is a per-clause-
// type statement of what the User cares about, fed into analyzeDocument's
// prompt as context (lib/seams/analyze-document.ts). This ticket does not
// persist or let a User edit red lines -- analyzeDocument just accepts a
// RedLine[] parameter, and calling code defaults to DEFAULT_RED_LINES where
// nothing else is available. Ticket 07 adds editing/persistence on top of
// this exact type later; don't change its shape without checking that
// ticket's needs.

import type { ClauseType } from "@/lib/domain-types";

export interface RedLine {
  clauseType: ClauseType;
  guidance: string;
}

// One entry per ClauseType, written in the User's own terms and derived
// directly from PRD.md's "My red lines" section.
export const DEFAULT_RED_LINES: RedLine[] = [
  {
    clauseType: "indemnification",
    guidance:
      "I care whether my liability under this clause is capped or uncapped, and whether it runs both ways or falls on me alone. Uncapped and one-sided is my biggest concern here: a single meritless third-party claim can exceed an entire project's fee, and my own liability insurance often doesn't cover it. Capped but still one-sided is still worth flagging: a cap doesn't erase the asymmetry.",
  },
  {
    clauseType: "ip-assignment",
    guidance:
      "I care about exactly when ownership of my work passes to the Client: on creation, on delivery, or only once I've been paid in full. Ownership that transfers before or independent of payment is the pattern to flag, since it means I can lose the rights to work I haven't been paid for yet.",
  },
  {
    clauseType: "limitation-of-liability",
    guidance:
      "I care about the same asymmetry test as indemnification: is the Client's liability capped while mine is left open-ended? An asymmetric cap (theirs limited, mine not) is the pattern to flag, even where a cap exists somewhere in the clause.",
  },
  {
    clauseType: "non-compete",
    guidance:
      "I care about how broad the restriction is in duration, geography, and industry. A long, wide non-compete can block me from working in my own field at all, not just with one Client. That scope is what I want flagged, not just the presence of a non-compete.",
  },
  {
    clauseType: "unilateral-termination",
    guidance:
      "I care about whether I can be cut off mid-project for any reason, with no minimum notice period and no kill fee. That combination, no notice and no fee, is the pattern to flag.",
  },
  {
    clauseType: "scope-creep",
    guidance:
      "I care about unlimited or open-ended revisions, especially when they're gated only by the Client's own discretion and come at no added cost to me. This is the clause type with the thinnest evidence behind it, so treat it as a real flag but a lower-confidence one.",
  },
  {
    clauseType: "arbitration",
    guidance:
      "Flag an arbitration or class-action-waiver clause at real severity every time it appears, even though it's common boilerplate. It's standard, but it still gives up a jury trial and the ability to join a class action. Don't discount it for being expected.",
  },
];
