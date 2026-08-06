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

The primary experience is one facilitator-operated browser shared with 12 engineers. Teams discuss in the meeting, nominate evidence to inspect, and commit one group decision. The lab does not imply synchronized voting or participant control that the client-only architecture cannot provide.

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

The decision form asks for four short items:

1. Where is the bottleneck?
2. Which two pieces of evidence support that diagnosis?
3. Why is this the smallest sufficient change?
4. What new risk will it introduce?

The application does not use AI grading. It applies a deterministic rubric to structured choices and then shows the official reasoning for comparison.

Automatic scoring uses only the selected bottleneck hypothesis, two selected evidence IDs, and the chosen intervention. Free-text fit and risk explanations are never keyword-scored. After reveal, the team uses an explicit self-assessment checklist for those dimensions; facilitator mode can record the agreed score locally.

### 5.4 Same system, visible evolution

The architecture diagram always occupies the first content region. Unchanged components remain in stable positions. New components appear only after the answer is revealed, and the next level begins with that topology as its current setup.

### 5.5 Cost is part of correctness

Every option shows two comparable costs:

- Monthly infrastructure cost
- Engineering effort points

The best decision is not always the most powerful design. It is the least costly intervention that restores the SLO while preserving required invariants and enough headroom for the stated traffic.

To keep the 12-level story coherent, a participant's selected option is treated as a reversible experiment. After its consequence is explained, the facilitator adopts the canonical recommended change for the next level. Only that canonical change affects the continuing budget and architecture.

## 6. Primary workshop loop

Each standard level follows the same state machine:

1. **Briefing** — show current architecture, incident, SLO, workload, and constraints.
2. **Investigate** — show live-looking core metrics; teams request or reveal evidence.
3. **Diagnose** — teams enter the suspected bottleneck and cite evidence.
4. **Decide** — compare five changes and select one.
5. **Reason** — complete the four-part reasoning chain.
6. **Commit** — lock the answer for this attempt.
7. **Consequence** — animate metric movement and explain what the selected option would do.
8. **Debrief** — show official diagnosis, recommended change, why alternatives are weaker, and the new risk.
9. **Evolve** — update the architecture diagram and move to the next incident.

Levels 11 and 12 use modified decision formats described in `level-specs.md`.

A committed decision is not retried in the normal flow. Its consequence is shown immediately, including any metric it improves and any invariant it harms. The canonical recommended change is then adopted for progression. Facilitator mode may rewind locally for teaching, but rewinding does not create a second scored attempt or alter the canonical budget.

### 6.1 Suggested three-hour pacing

- 10 minutes: orientation, operating contract, and interface walkthrough
- 8–10 minutes each: Levels 1–3
- 10–12 minutes each: Levels 4–10
- 12 minutes: Level 11 core exercise
- 20 minutes: Level 12 capstone
- 15 minutes: break and final retrospective buffer

The timer is guidance, not an automatic navigation deadline.

## 7. Page information architecture

The level page is one continuous, responsive page in this order:

### 7.1 Workshop header

- ScaleShop name
- Current level and title
- Progress: `Level 4 of 12`
- Mode indicator: Participant or Facilitator
- Remaining budget and engineering points
- Level 12 resilience points and selection slots while the capstone decision is active
- Fullscreen control
- Compact level picker; opening or previewing a level does not mark it complete

Avoid a large generic navigation sidebar. The diagram and incident should dominate the first viewport.

Participant and facilitator modes use different persistent labels, not only a button whose text changes. Entering facilitator mode may require a local confirmation to prevent accidental answer exposure during screen sharing; this is a usability guard, not authentication.

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

At most six primary metrics. Values use deterministic animation around a stable baseline. A threshold line or SLO state communicates whether each signal is healthy.

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
- A one-sentence “why this matters” explanation
- A metric-definition tooltip for juniors

The evidence drawer records what the team inspected but does not score them for asking.

Before option cards are enabled, the team selects a provisional bottleneck and two revealed evidence items. This keeps diagnosis ahead of technology selection while still allowing the team to revise its reasoning before commit.

