import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateCanonicalLedger,
  calculateCanonicalLedgerHistory,
  capstoneMetricValue,
  coreMetrics,
  formatMetric,
  metricMeter,
  metricStatus,
  migrateWorkshopState,
  missedDecisiveEvidence,
  orderedOptions,
  optionMetricValue,
  parseWorkshopState,
  presetValue,
  scoreBreakdown,
  scoreSubmission,
} from "../lib/workshop.ts";
import { levels } from "../data/levels.ts";

const latency = {
  id: "latency",
  label: "p95 latency",
  value: 1_000,
  after: 180,
  unit: "ms",
  threshold: 300,
  direction: "lower",
  kind: "slo",
  definition: "Request latency in the scenario window.",
  provenance: { sourceClass: "observability-derived" },
  presets: { normal: 180, campaign: 240, peak: 310, incident: 1_000 },
};

const utilization = { ...latency, id: "cpu", label: "Primary CPU", unit: "%", threshold: 80, kind: "capacity", value: 91, after: 52 };

test("metric thresholds distinguish healthy, risk, and breached", () => {
  assert.equal(metricStatus(180, latency), "healthy");
  assert.equal(metricStatus(340, latency), "risk");
  assert.equal(metricStatus(1_000, latency), "breached");
  assert.equal(formatMetric(1_200, latency), "1,200 ms");
});

test("a capacity limit breaches when crossed; the warning band sits below it", () => {
  assert.equal(metricStatus(60, utilization), "healthy");
  assert.equal(metricStatus(76, utilization), "risk");
  assert.equal(metricStatus(81, utilization), "breached");
  // The flat 1.2x band previously left Level 7's 91% primary reading only "at risk".
  assert.equal(metricStatus(91, utilization), "breached");
});

test("a higher-is-better capacity target warns before it breaches", () => {
  const throughput = { ...utilization, id: "throughput", direction: "higher", threshold: 100 };
  assert.equal(metricStatus(100, throughput), "healthy");
  assert.equal(metricStatus(95, throughput), "risk");
  assert.equal(metricStatus(89, throughput), "breached");
});

test("the metric meter encodes the value, the target, and the incident baseline", () => {
  const meter = metricMeter(180, latency);
  assert.ok(meter.fill > 0 && meter.fill < 100);
  assert.ok(meter.thresholdAt > meter.fill, "the target rule sits beyond a healthy fill");
  assert.equal(Math.round(meter.baselineAt), 87, "the dashed baseline marks the 1,000 ms incident value");
  assert.equal(metricMeter(1_000, latency).baselineAt, null, "no baseline mark while still at the incident value");
  assert.equal(metricMeter(null, latency), null);
});

test("diagnostic, unavailable, and exact-target metrics are not mislabelled", () => {
  assert.equal(metricStatus(78, { ...latency, kind: "observation" }), "observed");
  assert.equal(metricStatus(null, latency), "observed");
  assert.equal(formatMetric(null, latency), "N/A");
  const exact = { ...latency, threshold: 500, direction: "equal", kind: "invariant" };
  assert.equal(metricStatus(563, exact), "breached");
  assert.equal(metricStatus(500, exact), "healthy");
});

test("traffic presets use explicit centers and never mutate the metric", () => {
  const original = structuredClone(latency);
  assert.equal(presetValue(latency, "normal"), 180);
  assert.equal(presetValue(latency, "peak"), 310);
  assert.equal(presetValue(latency, "incident"), 1_000);
  assert.deepEqual(latency, original);
});

test("the shared-screen row is authored, and the debrief may promote a different set", () => {
  const level = levels[0];
  assert.deepEqual(coreMetrics(level, false).map((item) => item.id), ["catalogueP95", "checkoutP95", "errors", "traceCoverage"]);
  // The load test's finding must reach the core row, not sit behind a disclosure button.
  assert.deepEqual(coreMetrics(level, true).map((item) => item.id), ["sustainableRps", "offeredRps", "dbCpu", "traceCoverage"]);
  for (const item of levels) assert.ok(coreMetrics(item, false).length >= 3 && coreMetrics(item, false).length <= 4);
});

test("canonical ledger spends only adopted levels", () => {
  const levels = [
    { id: 1, techniqueTitle: "Cache", canonicalCost: 300, canonicalPoints: 2 },
    { id: 2, techniqueTitle: "Queue", canonicalCost: 450, canonicalPoints: 3 },
  ];
  assert.deepEqual(calculateCanonicalLedger(levels, 1), { monthly: 5_700, points: 68 });
  assert.deepEqual(calculateCanonicalLedgerHistory(levels, 2), [
    { levelId: 1, title: "Cache", monthlyCost: 300, points: 2, remainingMonthly: 5_700, remainingPoints: 68 },
    { levelId: 2, title: "Queue", monthlyCost: 450, points: 3, remainingMonthly: 5_250, remainingPoints: 65 },
  ]);
});

