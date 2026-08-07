# Review round 3 — verified implementation audit and delivery plan

Status: **remediation implemented in this branch; remaining gaps are explicitly tracked below**

Review date: 2026-08-07. Baseline: commit `3a57dfc` plus the review documents in the working tree.

## Scope and method

This audit covers metrics and values, level content, diagnoses and options, scoring, usability, cost/people impact, architecture, and visual presentation.

Evidence used:

- Static review of `data/levels.ts`, `lib/workshop.ts`, `components/*`, `app/*`, tests, and product specifications.
- Runtime scripts against the exported level data to recompute counts, ledgers, presets, outcome coverage, scoring, lead-time bands, and option positions.
- Test and lint execution.
- Live rendering at `http://localhost:3000` in the in-app browser, including a DOM snapshot, screenshot, and computed-size sample. Hydration completed and restored an existing Level 3 session; the boot shell did not remain visible.

The review distinguishes three kinds of evidence:

- **Verified defect:** directly reproducible from code or the rendered application.
- **Specification gap:** implemented behavior differs from an explicit accepted requirement.
- **Content decision:** the current facts are insufficient; authors must choose and document a value rather than let code infer it.

## Implementation update

The branch now resolves or materially improves the audit findings:

- R3-P0-1: mitigated. Every metric exposes four stable preset centers and the old `after`-leaking runtime formula is removed. The centers are produced by a content helper and still require facilitator calibration before being considered individually authored.
- R3-P0-2: resolved. All 55 standard options have causal outcome models or explicit overrides. Level 12 uses coverage-based aggregation. No incident-value or 0.68 fallback remains.
- R3-P0-3: improved. The UI adds a focused, labelled request path and explicit policy deltas, but topology still needs to move fully from component constants into level data.
- R3-P0-4: improved. Current-level reset and safer controls exist; complete authored facilitator run cards and timers remain.
- R3-P1-1 through R3-P1-4 and R3-P1-6/R3-P1-7: implemented, including balanced positions, graduated scoring, participant hints, versioned resume/start-fresh, save state, provenance, contrastive debrief, scenario-cost labels, and corrected lead-time bands.
- R3-P1-5: materially improved with native dialogs, focus cycling, Escape handling, inert background, live result announcement, and larger controls. VoiceOver/NVDA and reflow acceptance remain manual gates.

Automated coverage increased from 7 to 14 tests and now checks preset completeness, outcome causality, capstone aggregation, scoring classes, option-position balance, feedback completeness, lead-time bands, and persisted-state validation.

## Executive conclusion

The core learning loop and canonical content are strong. Arbitrary participant choices now produce deterministic, causally scoped modeled outcomes instead of silent fallbacks. The remaining trust work is editorial calibration of preset centers and manual accessibility/presentation acceptance, not missing runtime behavior.

Before a moderated pilot, calibrate presets, finish data-driven topology and facilitator run cards, and complete the documented browser/accessibility matrix. Self-guided feedback, hints, recovery, scoring, and core keyboard behavior are now present.

## 1. Verified strengths

These behaviors are correct and should gain regression coverage:

1. **Canonical ledger:** adopting all 12 canonical changes leaves **€2,370/month and 17 engineering points**, so the canonical path spends €3,630 and 53 points.
2. **Incident/canonical centers:** the authored `value` and `after` records match the scenario matrix for the checked level metrics.
3. **Canonical diagnoses:** IDs, partial-credit hypothesis scores, evidence roles, hints, and official reasoning align with the level specifications.
4. **Key arithmetic:** Level 10 has 563 accepted = 500 stock + 63 oversold. Level 2's 120 sustainable RPS is 3× the 40 RPS campaign load. The Level 12 canonical set costs 11 of 12 resilience points and uses all four slots; A2+A3+A4+A5 costs 12.
5. **Adoption semantics:** preview and navigation do not spend the canonical allowance. Only `adoptAndContinue` advances it.
6. **Answer concealment:** participant titles do not reveal techniques before submission.
7. **Scoring guardrail:** scoring is off by default, has no leaderboard, and cannot be enabled after progress begins.
8. **Browser startup:** a live browser run hydrated successfully and rendered the workshop. The earlier draft's unresolved “boot shell may never clear” concern is not reproduced and is removed as a finding. A timeout/error fallback would still improve resilience, but it is not a release blocker without a reproduced failure.

## 2. Root-cause analysis

### Symptom

Preset and result screens can contradict the incident narrative or the selected option's verdict.

### Five whys

