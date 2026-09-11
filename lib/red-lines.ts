// A RedLine is a per-clause-type statement of what the User cares about,
// fed into analyzeDocument's prompt as context (lib/seams/analyze-document.ts).
// analyzeDocument itself only reads clauseType + guidance -- it has no
// concept of `enabled` and never filters by it. Filtering happens outside
// that seam entirely: see filterFlagsByRedLines below, and its call site in
// app/documents/[id]/actions.ts's runAnalysis. This split is deliberate
// (ticket 07) -- analyzeDocument stays a pure "extract everything checkable"
// function, and disabling a clause type is a presentation-layer decision
// made after the fact, which is also what makes the "editing red lines
// visibly changes Flag[]" behavior deterministic and testable without a
// live model call.
//
// Persistence lives in lib/red-lines-store.ts (Supabase, per-user scope,
// lazily seeded from DEFAULT_RED_LINES on first access). This file stays
// framework/storage-agnostic: types, the default set, and the pure filter
// function only.

import type { ClauseType, Flag } from "@/lib/domain-types";

export interface RedLine {
  clauseType: ClauseType;
  guidance: string;
  enabled: boolean;
}

// One entry per ClauseType, written in the User's own terms and derived
// directly from PRD.md's "My red lines" section.
export const DEFAULT_RED_LINES: RedLine[] = [
  {
    clauseType: "indemnification",
    guidance:
      "I care whether my liability under this clause is capped or uncapped, and whether it runs both ways or falls on me alone. Uncapped and one-sided is my biggest concern here: a single meritless third-party claim can exceed an entire project's fee, and my own liability insurance often doesn't cover it. Capped but still one-sided is still worth flagging: a cap doesn't erase the asymmetry.",
    enabled: true,
  },
  {
    clauseType: "ip-assignment",
    guidance:
      "I care about exactly when ownership of my work passes to the Client: on creation, on delivery, or only once I've been paid in full. Ownership that transfers before or independent of payment is the pattern to flag, since it means I can lose the rights to work I haven't been paid for yet.",
    enabled: true,
  },
  {
    clauseType: "limitation-of-liability",
    guidance:
      "I care about the same asymmetry test as indemnification: is the Client's liability capped while mine is left open-ended? An asymmetric cap (theirs limited, mine not) is the pattern to flag, even where a cap exists somewhere in the clause.",
    enabled: true,
  },
  {
    clauseType: "non-compete",
    guidance:
      "I care about how broad the restriction is in duration, geography, and industry. A long, wide non-compete can block me from working in my own field at all, not just with one Client. That scope is what I want flagged, not just the presence of a non-compete.",
    enabled: true,
  },
  {
    clauseType: "unilateral-termination",
    guidance:
      "I care about whether I can be cut off mid-project for any reason, with no minimum notice period and no kill fee. That combination, no notice and no fee, is the pattern to flag.",
    enabled: true,
  },
  {
    clauseType: "scope-creep",
    guidance:
      "I care about unlimited or open-ended revisions, especially when they're gated only by the Client's own discretion and come at no added cost to me. This is the clause type with the thinnest evidence behind it, so treat it as a real flag but a lower-confidence one.",
    enabled: true,
  },
  {
    clauseType: "arbitration",
    guidance:
      "Flag an arbitration or class-action-waiver clause at real severity every time it appears, even though it's common boilerplate. It's standard, but it still gives up a jury trial and the ability to join a class action. Don't discount it for being expected.",
    enabled: true,
  },
];

// A flag survives if there's a red line for its clauseType with
// enabled: true, OR if there's no red-line entry at all for that
// clauseType. "No entry" is treated as enabled-by-default -- DEFAULT_RED_LINES
// covers all seven clause types, but a User's customized list should stay
// forgiving of a missing entry rather than silently dropping a whole clause
// type by omission. Pure and synchronous: no I/O, no OpenRouter call, which
// is what makes "editing red lines visibly changes Flag[]" testable with a
// stub client instead of a live model.
export function filterFlagsByRedLines(flags: Flag[], redLines: RedLine[]): Flag[] {
  return flags.filter((flag) => {
    const redLine = redLines.find((rl) => rl.clauseType === flag.clauseType);
    return redLine ? redLine.enabled : true;
  });
}
