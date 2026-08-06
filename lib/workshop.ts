export type MetricStatus = "healthy" | "risk" | "breached" | "observed";
export type OutcomeKind = "best" | "costly" | "partial" | "invariant";
export type EvidenceRole = "decisive" | "supporting" | "context";
export type TrafficPreset = "normal" | "campaign" | "peak" | "incident";
export type MetricKind = "slo" | "capacity" | "invariant" | "observation";

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
  level: number;
  adoptedThrough: number;
  revealed: Record<number, string[]>;
  submissions: Record<number, Submission>;
  hints: Record<number, number>;
  orientationSeen: boolean;
  scoring: boolean;
}

export const initialWorkshopState: WorkshopState = {
  level: 1,
  adoptedThrough: 0,
  revealed: {},
  submissions: {},
  hints: {},
  orientationSeen: false,
  scoring: false,
};

const trafficFactors: Record<TrafficPreset, number> = {
  normal: 0.35,
  campaign: 0.65,
  peak: 0.85,
  incident: 1,
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
  if (preset === "incident") return metric.value;
  if (metric.value === null) return null;
  const factor = trafficFactors[preset];
  const healthyReference = metric.after ?? metric.value;
  if (metric.direction === "zero") return preset === "peak" ? metric.value * 0.35 : 0;
  if (metric.direction === "higher") return Math.max(healthyReference * 0.9, metric.value * factor);
  return Math.max(healthyReference * 0.8, metric.value * (0.42 + factor * 0.58));
}

export function deterministicWave(seed: number, points = 22): number[] {
  let state = (seed + 1) * 9301 + 49297;
  return Array.from({ length: points }, (_, index) => {
    state = (state * 233280 + 17) % 2147483647;
    const noise = (state / 2147483647 - 0.5) * 18;
    return Math.max(12, Math.min(94, 46 + Math.sin((index + seed) * 0.62) * 12 + noise));
  });
}

export function calculateCanonicalLedger(levels: LevelSpec[], adoptedThrough: number) {
  return levels
    .filter((level) => level.id <= adoptedThrough)
    .reduce(
      (ledger, level) => ({
        monthly: ledger.monthly - level.canonicalCost,
        points: ledger.points - level.canonicalPoints,
      }),
      { monthly: 6000, points: 70 },
    );
}

export function scoreSubmission(level: LevelSpec, submission: Submission): number {
  const hypothesis = level.hypotheses.find((item) => item.id === submission.hypothesisId);
  const evidence = submission.evidenceIds.reduce((score, id) => {
    const item = level.evidence.find((candidate) => candidate.id === id);
    return score + (item?.role === "decisive" ? 12.5 : item?.role === "supporting" ? 6.25 : 0);
  }, 0);
  const canonical = level.canonicalOptionIds.every((id) => submission.optionIds.includes(id));
  return Math.round((hypothesis?.score ?? 0) + Math.min(25, evidence) + (canonical ? 40 : 15));
}

export const outcomeLabels: Record<OutcomeKind, string> = {
  best: "Restores all constraints",
  costly: "Restores the SLO with excess cost or complexity",
  partial: "Addresses one symptom",
  invariant: "Breaks a stated invariant",
};