test("full reference path stays within the declared architecture budget", () => {
  const history = calculateCanonicalLedgerHistory(levels, 12);
  assert.equal(history.length, 12);
  assert.deepEqual(calculateCanonicalLedger(levels, 12), { monthly: 2_370, points: 17 });
  assert.ok(history.every((entry) => entry.remainingMonthly >= 0 && entry.remainingPoints >= 0));
});

test("reasoning score rewards diagnosis, decisive evidence, and canonical action", () => {
  const level = {
    hypotheses: [{ id: "h1", label: "CPU", score: 25 }],
    evidence: [
      { id: "e1", role: "decisive" },
      { id: "e2", role: "decisive" },
    ],
    options: [{ id: "a1", kind: "best" }],
    canonicalOptionIds: ["a1"],
  };
  const submission = { hypothesisId: "h1", evidenceIds: ["e1", "e2"], optionIds: ["a1"] };
  assert.equal(scoreSubmission(level, submission), 90);
  assert.deepEqual(scoreBreakdown(level, submission), { diagnosis: 25, evidence: 25, interventionFit: 25, costAndSimplicity: 15 });
});

const scoringBase = {
  hypotheses: [{ id: "h1", score: 25 }], evidence: [{ id: "e1", role: "decisive" }, { id: "e2", role: "decisive" }], canonicalOptionIds: ["best"],
  options: [{ id: "best", kind: "best" }, { id: "costly", kind: "costly" }, { id: "partial", kind: "partial" }, { id: "wrong", kind: "wrong" }, { id: "unsafe", kind: "invariant" }],
};
const scoringSubmission = (id) => ({ hypothesisId: "h1", evidenceIds: ["e1", "e2"], optionIds: [id] });

test("outcome classes receive graduated fit and simplicity scores", () => {
  assert.equal(scoreSubmission(scoringBase, scoringSubmission("best")), 90);
  assert.equal(scoreSubmission(scoringBase, scoringSubmission("costly")), 70);
  assert.equal(scoreSubmission(scoringBase, scoringSubmission("partial")), 70);
  assert.equal(scoreSubmission(scoringBase, scoringSubmission("wrong")), 56);
  assert.equal(scoreSubmission(scoringBase, scoringSubmission("unsafe")), 25);
});

test("breaching a stated invariant is the worst available answer", () => {
  const score = (id) => scoreSubmission(scoringBase, scoringSubmission(id));
  assert.ok(score("unsafe") < score("wrong"), "an invariant breach must rank below merely wrong");
  assert.ok(score("costly") < score("best"), "over-scaling must not tie with the smallest sufficient change");
  // A perfect diagnosis with perfect evidence must not carry an invariant breach to a pass.
  assert.ok(score("unsafe") < 45);
});

test("the debrief can name the decisive evidence the team left on the desk", () => {
  const level = levels[2];
  const decisive = level.evidence.filter((item) => item.role === "decisive");
  const submission = { hypothesisId: "", evidenceIds: [decisive[0].id], optionIds: [] };
  const missed = missedDecisiveEvidence(level, submission);
  assert.deepEqual(missed.map((item) => item.id), decisive.slice(1).map((item) => item.id));
  assert.equal(missedDecisiveEvidence(level, { evidenceIds: decisive.map((item) => item.id) }).length, 0);
});

test("standard-level option positions are balanced across all five slots", () => {
  const positions = levels.filter((level) => !level.capstone).map((level) => orderedOptions(level).findIndex((option) => level.canonicalOptionIds.includes(option.id)) + 1);
  const counts = Array.from({ length: 5 }, (_, index) => positions.filter((position) => position === index + 1).length);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `position counts were ${counts.join(",")}`);
});

test("all level metrics have explicit preset centers and provenance", () => {
  for (const level of levels) {
    for (const metric of level.metrics) {
      assert.deepEqual(Object.keys(metric.presets), ["normal", "campaign", "peak", "incident"]);
      assert.equal(metric.presets.incident, metric.value);
      assert.ok(metric.definition.length > 20);
      assert.ok(metric.provenance.sourceClass);
    }
  }
});

test("option feedback and lead-time bands are complete", () => {
  for (const option of levels.flatMap((level) => level.options)) {
    assert.ok(option.areaFit.length > 20);
    assert.ok(option.fitBoundary.length > 20);
    if (option.points > 10) assert.equal(option.leadTime, "More than one month");
  }
});

