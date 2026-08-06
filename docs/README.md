# ScaleShop Scalability Lab — specification index

Status: **review draft; implementation is intentionally blocked until approval**.

This folder defines the next version of the ScaleShop Scalability Lab. It preserves the strongest parts of the original simulation—12 progressive incidents, animated metrics, evidence discovery, upgrade choices, facilitator answers, before/after comparison, and a team budget—while making the experience clearer, fairer, and more challenging.

## Documents

- [product-spec.md](product-spec.md) — product goals, users, workshop flow, information architecture, interaction model, facilitator experience, and acceptance criteria.
- [level-specs.md](level-specs.md) — the complete content model for all 12 levels: incidents, evidence, choices, expected reasoning, consequences, and learning objectives.
- [metrics-spec.md](metrics-spec.md) — metric vocabulary, credibility rules, scenario values, charts, thresholds, and simulation behavior.
- [architecture-spec.md](architecture-spec.md) — the consistent architecture-diagram language and the exact topology changes shown at every level.

## Recommended review baseline

The following product decisions are recommended for the first workshop. They remain reviewable and do not authorize implementation:

1. **Facilitator-led by default, self-guided as a secondary mode.** One shared browser is the canonical 12-person workshop setup. The local-only participant mode also supports individual practice.
2. **One committed attempt per level.** Reveal the selected option's consequence immediately, then debrief against the canonical change. Facilitator mode may rewind a level for discussion without changing the continuing budget.
3. **Hints have no score or budget penalty.** Record which hints were opened for the debrief. Penalizing investigation would work against the workshop's learning goal.
4. **Level 11 ends at partitioning and archiving in the core path.** Shard-key selection remains an optional senior extension and does not alter later levels.
5. **Level 12 remains one capstone with three failure waves.** Teams investigate dependency failure, overload/backlog, and zone/deployment failure before making one constrained multi-select decision.
6. **Keep euros, clearly labeled as scenario values.** Concrete recurring cost is easier to compare than abstract points, but the interface must say that values are not vendor quotes. Engineering effort remains a separate point budget.

Reviewers should explicitly accept or revise these six decisions before implementation approval.

## Scope boundary

This review version specifies a client-only simulation:

- No application database
- No user accounts or login
- No real infrastructure provisioning
- No real load generation
- No synchronized multiplayer state
- No AI grading

All level data will be static, all metric motion will be simulated, and optional progress will be stored only in the current browser.

## Implementation gate

No application code, scaffolding, dependency installation, or deployment should begin while this document says `review draft`. Approval must identify the accepted product decisions and change the status deliberately.
