# Product specification

## 1. Product summary

ScaleShop Scalability Lab is a browser-based, facilitator-led engineering workshop. Twelve engineers progressively scale a fictional e-commerce system through 12 incidents. At every level they inspect evidence, identify the bottleneck, choose the smallest sufficient intervention, explain their reasoning, and observe both the improvement and the new failure mode introduced.

The lab teaches a decision process, not a list of technologies:

> Pressure → symptom → evidence → bottleneck → smallest sufficient change → verification → new trade-off

The application must be understandable without slides and usable by engineers ranging from junior to senior.

## 2. Goals

1. Make every incident solvable from evidence contained in the product.
2. Keep the answer non-obvious: plausible alternatives must address a real part of the problem but differ in fit, cost, risk, or timing.
3. Require reasoning before revealing the result.
4. Show the system’s architecture at the top of every level using one consistent visual grammar.
5. Show only metrics that help diagnose that level, with stable definitions and credible relationships.
6. Explain why the selected scalability technique fits, what it does not solve, and which new risk it introduces.
7. Support a three-hour online session without requiring accounts, a database, or participant setup.
8. Give juniors enough context and definitions while giving seniors meaningful trade-offs and stretch questions.

## 3. Non-goals

- Teaching the operational syntax of Redis, PostgreSQL, Kafka, Kubernetes, or a cloud provider
- Accurately benchmarking a real production stack
- Provisioning or controlling real infrastructure
- Replacing a load-testing or observability platform
- Real-time multi-user collaboration or voting
- Security-gating facilitator answers
- Selecting one universally “correct” architecture

The displayed values are internally consistent workshop scenarios, not capacity promises.

### 3.1 Reference prototype findings

The published prototype was reviewed as a product reference only; no source or assets are copied.

Preserve these useful interaction ideas:

- Compact simulated-environment status and clear level identity
- A pause control for discussion
- Evidence cards that reveal observations in place
- Before/after comparison
- Fullscreen presentation mode
- An at-a-glance 12-level journey and visible team resources

Improve these observed limitations in the clean version:

- Replace the large persistent level sidebar with a compact progress control so architecture and incident dominate the first viewport.
- Replace the arbitrary percentage traffic slider with named, reproducible presets.
- Use journey-specific and level-specific metrics instead of repeating one generic six-card set.
- Offer five comparable options in standard levels, with mechanism, both cost dimensions, lead time, and reversibility.
- Require diagnosis and reasoning before an option can be committed.
- Replace the global “show answers” affordance with an explicit facilitator mode and unmistakable mode banner.
- Do not mark skipped levels complete merely because the facilitator navigated to them.
- Expand the one-line result into option-specific consequences, official reasoning, fit boundary, new risk, and verification criteria.
- Put the consistent current/evolved architecture diagram above the incident rather than omitting topology.

## 4. Users and modes

### 4.0 Canonical operating model

The primary experience is one facilitator-operated browser shared with 12 engineers, organized as three squads of four. Each squad rotates the roles of investigator, SLO/constraint guardian, challenger, and cost-and-risk spokesperson every two levels. Every investigation begins with 30–60 seconds of silent review, followed by squad discussion and one evidence-backed position per squad. The facilitator explicitly invites dissent before committing the group decision.

Meeting chat or polls may collect opinions, but they are optional and never authoritative application state. Roles rotate independently of seniority so the fastest or most senior voice does not dominate.

The same interface also supports self-guided individual practice. In that case, “facilitator allows it” means the local session has completed the debrief and enabled the next level.

### 4.1 Participant mode

Participant mode is the default. It exposes all information required to solve the incident but hides the official diagnosis and outcome until a decision is submitted.

Participants can:

- Inspect the current architecture
- Read the incident, SLOs, constraints, and traffic mix
- Reveal evidence items in any order
- Open metric definitions and component explanations
- Compare five candidate changes
- Write a short reasoning chain
- Submit a decision
- Review why their choice helps or fails
- Continue after the shared facilitator advances, or after the local debrief in self-guided use

