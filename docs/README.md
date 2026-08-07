# ScaleShop Scalability Lab — specification index

Status: **implemented pilot; content calibration and acceptance review remain in progress**.

This folder defines the next version of the ScaleShop Scalability Lab. It preserves the strongest parts of the original simulation—12 progressive incidents, animated metrics, evidence discovery, upgrade choices, facilitator answers, before/after comparison, and a reference architecture budget—while making the experience clearer, fairer, and more challenging.

## Documents

- [product-spec.md](product-spec.md) — product goals, users, workshop flow, information architecture, interaction model, facilitator experience, and acceptance criteria.
- [level-specs.md](level-specs.md) — the complete content model for all 12 levels: incidents, evidence, choices, expected reasoning, consequences, and learning objectives.
- [metrics-spec.md](metrics-spec.md) — metric vocabulary, credibility rules, scenario values, charts, thresholds, and simulation behavior.
- [architecture-spec.md](architecture-spec.md) — the consistent architecture-diagram language and the exact topology changes shown at every level.
- [facilitator-spec.md](facilitator-spec.md) — the 12-person operating model, 180-minute run sheet, presenter-safe controls, run cards, recovery behavior, and inclusion protocol.
- [review-round-2.md](review-round-2.md) — post-implementation Staff+ critique and prioritized acceptance backlog beyond level metrics.
- [review-round-3.md](review-round-3.md) — full implementation audit: metric/value verification, preset-formula contradictions, option-position bias, scoring gaps, usability, cost model, and visual review.
- [engineer-feedback-assessment.md](engineer-feedback-assessment.md) — assessment and implementation plan for pilot-tester feedback (APM surface, standard-metric tooltips, contrastive debrief).
- [product-improvements-after-feedback.md](product-improvements-after-feedback.md) — prioritized next improvements after the implemented feedback rounds, plus deliberately deferred complexity.

## Recommended review baseline

The following product decisions are recommended for the first workshop. They remain reviewable and do not authorize implementation:

1. **Facilitator-led by default, self-guided as a secondary mode.** One shared browser is the canonical 12-person workshop setup. The local-only participant mode also supports individual practice.
2. **One committed attempt per level.** Reveal the selected option's consequence immediately, then debrief against the recommended reference change. Facilitator mode may rewind a level for discussion without changing the continuing budget.
3. **Hints have no score or budget penalty.** Record which hints were opened for the debrief. Penalizing investigation would work against the workshop's learning goal.
4. **Level 11 ends at partitioning and archiving in the core path.** Shard-key selection remains an optional senior extension and does not alter later levels.
5. **Level 12 remains one capstone with three failure waves.** Teams investigate dependency failure, overload/backlog, and zone/deployment failure before making one constrained multi-select decision.
6. **Keep euros, clearly labeled as scenario values.** Concrete recurring cost is easier to compare than abstract points, but the interface must say that values are not vendor quotes. Engineering effort remains a separate point budget.

Reviewers should explicitly accept or revise these six decisions before implementation approval.

Visible scoring is **off by default** in the facilitator-led workshop. When enabled for self-guided practice, it is labeled “team reasoning review,” never individual performance, and has no leaderboard.

## Scope boundary

This review version specifies a client-only simulation:

- No application database
- No user accounts or login
- No real infrastructure provisioning
- No real load generation
- No synchronized multiplayer state
- No AI grading

All level data will be static, all metric motion will be simulated, and optional progress will be stored only in the current browser.

## Implementation approval record

The repository owner explicitly approved implementation after the persona review. The current application is a pilot implementation, not evidence that every acceptance criterion or content-authoring cell is complete.

Remaining open content—especially authored traffic presets, complete option-specific outcomes, glossary coverage, facilitator run cards, and Level 12 combination results—must stay visible in review rather than being treated as complete by implication.

## Review record

The draft was reviewed from three independent perspectives:

- Participant engineer, considering both junior and senior use
- Workshop facilitator operating one shared browser for 12 engineers
- Learning-experience and accessibility reviewer

Their accepted findings are incorporated in this revision. The core purpose remains unchanged: diagnose from evidence, select the smallest sufficient intervention, explain the trade-off, verify the outcome, and expose the next complexity.
