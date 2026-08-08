/**
 * Content validation gate — review-round-4.md §10.
 *
 * The earlier suite checked that content *existed*. It could not express the class of defect
 * that actually shipped: a set of metrics that individually look reasonable but together
 * describe a system state that cannot occur. Every check here detected a real defect in the
 * shipped data, so each one is a regression test, not a hypothetical.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { capstoneMetricValue, coreMetrics, metricStatus, optionMetricValue } from "../lib/workshop.ts";
import { levels } from "../data/levels.ts";

const PRESETS = ["normal", "campaign", "peak", "incident"];
const find = (level, id) => level.metrics.find((item) => item.id === id);
const at = (metric, preset) => metric.presets[preset];

/** Every state a participant can put on screen: the four presets plus each option's outcome. */
function reachableStates(level) {
  const states = PRESETS.map((preset) => ({
    label: `preset "${preset}"`,
    read: (id) => at(find(level, id), preset),
  }));
  for (const option of level.options) {
    states.push({
      label: `option ${option.id}`,
      read: (id) => (level.capstone ? capstoneMetricValue(level, [option.id], id) : optionMetricValue(level, option, id)),
    });
  }
  if (level.capstone) {
    states.push({ label: "capstone canonical set", read: (id) => capstoneMetricValue(level, level.canonicalOptionIds, id) });
    states.push({ label: "capstone alternate set", read: (id) => capstoneMetricValue(level, level.capstone.alternateOptionIds, id) });
  }
  states.push({ label: "canonical outcome", read: (id) => find(level, id).after });
  return states;
}

// 1 — caught five states where the shop completed more work than arrived, including the
// capstone's "No injection" preset reporting 32.5 useful completions from 30 offered requests.
test("completed work never exceeds offered work in any reachable state", () => {
  for (const level of levels) {
    for (const rule of level.relationships ?? []) {
      const [offeredId, completedId] = rule.kind === "conservation" ? [rule.offered, rule.completed] : [rule.offered, rule.completed];
      if (!offeredId || !completedId) continue;
      for (const state of reachableStates(level)) {
        const offered = state.read(offeredId);
        const completed = state.read(completedId);
        if (offered === null || completed === null) continue;
        assert.ok(
          completed <= offered + 1e-9,
          `L${level.id} ${state.label}: ${completedId}=${completed} exceeds ${offeredId}=${offered}`,
        );
      }
    }
  }
});

// 2 — caught the capstone rendering "Retry amplification: 0.8x" against its own definition of
// downstream attempts divided by offered requests, which has a hard floor of 1.0x.
test("no metric crosses its declared physical floor", () => {
  for (const level of levels) {
    for (const metric of level.metrics.filter((item) => item.floor !== undefined)) {
      for (const state of reachableStates(level)) {
        const value = state.read(metric.id);
        if (value === null) continue;
        assert.ok(value >= metric.floor, `L${level.id} ${state.label}: ${metric.id}=${value} below floor ${metric.floor}`);
      }
    }
  }
});

// 3 — caught a 22x burn rate authored against 12% errors and a 1% budget, which implies 12x.
test("derived metrics agree with their inputs within rounding tolerance", () => {
  for (const level of levels) {
    for (const rule of level.relationships ?? []) {
      for (const state of reachableStates(level)) {
        if (rule.kind === "successRate") {
          const offered = state.read(rule.offered);
          const errors = state.read(rule.errors);
          const completed = state.read(rule.completed);
          if ([offered, errors, completed].some((item) => item === null)) continue;
          const implied = offered * (1 - errors / 100);
          assert.ok(Math.abs(implied - completed) <= 0.15, `L${level.id} ${state.label}: ${rule.completed}=${completed} but ${rule.offered} and ${rule.errors} imply ${implied.toFixed(2)}`);
        }
        if (rule.kind === "burnRate") {
          const errors = state.read(rule.errors);
          const burn = state.read(rule.burn);
          const budget = find(level, rule.errors).threshold;
          if (errors === null || burn === null) continue;
          const implied = errors / budget;
          assert.ok(Math.abs(implied - burn) <= 0.15, `L${level.id} ${state.label}: ${rule.burn}=${burn}x but ${errors}% against a ${budget}% budget implies ${implied.toFixed(1)}x`);
        }
      }
    }
  }
});

// 4 — the interpolation model blended a participant's choice toward a mechanism they did not
// pick, producing states such as latency down 70% with completed throughput unmoved.
test("every standard option authors its own outcome", () => {
  for (const level of levels.filter((item) => !item.capstone)) {
    for (const option of level.options) {
      assert.ok(option.metricEffects, `${option.id} has no authored metricEffects`);
      assert.ok(Object.keys(option.metricEffects).length > 0, `${option.id} authors an empty outcome`);
      for (const id of Object.keys(option.metricEffects)) {
        assert.ok(find(level, id), `${option.id} authors an effect on unknown metric ${id}`);
      }
    }
  }
});

// 5 — caught five levels where selecting the recommended option produced a debrief table whose
// rows disagreed with the recommendation column.
test("the canonical option reproduces the canonical outcome exactly", () => {
  for (const level of levels.filter((item) => !item.capstone)) {
    const canonical = level.options.find((item) => level.canonicalOptionIds.includes(item.id));
    for (const metric of level.metrics) {
      assert.equal(
        optionMetricValue(level, canonical, metric.id),
        metric.after,
        `L${level.id} ${canonical.id} yields ${metric.id}=${optionMetricValue(level, canonical, metric.id)} but after=${metric.after}`,
      );
    }
  }
});

