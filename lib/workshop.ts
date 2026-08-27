export type MetricStatus = "healthy" | "risk" | "breached" | "observed";
export type OutcomeKind = "best" | "costly" | "partial" | "wrong" | "invariant";
export type EvidenceRole = "decisive" | "supporting" | "context";
export type TrafficPreset = "normal" | "campaign" | "peak" | "incident";
export type MetricKind = "slo" | "capacity" | "invariant" | "observation";
export type MetricSourceClass = "provider" | "observability-derived" | "runtime" | "load-test" | "analysis" | "business-invariant";

export type MetricPresetCenters = Record<TrafficPreset, number | null>;

export interface MetricProvenance {
  sourceClass: MetricSourceClass;
  comparableTo?: string;
  caveat?: string;
}

export interface MetricSpec {
  id: string;
  label: string;
  value: number | null;
  after: number | null;
  unit: string;
  threshold?: number;
  direction?: "lower" | "higher" | "zero" | "equal";
  precision?: number;
  kind?: MetricKind;
  window?: string;
  denominator?: string;
  definition: string;
  provenance: MetricProvenance;
  presets: MetricPresetCenters;
  /** Hard physical bound. A ratio of downstream attempts to requests cannot fall below 1. */
  floor?: number;
  /** Structural or per-request quantities do not move with the traffic preset. */
  presetsFlat?: boolean;
  /** Breached at every preset by design: the condition is not caused by traffic. */
  standingBreach?: boolean;
  /** The component does not exist yet at this level, so the value is unavailable rather than zero. */
  absentComponent?: boolean;
}

/**
 * Relationships the level data must honour. The formula that generates preset centers works on
 * one metric at a time and cannot see these, so they are declared here and enforced by the
 * content-validation gate rather than trusted.
 */
export type MetricRelationship =
  | { kind: "conservation"; offered: string; completed: string }
  | { kind: "successRate"; offered: string; errors: string; completed: string }
  | { kind: "burnRate"; errors: string; burn: string };

export interface TraceStage {
  label: string;
  duration: number;
}

export interface EvidenceSpec {
  id: string;
  category: string;
  title: string;
  value: string;
  meaning: string;
  role: EvidenceRole;
  wave?: 1 | 2 | 3;
  /** Stage durations rendered as a breakdown bar when the evidence is a trace. */
  stages?: TraceStage[];
}

export interface OptionSpec {
  id: string;
  title: string;
  mechanism: string;
  monthlyCost: number;
  points: number;
  leadTime: string;
  reversibility: "Easy" | "Moderate" | "Hard";
  kind: OutcomeKind;
  summary: string;
  risk: string;
  /**
   * The authored consequence of choosing this option. Every standard option declares one.
   * Metrics absent from the record keep their incident value; there is no interpolation
   * toward another option's result, because blending toward a mechanism the participant
   * did not choose has no physical meaning.
   */
  metricEffects?: Record<string, number | null>;
  coverage?: string[];
  /**
   * Human-readable statement of the failure domain(s) this action primarily contains, shown on
   * the capstone option card during selection. It names *what* each tool addresses so the set is
   * a legible design task; it deliberately does not say how well, or what residual risk remains —
   * that judgement is what the debrief evaluates.
   */
  covers?: string;
  areaFit: string;
  fitBoundary: string;
}

export interface HypothesisSpec {
  id: string;
  label: string;
  score: number;
}

