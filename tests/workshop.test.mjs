import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateCanonicalLedger,
  deterministicWave,
  formatMetric,
  metricStatus,
  presetValue,
  scoreSubmission,
} from "../lib/workshop.ts";

const latency = {
  id: "latency",
  label: "p95 latency",
  value: 1_000,
  after: 180,
  unit: "ms",
  threshold: 300,
  direction: "lower",
};

test("metric thresholds distinguish healthy, risk, and breached", () => {
  assert.equal(metricStatus(180, latency), "healthy");
  assert.equal(metricStatus(340, latency), "risk");
  assert.equal(metricStatus(1_000, latency), "breached");
  assert.equal(formatMetric(1_200, latency), "1,200 ms");
});

test("traffic presets never mutate the supplied metric", () => {
  const original = structuredClone(latency);
  assert.ok(presetValue(latency, "normal") < presetValue(latency, "incident"));
  assert.deepEqual(latency, original);
});

test("telemetry waves are deterministic and bounded", () => {
  assert.deepEqual(deterministicWave(7), deterministicWave(7));
  assert.equal(deterministicWave(7).length, 22);
  assert.ok(deterministicWave(7).every((point) => point >= 12 && point <= 94));
});

test("canonical ledger spends only adopted levels", () => {
  const levels = [
    { id: 1, canonicalCost: 300, canonicalPoints: 2 },
    { id: 2, canonicalCost: 450, canonicalPoints: 3 },
  ];
  assert.deepEqual(calculateCanonicalLedger(levels, 1), { monthly: 5_700, points: 68 });
});

test("reasoning score rewards diagnosis, decisive evidence, and canonical action", () => {
  const level = {
    hypotheses: [{ id: "h1", label: "CPU", score: 25 }],
    evidence: [
      { id: "e1", role: "decisive" },
      { id: "e2", role: "decisive" },
    ],
    canonicalOptionIds: ["a1"],
  };
  const submission = { hypothesisId: "h1", evidenceIds: ["e1", "e2"], optionIds: ["a1"] };
  assert.equal(scoreSubmission(level, submission), 90);
});

test("content source defines all twelve levels and required investigation fields", async () => {
  const source = await readFile(new URL("../data/levels.ts", import.meta.url), "utf8");
  const levelIds = [...source.matchAll(/^\s+id: (\d+),$/gm)].map((match) => Number(match[1]));
  assert.deepEqual(levelIds, Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal((source.match(/participantTitle:/g) ?? []).length, 12);
  assert.equal((source.match(/canonicalOptionIds:/g) ?? []).length, 12);
  assert.equal((source.match(/hints:/g) ?? []).length, 12);
  assert.match(source, /capstone:\s*\{ budget: 12, maxSelections: 4, evidenceRequired: 3 \}/);
});