### 4.2 Facilitator mode

Facilitator mode is available through an explicit local toggle or a separate `/facilitator` route. It is not protected because login is out of scope.

It adds:

- Correct diagnosis and evidence map
- Recommended reveal order
- Talking points and misconception warnings
- Full rationale for every option
- Level timer and pause control
- Before/after controls
- “Reveal hint,” “reveal answer,” and “advance level” actions
- Suggested junior and senior follow-up questions
- Reset of the local workshop session

It does not synchronize other browsers. For the first version, the facilitator should screen-share the lab or use the meeting platform’s polls.

Facilitator mode has two surfaces:

- **Presenter-safe controls:** timer, pause, hints, evidence reveal, traffic presets, commit, replay, and advance. These are safe to screen-share and never expose spoilers by entering the mode.
- **Spoiler content:** diagnosis, option evaluation, misconception notes, and debrief script. Each section remains collapsed until an explicit reveal. “Reveal answer” requires confirmation and names the level being revealed.

A persistent banner states `PRESENTER SAFE` or `ANSWERS VISIBLE`. Controls must remain usable without exposing private preparation notes.

### 4.3 First-run orientation

Before Level 1, a 60-second orientation explains the loop well enough for a participant to repeat it. A separate skippable, unscored sample interaction then provides 8–9 minutes of practice within the ten-minute orientation block:

1. Reveal one evidence item.
2. Read an observed value against a threshold.
3. Select a provisional bottleneck and cite evidence.
4. Inspect an option and open a free hint.
5. Predict one improvement and one trade-off.
6. See the difference between a team experiment and the canonical architecture that continues.

The persistent compact instruction is: `Inspect evidence → diagnose → cite two signals → compare changes → predict impact → commit once.` If saved state exists, orientation first offers `Resume workshop` and `Start fresh`.

## 5. Experience principles

### 5.1 Complete information, progressive disclosure

The lab must never depend on hidden facts. All decisive evidence exists in one of three layers:

1. **Situation:** workload, user-visible symptoms, SLO, business invariant, and constraints.
2. **Telemetry:** a small default metric set showing rate, latency, errors, and saturation.
3. **Evidence:** traces, query summaries, dependency timings, queue state, cost, or architecture details revealed on demand.

Participants are challenged by selecting and interpreting evidence, not by guessing facts the application withheld.

### 5.2 No trick answers

Each level has a “best next change” under explicit constraints. Other choices are plausible but are one of:

- A temporary capacity purchase
- A partial fix
- A solution aimed at the wrong bottleneck
- A correct pattern applied too early
- A risky shortcut that violates an invariant

No distractor should be absurd, and the recommended option must not be obviously longer or more detailed than every alternative.

Option order must not reveal correctness. Options have stable IDs, but participant mode uses a deterministic per-level display order that is independent of the recommended ID. Across the workshop, the recommended option must be balanced across card positions. Facilitator notes refer to option IDs and titles, never ordinal position.

### 5.3 Reasoning before correctness

The provisional bottleneck and cited evidence carry into the decision summary; participants do not re-enter them. Before commit, they may revise those selections and add three concise items:

1. Why is this the smallest sufficient change?
2. What should improve, and what should remain unchanged?
3. What important new risk will it introduce?

The application does not use AI grading. It applies a deterministic rubric to structured choices and then shows the official reasoning for comparison.

Automatic scoring uses only the selected bottleneck hypothesis, two selected evidence IDs, and the chosen intervention. Free-text fit and risk explanations are never keyword-scored. After reveal, the team uses an explicit self-assessment checklist for those dimensions; facilitator mode can record the agreed score locally.

### 5.4 Same system, visible evolution

The architecture diagram always occupies the first content region. Unchanged components remain in stable positions. New components appear only after the answer is revealed, and the next level begins with that topology as its current setup.