test("option outcomes are authored, never interpolated toward the canonical result", () => {
  for (const level of levels.filter((item) => !item.capstone)) {
    for (const option of level.options) {
      assert.ok(option.metricEffects, `${option.id} has no authored metricEffects`);
      for (const metric of level.metrics) {
        const outcome = optionMetricValue(level, option, metric.id);
        if (!Object.prototype.hasOwnProperty.call(option.metricEffects, metric.id)) {
          assert.equal(outcome, metric.value, `${option.id} changed unauthored ${metric.id}`);
        }
      }
    }
  }
});

test("capstone aggregation reaches canonical values only with required coverage", () => {
  const level = levels[11];
  for (const metric of level.metrics) assert.equal(capstoneMetricValue(level, level.canonicalOptionIds, metric.id), metric.after);
  assert.notEqual(capstoneMetricValue(level, ["L12-A6"], "errors"), level.metrics.find((metric) => metric.id === "errors").after);
  assert.equal(capstoneMetricValue(level, ["L12-A6"], "offeredCheckout"), level.metrics.find((metric) => metric.id === "offeredCheckout").value);
});

test("persisted state is versioned and range checked", () => {
  const valid = { version: 2, level: 3, adoptedThrough: 2, revealed: {}, submissions: {}, hints: {}, orientationSeen: true, scoring: false };
  assert.deepEqual(parseWorkshopState(valid), valid);
  assert.equal(parseWorkshopState({ ...valid, version: 1 }), null);
  assert.equal(parseWorkshopState({ ...valid, level: 99 }), null);
});

test("legacy state is migrated field by field rather than stamped with a new version", () => {
  const migrated = migrateWorkshopState({ version: 1, level: 4, adoptedThrough: 3, revealed: { 4: ["e1"] }, submissions: {}, hints: {} });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.level, 4);
  assert.deepEqual(migrated.revealed, { 4: ["e1"] });
  assert.equal(migrated.orientationSeen, false, "missing booleans take a safe default rather than passing through");
  // Out-of-range and unknown payloads are discarded, not coerced into live state.
  assert.equal(migrateWorkshopState({ version: 1, level: 99 }).level, 1);
  assert.equal(migrateWorkshopState({ version: 7, level: 3 }), null);
  assert.equal(migrateWorkshopState("nonsense"), null);
});

test("content source defines all twelve levels and required investigation fields", async () => {
  const source = await readFile(new URL("../data/levels.ts", import.meta.url), "utf8");
  const levelIds = [...source.matchAll(/^\s+id: (\d+),$/gm)].map((match) => Number(match[1]));
  assert.deepEqual(levelIds, Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal((source.match(/participantTitle:/g) ?? []).length, 12);
  assert.equal((source.match(/canonicalOptionIds:/g) ?? []).length, 12);
  assert.equal((source.match(/hints:/g) ?? []).length, 12);
  assert.match(source, /budget: 12,\s*maxSelections: 4,\s*evidenceRequired: 3,/);
  assert.match(source, /"Orders accepted", 563, 500/);
  // Structural rather than textual: the capstone needs decisive evidence in all three waves.
  const capstoneDecisive = levels[11].evidence.filter((item) => item.role === "decisive");
  assert.equal(capstoneDecisive.length, 6);
  assert.deepEqual([...new Set(capstoneDecisive.map((item) => item.wave))].sort(), [1, 2, 3]);
});

test("level zero briefing explains the lab without becoming a scored level", async () => {
  const source = await readFile(new URL("../components/LabIntroduction.tsx", import.meta.url), "utf8");
  assert.match(source, /00 \/ Welcome to ScaleShop/);
  assert.match(source, /Keep the shop healthy as it grows/);
  assert.match(source, /Your shared budget/);
  assert.match(source, /Good decisions you can explain/);
  assert.doesNotMatch(source, /counterfactual|canonical|smallest sufficient|operating contract/);
  assert.doesNotMatch(source, /[—–]/);
  assert.doesNotMatch(source, /LevelSpec|canonicalOptionIds|scoreSubmission/);
});

test("level navigation is collapsible on desktop and remains labeled", async () => {
  const component = await readFile(new URL("../components/Workshop.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /aria-controls="journey-levels"/);
  assert.match(component, /aria-expanded={!levelRailCollapsed}/);
  assert.match(component, /aria-label={`Level \$\{item\.id}: \$\{item\.participantTitle}/);
  assert.match(styles, /\.workshop-layout\.is-rail-collapsed \{ grid-template-columns: 4\.5rem/);
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.journey-scroll \{ flex-direction: row/);
});
