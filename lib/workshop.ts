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
}

export interface EvidenceSpec {
  id: string;
  category: string;
  title: string;
  value: string;
  meaning: string;
  role: EvidenceRole;
  wave?: 1 | 2 | 3;
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
  metricEffects?: Record<string, number | null>;
  coverage?: string[];
  areaFit: string;
  fitBoundary: string;
  outcomeModel: {
    affectedMetricIds: string[];
    progress: number;
  };
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
  capstone?: { budget: number; maxSelections: number; evidenceRequired: number };
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

export function metricStatus(value: number | null, metric: MetricSpec): MetricStatus {
  if (value === null || metric.kind === "observation") return "observed";
  if (metric.direction === "zero") return value === 0 ? "healthy" : "breached";
  if (metric.direction === "equal") return value === metric.threshold ? "healthy" : "breached";
  if (metric.threshold === undefined) return "healthy";
  if (metric.direction === "higher") {
    if (value >= metric.threshold) return "healthy";
    if (value >= metric.threshold * 0.85) return "risk";
    return "breached";
  }
  if (value <= metric.threshold) return "healthy";
  if (value <= metric.threshold * 1.2) return "risk";
  return "breached";
}

export function presetValue(metric: MetricSpec, preset: TrafficPreset): number | null {
  return metric.presets[preset];
}

export function deterministicWave(seed: number, points = 22): number[] {
  let state = (seed + 1) * 9301 + 49297;
  return Array.from({ length: points }, (_, index) => {
    state = (state * 233280 + 17) % 2147483647;
    const noise = (state / 2147483647 - 0.5) * 18;
    return Math.max(12, Math.min(94, 46 + Math.sin((index + seed) * 0.62) * 12 + noise));
  });
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
  if (["L12-A2", "L12-A3", "L12-A4", "L12-A5"].every((id) => selected.has(id))) return "costly";
  return "partial";
}

export function scoreBreakdown(level: LevelSpec, submission: Submission) {
  const hypothesis = level.hypotheses.find((item) => item.id === submission.hypothesisId);
  const evidence = submission.evidenceIds.reduce((score, id) => {
    const item = level.evidence.find((candidate) => candidate.id === id);
    return score + (item?.role === "decisive" ? 12.5 : item?.role === "supporting" ? 6.25 : 0);
  }, 0);
  const kind = outcomeKindForSubmission(level, submission);
  const interventionFit: Record<OutcomeKind, number> = { best: 25, costly: 25, partial: 12, wrong: 0, invariant: 0 };
  const costAndSimplicity: Record<OutcomeKind, number> = { best: 15, costly: 4, partial: 8, wrong: 0, invariant: 0 };
  return {
    diagnosis: hypothesis?.score ?? 0,
    evidence: Math.min(25, evidence),
    interventionFit: interventionFit[kind],
    costAndSimplicity: costAndSimplicity[kind],
  };
}

export function scoreSubmission(level: LevelSpec, submission: Submission): number {
  return Math.round(Object.values(scoreBreakdown(level, submission)).reduce((total, value) => total + value, 0));
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

export function optionMetricValue(level: LevelSpec, option: OptionSpec, metricId: string): number | null {
  const metric = level.metrics.find((item) => item.id === metricId);
  if (!metric) return null;
  if (option.metricEffects && Object.prototype.hasOwnProperty.call(option.metricEffects, metricId)) return option.metricEffects[metricId]!;
  if (!option.outcomeModel.affectedMetricIds.includes(metricId) || metric.value === null || metric.after === null) return metric.value;
  return Math.round((metric.value + (metric.after - metric.value) * option.outcomeModel.progress) * 10) / 10;
}

const capstoneMetricCoverage: Record<string, string[]> = {
  usefulCheckout: ["dependency", "amplification", "resources", "zone"],
  errors: ["dependency", "amplification", "resources", "zone", "deploy"],
  burn: ["dependency", "amplification", "resources", "zone", "deploy"],
  checkoutP95: ["dependency", "resources", "zone", "deploy"],
  queueAge: ["resources"],
  amplification: ["dependency", "amplification"],
  orderLoss: ["zone"],
};

export function capstoneMetricValue(level: LevelSpec, optionIds: string[], metricId: string): number | null {
  const metric = level.metrics.find((item) => item.id === metricId);
  if (!metric || metric.value === null || metric.after === null) return metric?.value ?? null;
  const required = capstoneMetricCoverage[metricId];
  if (!required) return metric.value;
  const covered = new Set<string>();
  optionIds.forEach((id) => level.options.find((option) => option.id === id)?.coverage?.forEach((dimension) => covered.add(dimension)));
  const progress = required.filter((dimension) => covered.has(dimension)).length / required.length;
  return Math.round((metric.value + (metric.after - metric.value) * progress) * 10) / 10;
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

export const outcomeLabels: Record<OutcomeKind, string> = {
  best: "Restores all constraints",
  costly: "Works, but exceeds justified cost or complexity",
  partial: "Addresses one symptom",
  wrong: "Targets the wrong area",
  invariant: "Breaks a stated invariant",
};