### 5.5 Cost is part of correctness

Every option shows two comparable costs:

- Monthly infrastructure cost
- Engineering effort points

The best decision is not always the most powerful design. It is the least costly intervention that restores the SLO while preserving required invariants and enough headroom for the stated traffic.

To keep the 12-level story coherent, a participant's selected option is treated as a reversible experiment. After its consequence is explained, the result separates three concepts:

- `Your experiment would cost` — the selected option's counterfactual recurring and engineering delta
- `Canonical next change` — the workshop change adopted after debrief
- `Canonical architecture allowance` — the recurring-cost and engineering ledger that continues

Only an explicit `Adopt canonical change and continue` action updates the architecture and ledger. Preview, navigation, replay, rewind, and wrong experiments never update them silently.

## 6. Primary workshop loop

Each standard level follows the same state machine:

1. **Briefing** — show current architecture, incident, SLO, workload, and constraints.
2. **Investigate** — show live-looking core metrics; teams request or reveal evidence.
3. **Diagnose** — teams enter the suspected bottleneck and cite evidence.
4. **Decide** — compare five changes and select one.
5. **Reason** — review the carried-forward diagnosis and evidence, then complete fit, prediction, and risk.
6. **Commit** — lock the answer for this attempt.
7. **Consequence** — animate metric movement and explain what the selected option would do.
8. **Debrief** — show official diagnosis, recommended change, why alternatives are weaker, and the new risk.
9. **Evolve** — update the architecture diagram and move to the next incident.

Levels 11 and 12 use modified decision formats described in `level-specs.md`.

A committed decision is not retried in the normal flow. Before commit, the team can review and edit everything and must confirm `Submit team experiment`. Its consequence is shown immediately, including any metric it improves and any invariant it harms. The team may revise its written reasoning after debrief for its decision journal, but that is not another scored attempt.

Facilitator mode provides separate `Replay consequence`, `Reset current level`, `Rewind to briefing`, and confirmed `Reset whole workshop` actions. Rewind restores the start-of-level state; it never changes prior canonical progression. Accidental answer reveal can be hidden again but is recorded in the local facilitation timeline.

### 6.1 Three-hour pacing

The exact 180-minute run sheet, fast paths, role rotation, warnings, and overrun policy are defined in `facilitator-spec.md`. The timer is guidance, not an automatic navigation deadline. Pause stops metric motion and the facilitation timer; it never changes authored scenario state.

## 7. Page information architecture

The level page is one continuous, responsive page in this order:

### 7.1 Workshop header

- ScaleShop name
- Current level and neutral participant title; the technique title appears only after debrief reveal
- Progress: `Level 4 of 12`
- Mode indicator: Participant or Facilitator
- Remaining canonical recurring-cost allowance and engineering points
- Level 12 resilience points and selection slots while the capstone decision is active
- Fullscreen control
- Compact level picker; opening or previewing a level does not mark it complete

Avoid a large generic navigation sidebar. The diagram and incident should dominate the first viewport.

Participant and facilitator modes use different persistent labels, not only a button whose text changes. Entering facilitator mode may require a local confirmation to prevent accidental answer exposure during screen sharing; this is a usability guard, not authentication.

Sticky phase anchors provide one-click focus views for `Architecture`, `Evidence`, `Decision`, and `Debrief`, plus a presenter-safe `Next facilitation step` control. Fullscreen preserves these controls; browser zoom is never required for navigation.

### 7.2 Current architecture

- Fixed-layout diagram defined in `architecture-spec.md`
- “Current setup” label
- Workload paths and dependency boundaries
- Optional metric overlays after evidence is revealed
- A compact legend that stays identical across levels

The solution component must not appear before decision reveal.

### 7.3 Incident briefing

- What changed
- What users report
- Workload mix
- Current SLO or invariant at risk
- Constraints such as freshness, consistency, or budget

