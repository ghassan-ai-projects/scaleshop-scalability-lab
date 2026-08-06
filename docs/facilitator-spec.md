# Facilitator and workshop-operation specification

Status: **persona-reviewed draft; content IDs must be finalized before implementation**.

## 1. Operating contract for 12 engineers

The canonical session uses one shared browser and three squads of four. Each squad rotates these roles every two levels:

1. **Investigator** — nominates evidence to open.
2. **SLO and constraint guardian** — checks targets, freshness, correctness, and scope.
3. **Challenger** — argues for the strongest alternative and identifies missing evidence.
4. **Cost-and-risk spokesperson** — reports the squad's decision, cost trade-off, and introduced risk.

No role is permanently assigned by seniority. Every level begins with 30–60 seconds of silent evidence review. Squads then discuss before any open-floor debate. Meeting chat or polls are optional collection tools, not product state.

The facilitator asks before commit:

> What evidence would change our mind? Does a squad or quieter voice see a violated constraint?

Hints are available without justification or penalty.

## 2. Exact 180-minute run sheet

| Time | Activity | Minutes | Cumulative |
|---|---|---:|---:|
| 00:00 | Orientation and sample incident | 10 | 10 |
| 00:10 | Level 1 | 8 | 18 |
| 00:18 | Level 2 | 10 | 28 |
| 00:28 | Level 3 | 10 | 38 |
| 00:38 | Level 4 | 11 | 49 |
| 00:49 | Level 5 | 11 | 60 |
| 01:00 | Level 6 | 10 | 70 |
| 01:10 | Midpoint break | 10 | 80 |
| 01:20 | Level 7 | 11 | 91 |
| 01:31 | Level 8 | 12 | 103 |
| 01:43 | Level 9 | 12 | 115 |
| 01:55 | Level 10 | 14 | 129 |
| 02:09 | Level 11 core path | 13 | 142 |
| 02:22 | Level 12 capstone | 23 | 165 |
| 02:45 | Retrospective and transfer prompt | 15 | 180 |

The optional Level 11 sharding extension takes 8 additional minutes and is excluded from the canonical three-hour run. Use it only by shortening earlier stretch discussions or scheduling extra time.

At two minutes remaining, show a soft warning. The fast path reveals only the run card's decisive evidence, takes one squad report, commits, and preserves the debrief. Never skip the debrief to recover time.

## 3. Standard facilitation cadence

1. **Brief — 45 seconds:** read the incident, target, invariant, and neutral participant title.
2. **Silent inspect — 30–60 seconds:** participants read core metrics before discussion.
3. **Investigate — 2–3 minutes:** squads request evidence; facilitator opens nominated items.
4. **Diagnose — 2 minutes:** each squad selects a hypothesis and two decisive evidence items.
5. **Challenge — 1–2 minutes:** strongest alternative and disconfirming evidence.
6. **Decide — 1 minute:** compare cost, lead time, reversibility, and safeguards.
7. **Commit — 30 seconds:** invite dissent, review summary, confirm team experiment.
8. **Consequence and debrief — 2–3 minutes:** compare team experiment with canonical change, fit boundary, risk, verification, and next incident.

Pause stops metric motion and the facilitation timer only. It never changes traffic preset, evidence, answer, score, budget, or architecture state.

## 4. Presenter-safe controls and recovery

- Entering facilitator mode exposes no answer.
- Spoiler panels are collapsed and omitted from the accessibility tree until explicitly opened.
- `Reveal hint 1`, `Reveal hint 2`, and `Reveal answer` name the current level; answer reveal requires confirmation.
- `Submit team experiment` is separate from `Adopt canonical change and continue`.
- `Replay consequence` repeats animation or jumps directly to final values without changing state.
- `Rewind to briefing` restores the current level's inherited canonical state.
- `Reset current level` and `Reset whole workshop` are separate; whole-workshop reset requires confirmation.
- Navigation or preview never marks a level complete or changes a ledger.
- Level 11 Phase B shows `TWO YEARS LATER — NON-SCORED PROJECTION`; `Exit extension` restores the partitioned canonical topology before Level 12.

## 5. Per-level run cards

