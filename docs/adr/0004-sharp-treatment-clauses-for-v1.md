# 0004. IP assignment and indemnification get sharp treatment in v1; other clause types stay generic

## Decision
Redline v1 builds its most precise, well-tuned detection for two clause types: IP assignment / ownership-before-payment, and indemnification. Non-compete, limitation-of-liability, unilateral termination, and scope creep are flagged with generic detection in v1 — this is a stated gap, not an oversight.

## Alternatives
- IP assignment alone (the original recommendation): rejected because indemnification is the research's sharpest quantified freelance harm — a single meritless third-party claim can exceed an entire project's fee, and commercial liability insurance often doesn't cover it. Shipping it with only generic detection would mean the tool is weakest exactly where the harm is largest.
- All six clause types at generic depth, none sharp: rejected as spreading effort too thin to be excellent at anything.

## Why
Two clause types, chosen for being both freelance-specific and high-consequence, get the tool's best judgment. The rest are still flagged and cited — just without the same tuning — so the PRD can say plainly what v1 is and isn't good at yet, rather than implying uniform quality across every clause type.

## Consequences
- The "what good looks like" test criteria in PRD.md must be scoped per clause type, not as one blanket accuracy number — sharp-treatment clauses should be held to a higher bar than generic ones.
- A contract whose main risk is a severe non-compete or limitation-of-liability clause will get a shallower read than one whose main risk is IP assignment or indemnification. This should be stated in the PRD, not discovered by a user.