### 7.4 Core telemetry

Show three or four core metrics initially and at most six after deliberate expansion. Values use deterministic animation around a stable baseline. A threshold line or SLO state communicates whether each signal is healthy. Evidence and advanced metrics remain available without crowding the shared-screen view.

### 7.5 Evidence desk

Evidence is grouped by source, not by answer:

- Application
- Database
- Cache or queue
- External dependency
- Business correctness
- Cost and capacity

Each evidence item has:

- A clear label such as “Checkout trace”
- The observed value
- A neutral explanation of what it measures and what high or low values generally imply
- A metric-definition tooltip for juniors

Incident-specific causal interpretation appears only in facilitator spoiler content and the debrief. The evidence drawer records what the team inspected but does not score them for asking. Teams may inspect as many items as useful, then nominate the two most decisive items separately.

Before option cards are enabled, the team selects a provisional bottleneck and two revealed evidence items. This keeps diagnosis ahead of technology selection while still allowing the team to revise those selections in the decision summary before commit.

### 7.6 Decision area

Five option cards use identical structure:

- Short, neutral action title of comparable length
- Consistently structured mechanism and safeguard row
- Expected time to implement
- Infrastructure cost
- Engineering points
- Reversibility: easy, moderate, or hard

Cards do not display “recommended,” risk severity, or expected performance before submission.

Within each level, editorial review compares title length, safeguard count, specificity, and tone. The recommended option cannot be the only card that sounds production-ready or contains operational safeguards.

### 7.7 Reasoning form

The decision summary carries forward the provisional diagnosis and cited evidence, allows revision, and asks only for fit, predicted metric movement, and new risk. It includes an optional two-stage hint:

- Hint 1 points to the right evidence category.
- Hint 2 names the diagnostic relationship without naming the technology.

Hints do not reduce score or budget. Their use appears only as positively framed investigation history in presenter-safe mode and is never used to compare participants.

### 7.8 Result and explanation

After submission, show a neutral outcome classification:

- `Restores all constraints`
- `Restores the SLO with excess cost or complexity`
- `Addresses one symptom`
- `Breaks a stated invariant`

Then show:

- Effect on each relevant metric
- Explanation tied to the submitted option
- Official reasoning chain
- Why the technique fits this workload
- When not to use it
- New operational or correctness risk
- Verification criteria
- Updated architecture

Wrong answers should teach, not merely reject.

## 8. Decision scoring

Visible scoring is off by default for facilitator-led workshops. It may be enabled before Level 1 for self-guided practice and is labeled `Team reasoning review`, never individual performance. It cannot be enabled mid-session and there is no leaderboard. When enabled, it totals 100 points:

| Dimension | Points | Rule |
|---|---:|---|
| Diagnosis | 25 | Automatic from the structured bottleneck selection |
| Evidence | 25 | Automatic from two selected evidence IDs; partial credit is defined in level data |
| Intervention fit | 25 | Automatic from the option outcome classification and invariant checks |
| Cost and simplicity | 15 | Automatic from the option's fit, recurring cost, effort, and simpler viable alternatives |
| New-risk awareness | 10 | Team self-assessment after reveal; facilitator may confirm locally |

The free-text explanation is shown beside the official reasoning but is not machine-graded. In facilitated mode the same rubric is a private debrief checklist, not a public score. No cross-user score persistence is required.

## 9. Junior and senior support

### For junior engineers

- A per-level terminology inventory using plain language first and the industry term second
- “Healthy range” context where it is meaningful
- Traces and flows broken into labeled stages
- Hints based on investigation direction
- Explanation of why a tempting option fails

At minimum, authored definitions cover RED, USE, SLO, error budget, cardinality, N+1, TTL, outbox, poison job, TTFB, cache key and `Vary`, read-your-own-write, OLTP, IOPS, partition pruning, shard skew, bulkhead, backpressure, idempotency, and canary rollback. Definitions are contextual, keyboard/touch accessible, and remain available after reveal.

