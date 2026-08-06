"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { levels } from "@/data/levels";
import {
  calculateCanonicalLedger,
  formatMetric,
  initialWorkshopState,
  metricStatus,
  outcomeLabels,
  presetValue,
  scoreSubmission,
  type OptionSpec,
  type Submission,
  type TrafficPreset,
  type WorkshopState,
} from "@/lib/workshop";
import { ArchitectureMap } from "./ArchitectureMap";
import { MetricCard } from "./MetricCard";

const STORAGE_KEY = "scaleshop-workshop-v1";
const presetLabels: Record<TrafficPreset, string> = { normal: "Normal", campaign: "Campaign", peak: "Peak", incident: "Incident" };

function stableOptionOrder<T extends { id: string }>(items: T[], seed: number): T[] {
  return [...items]
    .map((item) => ({ item, weight: [...item.id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0) + seed * 17) % 1009, 7) }))
    .sort((a, b) => a.weight - b.weight)
    .map(({ item }) => item);
}

function coverageFor(optionIds: string[]) {
  const coverage = new Set<string>();
  optionIds.forEach((id) => levels[11].options.find((item) => item.id === id)?.coverage?.forEach((item) => coverage.add(item)));
  return coverage;
}

export function Workshop() {
  const [state, setState] = useState<WorkshopState>(initialWorkshopState);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<"participant" | "facilitator">("participant");
  const [spoilers, setSpoilers] = useState(false);
  const [preset, setPreset] = useState<TrafficPreset>("incident");
  const [motionPaused, setMotionPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [hypothesisId, setHypothesisId] = useState("");
  const [citedEvidence, setCitedEvidence] = useState<string[]>([]);
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [fit, setFit] = useState("");
  const [prediction, setPrediction] = useState("");
  const [risk, setRisk] = useState("");
  const [resultView, setResultView] = useState<"team" | "canonical">("team");
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const level = levels[state.level - 1];
  const submission = state.submissions[level.id];
  const revealed = state.revealed[level.id] ?? [];
  const hintCount = state.hints[level.id] ?? 0;
  const ledger = calculateCanonicalLedger(levels, state.adoptedThrough);
  const requiredEvidence = level.capstone?.evidenceRequired ?? 2;
  const citedWaves = new Set(citedEvidence.map((id) => level.evidence.find((item) => item.id === id)?.wave).filter(Boolean));
  const selectedPoints = optionIds.reduce((sum, id) => sum + (level.options.find((item) => item.id === id)?.points ?? 0), 0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initialWorkshopState, ...JSON.parse(saved) });
    } catch {
      // Storage is optional; the workshop continues in memory.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* optional local persistence */ }
  }, [state, hydrated]);

  useEffect(() => {
    const existing = state.submissions[level.id];
    setHypothesisId(existing?.hypothesisId ?? "");
    setCitedEvidence(existing?.evidenceIds ?? []);
    setOptionIds(existing?.optionIds ?? []);
    setFit(existing?.fit ?? "");
    setPrediction(existing?.prediction ?? "");
    setRisk(existing?.risk ?? "");
    setResultView(existing ? "team" : "team");
    setPreset(level.id === 1 ? "normal" : "incident");
    setShowAllMetrics(false);
  }, [level.id, state.submissions]);

  useEffect(() => {
    if (motionPaused) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 2400);
    return () => window.clearInterval(id);
  }, [motionPaused]);

  const selectedOptions = useMemo(
    () => (submission?.optionIds ?? optionIds).map((id) => level.options.find((item) => item.id === id)).filter(Boolean) as OptionSpec[],
    [level.options, optionIds, submission],
  );
  const orderedOptions = useMemo(() => stableOptionOrder(level.options, level.id), [level.id, level.options]);
  const displayedMetrics = showAllMetrics ? level.metrics : level.metrics.slice(0, 4);

  const selectedOutcome = useMemo(() => {
    if (!submission) return null;
    if (!level.capstone) return selectedOptions[0] ?? null;
    const selected = new Set(submission.optionIds);
    const canonical = level.canonicalOptionIds.every((id) => selected.has(id));
    const alternate = ["L12-A2", "L12-A3", "L12-A4", "L12-A5"].every((id) => selected.has(id));
    const coverage = coverageFor(submission.optionIds);
    return {
      id: "capstone-outcome",
      title: canonical ? "Smallest sufficient resilience set" : alternate ? "Broader fallback set" : "Partially contained failure set",
      mechanism: `${coverage.size} of 5 protection dimensions covered`, monthlyCost: 0, points: selectedOptions.reduce((sum, item) => sum + item.points, 0),
      leadTime: "Layered program", reversibility: "Hard" as const,
      kind: canonical ? "best" as const : alternate ? "costly" as const : "partial" as const,
      summary: canonical
        ? "Checkout, shared resources, zone recovery, and deployment failure are contained with one resilience point left unspent."
        : alternate
          ? "All displayed constraints recover, but broader fallback policy uses the entire resilience allowance."
          : `The set covers ${[...coverage].join(", ") || "no complete failure dimension"}; at least one injected failure remains uncontained.`,
      risk: "The uncovered dimension remains visible in the consequence metrics and recovery timeline.",
    };
  }, [level, selectedOptions, submission]);

  function revealEvidence(id: string) {
    if (revealed.includes(id)) return;
    setState((current) => ({ ...current, revealed: { ...current.revealed, [level.id]: [...revealed, id] } }));
  }

  function toggleCitation(id: string) {
    setCitedEvidence((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < requiredEvidence ? [...current, id] : current);
  }

  function toggleOption(id: string) {
    if (!level.capstone) { setOptionIds([id]); return; }
    const item = level.options.find((candidate) => candidate.id === id);
    if (!item) return;
    setOptionIds((current) => {
      if (current.includes(id)) return current.filter((itemId) => itemId !== id);
      const currentPoints = current.reduce((sum, itemId) => sum + (level.options.find((candidate) => candidate.id === itemId)?.points ?? 0), 0);
      if (current.length >= level.capstone!.maxSelections || currentPoints + item.points > level.capstone!.budget) return current;
      return [...current, id];
    });
  }

  const readyForOptions = hypothesisId !== "" && citedEvidence.length === requiredEvidence && (!level.capstone || citedWaves.size === 3);
  const readyToSubmit = readyForOptions && optionIds.length > 0 && fit.trim().length >= 8 && prediction.trim().length >= 8 && risk.trim().length >= 8;

  function submit() {
    if (!readyToSubmit) return;
    const next: Submission = { hypothesisId, evidenceIds: citedEvidence, optionIds, fit: fit.trim(), prediction: prediction.trim(), risk: risk.trim(), submittedAt: new Date().toISOString() };
    setState((current) => ({ ...current, submissions: { ...current.submissions, [level.id]: next } }));
    setResultView("team");
    window.setTimeout(() => resultRef.current?.focus(), 50);
  }

  function adoptAndContinue() {
    setState((current) => ({ ...current, adoptedThrough: Math.max(current.adoptedThrough, level.id), level: Math.min(12, level.id + 1) }));
    window.scrollTo({ top: 0, behavior: motionPaused ? "auto" : "smooth" });
  }

  function resetWorkshop() {
    if (!window.confirm("Reset the entire local workshop? This clears all decisions and progress.")) return;
    setState({ ...initialWorkshopState, orientationSeen: true });
  }

  function revealAnswer() {
    if (!window.confirm(`Reveal the official answer for Level ${level.id}?`)) return;
    setSpoilers(true);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }

  function valueFor(metricId: string) {
    const metric = level.metrics.find((item) => item.id === metricId)!;
    if (!submission) return presetValue(metric, preset);
    if (resultView === "canonical") return metric.after;
    if (level.capstone) {
      if (selectedOutcome?.kind === "best" || selectedOutcome?.kind === "costly") return metric.after;
      if (metric.value === null) return null;
      if (metric.direction === "zero") return metric.value;
      return metric.value * 0.68;
    }
    const effects = selectedOptions[0]?.metricEffects;
    return effects && Object.prototype.hasOwnProperty.call(effects, metricId) ? effects[metricId]! : metric.value;
  }

  if (!hydrated) return <main className="boot-shell"><div className="boot-mark">S</div><p>Restoring your workshop…</p></main>;

  return (
    <main className="workshop-shell">
      <a className="skip-link" href="#current-task">Skip to current task</a>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">S</span><span><strong>ScaleShop</strong><small>Scalability Lab</small></span></div>
        <div className="topbar-status"><span className="live-dot" /> SIMULATED ENVIRONMENT</div>
        <div className="topbar-actions">
          <button className={`mode-button ${mode === "facilitator" ? "active" : ""}`} onClick={() => { setMode(mode === "participant" ? "facilitator" : "participant"); setSpoilers(false); }}>
            {mode === "participant" ? "Participant view" : spoilers ? "Answers visible" : "Presenter safe"}
          </button>
          <button className="icon-button" onClick={toggleFullscreen} aria-label="Toggle fullscreen">⛶</button>
        </div>
      </header>

      <nav className="journey" aria-label="Workshop levels">
        <div className="journey-scroll">
          {levels.map((item) => {
            const done = state.adoptedThrough >= item.id;
            return <button key={item.id} className={`${item.id === level.id ? "active" : ""} ${done ? "done" : ""}`} onClick={() => setState((current) => ({ ...current, level: item.id }))} aria-current={item.id === level.id ? "step" : undefined}>
              <span>{String(item.id).padStart(2, "0")}</span><strong>{item.participantTitle}</strong>{done && <i>✓</i>}
            </button>;
          })}
        </div>
      </nav>

      <div className="workspace">
        <section className="level-hero" id="current-task">
          <div>
            <p className="eyebrow">Level {String(level.id).padStart(2, "0")} / {level.phase}</p>
            <h1>{submission ? level.techniqueTitle : level.participantTitle}</h1>
            <p>{level.incident}</p>
          </div>
          <div className="ledger-card" aria-label="Canonical architecture allowance">
            <span>Canonical allowance</span><strong>€{ledger.monthly.toLocaleString()}<small>/mo</small></strong><strong>{ledger.points}<small> engineering pts</small></strong>
          </div>
        </section>

        <div className="phase-anchors" aria-label="Page sections">
          <a href="#architecture">Architecture</a><a href="#telemetry">Telemetry</a><a href="#evidence">Evidence</a><a href="#decision">Decision</a>{submission && <a href="#debrief">Debrief</a>}
        </div>

        <ArchitectureMap stage={submission ? level.id : Math.max(0, level.id - 1)} level={level} evolved={Boolean(submission)} />

        <section className="brief-grid">
          <article className="panel incident-card"><p className="eyebrow">The pressure</p><h2>{level.question}</h2><p>{level.incident}</p></article>
          <article className="panel constraints-card"><p className="eyebrow">Operating contract</p><h2>Constraints</h2><ul>{level.constraints.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>

        <section id="telemetry" className="panel telemetry-panel" aria-labelledby="telemetry-title">
          <div className="section-heading">
            <div><p className="eyebrow">60-second window</p><h2 id="telemetry-title">Core telemetry</h2></div>
            <div className="telemetry-controls">
              {!submission && <div className="segmented" aria-label="Traffic preset">{(Object.keys(presetLabels) as TrafficPreset[]).map((item) => <button key={item} className={preset === item ? "active" : ""} onClick={() => setPreset(item)}>{presetLabels[item]}</button>)}</div>}
              {submission && <div className="segmented"><button className={resultView === "team" ? "active" : ""} onClick={() => setResultView("team")}>Team experiment</button><button className={resultView === "canonical" ? "active" : ""} onClick={() => setResultView("canonical")}>Canonical</button></div>}
              <button className="secondary-button" onClick={() => setMotionPaused((value) => !value)}>{motionPaused ? "Resume motion" : "Pause motion"}</button>
            </div>
          </div>
          <div className="metric-grid">{displayedMetrics.map((item, index) => <MetricCard key={item.id} metric={item} value={valueFor(item.id)} seed={level.id * 20 + index + tick} paused={motionPaused} />)}</div>
          {level.metrics.length > 4 && <button className="metric-expand" onClick={() => setShowAllMetrics((value) => !value)} aria-expanded={showAllMetrics}>{showAllMetrics ? "Show core signals only" : `Inspect ${level.metrics.length - 4} additional signals`}</button>}
        </section>

        <section id="evidence" className="panel evidence-panel" aria-labelledby="evidence-title">
          <div className="section-heading"><div><p className="eyebrow">Investigate</p><h2 id="evidence-title">Evidence desk</h2></div><span className="inspection-count">{revealed.length} / {level.evidence.length} inspected</span></div>
          <p className="section-intro">Open as much evidence as useful. Then nominate the {requiredEvidence} most decisive items.</p>
          <div className="evidence-grid">
            {level.evidence.map((item) => {
              const isOpen = revealed.includes(item.id); const cited = citedEvidence.includes(item.id);
              return <article className={`evidence-card ${isOpen ? "open" : ""}`} key={item.id}>
                <span className="category-label">{item.wave ? `Wave ${item.wave} · ` : ""}{item.category}</span><h3>{item.title}</h3>
                {isOpen ? <><strong>{item.value}</strong><p>{item.meaning}</p><label className="cite-control"><input type="checkbox" checked={cited} onChange={() => toggleCitation(item.id)} disabled={!cited && citedEvidence.length >= requiredEvidence || Boolean(submission)} /> Cite as decisive</label></> : <button onClick={() => revealEvidence(item.id)}>Inspect evidence <span>→</span></button>}
              </article>;
            })}
          </div>
        </section>

        <section id="decision" className="decision-grid">
          <article className="panel diagnosis-panel">
            <p className="eyebrow">Diagnose</p><h2>Where is the bottleneck?</h2>
            <fieldset disabled={Boolean(submission)}><legend className="sr-only">Select a bottleneck hypothesis</legend>{level.hypotheses.map((item) => <label className="radio-row" key={item.id}><input type="radio" name="hypothesis" value={item.id} checked={hypothesisId === item.id} onChange={() => setHypothesisId(item.id)} /><span>{item.label}</span></label>)}</fieldset>
            <div className="selection-summary"><span>{citedEvidence.length} / {requiredEvidence} evidence cited</span>{level.capstone && <span>{citedWaves.size} / 3 waves represented</span>}<span>{hypothesisId ? "Hypothesis selected" : "Choose a hypothesis"}</span></div>
          </article>

          <article className={`panel options-panel ${readyForOptions ? "ready" : "locked"}`}>
            <div className="section-heading"><div><p className="eyebrow">Decide</p><h2>{level.capstone ? "Choose resilience actions" : "Choose the next change"}</h2></div>{level.capstone && <span className="points-counter">{selectedPoints} / {level.capstone.budget} pts · {optionIds.length} / {level.capstone.maxSelections}</span>}</div>
            {!readyForOptions ? <div className="decision-lock"><span>↳</span><p>Select a hypothesis and cite {requiredEvidence} revealed evidence items{level.capstone ? ", with one from each failure wave," : ""} before comparing tools.</p></div> : <fieldset disabled={Boolean(submission)}><legend className="sr-only">Select an intervention</legend><div className="option-list">{orderedOptions.map((item) => {
              const checked = optionIds.includes(item.id); const wouldExceed = Boolean(level.capstone && !checked && (optionIds.length >= level.capstone.maxSelections || selectedPoints + item.points > level.capstone.budget));
              return <label className={`option-card ${checked ? "selected" : ""} ${wouldExceed ? "disabled" : ""}`} key={item.id}><input aria-label={item.title} type={level.capstone ? "checkbox" : "radio"} name="option" checked={checked} disabled={wouldExceed || Boolean(submission)} onChange={() => toggleOption(item.id)} /><span className="option-copy"><strong>{item.title}</strong><span>{item.mechanism}</span><small>€{item.monthlyCost}/mo · {item.points} pts · {item.leadTime} · {item.reversibility}</small></span></label>;
            })}</div></fieldset>}
          </article>
        </section>

        {readyForOptions && <section className="panel reasoning-panel">
          <p className="eyebrow">Reason</p><h2>Predict the trade-off</h2>
          <div className="reasoning-grid">
            <label>Why is this the smallest sufficient change?<textarea value={fit} onChange={(event) => setFit(event.target.value)} disabled={Boolean(submission)} placeholder="Tie the mechanism to the stated constraint…" /></label>
            <label>What should improve—and remain unchanged?<textarea value={prediction} onChange={(event) => setPrediction(event.target.value)} disabled={Boolean(submission)} placeholder="Predict metric movement and a stable signal…" /></label>
            <label>What important new risk appears?<textarea value={risk} onChange={(event) => setRisk(event.target.value)} disabled={Boolean(submission)} placeholder="Name the operational or correctness cost…" /></label>
          </div>
          {!submission && <button className="primary-button commit-button" disabled={!readyToSubmit} onClick={submit}>Submit team experiment <span>→</span></button>}
        </section>}

        {submission && selectedOutcome && <section id="debrief" className="panel result-panel" ref={resultRef} tabIndex={-1} aria-labelledby="result-title">
          <div className="result-banner"><span>{outcomeLabels[selectedOutcome.kind]}</span><strong id="result-title">{selectedOutcome.title}</strong><p>{selectedOutcome.summary}</p></div>
          <div className="comparison-table-wrap"><table><caption>Team experiment metric outcome</caption><thead><tr><th>Signal</th><th>Before</th><th>Team outcome</th><th>Canonical</th></tr></thead><tbody>{level.metrics.map((item) => { const teamValue = resultView === "team" ? valueFor(item.id) : item.after; return <tr key={item.id}><th>{item.label}</th><td>{formatMetric(item.value, item)}</td><td><span className={`table-status status-${metricStatus(teamValue, item)}`}>{formatMetric(teamValue, item)}</span></td><td>{formatMetric(item.after, item)}</td></tr>; })}</tbody></table></div>
          <div className="debrief-grid">
            <article><span>Official diagnosis</span><h3>{level.official.bottleneck}</h3><p>{level.official.evidence}</p></article>
            <article><span>Why it fits</span><h3>{level.official.fit}</h3><p><strong>Verification:</strong> {level.official.verification}</p></article>
            <article><span>New complexity</span><h3>{level.official.risk}</h3><p><strong>Your predicted risk:</strong> {submission.risk}</p></article>
          </div>
          <div className="cost-comparison"><div><span>Your experiment would cost</span><strong>€{selectedOptions.reduce((sum, item) => sum + item.monthlyCost, 0)}/mo · {selectedOptions.reduce((sum, item) => sum + item.points, 0)} pts</strong></div><div><span>Canonical next change</span><strong>€{level.canonicalCost}/mo · {level.canonicalPoints || "separate"} pts</strong></div>{state.scoring && <div><span>Team reasoning review</span><strong>{scoreSubmission(level, submission)} / 90 automatic · 10 team self-review</strong></div>}</div>
          <div className="next-callout"><p><span>{level.id === 12 && state.adoptedThrough === 12 ? "Workshop complete" : "Next pressure"}</span>{level.id === 12 && state.adoptedThrough === 12 ? "The team completed all 12 incidents. Use the journey to revisit any decision and compare reasoning." : level.official.next}</p>{!(level.id === 12 && state.adoptedThrough === 12) && <button className="primary-button" onClick={adoptAndContinue}>{level.id === 12 ? "Complete workshop" : "Adopt canonical change and continue"} <span>→</span></button>}</div>
        </section>}

        {mode === "facilitator" && <aside className="facilitator-dock" aria-label="Facilitator controls">
          <div><span className={`presenter-state ${spoilers ? "danger" : ""}`}>{spoilers ? "ANSWERS VISIBLE" : "PRESENTER SAFE"}</span><strong>Facilitator</strong></div>
          <button onClick={() => setMotionPaused((value) => !value)}>{motionPaused ? "Resume" : "Pause"}</button>
          <button disabled={state.adoptedThrough > 0 || Object.keys(state.submissions).length > 0} title="Scoring can only be changed before Level 1 begins" onClick={() => setState((current) => ({ ...current, scoring: !current.scoring }))}>{state.scoring ? "Hide score" : "Show score"}</button>
          <button onClick={() => setState((current) => ({ ...current, hints: { ...current.hints, [level.id]: Math.min(2, hintCount + 1) } }))} disabled={hintCount >= 2}>Reveal hint {Math.min(2, hintCount + 1)}</button>
          <button onClick={revealAnswer}>{spoilers ? "Answer revealed" : "Reveal answer"}</button>
          <button onClick={resetWorkshop}>Reset workshop</button>
          {hintCount > 0 && <div className="facilitator-popover"><span>Investigation hint</span>{level.hints.slice(0, hintCount).map((item) => <p key={item}>{item}</p>)}</div>}
          {spoilers && <div className="facilitator-popover spoiler"><span>Official diagnosis</span><p>{level.official.bottleneck}</p><strong>Canonical: {level.options.filter((item) => level.canonicalOptionIds.includes(item.id)).map((item) => item.title).join(", ")}</strong><p>{level.stretch}</p></div>}
        </aside>}
      </div>

      {!state.orientationSeen && <div className="modal-backdrop" role="presentation"><section className="orientation-modal" role="dialog" aria-modal="true" aria-labelledby="orientation-title"><span className="orientation-kicker">60-second orientation</span><h2 id="orientation-title">Scale by evidence, not instinct.</h2><p>For every incident, your team follows the same diagnostic loop.</p><ol><li><b>Inspect</b> evidence and thresholds.</li><li><b>Diagnose</b> the limiting resource or failure.</li><li><b>Cite</b> the two signals that prove it.</li><li><b>Compare</b> changes, cost, and reversibility.</li><li><b>Predict</b> improvement and new risk.</li><li><b>Commit once</b>, then compare with the canonical path.</li></ol><div className="orientation-note">Hints are free. Wrong experiments teach. Only the canonical change continues the shared architecture.</div><button className="primary-button" onClick={() => setState((current) => ({ ...current, orientationSeen: true }))}>Enter the lab <span>→</span></button></section></div>}
    </main>
  );
}