// 6 — the core row was `metrics.slice(0, 4)`, so Level 1's debrief showed four healthy cards
// while the finding that sets up Level 2 sat behind a disclosure button.
test("every level authors a core row, before and after the decision", () => {
  for (const level of levels) {
    for (const submitted of [false, true]) {
      const core = coreMetrics(level, submitted);
      assert.ok(core.length >= 3 && core.length <= 4, `L${level.id} core row has ${core.length} metrics`);
      assert.equal(new Set(core.map((item) => item.id)).size, core.length, `L${level.id} core row repeats a metric`);
    }
    for (const id of [...level.coreMetricIds, ...(level.coreMetricIdsAfter ?? [])]) {
      assert.ok(find(level, id), `L${level.id} core row names unknown metric ${id}`);
    }
  }
});

// 7 — Level 1 rendered four preset buttons that changed nothing, on the first screen a
// participant ever touches.
test("a level either varies across presets or says why it cannot", () => {
  for (const level of levels) {
    const varies = level.metrics.some((metric) => new Set(PRESETS.map((preset) => at(metric, preset))).size > 1);
    if (level.presetsUnavailable) {
      assert.ok(!varies, `L${level.id} declares presets unavailable but some metric varies`);
      assert.ok(level.presetsUnavailable.length > 40, `L${level.id} must explain why presets are unavailable`);
    } else {
      assert.ok(varies, `L${level.id} renders a preset control that changes nothing`);
    }
  }
});

// 8 — the generic formula scaled per-request and structural quantities with traffic, producing
// "0.4 healthy instances" and a per-request query count that fell with arrival rate.
test("flat metrics hold still and non-flat metrics move", () => {
  for (const level of levels) {
    for (const metric of level.metrics) {
      const distinct = new Set(PRESETS.map((preset) => at(metric, preset))).size;
      if (metric.presetsFlat) assert.equal(distinct, 1, `L${level.id} ${metric.id} is flagged flat but varies`);
      else if (!level.presetsUnavailable) assert.ok(distinct > 1, `L${level.id} ${metric.id} is not flagged flat but never moves`);
    }
  }
});

// 9 — a cache hit ratio of 0% rendered as Breached on a level where no cache exists.
test("nothing is breached at the calm preset unless it is a standing condition", () => {
  const violations = [];
  for (const level of levels) {
    for (const metric of level.metrics) {
      // Absent components and standing conditions are authored as such and reviewed on purpose.
      if (metric.presetsFlat || metric.standingBreach) continue;
      if (metricStatus(at(metric, "normal"), metric) === "breached") {
        violations.push(`L${level.id} ${metric.id} = ${at(metric, "normal")} against a ${metric.threshold} target`);
      }
    }
  }
  assert.deepEqual(violations, [], `breached at the calm preset without a \`standing\` flag:\n  ${violations.join("\n  ")}`);
});

// 10 — a flat 1.2x risk band left Level 7's 91% primary against an 80% limit reading only
// "at risk", so the level about an overloaded primary never turned red.
test("every level shows at least one breached signal at its incident preset", () => {
  for (const level of levels) {
    // Level 1 is the exception the data already declares: nothing is measurably wrong, and
    // establishing what "wrong" would even mean is the task.
    if (level.presetsUnavailable) continue;
    const breached = level.metrics.filter((metric) => metricStatus(at(metric, "incident"), metric) === "breached");
    assert.ok(breached.length > 0, `L${level.id} signals no breach at its incident preset`);
    const core = coreMetrics(level, false).map((item) => item.id);
    assert.ok(
      breached.some((metric) => core.includes(metric.id)),
      `L${level.id} breaches only outside the core row: ${breached.map((item) => item.id).join(", ")}`,
    );
  }
});

// 11 — `wrong` and `invariant` both scored 50/90, so trading away a stated correctness
// guarantee read as a near-pass.
test("absent components report N/A rather than a misleading zero", () => {
  for (const level of levels) {
    for (const metric of level.metrics.filter((item) => item.absentComponent)) {
      assert.equal(metric.value, null, `L${level.id} ${metric.id} is absent but carries a value`);
      assert.ok(PRESETS.every((preset) => at(metric, preset) === null));
      assert.equal(metricStatus(metric.value, metric), "observed");
    }
  }
});

// 12 — locks in the shape the levels already had: one right answer, one best option.
test("each level has exactly one full-credit hypothesis and one best option", () => {
  for (const level of levels) {
    assert.equal(level.hypotheses.filter((item) => item.score === 25).length, 1, `L${level.id} hypotheses`);
    const decisive = level.evidence.filter((item) => item.role === "decisive").length;
    assert.ok(decisive >= (level.capstone?.evidenceRequired ?? 2), `L${level.id} has too few decisive items to cite`);
    if (!level.capstone) assert.equal(level.options.filter((item) => item.kind === "best").length, 1, `L${level.id} options`);
  }
});

test("the capstone's alternate set is authored and genuinely restores the constraints", () => {
  const level = levels[11];
  const { alternateOptionIds, budget, coverageDimensions } = level.capstone;
  const cost = (ids) => ids.reduce((sum, id) => sum + level.options.find((item) => item.id === id).points, 0);
  assert.ok(cost(level.canonicalOptionIds) <= budget);
  assert.ok(cost(alternateOptionIds) <= budget);
  assert.ok(cost(level.canonicalOptionIds) < cost(alternateOptionIds), "the canonical set must be the cheaper of the two");
  for (const metric of level.metrics) {
    assert.equal(capstoneMetricValue(level, alternateOptionIds, metric.id), metric.after, `alternate set misses ${metric.id}`);
  }
  const declared = new Set(coverageDimensions);
  for (const option of level.options) {
    for (const dimension of option.coverage ?? []) assert.ok(declared.has(dimension), `${option.id} covers undeclared ${dimension}`);
  }
});