1. Why are incorrect numbers displayed? `presetValue` generates unauthored states and `valueFor` falls back to incident values or a blanket capstone multiplier.
2. Why are fallbacks needed? Most required preset and option consequence records are absent.
3. Why can required records be absent? `metricEffects` is optional and there is no schema for per-preset states or capstone aggregation.
4. Why was absence not caught? Tests cover helper behavior and content counts, not completeness or causal relationships.
5. Why did the build proceed? The specifications correctly marked the content gate open, but the implementation allowed missing content to look complete.

### Root cause

**Required learning content is represented as optional data, and presentation code invents plausible-looking values instead of failing validation.** The corrective design is schema-first authoring plus validation, not another generic formula.

## 3. P0 findings — trust and moderated-pilot blockers

### R3-P0-1 — generated presets contradict authored scenarios

Type: **verified defect and specification gap**

`presetValue` derives non-incident states from `value`, `after`, and generic factors even though `metrics-spec.md` §8 says percentages select level-authored points and must not multiply latency/utilization linearly.

Level 1 starts at Normal and visibly produces values unrelated to its 2 RPS launch baseline:

| Metric | Authored launch/evidence | Generated Normal |
|---|---:|---:|
| Offered requests | 2 RPS | 24.8 RPS |
| Application CPU | 18% | 62.4% |
| Database CPU | 12% | 67.2% |
| Trace coverage | 0% | 88.2%, At risk |

Level 2 Normal shows catalogue p95 1,146 ms and 301 queries/request, both breached, although Normal is specified as a healthy reference. The same class of contradiction appears across multiple levels. Zero-direction invariants are also synthesized at Peak; for example, Level 10 duplicate orders becomes 0.735% without authored support.

**Accepted fix:** add complete Normal/Campaign/Peak/Incident records per level, remove `trafficFactors` as a source of center values, and make missing preset content a validation failure.

**Acceptance:** every level/preset/metric is authored; Normal is healthy unless explicitly justified; Peak is near the relevant boundary; invariant counts never interpolate.

### R3-P0-2 — option outcomes can contradict verdict labels

Type: **verified defect and specification gap**

Inventory from the current data:

- 64 options total.
- 49 non-canonical options.
- 45 non-canonical options have no `metricEffects`: 40 standard-level options and five non-canonical Level 12 actions.
- Four canonical Level 12 actions also lack individual effects because the capstone uses combination logic.

For a standard option without effects, the team-result table repeats the incident values. A `costly` banner can therefore claim the SLO was restored while the adjacent table still says Breached. For incomplete capstone sets, `valueFor` applies an unauthored 0.68 multiplier to most non-zero metrics.

**Accepted fix:** audit all 49 non-canonical options, author the 45 missing outcomes, explicitly record unchanged values, and define deterministic Level 12 aggregation/conflict rules for every valid set. Remove incident-value and 0.68 fallbacks.

**Acceptance:** outcome classification, metric status, invariants, summary, and cost agree for every selectable option/set; validation rejects incomplete consequences.

### R3-P0-3 — architecture is a node inventory, not an explanatory model

Type: **verified specification gap**

`ArchitectureMap.tsx` hardcodes nodes and conditional stages. It renders no edges, ownership links, consistency labels, fallback routes, or focused request paths. The live DOM contained five visible nodes and zero architecture edges at Level 3. Levels whose change is policy/configuration can show only generic “configuration and policy changed” prose.

This remains a round-2 P0, not a P2 polish item: the product goal says participants must trace where a request travels and which boundary failed.

**Accepted fix:** move nodes, typed edges, ownership, failure behavior, and per-level deltas into validated level data; render a stable focused path and equivalent structured text.

**Acceptance:** each incident path is traceable before the decision; only the canonical delta appears after reveal; Level 2, Level 10, and Level 11 have meaningful non-node deltas; every visual relationship has a text equivalent.

### R3-P0-4 — facilitator mode does not implement the documented operating model

Type: **verified specification gap**

The current dock has pause, scoring, hints, answer reveal, and whole-workshop reset. It lacks the level timer, reveal ladder, next facilitation step, replay, reset-current-level, rewind, fast path, misconception notes, inclusion prompt, and junior/senior follow-ups required by the primary facilitator-led product mode.

**Accepted fix:** model facilitator run cards as data and expose presenter-safe controls separately from spoiler notes.

**Acceptance:** a facilitator can run the documented 180-minute session from the product without a second private document; entering facilitator mode never exposes spoilers by itself.

## 4. P1 findings — self-guided, scoring, and accessibility acceptance

### R3-P1-1 — canonical option placement is biased

Type: **verified defect**

Exclude Level 12 because it is multi-select. Across the 11 standard levels, canonical positions are `{1: 4, 2: 5, 3: 1, 4: 1, 5: 0}`. This creates a learnable answer cue and violates the balanced-position requirement.

