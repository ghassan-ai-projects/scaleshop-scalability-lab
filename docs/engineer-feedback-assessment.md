# Engineer feedback assessment and implementation plan

Status: **core recommendations implemented; final content calibration and assistive-technology checks remain**

Review date: 2026-08-07. Baseline: commit `3a57dfc` plus the two review documents in the working tree.

The pilot engineer asked for:

1. APM (Application Performance Monitoring)
2. Only standard AWS/GCP-style metrics, with an information tooltip for each metric
3. Feedback explaining why the trainee's chosen improvement targets the right or wrong area

The underlying needs are valid. The literal requests need refinement: the lab should teach transferable observability concepts without pretending every useful signal is a vendor-native metric, and it should not turn “install APM” into a capacity answer.

## Implementation update

The accepted design is now implemented:

- Metric records carry definitions, source-class provenance, comparable provider names where semantics align, and four deterministic preset centers.
- Metric explanations work by button focus/click and dismiss with Escape.
- The architecture calls the capability `Observability / APM`; Level 2 and Level 4 trace evidence renders authored stage-duration breakdowns.
- Every standard option has an explicit causal outcome profile. Level 12 aggregates metrics only from selected protection dimensions; the blanket multiplier is removed.
- Debriefs contrast the selected diagnosis and intervention with decisive evidence, name right/wrong/adjacent area fit, and state when a rejected option becomes justified.
- Scoring separates intervention fit from cost/simplicity and includes an explicit `Targets the wrong area` outcome.
- Regression coverage increased from 7 to 14 tests before final browser verification.

Remaining calibration is editorial rather than architectural: review generated preset centers with the facilitator, refine provider caveats per metric, and run VoiceOver/NVDA acceptance.

## Verification method