### 7.6 Decision area

Five option cards use identical structure:

- Action title
- One-sentence mechanism
- Expected time to implement
- Infrastructure cost
- Engineering points
- Reversibility: easy, moderate, or hard

Cards do not display “recommended,” risk severity, or expected performance before submission.

### 7.7 Reasoning form

The form requires concise entries and allows discussion before submission. It includes an optional two-stage hint:

- Hint 1 points to the right evidence category.
- Hint 2 names the diagnostic relationship without naming the technology.

Hints do not reduce score or budget in the recommended first-workshop configuration. The debrief shows which hints were used so the facilitator can discuss the investigation path without discouraging help-seeking.

### 7.8 Result and explanation

After submission, show:

- “Best next change,” “viable but inefficient,” “partial,” or “unsafe” classification
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

Scoring is optional but, if enabled, totals 100 points:

| Dimension | Points | Rule |
|---|---:|---|
| Diagnosis | 25 | Automatic from the structured bottleneck selection |
| Evidence | 25 | Automatic from two selected evidence IDs; partial credit is defined in level data |
| Intervention fit | 25 | Automatic from the option outcome classification and invariant checks |
| Cost and simplicity | 15 | Automatic from the option's fit, recurring cost, effort, and simpler viable alternatives |
| New-risk awareness | 10 | Team self-assessment after reveal; facilitator may confirm locally |

The free-text explanation is shown beside the official reasoning but is not machine-graded. The interface should emphasize discussion over leaderboard competition. No cross-user score persistence is required.

## 9. Junior and senior support

### For junior engineers

- Plain-language definitions for p95, saturation, replication lag, idempotency, and backpressure
- “Healthy range” context where it is meaningful
- Traces and flows broken into labeled stages
- Hints based on investigation direction
- Explanation of why a tempting option fails

### For senior engineers

- Explicit consistency, cost, blast-radius, and operability constraints
- Alternatives that are technically valid but mistimed
- Stretch prompt after each level, such as “At what threshold would the rejected option become justified?”
- Ability to inspect p99, skew, lag, retry, and saturation details beyond the default metrics

## 10. Data and technical scope

The product is a deterministic client-side simulation.

### 10.1 Static content model

Each level is defined as data containing:

- Architecture state before and after
- Incident and constraints
- SLOs and invariants
- Metric definitions and time-series seeds
- Evidence items
- Options and option-specific outcomes
- Stable option IDs, display-order seed, lead-time band, recurring cost, engineering effort, and reversibility
- Structured bottleneck hypotheses and evidence IDs used by the deterministic rubric
- Official reasoning
- Hints
- Facilitator notes
- Junior glossary entries
- Senior stretch prompt

Content must not be scattered through UI components.

### 10.2 Local state only

Browser storage may remember:

- Current level
- Revealed evidence
- Submitted answers
- Remaining local budget
- Display preferences

It must offer a visible reset. The core experience works when storage is unavailable. No personal or sensitive data is collected.

### 10.3 Deterministic metric engine

Metric motion is generated from a seeded function so that:

- The same level and traffic setting yields the same pattern.
- Before/after comparisons are stable.
- Values do not drift into contradictions.
- Reduced-motion users can see static representative values.

Traffic controls select named presets rather than arbitrary unrealistic values: Normal, Campaign, Peak, and Incident.

Level 1 starts with the healthy launch baseline because the absence of an operating contract is the challenge. Levels 2–12 start at Incident. The facilitator may move to lower presets to test whether a diagnosis still fits.

## 11. Accessibility and usability requirements

- Full keyboard operation with native controls
- Visible focus states
- Meaning never depends on color alone
- Diagram has a text alternative listing nodes and flows
- Charts include units, thresholds, and accessible summaries
- No essential information exists only in animation or hover
- Motion respects `prefers-reduced-motion`
- Responsive from 320 px upward, optimized for a shared 16:9 desktop screen
- Minimum body text equivalent to 16 px on desktop presentation
- No internal horizontal scrolling for the main workshop flow
- Fullscreen mode preserves access to level, incident, metrics, evidence, and decisions

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