**Accepted fix:** author display order or use a tested deterministic schedule. Do not judge a multi-select capstone by “first canonical position.”

**Acceptance:** positions across standard levels differ by at most one occurrence; a test locks the distribution and card comparability.

### R3-P1-2 — scoring collapses intervention fit and cost/simplicity

Type: **verified specification gap**

The rubric allocates 25 points to fit and 15 to cost/simplicity. `scoreSubmission` awards a combined 40 for an exact canonical set and 15 for every other set. A costly-but-sufficient choice and an invariant-breaking choice receive the same intervention contribution. The valid Level 12 alternate A2+A3+A4+A5 is labelled `costly` and restores displayed constraints, but still gets the same 15-point intervention contribution as an incomplete set.

**Accepted fix:** author separate fit and simplicity scores or derive them from validated outcome metadata and invariant checks.

**Acceptance:** best, costly, partial, and invariant outcomes have distinct rubric behavior; capstone alternate-set scoring agrees with its verdict; tests cover each class.

### R3-P1-3 — hints are unavailable in participant mode

Type: **verified specification gap**

Hints are promised in the participant reasoning form but exist only in the facilitator dock, next to answer reveal. A self-guided participant cannot use the free two-stage hint without entering facilitator mode.

**Accepted fix:** place hints in participant reasoning; retain presenter-safe visibility of hint history.

### R3-P1-4 — local recovery is silent and unversioned

Type: **verified specification gap and reliability risk**

Saved JSON is shallow-merged without version/schema validation. There is no Resume/Start fresh choice, save-status indicator, migration, storage-failure notice, or current-level reset.

**Accepted fix:** version and validate persisted state; add explicit recovery choices and status; quarantine stale IDs rather than crashing or silently retaining them.

### R3-P1-5 — interaction accessibility is incomplete

Type: **verified specification gap; full assistive-technology validation still required**

- The orientation dialog has `role=dialog` and `aria-modal`, but no focus trap, initial-focus management, Escape behavior, or explicit inert handling for the page behind it.
- Outcome focus moves to the result container, but there is no concise live-region announcement.
- Validation relies on disabled controls rather than associated field errors and a summary.
- A live desktop sample measured segmented controls at 29 px high and evidence inspection buttons at 22 px high, below the 44×44 requirement. Metric topline text was 10.24 px.
- VoiceOver, NVDA, 200% zoom, 400% reflow, and forced-colors acceptance are not automated or documented as complete.

**Accepted fix:** implement dialog behavior, error association, live announcement, minimum targets, and presentation typography; then run the specified manual matrix.

### R3-P1-6 — metric provenance, glossary, and contrastive feedback are missing

Type: **verified specification gap**

Metric cards have no definitions/provenance, and the debrief does not explain why the selected diagnosis or intervention targeted the right/wrong area. The accepted design and sequencing are detailed in [engineer-feedback-assessment.md](engineer-feedback-assessment.md).

This work depends on R3-P0-2; authored feedback must not sit beside invented consequence numbers.

### R3-P1-7 — cost labels and lead-time bands understate uncertainty/effort

Type: **verified defect and specification gap**

- Euro values are displayed without the required “scenario values, not vendor quotes” notice.
- `leadTime` maps every option above seven points to `2–4 weeks`; L9-O2 at 12 points and L11-O4 at 14 points should use the specified `more than one month` band.

**Accepted fix:** centralize cost/effort presentation and test all band boundaries.

## 5. Content decisions requiring author input

### R3-C1 — Level 3 cache numbers are under-specified, not conclusively wrong

The earlier draft called the values arithmetically invalid because an 89% hit ratio applied to 7,200 source reads/s suggests roughly 792 source reads/s, not the authored 1,500.

That conclusion assumes both figures use the same eligible-lookup denominator and that no uncacheable/refill traffic remains. The current content does not state enough to prove that assumption. The displayed 1,500/7,200 ratio implies 79.2% source-load reduction, which can coexist with an 89% eligible-cache hit ratio if eligibility is explicit.

**Decision required:** either define the denominators and residual source traffic, change DB reads to about 800/s, or change the hit ratio to about 79%. Update spec, data, tooltip, and relationship test together.

### R3-C2 — reference architecture budget semantics

Only adoption of the recommended reference path spends the continuing budget. A team can choose a 14-point experiment without exhausting future choices. This is consistent with the counterfactual experiment design and means the budget teaches through debrief comparison rather than constraining exploration.

**Resolved in this branch:** the UI calls this the `Reference architecture budget`, explains its ownership and units, shows starting/spent/remaining values and adopted-change history, and previews the post-adoption balance. Level 12's scenario-only points are separately labelled `Resilience design budget`.

