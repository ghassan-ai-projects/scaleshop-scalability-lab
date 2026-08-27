"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { levels } from "@/data/levels";
import {
  calculateCanonicalLedger,
  capstoneCoverage,
  capstoneCoverageSummary,
  capstoneGaps,
  capstoneMetricValue,
  coreMetrics,
  formatMetric,
  initialWorkshopState,
  hypothesisRationale,
  metricStatus,
  migrateWorkshopState,
  missedDecisiveEvidence,
  orderedOptions,
  optionMetricValue,
  outcomeLabels,
  outcomeKindForSubmission,
  presetValue,
  scoreBreakdown,
  scoreSubmission,
  type LevelSpec,
  type OptionSpec,
  type Submission,
  type TrafficPreset,
  type WorkshopState,
} from "@/lib/workshop";
import { ArchitectureMap } from "./ArchitectureMap";
import { MetricCard } from "./MetricCard";
import { ReferenceBudget } from "./ReferenceBudget";
import { LabIntroduction } from "./LabIntroduction";
import { SiteFooter } from "./SiteFooter";

const STORAGE_KEY = "scaleshop-workshop-v2";
const LEGACY_STORAGE_KEY = "scaleshop-workshop-v1";
const presetLabels: Record<TrafficPreset, string> = { normal: "Normal", campaign: "Campaign", peak: "Peak", incident: "Incident" };
const scenarioPresetLabels: Partial<Record<number, Record<TrafficPreset, string>>> = {
  10: { normal: "Open sale", campaign: "Admission rising", peak: "Stock boundary", incident: "Contention incident" },
  11: { normal: "Normal writes", campaign: "Write growth", peak: "I/O boundary", incident: "Maintenance incident" },
  12: { normal: "No injection", campaign: "One failure", peak: "Coupled failures", incident: "Compound incident" },
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export function Workshop() {
  const [state, setState] = useState<WorkshopState>(initialWorkshopState);
  const [hydrated, setHydrated] = useState(false);
  const [savedCandidate, setSavedCandidate] = useState<WorkshopState | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "memory">("saving");
  const [mode, setMode] = useState<"participant" | "facilitator">("participant");
  const [spoilers, setSpoilers] = useState(false);
  const [preset, setPreset] = useState<TrafficPreset>("incident");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hypothesisId, setHypothesisId] = useState("");
  const [citedEvidence, setCitedEvidence] = useState<string[]>([]);
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [fit, setFit] = useState("");
  const [prediction, setPrediction] = useState("");
  const [risk, setRisk] = useState("");
  const [resultView, setResultView] = useState<"team" | "canonical">("team");
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [levelRailCollapsed, setLevelRailCollapsed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const orientationButtonRef = useRef<HTMLButtonElement>(null);

  const level: LevelSpec = levels[state.level - 1];
  const submission = state.submissions[level.id];
  const revealed = state.revealed[level.id] ?? [];
  const hintCount = state.hints[level.id] ?? 0;
  const ledger = calculateCanonicalLedger(levels, state.adoptedThrough);
  const projectedLedger = calculateCanonicalLedger(levels, Math.max(state.adoptedThrough, level.id));
  const requiredEvidence = level.capstone?.evidenceRequired ?? 2;
  const citedWaves = new Set(citedEvidence.map((id) => level.evidence.find((item) => item.id === id)?.wave).filter(Boolean));
  const selectedPoints = optionIds.reduce((sum, id) => sum + (level.options.find((item) => item.id === id)?.points ?? 0), 0);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    try {
      const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = migrateWorkshopState(JSON.parse(saved));
        if (parsed && (parsed.level > 1 || parsed.adoptedThrough > 0 || Object.keys(parsed.submissions).length > 0)) setSavedCandidate(parsed);
        else if (parsed) {
          setState(parsed);
          setShowIntroduction(!parsed.orientationSeen);
        }
      }
    } catch {
      setSaveStatus("memory");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || savedCandidate) return;
    setSaveStatus("saving");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setSaveStatus("saved"); } catch { setSaveStatus("memory"); }
  }, [state, hydrated, savedCandidate]);

  useEffect(() => {
    const existing = state.submissions[level.id];
    setHypothesisId(existing?.hypothesisId ?? "");
    setCitedEvidence(existing?.evidenceIds ?? []);
    setOptionIds(existing?.optionIds ?? []);
    setFit(existing?.fit ?? "");
    setPrediction(existing?.prediction ?? "");
    setRisk(existing?.risk ?? "");
    setResultView("team");
    setPreset("incident");
    setShowAllMetrics(false);
  }, [level.id, state.submissions]);

  useEffect(() => {
    if (savedCandidate) orientationButtonRef.current?.focus();
  }, [savedCandidate]);

  const selectedOptions = useMemo(
    () => (submission?.optionIds ?? optionIds).map((id) => level.options.find((item) => item.id === id)).filter(Boolean) as OptionSpec[],
    [level.options, optionIds, submission],
  );
  const displayedOptions = useMemo(() => orderedOptions(level), [level]);
  const curatedCore = useMemo(() => coreMetrics(level, Boolean(submission)), [level, submission]);
  const displayedMetrics = showAllMetrics ? level.metrics : curatedCore;
  const hiddenMetricCount = level.metrics.length - curatedCore.length;
  const activePresetLabels = scenarioPresetLabels[level.id] ?? presetLabels;

  const selectedOutcome = useMemo(() => {
    if (!submission) return null;
    if (!level.capstone) return selectedOptions[0] ?? null;
    const kind = outcomeKindForSubmission(level, submission);
    const canonical = kind === "best";
    const alternate = kind === "costly";
    const coverage = capstoneCoverage(level, submission.optionIds);
    const dimensionCount = level.capstone.coverageDimensions.length;
    return {
      id: "capstone-outcome",
      title: canonical ? "Smallest sufficient resilience set" : alternate ? "Broader fallback set" : "Partially contained failure set",
      mechanism: `${coverage.size} of ${dimensionCount} protection dimensions covered`, monthlyCost: 0, points: selectedOptions.reduce((sum, item) => sum + item.points, 0),
      leadTime: "Layered program", reversibility: "Hard" as const,
      kind,
      summary: canonical
        ? "Checkout, shared resources, zone recovery, and deployment failure are contained with one resilience point left unspent."
        : alternate
          ? "All displayed constraints recover, but broader fallback policy uses the entire resilience allowance."
          : `The set covers ${[...coverage].join(", ") || "no complete failure dimension"}; at least one injected failure remains uncontained.`,
      risk: "The uncovered dimension remains visible in the consequence metrics and recovery timeline.",
    };
  }, [level, selectedOptions, submission]);

  const hasNumericTeamOutcome = Boolean(submission);

  // Derive from `current`, never from the render-scoped `revealed`. Reading the closure meant
  // two clicks inside one React batch both built their array from the same stale snapshot, so
  // the second silently overwrote the first and evidence reveals were lost.
  function revealEvidence(id: string) {
    setState((current) => {
      const open = current.revealed[level.id] ?? [];
      if (open.includes(id)) return current;
      return { ...current, revealed: { ...current.revealed, [level.id]: [...open, id] } };
    });
  }

  function revealHint() {
    setState((current) => ({
      ...current,
      hints: { ...current.hints, [level.id]: Math.min(2, (current.hints[level.id] ?? 0) + 1) },
    }));
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
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function openLevel(levelId: number) {
    setShowIntroduction(false);
    setState((current) => ({ ...current, level: levelId, orientationSeen: true }));
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function resetWorkshop() {
    if (!window.confirm("Reset the entire local workshop? This clears all decisions and progress.")) return;
    setState({ ...initialWorkshopState, orientationSeen: true });
  }

  function resetCurrentLevel() {
    setState((current) => {
      const submissions = { ...current.submissions }; const revealedState = { ...current.revealed }; const hintsState = { ...current.hints };
      delete submissions[level.id]; delete revealedState[level.id]; delete hintsState[level.id];
      return { ...current, submissions, revealed: revealedState, hints: hintsState };
    });
  }

  function trapDialog(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled)")];
    if (!controls.length) return;
    const first = controls[0]; const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function revealAnswer() {
    if (!window.confirm(`Reveal the official answer for Level ${level.id}?`)) return;
    setSpoilers(true);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }

  /** What the team's own choice produced, independent of which view the cards are showing. */
  function teamOutcomeValue(metricId: string) {
    const metric = level.metrics.find((item) => item.id === metricId)!;
    if (!submission) return metric.value;
    if (level.capstone) return capstoneMetricValue(level, submission.optionIds, metricId);
    return selectedOptions[0] ? optionMetricValue(level, selectedOptions[0], metricId) : metric.value;
  }

  function valueFor(metricId: string) {
    const metric = level.metrics.find((item) => item.id === metricId)!;
    if (!submission) return presetValue(metric, preset);
    return resultView === "canonical" ? metric.after : teamOutcomeValue(metricId);
  }

  if (!hydrated) return <main className="boot-shell"><div className="boot-mark">S</div><p>Restoring your workshop…</p></main>;

  return (
    <main className="workshop-shell">
      <div className="application-content" inert={savedCandidate ? true : undefined}>
      <a className="skip-link" href="#current-task">Skip to current task</a>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">S</span><span><strong>ScaleShop</strong><small>Scalability Lab</small></span></div>
        <div className="topbar-status"><span className="live-dot" /> SIMULATED ENVIRONMENT · {saveStatus === "saved" ? "SAVED LOCALLY" : saveStatus === "saving" ? "SAVING" : "NOT SAVED"}</div>
        <div className="topbar-actions">
          <button className={`mode-button ${mode === "facilitator" ? "active" : ""}`} onClick={() => { setMode(mode === "participant" ? "facilitator" : "participant"); setSpoilers(false); }}>
            {mode === "participant" ? "Participant view" : spoilers ? "Answers visible" : "Presenter safe"}
          </button>
          <button className="icon-button" onClick={toggleFullscreen} aria-label="Toggle fullscreen">⛶</button>
        </div>
      </header>

      <div className={`workshop-layout ${levelRailCollapsed ? "is-rail-collapsed" : ""}`}>
        <nav className={`journey ${levelRailCollapsed ? "is-collapsed" : ""}`} aria-label="Workshop levels">
          <div className="journey-header">
            <strong>Workshop journey</strong>
            <button
              type="button"
              aria-controls="journey-levels"
              aria-expanded={!levelRailCollapsed}
              aria-label={levelRailCollapsed ? "Expand level navigation" : "Collapse level navigation"}
              title={levelRailCollapsed ? "Expand level navigation" : "Collapse level navigation"}
              onClick={() => setLevelRailCollapsed((collapsed) => !collapsed)}
            >{levelRailCollapsed ? "»" : "«"}</button>
          </div>
          <div className="journey-scroll" id="journey-levels">
            <button aria-label="Level 0: Lab briefing" title="Level 0: Lab briefing" className={showIntroduction ? "active intro-tab" : "intro-tab"} onClick={() => { setShowIntroduction(true); window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }); }} aria-current={showIntroduction ? "step" : undefined}>
              <span>00</span><strong>Lab briefing</strong>
            </button>
            {levels.map((item) => {
              const done = state.adoptedThrough >= item.id;
              return <button key={item.id} aria-label={`Level ${item.id}: ${item.participantTitle}${done ? ", completed" : ""}`} title={`Level ${item.id}: ${item.participantTitle}`} className={`${!showIntroduction && item.id === level.id ? "active" : ""} ${done ? "done" : ""}`} onClick={() => openLevel(item.id)} aria-current={!showIntroduction && item.id === level.id ? "step" : undefined}>
                <span>{String(item.id).padStart(2, "0")}</span><strong>{item.participantTitle}</strong>{done && <i aria-label="Completed">✓</i>}
              </button>;
            })}
          </div>
        </nav>

        <div className="workspace">
        {showIntroduction ? <LabIntroduction currentLevel={state.level} hasProgress={state.adoptedThrough > 0 || Object.keys(state.submissions).length > 0} onContinue={() => openLevel(state.level)} /> : <>
        <section className="level-hero" id="current-task">
          <div>
            <p className="eyebrow">Level {String(level.id).padStart(2, "0")} / {level.phase}</p>
            <h1>{submission ? level.techniqueTitle : level.participantTitle}</h1>
            <p>{level.incident}</p>
          </div>
          <ReferenceBudget levels={levels} adoptedThrough={state.adoptedThrough} />
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
              {!submission && !level.presetsUnavailable && <div className="segmented" aria-label="Scenario preset">{(Object.keys(activePresetLabels) as TrafficPreset[]).map((item) => <button key={item} className={preset === item ? "active" : ""} onClick={() => setPreset(item)}>{activePresetLabels[item]}</button>)}</div>}
              {submission && <div className="segmented"><button className={resultView === "team" ? "active" : ""} onClick={() => setResultView("team")}>Team experiment</button><button className={resultView === "canonical" ? "active" : ""} onClick={() => setResultView("canonical")}>Recommended reference</button></div>}
            </div>
          </div>
          {!submission && level.presetsUnavailable && <p className="preset-unavailable" role="note">{level.presetsUnavailable}</p>}
          <div className="metric-grid">{displayedMetrics.map((item) => <MetricCard key={item.id} metric={item} value={valueFor(item.id)} />)}</div>
          {hiddenMetricCount > 0 && <button className="metric-expand" onClick={() => setShowAllMetrics((value) => !value)} aria-expanded={showAllMetrics}>{showAllMetrics ? "Show core signals only" : `Inspect ${hiddenMetricCount} additional signals`}</button>}
        </section>

        <section id="evidence" className="panel evidence-panel" aria-labelledby="evidence-title">
          <div className="section-heading"><div><p className="eyebrow">Investigate</p><h2 id="evidence-title">Evidence desk</h2></div><span className="inspection-count">{revealed.length} / {level.evidence.length} inspected</span></div>
          <p className="section-intro">Open as much evidence as useful. Then nominate the {requiredEvidence} most decisive items{level.capstone ? ", one from each failure wave" : ""}.</p>
          {level.capstone?.waveLabels && <ol className="wave-legend" aria-label="The three failure waves in this incident">{level.capstone.waveLabels.map((label, index) => <li key={label}><span className="wave-tag">Wave {index + 1}</span>{label}</li>)}</ol>}
          <div className="evidence-grid">
            {level.evidence.map((item) => {
              const isOpen = revealed.includes(item.id); const cited = citedEvidence.includes(item.id);
              const longestStage = Math.max(...(item.stages ?? [{ duration: 1 }]).map((entry) => entry.duration));
              return <article className={`evidence-card ${isOpen ? "open" : ""}`} key={item.id}>
                <span className="category-label">{item.wave ? `Wave ${item.wave} · ` : ""}{item.category}</span><h3>{item.title}</h3>
                {isOpen ? <><strong>{item.value}</strong>{item.stages && <div className="trace-breakdown" aria-label={`${item.title} stage durations`}>{item.stages.map((stage) => <div key={stage.label}><span>{stage.label}</span><i style={{ width: `${Math.max(8, stage.duration / longestStage * 100)}%` }} /><strong>{stage.duration.toLocaleString()} ms</strong></div>)}</div>}<p>{item.meaning}</p><label className="cite-control"><input type="checkbox" checked={cited} onChange={() => toggleCitation(item.id)} disabled={!cited && citedEvidence.length >= requiredEvidence || Boolean(submission)} aria-label={`Cite ${item.title} as decisive`} /> Cite as decisive</label></> : <button onClick={() => revealEvidence(item.id)} aria-label={`Inspect ${item.title}`}>Inspect evidence <span>→</span></button>}
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
            <div className="section-heading"><div><p className="eyebrow">Decide</p><h2>{level.capstone ? "Choose resilience actions" : "Choose the next change"}</h2></div>{level.capstone && <span className="points-counter">Resilience design budget: {selectedPoints} / {level.capstone.budget} pts · {optionIds.length} / {level.capstone.maxSelections} actions</span>}</div>
            {level.capstone && <p className="capstone-budget-note">This scenario-only budget limits the resilience actions you can combine. It is separate from the reference architecture effort budget.</p>}
            {!readyForOptions ? <div className="decision-lock"><span>↳</span><p>Select a hypothesis and cite {requiredEvidence} revealed evidence items{level.capstone ? ", with one from each failure wave," : ""} before comparing tools.</p></div> : <fieldset disabled={Boolean(submission)}><legend className="sr-only">Select an intervention</legend><div className="option-list">{displayedOptions.map((item) => {
              const checked = optionIds.includes(item.id); const wouldExceed = Boolean(level.capstone && !checked && (optionIds.length >= level.capstone.maxSelections || selectedPoints + item.points > level.capstone.budget));
              return <label className={`option-card ${checked ? "selected" : ""} ${wouldExceed ? "disabled" : ""}`} key={item.id}><input aria-label={item.title} type={level.capstone ? "checkbox" : "radio"} name="option" checked={checked} disabled={wouldExceed || Boolean(submission)} onChange={() => toggleOption(item.id)} /><span className="option-copy"><strong>{item.title}</strong><span>{item.mechanism}</span>{level.capstone && item.covers && <em className="option-covers">Contains: {item.covers}</em>}<small>{level.capstone ? `${item.points} resilience pts` : `€${item.monthlyCost}/mo · ${item.points} pts`} · {item.leadTime} · {item.reversibility}</small></span></label>;
            })}</div></fieldset>}
          </article>
        </section>

        {readyForOptions && <section className="panel reasoning-panel">
          <p className="eyebrow">Reason</p><h2>Predict the trade-off</h2>
          {!submission && <div className="participant-hints"><button className="secondary-button" onClick={revealHint} disabled={hintCount >= 2}>Reveal free hint {Math.min(2, hintCount + 1)}</button>{level.hints.slice(0, hintCount).map((item, index) => <p key={item}><strong>Hint {index + 1}:</strong> {item}</p>)}</div>}
          <div className="reasoning-grid">
            <label>Why is this the smallest sufficient change?<textarea value={fit} onChange={(event) => setFit(event.target.value)} disabled={Boolean(submission)} placeholder="Tie the mechanism to the stated constraint…" /></label>
            <label>What should improve—and remain unchanged?<textarea value={prediction} onChange={(event) => setPrediction(event.target.value)} disabled={Boolean(submission)} placeholder="Predict metric movement and a stable signal…" /></label>
            <label>What important new risk appears?<textarea value={risk} onChange={(event) => setRisk(event.target.value)} disabled={Boolean(submission)} placeholder="Name the operational or correctness cost…" /></label>
          </div>
          {!submission && <button className="primary-button commit-button" disabled={!readyToSubmit} onClick={submit}>Submit team experiment <span>→</span></button>}
        </section>}

        {submission && selectedOutcome && <section id="debrief" className="panel result-panel" ref={resultRef} tabIndex={-1} aria-labelledby="result-title" aria-live="polite">
          <div className="result-banner"><span>{outcomeLabels[selectedOutcome.kind]}</span><strong id="result-title">{selectedOutcome.title}</strong><p>{selectedOutcome.summary}</p></div>
          {/* The table always reports the team's own outcome. It previously followed `resultView`,
              so switching to the reference view rewrote the "Team outcome" column with the
              canonical values and showed a team its result as the recommended one. */}
          {hasNumericTeamOutcome && <div className="comparison-table-wrap"><table><caption>Modeled team experiment outcome; unlisted signals remain unchanged</caption><thead><tr><th>Signal</th><th>Before</th><th>Team outcome</th><th>Recommended reference</th></tr></thead><tbody>{level.metrics.map((item) => { const teamValue = teamOutcomeValue(item.id); return <tr key={item.id}><th>{item.label}</th><td>{formatMetric(item.value, item)}</td><td><span className={`table-status status-${metricStatus(teamValue, item)}`}>{formatMetric(teamValue, item)}</span></td><td>{formatMetric(item.after, item)}</td></tr>; })}</tbody></table></div>}
          <div className="contrast-debrief">
            <article><span>Your diagnosis</span><h3>{level.hypotheses.find((item) => item.id === submission.hypothesisId)?.label}</h3><p>{hypothesisRationale(level, submission.hypothesisId)}</p></article>
            <article><span>Your intervention</span><h3>{selectedOutcome.title}</h3><p>{selectedOptions.map((item) => item.areaFit).join(" ")}</p><p><strong>When it fits:</strong> {selectedOptions.map((item) => item.fitBoundary).join(" ")}</p></article>
            {selectedOutcome.kind !== "best" && <article className="canonical-answer"><span>Recommended next change</span><h3>{level.options.filter((item) => level.canonicalOptionIds.includes(item.id)).map((item) => item.title).join(" + ")}</h3><p>{level.options.filter((item) => level.canonicalOptionIds.includes(item.id)).map((item) => item.mechanism).join(" ")}</p><p><strong>Why:</strong> {level.official.fit}</p></article>}
          </div>
          {level.capstone && (() => {
            const summary = capstoneCoverageSummary(level, submission.optionIds);
            const gaps = capstoneGaps(level, submission.optionIds);
            return <div className={`coverage-scorecard ${gaps.length === 0 ? "complete" : "incomplete"}`} role="note">
              <div className="scorecard-count"><span>Failure domains contained</span><strong>{summary.contained} of {summary.total}</strong></div>
              {gaps.length === 0
                ? <p>{selectedOutcome?.kind === "costly" ? "Every failure domain is contained — but this set uses the whole allowance, more than the smallest sufficient one." : "Every injected failure domain is contained, with a resilience point to spare. This is the smallest sufficient set."}</p>
                : <><p>Each remaining domain still fails when its wave is replayed:</p><ul>{gaps.map((gap) => <li key={gap.dimension}><strong>{gap.label}</strong> — still exposed.{gap.closestFix ? <> Closest fix within budget: <em>{gap.closestFix.title}</em> ({gap.closestFix.points} pts).</> : null}</li>)}</ul></>}
            </div>;
          })()}
          {missedDecisiveEvidence(level, submission).length > 0 && <div className="missed-evidence" role="note">
            <span>Decisive evidence you did not cite</span>
            <ul>{missedDecisiveEvidence(level, submission).map((item) => <li key={item.id}><strong>{item.title}</strong> — {item.value}. {item.meaning}</li>)}</ul>
          </div>}
          <div className="debrief-grid">
            <article><span>Official diagnosis</span><h3>{level.official.bottleneck}</h3><p>{level.official.evidence}</p></article>
            <article><span>Why it fits</span><h3>{level.official.fit}</h3><p><strong>Verification:</strong> {level.official.verification}</p></article>
            <article><span>New complexity</span><h3>{level.official.risk}</h3><p><strong>Your predicted risk:</strong> {submission.risk}</p></article>
          </div>
          <div className="cost-comparison"><div><span>Your experiment would cost</span><strong>{level.capstone ? `${selectedOptions.reduce((sum, item) => sum + item.points, 0)} resilience pts` : `€${selectedOptions.reduce((sum, item) => sum + item.monthlyCost, 0)}/mo · ${selectedOptions.reduce((sum, item) => sum + item.points, 0)} pts`}</strong><small>Counterfactual only; this does not spend the reference budget.</small></div><div><span>Recommended reference change</span><strong>{level.capstone ? "Separate resilience budget" : `€${level.canonicalCost}/mo · ${level.canonicalPoints} effort pts`}</strong></div><div className="projected-budget"><span>Reference budget after adoption</span><strong>€{projectedLedger.monthly.toLocaleString()}/mo · {projectedLedger.points} pts remain</strong><small>{state.adoptedThrough >= level.id ? "Already included in the ledger." : `Adopting the reference path through Level ${level.id} spends €${(ledger.monthly - projectedLedger.monthly).toLocaleString()}/mo and ${ledger.points - projectedLedger.points} effort pts.`}</small></div>{state.scoring && <div><span>Team reasoning review</span><strong>{scoreSubmission(level, submission)} / 90 automatic · 10 team self-review</strong><small>{Object.entries(scoreBreakdown(level, submission)).map(([key, value]) => `${key}: ${value}`).join(" · ")}</small></div>}</div>
          <p className="scenario-cost-note">Euro amounts are workshop scenario values, not vendor quotes. Effort points compare relative delivery and organizational load; they are not people or days.</p>
          <div className="next-callout"><p><span>{level.id === 12 && state.adoptedThrough === 12 ? "Workshop complete" : "Next pressure"}</span>{level.id === 12 && state.adoptedThrough === 12 ? "The team completed all 12 incidents. Use the journey to revisit any decision and compare reasoning." : level.official.next}</p>{!(level.id === 12 && state.adoptedThrough === 12) && <button className="primary-button" onClick={adoptAndContinue}>{level.id === 12 ? "Complete workshop" : "Adopt recommended change and continue"} <span>→</span></button>}</div>
        </section>}

        {mode === "facilitator" && <aside className="facilitator-dock" aria-label="Facilitator controls">
          <div><span className={`presenter-state ${spoilers ? "danger" : ""}`}>{spoilers ? "ANSWERS VISIBLE" : "PRESENTER SAFE"}</span><strong>Facilitator</strong></div>
          <button disabled={state.scoring} title="Scoring can be switched on at any time, but not switched off once the team has seen it" onClick={() => setState((current) => ({ ...current, scoring: true }))}>{state.scoring ? "Score shown" : "Show score"}</button>
          <button onClick={revealHint} disabled={hintCount >= 2}>Reveal hint {Math.min(2, hintCount + 1)}</button>
          <button onClick={revealAnswer}>{spoilers ? "Answer revealed" : "Reveal answer"}</button>
          <button onClick={resetCurrentLevel}>Reset level</button>
          <button onClick={resetWorkshop}>Reset workshop</button>
          {hintCount > 0 && <div className="facilitator-popover"><span>Investigation hint</span>{level.hints.slice(0, hintCount).map((item) => <p key={item}>{item}</p>)}</div>}
          {spoilers && <div className="facilitator-popover spoiler"><span>Official diagnosis</span><p>{level.official.bottleneck}</p><strong>Recommended reference: {level.options.filter((item) => level.canonicalOptionIds.includes(item.id)).map((item) => item.title).join(", ")}</strong><p>{level.stretch}</p></div>}
        </aside>}
        </>}
        </div>
      </div>
      <SiteFooter />
      </div>

      {savedCandidate && <div className="modal-backdrop" role="presentation"><dialog open className="orientation-modal" aria-labelledby="resume-title" onKeyDown={trapDialog}><span className="orientation-kicker">Saved locally</span><h2 id="resume-title">Continue your workshop?</h2><p>A previous session reached Level {savedCandidate.level}. Resume it or start a clean run.</p><div className="resume-actions"><button ref={orientationButtonRef} className="primary-button" onClick={() => { setState(savedCandidate); setShowIntroduction(false); setSavedCandidate(null); }}>Resume workshop</button><button className="secondary-button" onClick={() => { setState(initialWorkshopState); setShowIntroduction(true); setSavedCandidate(null); }}>Start fresh</button></div></dialog></div>}
    </main>
  );
}