Evidence IDs refer to `level-specs.md`. Diagnostic roles and exact hints are facilitator content and are never participant labels.

### Level 1 — Unknown capacity

- **Opening:** “What would make a capacity claim credible rather than confident-sounding?”
- **Fast path:** `L1-E1`, `L1-E2`, then the stepped-test result after commit.
- **Hint 1:** “Look for what is missing, not which resource is hot.”
- **Hint 2:** “A capacity claim needs a journey target and a representative test that stops at the first boundary.”
- **Misconception response:** Buying capacity or quoting one average does not define acceptable service.
- **Junior / senior:** “Which journey needs the strictest target?” / “How would workload mix and test duration change the envelope?”
- **Transition:** The representative test exposes database work at campaign load, leading to Level 2.

### Level 2 — The campaign slowdown

- **Opening:** “Where is time spent, and how much work happens per request?”
- **Fast path:** `L2-E1`, `L2-E2`, `L2-E3`.
- **Hint 1:** “Inspect the database portion of one catalogue trace.”
- **Hint 2:** “Compare work per request with resource saturation before buying capacity.”
- **Misconception response:** More app handlers increase pressure on an already saturated database.
- **Junior / senior:** “Why are 483 queries different from 483 rows?” / “When is vertical scaling still rational incident containment?”
- **Transition:** Efficient queries expose a later workload dominated by repeated reads.

### Level 3 — The viral product

- **Opening:** “Which evidence distinguishes repeated work from unavoidable work?”
- **Fast path:** `L3-E2`, `L3-E3`, `L3-E5`.
- **Hint 1:** “Compare key repetition with how often the underlying data changes.”
- **Hint 2:** “A bounded-stale copy is useful only if the source remains authoritative and failure has a safe path.”
- **Misconception response:** A replica adds capacity but still performs every repeated read.
- **Junior / senior:** “Which fields may be stale?” / “How do invalidation and request coalescing fail differently?”
- **Transition:** Faster reads leave slow checkout side effects visible.

### Level 4 — Checkout waits on side effects

- **Opening:** “What must finish before ‘confirmed’ is truthful?”
- **Fast path:** `L4-E2`, `L4-E3`, `L4-E4`.
- **Hint 1:** “Break the checkout trace into required and deferrable stages.”
- **Hint 2:** “The hard part is preserving committed work across the database-to-job handoff.”
- **Misconception response:** Asynchrony without durable handoff only moves the failure window.
- **Junior / senior:** “Which actions may happen later?” / “Where exactly is the atomic boundary?”
- **Transition:** Workers help latency; the next ceiling is one stateful app instance.

### Level 5 — One instance at the limit

- **Opening:** “What prevents a second instance from being disposable?”
- **Fast path:** `L5-E1`, `L5-E2`, `L5-E5`.
- **Hint 1:** “Look at application queueing and where sessions and files live.”
- **Hint 2:** “Horizontal capacity is safe only when any healthy instance can serve the next request.”
- **Misconception response:** Sticky sessions preserve hidden failure and deployment coupling.
- **Junior / senior:** “What state must move?” / “How do autoscaling and database connection limits interact?”
- **Transition:** A healthy origin still serves distant public bytes inefficiently.

### Level 6 — Slow far from home

- **Opening:** “Is the time spent computing, storing, or travelling?”
- **Fast path:** `L6-E1`, `L6-E2`, `L6-E5`.
- **Hint 1:** “Compare payload bytes and latency by geography with origin utilization.”
- **Hint 2:** “Repeated public, versioned content can avoid both the origin and the long round trip.”
- **Misconception response:** Origin cache or more regional app fleets do not remove every geographic data call.
- **Junior / senior:** “Which routes are public?” / “Which cache-key fields prevent leaks without exploding cardinality?”
- **Transition:** Edge offload leaves eligible reads and reporting on the primary.

### Level 7 — The overloaded primary

- **Opening:** “Which work can move without breaking immediate visibility?”
- **Fast path:** `L7-E1`, `L7-E2`, `L7-E4`.
- **Hint 1:** “Separate reads from writes, then classify reads by freshness.”
- **Hint 2:** “Move only reads that tolerate lag; preserve post-write reads on the source.”
- **Misconception response:** Replicas do not increase write throughput and lag is a correctness condition, not just a metric.
- **Junior / senior:** “Why might an order disappear briefly?” / “How can stickiness use a replication position instead of time?”
- **Transition:** Multi-year reports outgrow an OLTP-shaped replica.