export interface LevelSpec {
  id: number;
  participantTitle: string;
  techniqueTitle: string;
  phase: string;
  incident: string;
  question: string;
  constraints: string[];
  metrics: MetricSpec[];
  /**
   * The authored shared-screen row. Previously this was `metrics.slice(0, 4)`, which left
   * Level 1's debrief showing four healthy cards while the finding that sets up Level 2 —
   * the database saturating at the 31-RPS boundary — sat behind a disclosure button.
   */
  coreMetricIds: string[];
  /** The debrief may promote a different set once the consequence is known. */
  coreMetricIdsAfter?: string[];
  /** Levels with no instrumentation to vary say so instead of rendering an inert control. */
  presetsUnavailable?: string;
  evidence: EvidenceSpec[];
  hypotheses: HypothesisSpec[];
  options: OptionSpec[];
  canonicalOptionIds: string[];
  canonicalCost: number;
  canonicalPoints: number;
  official: {
    bottleneck: string;
    evidence: string;
    fit: string;
    risk: string;
    verification: string;
    next: string;
  };
  hints: [string, string];
  stretch: string;
  capstone?: {
    budget: number;
    maxSelections: number;
    evidenceRequired: number;
    /** The broader set that also restores every constraint, at the cost of the whole allowance. */
    alternateOptionIds: string[];
    /**
     * Names the three failure waves so the evidence desk can show what the team is decomposing.
     * Index 0 is wave 1. The spec designed this staging to reduce cognitive overload; without the
     * legend the participant sees only unexplained "Wave 1/2/3" tags.
     */
    waveLabels?: [string, string, string];
    /** Metric id → the protection dimensions that must all be covered to reach `after`. */
    coverageRequirements: Record<string, string[]>;
    coverageDimensions: string[];
    /** Plain-language names for coverage dimensions, used by the near-miss debrief scorecard. */
    dimensionLabels?: Record<string, string>;
  };
  relationships?: MetricRelationship[];
}

export interface Submission {
  hypothesisId: string;
  evidenceIds: string[];
  optionIds: string[];
  fit: string;
  prediction: string;
  risk: string;
  submittedAt: string;
}

export interface WorkshopState {
  version: 2;
  level: number;
  adoptedThrough: number;
  revealed: Record<number, string[]>;
  submissions: Record<number, Submission>;
  hints: Record<number, number>;
  orientationSeen: boolean;
  scoring: boolean;
}

export const initialWorkshopState: WorkshopState = {
  version: 2,
  level: 1,
  adoptedThrough: 0,
  revealed: {},
  submissions: {},
  hints: {},
  orientationSeen: false,
  scoring: false,
};

export function formatMetric(value: number | null, metric: MetricSpec): string {
  if (value === null) return "N/A";
  const precision = metric.precision ?? (Math.abs(value) < 10 && !Number.isInteger(value) ? 1 : 0);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return metric.unit === "%" ? `${formatted}%` : `${formatted} ${metric.unit}`.trim();
}

/**
 * Risk bands are per kind, because resources and objectives fail differently.
 *
 * A capacity limit is a limit: crossing it is a breach, and the warning band sits *below* it.
 * An SLO is a target with a noisy tail, so a margin above it is still recoverable. Using one
 * flat multiplier for both left Level 7 with a 91% primary against an 80% limit showing only
 * "at risk" — a level whose entire narrative is an overloaded primary never turned red.
 */
const RISK_BANDS: Record<"capacity" | "slo", { lower: number; higher: number }> = {
  capacity: { lower: 0.9, higher: 0.9 },
  slo: { lower: 1.2, higher: 0.85 },
};

export function metricStatus(value: number | null, metric: MetricSpec): MetricStatus {
  if (value === null || metric.kind === "observation") return "observed";
  if (metric.direction === "zero") return value === 0 ? "healthy" : "breached";
  if (metric.direction === "equal") return value === metric.threshold ? "healthy" : "breached";
  if (metric.threshold === undefined) return "healthy";
  const band = RISK_BANDS[metric.kind === "capacity" ? "capacity" : "slo"];
  if (metric.direction === "higher") {
    if (value >= metric.threshold) return "healthy";
    return value >= metric.threshold * band.higher ? "risk" : "breached";
  }
  if (metric.kind === "capacity") {
    if (value > metric.threshold) return "breached";
    return value >= metric.threshold * band.lower ? "risk" : "healthy";
  }
  if (value <= metric.threshold) return "healthy";
  return value <= metric.threshold * band.lower ? "risk" : "breached";
}

/**
 * Proportions for the metric meter: how full the bar is, where the target sits, and where the
 * incident baseline sat. Every one of the three encodes an authored number. The bars this
 * replaces were seeded from the level id and a tick counter and never read the metric at all,
 * so a healthy card and a breached card drew statistically identical charts.
 */