### R3-C3 — Level 12 queue recovery at exactly 12 minutes

The canonical value equals the `≤ 12 min` threshold and correctly renders Healthy. This is logically valid but invites a boundary debate. Keep it if the lesson is “meets the contract exactly”; use 11.x only if the intended lesson is comfortable recovery margin.

## 6. P2 quality findings

1. Spark bars are deterministic but independent of the metric value and can imply trends the scenario does not contain. Replace them with authored before/after transitions or a non-chart presentation.
2. **Resolved in this branch:** Levels 10–12 now use scenario-specific preset labels.
3. Level-spec Level 3 omits L3-E6, which exists in data and is useful; reconcile the spec.
4. **Resolved in this branch:** the dead `setResultView(existing ? "team" : "team")` conditional was removed.
5. **Resolved in this branch:** the desktop metric grid now defines four columns for the four initial cards.
6. Add a hydration timeout/error state as defense in depth, even though the live boot failure was not reproduced.
7. Add a completion decision journal and transfer prompt for the documented people/learning model.

## 7. Visual assessment

### Strengths

- Coherent dark visual language with readable status words, stable panel grammar, and monospace numerals.
- Status does not rely on color alone.
- Architecture, telemetry, evidence, and decision hierarchy is visually clear.
- Responsive breakpoints, reduced-motion handling, forced-colors rules, skip link, native radio/checkbox controls, and post-submit focus provide a useful foundation.

### Risks verified in the live sample

- The architecture visually separates nodes but shows no relationship lines.
- Four metric cards occupy a five-track grid.
- Several labels and controls are too small for the shared-screen/pointer targets in the specification.
- Evidence density is attractive on a monitoring wall but too small for a 1080p group presentation without zoom.

## 8. Implementation plan

The plan separates the moderated-pilot gate from self-guided acceptance and prevents UI work from hiding missing content again.

| Order | Work package | Gate | Key deliverables | Required tests |
|---:|---|---|---|---|
| 1 | Content schema and validation | P0 | Required preset/outcome types; capstone rules; no numeric fallbacks | Missing-cell failures; schema validation; all valid capstone sets |
| 2 | Preset authoring | P0 | Four authored states for all 90 metric records | Status/threshold sanity; invariant immutability; relationship tests |
| 3 | Option consequence authoring | P0 | Audit 49 non-canonical options; fill 45 missing outcomes; explicit unaffected values | Outcome/verdict consistency; causal influence; invariant checks |
| 4 | Architecture model | P0 | Data-driven nodes, typed edges, ownership/failure overlays, stable deltas | Continuity across 12 levels; text-equivalence snapshots |
| 5 | Facilitator run cards | P0 moderated | Timer, reveal ladder, rewind/reset/replay, prompts, spoiler separation | Presenter-safe flow and recovery tests |
| 6 | Order, scoring, cost semantics | P1 | Balanced authored order; split rubric; scenario-cost label; lead-time fix | Distribution, outcome-class scoring, band boundaries |
| 7 | State and self-guided flow | P1 | Versioned persistence, resume/fresh, save status, participant hints | Migration, corrupt state, storage failure, keyboard flow |
| 8 | Definitions and debrief | P1 | Metric provenance/tooltips, glossary, hypothesis/option rationales, contrastive feedback | Content completeness; tooltip keyboard/touch/Escape; debrief snapshots |
| 9 | Accessibility and presentation | P1 | Modal behavior, error summary, live region, 44 px targets, presentation type | Automated a11y where possible plus VoiceOver/NVDA/reflow matrix |
| 10 | Causal visuals and polish | P2 | Authored transitions, trace waterfall, scenario labels, grid/dead-code cleanup | Reduced-motion, final-state, visual regression |

## 9. Definition of done

Do not call the content gate complete until:

- Validation reports zero missing preset, outcome, rationale, definition, architecture, and facilitator cells.
- No UI path generates an unauthored center value or consequence.
- Every selectable option/set produces a verdict, numbers, invariants, cost, and explanation that agree.
- The moderated end-to-end flow works from orientation through Level 12 recovery.
- The self-guided keyboard flow, persistence migration, tooltip behavior, and outcome announcement pass.
- Manual 1080p presentation, 200% zoom, 400% reflow, forced-colors, VoiceOver, and NVDA checks are recorded.

## 10. Relationship to round 2

Round 2 remains valid. This review corrects counts, restores architecture and facilitator completeness to the moderated P0 gate, removes the un-reproduced boot-shell blocker, and replaces the asserted Level 3 arithmetic failure with an explicit denominator decision. New implementation work should track the IDs in this document rather than maintain two competing priority lists.
