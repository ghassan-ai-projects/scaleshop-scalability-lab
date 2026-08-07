import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateCanonicalLedger,
  calculateCanonicalLedgerHistory,
  capstoneMetricValue,
  deterministicWave,
  formatMetric,
  metricStatus,
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
  definition: "Request latency in the scenario window.",
  provenance: { sourceClass: "observability-derived" },
  presets: { normal: 180, campaign: 240, peak: 310, incident: 1_000 },
};

test("metric thresholds distinguish healthy, risk, and breached", () => {
  assert.equal(metricStatus(180, latency), "healthy");
  assert.equal(metricStatus(340, latency), "risk");
  assert.equal(metricStatus(1_000, latency), "breached");
  assert.equal(formatMetric(1_200, latency), "1,200 ms");
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

test("telemetry waves are deterministic and bounded", () => {
  assert.deepEqual(deterministicWave(7), deterministicWave(7));
  assert.equal(deterministicWave(7).length, 22);
  assert.ok(deterministicWave(7).every((point) => point >= 12 && point <= 94));
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

test("outcome classes receive graduated fit and simplicity scores", () => {
  const base = {
    hypotheses: [{ id: "h1", score: 25 }], evidence: [{ id: "e1", role: "decisive" }, { id: "e2", role: "decisive" }], canonicalOptionIds: ["best"],
    options: [{ id: "best", kind: "best" }, { id: "costly", kind: "costly" }, { id: "partial", kind: "partial" }, { id: "wrong", kind: "wrong" }, { id: "unsafe", kind: "invariant" }],
  };
  const submission = (id) => ({ hypothesisId: "h1", evidenceIds: ["e1", "e2"], optionIds: [id] });
  assert.equal(scoreSubmission(base, submission("best")), 90);
  assert.equal(scoreSubmission(base, submission("costly")), 79);
  assert.equal(scoreSubmission(base, submission("partial")), 70);
  assert.equal(scoreSubmission(base, submission("wrong")), 50);
  assert.equal(scoreSubmission(base, submission("unsafe")), 50);
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
    for (const metric of level.metrics.slice(0, 4)) {
      if (level.id === 11 && metric.id === "hotSet") continue; // Stored history is fixed; Level 11 varies write pressure, not data size.
      assert.notEqual(metricStatus(metric.presets.normal, metric), "breached", `Level ${level.id} ${metric.id} breaches at Normal`);
    }
  }
});

test("option feedback and lead-time bands are complete", () => {
  for (const option of levels.flatMap((level) => level.options)) {
    assert.ok(option.areaFit.length > 20);
    assert.ok(option.fitBoundary.length > 20);
    assert.ok(option.outcomeModel);
    assert.ok(option.outcomeModel.progress >= 0 && option.outcomeModel.progress <= 1);
    if (option.points > 10) assert.equal(option.leadTime, "More than one month");
  }
});

test("option outcome models change only authored signals", () => {
  for (const level of levels.filter((item) => !item.capstone)) {
    for (const option of level.options) {
      for (const metric of level.metrics) {
        const outcome = optionMetricValue(level, option, metric.id);
        if (!option.outcomeModel.affectedMetricIds.includes(metric.id)) assert.equal(outcome, metric.value, `${option.id} changed unauthored ${metric.id}`);
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

test("content source defines all twelve levels and required investigation fields", async () => {
  const source = await readFile(new URL("../data/levels.ts", import.meta.url), "utf8");
  const levelIds = [...source.matchAll(/^\s+id: (\d+),$/gm)].map((match) => Number(match[1]));
  assert.deepEqual(levelIds, Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal((source.match(/participantTitle:/g) ?? []).length, 12);
  assert.equal((source.match(/canonicalOptionIds:/g) ?? []).length, 12);
  assert.equal((source.match(/hints:/g) ?? []).length, 12);
  assert.match(source, /capstone:\s*\{ budget: 12, maxSelections: 4, evidenceRequired: 3 \}/);
  assert.match(source, /"Orders accepted", 563, 500/);
  assert.equal((source.match(/"decisive", [123]\)/g) ?? []).length, 6);
});

test("level zero briefing explains the lab without becoming a scored level", async () => {
  const source = await readFile(new URL("../components/LabIntroduction.tsx", import.meta.url), "utf8");
  assert.match(source, /00 \/ Lab briefing/);
  assert.match(source, /Twelve progressive engineering decisions/);
  assert.match(source, /Reference architecture budget/);
  assert.match(source, /Experiments are counterfactual/);
  assert.doesNotMatch(source, /LevelSpec|canonicalOptionIds|scoreSubmission/);
});
