# Product improvements after the feedback rounds

Status: **recommended next work, not required for the current core learning loop**
Review date: 2026-08-07

The lab is good enough for another moderated validation round. The recent work fixed the largest trust and self-guided-learning gaps: deterministic outcomes, metric definitions, contrastive feedback, clearer hints, safer persistence, and an understandable reference architecture budget.

The following improvements would make the product materially more useful. They are deliberately limited to changes that strengthen diagnosis, facilitation, or transfer to real engineering work.

## 1. Add a completion decision journal

At the end of Level 12, show a compact record of the participant's decisions:

- diagnosis and decisive evidence for each level;
- experiment selected and modeled consequence;
- recommended reference change and budget impact;
- recurring reasoning patterns, such as over-scaling or missing invariants;
- one transfer prompt: “What would you inspect first in your own system?”

Why this matters: the lab currently teaches each incident well, but it does not consolidate the learning into a reusable mental model. The journal should be printable or copyable without introducing accounts or a backend.

Acceptance: a participant can explain two strengths, one repeated mistake, and one action they will apply at work.

## 2. Finish the facilitator operating layer

Add authored run cards for every level with:

- suggested timebox and reveal sequence;
- the misconception to listen for;
- one junior and one senior follow-up question;
- an inclusion prompt that invites a second voice before revealing the answer;
- replay/reset-current-level controls that do not alter the adopted reference path.

Why this matters: facilitator-led delivery is the primary workshop format, but the facilitator still needs knowledge outside the product. This is more valuable than adding more visual polish.

Acceptance: a prepared engineer can facilitate the complete workshop without a second private guide.

## 3. Make architecture relationships data-driven

Move request paths, ownership, consistency boundaries, fallback routes, and failure propagation from component logic into validated level data. Render the focused path before the decision and only the adopted delta afterward.

Why this matters: the current map is much clearer than before, but some levels still teach through a node inventory when the real lesson is a relationship or policy boundary.

Acceptance: for every level, a participant can answer “where does this request travel, who owns the state, and where does this failure propagate?” using either the visual map or its text equivalent.

## 4. Add content validation as a release gate

Create a validation command that fails when a level has missing or contradictory learning content:

- preset centers and threshold relationships;
- option outcome coverage and unchanged invariants;
- recommendation cost and reference-budget bounds;
- metric definitions, provenance, windows, and denominators;
- architecture path and facilitator run card.

Why this matters: the largest earlier defects came from optional content being replaced with plausible runtime fallbacks. Validation prevents that class of regression as levels evolve.

Acceptance: CI rejects a level that lacks required consequence data or produces a verdict inconsistent with its metrics.

## 5. Replace decorative sparklines with causal transitions

The current spark bars suggest time-series information that the scenario does not actually author. Replace them with a restrained before/after transition, or remove them when no meaningful trend exists.

Why this matters: an observability lab should not use decorative charts that can be mistaken for evidence.

Acceptance: every chart encodes an authored value, time window, or comparison and has a text equivalent.

## 6. Complete the accessibility and presentation acceptance matrix

Record manual checks for VoiceOver, NVDA, keyboard-only use, 200% zoom, 400% reflow, forced colors, reduced motion, and a 1080p shared-screen session. Add targeted visual regression coverage for the orientation, budget hint, result debrief, and Level 12 selection state.

Why this matters: automated checks cover structure but cannot prove shared-screen readability or assistive-technology behavior.

Acceptance: the matrix records browser, assistive technology, result, and any known limitation for each required scenario.

## Priority order

1. Content validation gate.
2. Completion decision journal.
3. Facilitator run cards.
4. Data-driven architecture relationships.
5. Accessibility/presentation matrix.
6. Causal metric transitions.

## Explicitly not recommended now

- AI-generated grading or feedback;
- accounts, leaderboards, or competitive gamification;
- a hosted telemetry backend;
- vendor-specific APM integration;
- more levels before the current twelve are fully calibrated.

These additions would increase complexity without addressing a demonstrated learning problem. Reconsider them only after participant evidence shows a clear need.