### For senior engineers

- Explicit consistency, cost, blast-radius, and operability constraints
- Alternatives that are technically valid but mistimed
- Stretch prompt after each level, such as “At what threshold would the rejected option become justified?”
- Ability to inspect p99, skew, lag, retry, and saturation details beyond the default metrics

## 10. Data and technical scope

The product is a deterministic client-side simulation.

### 10.1 Static content model

Each level is defined as data containing:

- `participantTitle` that does not name the solution and `techniqueTitle` revealed only in debrief
- Architecture state before, after, and accessible delta
- Incident, constraints, SLOs, invariants, and decision-driving thresholds
- Three to five bottleneck hypotheses with stable IDs and partial-credit mapping
- Metrics tagged `core`, `evidence`, or `advanced`, with all four preset center values and time-series seeds
- Evidence with stable IDs, source, diagnostic role (`decisive`, `supporting`, or `context`), rubric weight, neutral participant explanation, and facilitator interpretation
- Two exact hints that point toward diagnosis without naming the technology
- Five standard options with stable IDs, display-order seed, neutral title, mechanism, safeguards, recurring cost, engineering effort, lead-time band, explicit reversibility, and outcome classification
- A deterministic before/after metric and invariant consequence for every option, including unaffected values
- Official reasoning, fit boundary, new risk, verification plan, and threshold that would make at least one rejected option appropriate
- Facilitator run card: target minutes, opening prompt, reveal ladder, fast path, misconceptions, junior/senior prompts, inclusion prompt, debrief, and transition
- Per-level terminology inventory and senior stretch prompt

Content must not be scattered through UI components.

### 10.1.1 Content-authoring gate

The product specification is not implementation-ready until every field above is populated for all 12 levels and cross-checked against `metrics-spec.md`, `architecture-spec.md`, and `facilitator-spec.md`. Prose option outcomes in `level-specs.md` are editorial summaries, not substitutes for numeric option-specific outcome records.

Before approval, a content-readiness matrix must show no missing cells for:

| Required content | Current draft status | Approval condition |
|---|---|---|
| Neutral and revealed titles | Authored | Review all titles for answer leakage |
| Hypotheses and rubric mappings | Authored | Validate partial-credit labels per level |
| Evidence IDs, roles, and weights | Authored | Confirm UI never exposes diagnostic role |
| Exact hints | Authored in `facilitator-spec.md` | Usability-test that hints do not name technology |
| Option metadata | **Open** | Author explicit neutral title, safeguards, lead time, and reversibility for every option |
| Four preset metric states | **Open** | Author Normal, Campaign, Peak, and Incident center values for every displayed metric |
| Every option's consequence matrix | **Open** | Author affected, unaffected, SLO, invariant, and cost outcomes for every option |
| Glossary inventory | **Open** | Author contextual terms for every level |
| Facilitator run card | **Partial** | Add per-level target allocation, normal reveal ladder, inclusion prompt, debrief script, and strongest-alternative threshold; then dry-run timings |
| Level 12 combination outcomes | **Partial** | Finalize aggregation/conflict rules and numeric outcome state for every valid action set |

Implementation must not infer or generate a missing cell.

### 10.2 Local state only

Browser storage may remember:

- Current level
- Revealed evidence
- Submitted answers
- Remaining canonical recurring-cost allowance and engineering points
- Display preferences
- Decision journal entries containing team reasoning but no participant names

The interface shows `Saved locally` or `Not saved` status. When prior state exists, it offers resume or start fresh. It provides reset-current-level and separately confirmed reset-workshop actions. When storage is unavailable, the workshop continues and shows a non-blocking notice. No names, individual scores, or personal or sensitive data are collected.