export function metricMeter(value: number | null, metric: MetricSpec) {
  if (value === null || metric.direction === "zero" || metric.direction === "equal") return null;
  const candidates = [value, metric.threshold, metric.value, metric.after].filter(
    (item): item is number => typeof item === "number",
  );
  const scale = Math.max(...candidates) * 1.15;
  if (!(scale > 0)) return null;
  const proportion = (item: number | null | undefined) =>
    typeof item === "number" ? Math.max(0, Math.min(100, (item / scale) * 100)) : null;
  return {
    fill: proportion(value) ?? 0,
    thresholdAt: proportion(metric.threshold),
    baselineAt: metric.value === value ? null : proportion(metric.value),
  };
}

export function presetValue(metric: MetricSpec, preset: TrafficPreset): number | null {
  return metric.presets[preset];
}

export function coreMetrics(level: LevelSpec, submitted: boolean): MetricSpec[] {
  const ids = (submitted && level.coreMetricIdsAfter) || level.coreMetricIds;
  return ids.map((id) => level.metrics.find((item) => item.id === id)).filter(Boolean) as MetricSpec[];
}

export const REFERENCE_ARCHITECTURE_BUDGET = { monthly: 6000, points: 70 } as const;

export interface ReferenceBudgetEntry {
  levelId: number;
  title: string;
  monthlyCost: number;
  points: number;
  remainingMonthly: number;
  remainingPoints: number;
}

export function calculateCanonicalLedgerHistory(levels: LevelSpec[], adoptedThrough: number): ReferenceBudgetEntry[] {
  let remainingMonthly = REFERENCE_ARCHITECTURE_BUDGET.monthly;
  let remainingPoints = REFERENCE_ARCHITECTURE_BUDGET.points;

  return levels
    .filter((level) => level.id <= adoptedThrough)
    .sort((first, second) => first.id - second.id)
    .map((level) => {
      remainingMonthly -= level.canonicalCost;
      remainingPoints -= level.canonicalPoints;
      return {
        levelId: level.id,
        title: level.techniqueTitle,
        monthlyCost: level.canonicalCost,
        points: level.canonicalPoints,
        remainingMonthly,
        remainingPoints,
      };
    });
}

export function calculateCanonicalLedger(levels: LevelSpec[], adoptedThrough: number) {
  const history = calculateCanonicalLedgerHistory(levels, adoptedThrough);
  const latest = history.at(-1);
  return latest
    ? { monthly: latest.remainingMonthly, points: latest.remainingPoints }
    : { ...REFERENCE_ARCHITECTURE_BUDGET };
}

export function outcomeKindForSubmission(level: LevelSpec, submission: Submission): OutcomeKind {
  if (!level.capstone) return level.options.find((item) => submission.optionIds.includes(item.id))?.kind ?? "partial";
  const selected = new Set(submission.optionIds);
  if (level.canonicalOptionIds.every((id) => selected.has(id))) return "best";
  if (level.capstone.alternateOptionIds.every((id) => selected.has(id))) return "costly";
  return "partial";
}

/**
 * An answer that breaches a stated invariant is the worst available answer, not a mid-table one.
 * The previous table gave `wrong` and `invariant` an identical 50/90 and gave `costly` the same
 * intervention-fit credit as `best`, so over-scaling scored 88% and trading away a correctness
 * guarantee read as a near-pass. Both contradict the lab's premise.
 */
const INTERVENTION_FIT: Record<OutcomeKind, number> = { best: 25, costly: 16, partial: 12, wrong: 4, invariant: -15 };
const COST_AND_SIMPLICITY: Record<OutcomeKind, number> = { best: 15, costly: 4, partial: 8, wrong: 2, invariant: -10 };

export function scoreBreakdown(level: LevelSpec, submission: Submission) {
  const hypothesis = level.hypotheses.find((item) => item.id === submission.hypothesisId);
  const evidence = submission.evidenceIds.reduce((score, id) => {
    const item = level.evidence.find((candidate) => candidate.id === id);
    return score + (item?.role === "decisive" ? 12.5 : item?.role === "supporting" ? 6.25 : 0);
  }, 0);
  const kind = outcomeKindForSubmission(level, submission);
  return {
    diagnosis: hypothesis?.score ?? 0,
    evidence: Math.min(25, evidence),
    interventionFit: INTERVENTION_FIT[kind],
    costAndSimplicity: COST_AND_SIMPLICITY[kind],
  };
}

