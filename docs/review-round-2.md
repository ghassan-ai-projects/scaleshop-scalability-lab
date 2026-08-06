# Staff+ review round 2 — product and operating model

Status: **open acceptance backlog**

This review follows the metric and evidence correction pass. It deliberately examines different risks: architecture fidelity, facilitation completeness, accessibility, state recovery, and whether the simulation teaches through causal behavior rather than decorative motion.

## P0 — required before a moderated workshop

### 1. Architecture is not yet an explanatory model

The current renderer lists nodes in stable lanes, but it does not render the synchronous, asynchronous, read, write, replication, fallback, or ownership edges required by `architecture-spec.md`. Topology is embedded as conditional component logic rather than authored level data. Level 2 configuration changes and Level 10 correctness boundaries therefore have no precise visual delta.

**Acceptance:** move nodes, edges, ownership, consistency, failure behavior, and per-level deltas into data; render a traceable focused request path and equivalent structured alternative.

### 2. Facilitator mode is not sufficient to run the documented session

The current dock provides pause, hints, answer reveal, scoring, and whole-workshop reset. It lacks the level timer, recommended reveal order, next facilitation step, replay, reset-current-level, rewind, fast path, misconception notes, inclusion prompt, and junior/senior follow-ups promised by the specifications.

**Acceptance:** implement the facilitator run card as data and expose presenter-safe controls separately from spoiler notes.

### 3. The content matrix remains incomplete

Traffic presets still derive values from a generic formula. Most non-canonical options do not have complete numeric affected/unaffected outcomes, and Level 12 does not yet have authored numeric results for every valid action set.

**Acceptance:** author all four preset states and every option/combination consequence, then add relationship tests for rates, totals, freshness, invariants, and resource saturation.

## P1 — required before accessibility and self-guided acceptance

### 4. First-run and recovery flows are incomplete

The orientation explains the loop but omits the required sample interaction. Saved state is restored silently rather than offering `Resume workshop` and `Start fresh`; the UI does not report `Saved locally` or storage failure. There is no printable decision journal.

### 5. Accessibility needs interaction-level validation

The orientation dialog has no focus trap or Escape behavior. Validation is expressed by disabled controls rather than associated error summaries. Outcome changes have no concise live-region announcement. Several segmented and facilitator controls are below the 44×44 target. Presentation text and diagram labels are smaller than the specified shared-screen sizes.

### 6. Metric motion is decorative rather than causal

Spark bars are generated independently of the displayed value. There is no shared before/after scale, change marker, authored 8–12-second transition, absolute delta, direction column, or `Show final state now`. This can imply evidence that the scenario data does not contain.

### 7. Evidence explanations sometimes reveal interpretation

Several participant-visible descriptions state the likely cause rather than neutrally defining the observation. This reduces the challenge for seniors and conflicts with the rule that incident-specific interpretation belongs in facilitator/debrief content.

## P2 — quality and maintainability

### 8. Local state requires schema validation and migration

Persisted JSON is merged into the current state without version validation. A future content or schema change can leave references to removed levels, evidence, or options.

### 9. Facilitator and participant routes need clearer separation

Entering facilitator mode has no confirmation. Presenter-safe state is visually indicated, but preparation notes and screen-shared controls still share one floating surface.

### 10. Acceptance testing is too narrow

Current automated tests cover core calculations and content counts. Missing coverage includes a complete keyboard level, focus after commit, local-state recovery, option-order balance, all capstone combinations, responsive reflow, forced colors, and architecture continuity across all 12 transitions.

## Recommended sequence

1. Author and render the architecture model.
2. Complete option/preset/capstone scenario data and consistency tests.
3. Implement facilitator run cards and recovery controls.
4. Add sample orientation, resume/reset, save status, and decision journal.
5. Replace decorative charts with authored transitions and accessible comparison data.
6. Complete keyboard, screen-reader, reflow, and moderated usability validation.