The locally printable decision journal records diagnosis, cited evidence, predicted metric movement, chosen intervention, revealed trade-off, and verification plan. The final prompt asks participants to map one decision to their own system and name the evidence threshold that would justify it.

### 10.3 Deterministic metric engine

Metric motion is generated from a seeded function so that:

- The same level and traffic setting yields the same pattern.
- Before/after comparisons are stable.
- Values do not drift into contradictions.
- Reduced-motion users can see static representative values.

Traffic controls select named presets rather than arbitrary unrealistic values: Normal, Campaign, Peak, and Incident.

Level 1 starts with the healthy launch baseline because the absence of an operating contract is the challenge. Levels 2–12 start at Incident. The facilitator may move to lower presets to test whether a diagnosis still fits.

## 11. Accessibility and usability requirements

Target WCAG 2.2 AA for the complete workshop flow.

- Complete a full level using keyboard only; all decisions use native radio or checkbox semantics.
- Provide logical landmarks and headings plus a skip link to the current task.
- Keep visible focus; drawers return focus predictably and dynamic updates never lose it.
- Tooltips work by focus, click, and touch, dismiss with Escape, and never require hover.
- Validation errors are associated with fields and summarized at the reasoning-form heading.
- After commit, move focus to the result heading; announce one concise outcome summary.
- Never announce metric jitter through live regions.
- Meaning never depends on color, position, animation, or icon alone.
- Provide a persistent `Pause motion` setting in addition to `prefers-reduced-motion`, plus `Show final state now` for transitions.
- Charts remain supplementary to an accessible before/after table containing value, unit, threshold state, absolute change, and direction.
- Diagram alternatives include current nodes, ordered flows, ownership, source of truth, consistency expectation, unavailable/degraded state, stressed evidence, and exact evolved delta.
- Support 200% zoom and 400% reflow without loss of content or function.
- Verify forced-colors/high-contrast mode and visible focus in both light and dark themes.
- Use pointer targets of at least 44×44 CSS pixels.
- Responsive behavior starts at 320 px, using structured architecture lane cards rather than shrinking the full topology.
- Presentation mode uses at least 18 px equivalent body text and 20 px diagram labels at 1080p; browser zoom is not required.
- No internal horizontal scrolling for the main workshop flow.
- Fullscreen preserves access to level, incident, metrics, evidence, decisions, pause, and facilitation controls.
- Run VoiceOver and NVDA smoke tests before acceptance.

## 12. Acceptance criteria

The specification is implemented successfully when:

1. A new participant can explain what to do within 60 seconds without verbal instruction.
2. Every level can be solved using evidence visible in the product.
3. Every standard level and Level 11 Phase A offer five plausible choices with comparable cost and effort information; Level 12 provides the specified constrained action set.
4. Every option has an outcome-specific rationale.
5. The recommended option is the smallest change that restores the stated SLO under the stated constraints.
6. The architecture diagram remains visually stable and adds only the relevant delta at each level.
7. Metric values preserve causal consistency before and after every decision.
8. Participant mode reveals no official answer before submission.
9. Facilitator mode contains a complete debrief without requiring separate notes.
10. The complete workshop works without a database, login, network API, or real infrastructure.
11. Refreshing the page does not corrupt the local session, and reset restores the initial state.
12. The application contains no implementation of unapproved features beyond this specification.
13. A correct answer cannot be inferred from card length, wording detail, cost formatting, or repeated position.
14. Free text is never presented as automatically understood or objectively graded.
15. A facilitator can run the complete workshop from one shared browser without implying multiplayer synchronization.
16. Neutral participant titles and evidence wording do not name the technique before debrief.
17. Moderated validation includes at least one junior, one mid-level, one senior, one keyboard-only user, and one screen-reader user.
18. Test participants can distinguish offered load from completed work, interpret an architecture delta, find a term definition, and explain why one alternative is mistimed.
19. Every content-authoring-gate cell is complete; implementation contains no invented workshop content.