- Compared the requests with `product-spec.md`, `metrics-spec.md`, `facilitator-spec.md`, `data/levels.ts`, `lib/workshop.ts`, and the rendered components.
- Counted the current content model: 90 metric records, 71 evidence items, 48 hypotheses, and 64 options.
- The initial audit confirmed that `MetricSpec` had no definition or provenance metadata, `HypothesisSpec` had no rationale, and `OptionSpec` had no area-fit explanation; the implementation update above closes those model gaps.
- The initial audit confirmed that trace evidence was prose-only and the architecture node was labelled `Metrics + traces`; both are now improved.
- Checked representative names against current primary documentation from [AWS SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-available-cloudwatch-metrics.html), [AWS RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-metrics.html), [AWS CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/programming-cloudwatch-metrics.html), and [Google Cloud service monitoring](https://docs.cloud.google.com/stackdriver/docs/solutions/slo-monitoring).

## Decision 1: add an APM-shaped experience, not an APM dependency

### Finding

The lab already teaches much of the substance associated with APM:

- Level 1 establishes journey SLOs, RED/USE signals, alerts, and tracing.
- Levels 2 and 4 include stage or dependency timing evidence.
- Level 1 option L1-O4 deliberately treats “adopt default APM” as partial because a tool without an operating contract does not establish a capacity envelope.

The transfer to day-to-day tools is too implicit. The UI is a flat metric-card grid. It does not group journey RED signals, show a trace waterfall, or explain how the evidence relates to an APM service view.

### Decision

**Accept the presentation and vocabulary gap. Reject adding a vendor SDK, backend, or stronger “buy APM” answer.** A real APM integration conflicts with the client-only simulation and would add operational complexity without improving the learning objective.

### Accepted scope

- Rename the post-Level-1 architecture node to `Observability / APM` and define APM in context.
- Group telemetry by user journey and resource rather than implying one undifferentiated service.
- Render authored trace evidence as a simple stage-duration waterfall or stacked bar with a text/table equivalent.
- Add a Level 1 debrief sentence explaining what default APM provides and what the operating contract still must define.

### Acceptance criteria

- A participant can identify Rate, Errors, and Duration for catalogue and checkout.
- Trace evidence exposes stage name, duration, and total without relying on color.
- No networked telemetry service, vendor credential, or runtime agent is required.
- L1-O4 remains partial credit.

## Decision 2: use explicit metric provenance, not a false “standard/custom” binary

### Finding

There is no universal AWS/GCP list that can represent every signal needed by this workshop. The draft mapping also overstated some equivalences:

- RDS `ReadIOPS` is storage I/O; the lab's `Database reads /s` can represent logical query or row work and is not automatically the same metric.
- Connection-pool wait is typically emitted by an application, driver, or proxy; it is not an RDS `DatabaseConnections` equivalent.
- CloudFront `OriginLatency` measures first-byte latency for origin-served requests; it is not identical to end-user far-region TTFB.
- Error percentages, p95 latency, SLO burn rate, retry amplification, and trace coverage are commonly derived signals, not necessarily vendor-native counters.
- Oversold units, duplicate orders, confirmed-order loss, and useful outcomes are business invariants. Removing them would destroy the correctness lessons in Levels 10–12.

The safe rule is provenance and definition, not “invent none.”

### Decision

**Accept stable definitions, familiar names, and tooltips. Replace the single proposed `standard` string with structured provenance.**

Use these source classes:

| Source class | Meaning | Examples |
|---|---|---|
| `provider` | Direct analogue of a cloud/provider metric | CPU utilization, database connections, read/write IOPS, replica lag, cache hit rate, oldest-message age |
| `observability-derived` | Derived from request/trace/event data using an established operational definition | RPS, error rate, p95, SLO burn rate, retry amplification |
| `runtime` | Emitted by the application, database, driver, pool, or proxy | queries/request, pool wait, lock wait |
| `load-test` | Result of a controlled experiment, not live telemetry | sustainable RPS, first breach point |
| `analysis` | Derived investigation output | top-key share, image byte share, partition pruning |
| `business-invariant` | Domain correctness measure | oversold units, duplicate orders, confirmed-order loss |

Suggested shape:

```ts
type MetricProvenance = {
  sourceClass: "provider" | "observability-derived" | "runtime" | "load-test" | "analysis" | "business-invariant";
  comparableTo?: string;
  caveat?: string;
};
```

Add a reusable definition registry keyed by a stable concept ID. Do not repeat the same definition across all 90 level-specific metric records.

### Tooltip content

Each metric explanation should answer:

1. What is measured?
2. What is the unit, window, and denominator?
3. What source class produces it?
4. If a provider analogue exists, what is comparable and what differs?
5. Why is the threshold relevant in this scenario?

### Acceptance criteria

- Every displayed metric resolves to a definition and one source class.
- Every ratio states its numerator and denominator; every rate states its window.
- Provider comparisons are exact enough to avoid conflating logical work, storage I/O, and end-user latency.
- The info control works with keyboard focus, click, and touch; Escape dismisses it; hover is optional.
- Definitions remain available after submission and satisfy the existing product-spec glossary requirement.

## Decision 3: add deterministic contrastive feedback

### Finding

The debrief currently shows an outcome label, the chosen option summary, official reasoning, and a metric table. It does not explicitly connect the trainee's diagnosis and intervention to the evidence. The data model cannot currently generate statements such as:

> You diagnosed database capacity. DB CPU was 12% at the observed load, so capacity was not yet the demonstrated constraint.

This is a high-value learning gap, especially in self-guided use.

### Decision

**Accept. Implement authored, deterministic feedback; do not introduce AI grading.** The selected hypothesis, evidence IDs, option outcome kind, cost, and authored consequences already provide the required structure.

Add:

- `rationale` for all 48 hypotheses.
- `areaFit` and `fitBoundary` for all 64 options.
- A debrief contrast: `Your diagnosis → evidence check → your intervention → actual effect → canonical change → when your option would become justified`.

The feedback must refer to authored facts. It must not infer numeric impact from the generic preset formula or from the option's outcome label.

### Dependency

Numeric outcome authoring comes first. The code currently leaves 45 of 49 non-canonical options without `metricEffects`; 40 are standard-level options and five are non-canonical Level 12 actions. Level 12 also needs authored aggregation rules for valid combinations. Contrastive prose beside a contradictory metric table would make the problem worse.

### Acceptance criteria

- Every hypothesis explains which evidence supports or rejects that area.
- Every option explains what it changes, what it cannot change, and the threshold at which it would become reasonable.
- The feedback distinguishes wrong layer, right layer/wrong timing, incomplete mechanism, excessive cost, and invariant violation.
- A content test fails when a hypothesis or option lacks the required rationale.

## Implementation plan for accepted work

| Phase | Work | Priority | Dependencies | Verification |
|---|---|---:|---|---|
| 0 | Define authored preset/outcome schemas and Level 12 aggregation rules; remove generated fallbacks | P0 | None | Schema validation plus causal and invariant tests |
| 1 | Author all preset centers; audit all 49 non-canonical options and fill the 45 missing outcomes | P0 | Phase 0 | No outcome may contradict its classification or threshold state |
| 2 | Add reusable metric definitions and structured provenance; audit all 90 metric records | P1 | Phase 0 | Completeness, denominator, unit, and provider-analogue tests |
| 3 | Build accessible metric explanations and contextual glossary | P1 | Phase 2 | Keyboard, touch, Escape, reflow, and screen-reader smoke tests |
| 4 | Author 48 hypothesis rationales and 64 option area-fit records; render contrastive debrief | P1 | Phase 1 | Snapshot/content tests across all options and capstone sets |
| 5 | Add journey RED grouping, trace waterfall, and APM vocabulary/debrief copy | P2 | Phases 2–3 | Visual, keyboard, and text-alternative checks |

## Explicitly not planned

- A production APM backend or vendor SDK
- Live AWS/GCP telemetry
- Removing business invariants because they are not provider-native
- AI-generated scoring or free-text grading
- One-to-one vendor naming where the semantics or denominator differ

## Cross-reference

The outcome and preset prerequisites are tracked as R3-P0-1 and R3-P0-2 in [review-round-3.md](review-round-3.md). Tooltip/glossary work closes existing requirements in `product-spec.md` §§7.5, 9, and 11.