export function scoreSubmission(level: LevelSpec, submission: Submission): number {
  const total = Object.values(scoreBreakdown(level, submission)).reduce((sum, value) => sum + value, 0);
  return Math.max(0, Math.round(total));
}

/** Decisive evidence the team did not cite, so the debrief can name what was left on the desk. */
export function missedDecisiveEvidence(level: LevelSpec, submission: Submission): EvidenceSpec[] {
  const cited = new Set(submission.evidenceIds);
  return level.evidence.filter((item) => item.role === "decisive" && !cited.has(item.id));
}

export function orderedOptions(level: LevelSpec): OptionSpec[] {
  if (level.capstone) return level.options;
  const canonicalId = level.canonicalOptionIds[0];
  const canonical = level.options.find((item) => item.id === canonicalId);
  if (!canonical) return level.options;
  const target = (level.id - 1) % level.options.length;
  const others = level.options.filter((item) => item.id !== canonicalId);
  const result = [...others];
  result.splice(target, 0, canonical);
  return result;
}

export function hypothesisRationale(level: LevelSpec, hypothesisId: string): string {
  const hypothesis = level.hypotheses.find((item) => item.id === hypothesisId);
  if (!hypothesis) return "No diagnosis was recorded.";
  if (hypothesis.score === 25) return `Right area. ${level.official.evidence}`;
  if (hypothesis.score >= 10) return `Adjacent area, but not the smallest demonstrated constraint. ${level.official.evidence}`;
  if (hypothesis.score > 0) return `This identifies a symptom, not the limiting mechanism. ${level.official.evidence}`;
  return `The evidence does not support this area. ${level.official.evidence}`;
}

/** Metrics the option does not author keep their incident value. Nothing is interpolated. */
export function optionMetricValue(level: LevelSpec, option: OptionSpec, metricId: string): number | null {
  const metric = level.metrics.find((item) => item.id === metricId);
  if (!metric) return null;
  const effects = option.metricEffects;
  if (effects && Object.prototype.hasOwnProperty.call(effects, metricId)) return effects[metricId];
  return metric.value;
}

export function capstoneCoverage(level: LevelSpec, optionIds: string[]): Set<string> {
  const covered = new Set<string>();
  optionIds.forEach((id) =>
    level.options.find((option) => option.id === id)?.coverage?.forEach((dimension) => covered.add(dimension)),
  );
  return covered;
}

/**
 * The failure domains that actually have to be contained: every dimension some metric's
 * restoration depends on. A dimension no metric requires (e.g. the transient cache-refill surge)
 * is a distractor, not a gap, so it is intentionally excluded from the near-miss scorecard.
 */
export function capstoneRequiredDimensions(level: LevelSpec): string[] {
  const required = new Set<string>();
  for (const dimensions of Object.values(level.capstone?.coverageRequirements ?? {})) {
    for (const dimension of dimensions) required.add(dimension);
  }
  return [...required];
}

export function capstoneCoverageSummary(level: LevelSpec, optionIds: string[]): { contained: number; total: number } {
  const required = capstoneRequiredDimensions(level);
  const covered = capstoneCoverage(level, optionIds);
  return { contained: required.filter((dimension) => covered.has(dimension)).length, total: required.length };
}

export interface CapstoneGap {
  dimension: string;
  label: string;
  /** The cheapest single action that would have closed this gap, so the debrief can be specific. */
  closestFix?: { title: string; points: number };
}

/**
 * Required failure domains the selected set leaves uncovered, each with the cheapest action that
 * would have closed it. This turns an all-or-nothing "partial" into actionable near-miss feedback
 * without lowering the bar: the smallest-sufficient judgement is still the participant's to make.
 */
export function capstoneGaps(level: LevelSpec, optionIds: string[]): CapstoneGap[] {
  const covered = capstoneCoverage(level, optionIds);
  const labels = level.capstone?.dimensionLabels ?? {};
  return capstoneRequiredDimensions(level)
    .filter((dimension) => !covered.has(dimension))
    .map((dimension) => {
      const closest = level.options
        .filter((option) => option.coverage?.includes(dimension))
        .sort((first, second) => first.points - second.points)[0];
      return {
        dimension,
        label: labels[dimension] ?? dimension,
        closestFix: closest ? { title: closest.title, points: closest.points } : undefined,
      };
    });
}

