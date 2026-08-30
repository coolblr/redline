# 0002. Serve freelancers and small business owners, not individual consumers, in v1

## Decision
Redline v1 serves freelancers and small business owners deciding whether to sign a contract someone else sent them. It does not serve individual consumers reviewing ToS, subscriptions, or personal leases.

## Alternatives
- Serve individual consumers first: the research's single most-evidenced clause type (auto-renewal, 100,000+ FTC complaints) is a consumer problem, not a freelance one.
- Serve both from day one.
Both were rejected: consumer willingness-to-pay has no comparable price anchor to the freelance/small-business segment's $150–$1,500 range, and severity-ranking plus drafted counter-offers — the two features closest to giving legal advice — is exactly the feature set the FTC fined DoNotPay over when aimed at consumers.

## Why
Freelancers and small business owners have the strongest evidence on every axis that matters for a v1 bet: quantified pain (personal-guarantee lawsuits, 47% of small businesses losing $500+ to unreviewed legal issues), proven willingness to pay at a specific price point, and a near-identical competitor (QwickContractReview.com, $99/document) already validating demand. Consumer ToS review sits in a regulatory shadow this version isn't ready to stand in.

## Consequences
- v1's tone, red lines, and marketing language can be written for one segment instead of hedged across two.
- Individual consumers are explicitly not served — anyone reviewing a subscription ToS or a personal apartment lease should not expect this version to fit their situation well.
- If consumer demand turns out to matter later, the liability posture (marketing language, how confident the tool is allowed to sound) will need its own re-evaluation before extending into that segment — this decision doesn't imply that groundwork is already done.