### Level 8 — Reports overwhelm operations

- **Opening:** “Does this workload need a different server, or a different data model?”
- **Fast path:** `L8-E1`, `L8-E2`, `L8-E3`.
- **Hint 1:** “Compare report shape and freshness with transactional access patterns.”
- **Hint 2:** “A five-minute freshness allowance permits an independently optimized analytical model.”
- **Misconception response:** A separate service on the same storage is not workload isolation.
- **Junior / senior:** “Why can stale analytics be correct?” / “How do corrections, deletion, and reconciliation propagate?”
- **Transition:** Catalogue and checkout now differ in traffic, release, and failure profiles.

### Level 9 — One fleet, two workloads

- **Opening:** “Which measured differences justify a deployment boundary?”
- **Fast path:** `L9-E1`, `L9-E2`, `L9-E4`.
- **Hint 1:** “Compare scaling need, release cadence, and blast radius.”
- **Hint 2:** “A useful boundary changes independent capacity and failure, not only repository structure.”
- **Misconception response:** More services are not more scalable when ownership and synchronous coupling remain shared.
- **Junior / senior:** “What can deploy independently?” / “Which copied data remains derived, and who owns truth?”
- **Transition:** Independent checkout scaling increases concurrency against hot inventory.

### Level 10 — Five hundred units

- **Opening:** “What is useful throughput when only 500 successes are possible?”
- **Fast path:** `L10-E1`, `L10-E3`, `L10-E4`.
- **Hint 1:** “Prioritize inventory totals, duplicate behavior, and lock waiting over raw attempt RPS.”
- **Hint 2:** “Enforce the invariant at the source of truth, make retries repeatable, and bound admission.”
- **Misconception response:** More writers increase contention; a lock outside the source of truth cannot enforce the invariant alone.
- **Junior / senior:** “Why is rejection sometimes success?” / “How does payment race reservation expiry?”
- **Transition:** Correctness is restored, but years of order history enlarge the hot operational set.

### Level 11 — Four terabytes and growing

- **Opening:** “How much of the database must remain hot to meet operational objectives?”
- **Fast path:** `L11-E1`, `L11-E3`, `L11-E5`.
- **Hint 1:** “Compare active and historical data with the backup, maintenance, and write-headroom targets.”
- **Hint 2:** “Reduce the hot set before accepting distributed routing and cross-shard operations.”
- **Misconception response:** Sharding distributes data but does not repair an avoidably oversized hot set.
- **Junior / senior:** “What does partition pruning avoid?” / “Which observable threshold would justify Phase B?”
- **Transition:** The final topology now faces simultaneous dependency, overload, zone, and deployment failure.

### Level 12 — Everything fails at once

- **Opening:** “Which protections preserve confirmed orders, and which improve only non-critical availability?”
- **Fast path:** one decisive item per wave: `L12-E1`, `L12-E4`, `L12-E6`, plus `L12-E8`.
- **Hint 1:** “Choose one observation from each wave and rank checkout durability above email and analytics freshness.”
- **Hint 2:** “Contain amplification and shared resources, protect durable recovery, and stop harmful change; no budget covers every improvement.”
- **Misconception response:** Spending every point is not rewarded, and powerful multi-region designs may still be the wrong next move.
- **Junior / senior:** “Which features may degrade?” / “What risk remains deliberately uncovered by your set?”
- **Transition:** Use the decision journal for the final value, complexity, reversibility, and transfer retrospective.

## 6. Debrief requirements

Every debrief names:

- What the selected experiment genuinely improves
- Which SLO or invariant remains breached
- Its counterfactual recurring and engineering cost
- The canonical next change and why it is smaller or safer
- The new risk introduced
- A concrete verification test
- The measurable threshold or time horizon that would make the strongest rejected option reasonable

The result language is neutral: `Restores all constraints`, `Restores the SLO with excess cost or complexity`, `Addresses one symptom`, or `Breaks a stated invariant`.