/**
 * The capstone is the one level where combinations, not single options, produce the outcome, so
 * its metrics are aggregated from the protection dimensions the selected set covers. A metric
 * only reaches its remediated value when every dimension it depends on is covered.
 */
export function capstoneMetricValue(level: LevelSpec, optionIds: string[], metricId: string): number | null {
  const metric = level.metrics.find((item) => item.id === metricId);
  if (!metric || metric.value === null || metric.after === null) return metric?.value ?? null;

  // A derived metric is computed from its inputs, never aggregated on its own. Interpolating
  // useful completion and error rate independently let a partial set report more completions
  // than its own error rate allows.
  const round1 = (item: number) => Math.round(item * 10) / 10;
  for (const rule of level.relationships ?? []) {
    if (rule.kind === "successRate" && rule.completed === metricId) {
      const offered = capstoneMetricValue(level, optionIds, rule.offered);
      const errors = capstoneMetricValue(level, optionIds, rule.errors);
      if (offered !== null && errors !== null) return round1(offered * (1 - errors / 100));
    }
    if (rule.kind === "burnRate" && rule.burn === metricId) {
      const errors = capstoneMetricValue(level, optionIds, rule.errors);
      const budget = level.metrics.find((item) => item.id === rule.errors)?.threshold;
      if (errors !== null && budget) return round1(errors / budget);
    }
  }

  const required = level.capstone?.coverageRequirements[metricId];
  if (!required?.length) return metric.value;
  const covered = capstoneCoverage(level, optionIds);
  const progress = required.filter((dimension) => covered.has(dimension)).length / required.length;
  const raw = metric.value + (metric.after - metric.value) * progress;
  const rounded = Math.round(raw * 10) / 10;
  return metric.floor === undefined ? rounded : Math.max(metric.floor, rounded);
}

export function parseWorkshopState(value: unknown): WorkshopState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WorkshopState>;
  if (candidate.version !== 2 || !Number.isInteger(candidate.level) || candidate.level! < 1 || candidate.level! > 12) return null;
  if (!Number.isInteger(candidate.adoptedThrough) || candidate.adoptedThrough! < 0 || candidate.adoptedThrough! > 12) return null;
  const record = (item: unknown) => Boolean(item && typeof item === "object" && !Array.isArray(item));
  if (!record(candidate.revealed) || !record(candidate.submissions) || !record(candidate.hints) || typeof candidate.orientationSeen !== "boolean" || typeof candidate.scoring !== "boolean") return null;
  return candidate as WorkshopState;
}

/**
 * Migrate a stored payload to the current shape. Version 1 was previously stamped as version 2
 * without inspection, so any shape difference passed straight into live state. Unknown or
 * unreadable payloads are discarded rather than coerced.
 */
export function migrateWorkshopState(raw: unknown): WorkshopState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (candidate.version === 2) return parseWorkshopState(candidate);
  if (candidate.version !== undefined && candidate.version !== 1) return null;
  const record = (item: unknown) => (item && typeof item === "object" && !Array.isArray(item) ? (item as Record<number, unknown>) : {});
  const bounded = (item: unknown, min: number, max: number, fallback: number) =>
    Number.isInteger(item) && (item as number) >= min && (item as number) <= max ? (item as number) : fallback;
  return parseWorkshopState({
    version: 2,
    level: bounded(candidate.level, 1, 12, 1),
    adoptedThrough: bounded(candidate.adoptedThrough, 0, 12, 0),
    revealed: record(candidate.revealed),
    submissions: record(candidate.submissions),
    hints: record(candidate.hints),
    orientationSeen: candidate.orientationSeen === true,
    scoring: candidate.scoring === true,
  });
}

export const outcomeLabels: Record<OutcomeKind, string> = {
  best: "Restores all constraints",
  costly: "Works, but exceeds justified cost or complexity",
  partial: "Addresses one symptom",
  wrong: "Targets the wrong area",
  invariant: "Breaks a stated invariant",
};
