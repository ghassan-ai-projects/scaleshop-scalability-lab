interface LabIntroductionProps {
  currentLevel: number;
  hasProgress: boolean;
  onContinue: () => void;
}

const reasoningLoop = [
  ["Inspect", "Read the operating contract, telemetry, and evidence."],
  ["Diagnose", "Name the limiting mechanism—not only the symptom."],
  ["Decide", "Choose the smallest sufficient, reversible change."],
  ["Predict", "State what improves, what stays stable, and the new risk."],
  ["Compare", "Run the modeled experiment and study the reference path."],
  ["Adopt", "Continue the shared architecture only when ready."],
] as const;

export function LabIntroduction({ currentLevel, hasProgress, onContinue }: LabIntroductionProps) {
  return <div className="lab-introduction" id="current-task">
    <section className="intro-hero">
      <div>
        <p className="eyebrow">00 / Lab briefing</p>
        <h1>ScaleShop grows by evidence, not instinct.</h1>
        <p>You are the engineering team for a growing online shop. Across twelve incidents, you will diagnose the next constraint, test a change, explain its trade-offs, and evolve one continuing architecture.</p>
      </div>
      <button className="primary-button intro-start" onClick={onContinue}>
        {hasProgress ? `Return to Level ${String(currentLevel).padStart(2, "0")}` : "Start Level 01"} <span>→</span>
      </button>
    </section>

    <section className="intro-overview" aria-label="Lab overview">
      <article className="panel intro-card">
        <p className="eyebrow">The shop</p>
        <h2>Catalogue, checkout, and confirmed orders</h2>
        <p>ScaleShop begins as a small monolith backed by PostgreSQL and external payment, email, and warehouse services. Traffic, data, dependencies, and failure modes grow as the lab progresses.</p>
        <p>Customer latency matters, but correctness is never optional: no lost confirmed orders, duplicate orders, or oversold stock.</p>
      </article>
      <article className="panel intro-card">
        <p className="eyebrow">Your mission</p>
        <h2>Twelve progressive engineering decisions</h2>
        <p>Each level presents an operating contract and a specific pressure. Your answer is committed once, but wrong experiments are useful: their modeled consequences reveal why an intervention fits—or targets the wrong area.</p>
        <p>This is a reasoning lab, not a cloud-product quiz. Prefer evidence, mechanisms, simplicity, and reversibility.</p>
      </article>
    </section>

    <section className="panel intro-loop" aria-labelledby="intro-loop-title">
      <p className="eyebrow">How each level works</p>
      <h2 id="intro-loop-title">One repeatable diagnostic loop</h2>
      <ol>{reasoningLoop.map(([title, description], index) => <li key={title}>
        <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{description}</p></div>
      </li>)}</ol>
    </section>

    <section className="intro-overview">
      <article className="panel intro-card">
        <p className="eyebrow">Reference architecture budget</p>
        <h2>€6,000/month · 70 effort points</h2>
        <p>Experiments are counterfactual and free to explore. Only adopting the recommended reference path spends the continuing scenario budget. Effort points compare delivery and organizational load; they are not people or calendar days.</p>
        <p>Level 12 uses a separate resilience design budget for combining failure protections.</p>
      </article>
      <article className="panel intro-card">
        <p className="eyebrow">What success looks like</p>
        <h2>Defensible decisions, not perfect guesses</h2>
        <ul>
          <li>Tie the diagnosis to decisive evidence.</li>
          <li>Predict a measurable improvement and a stable signal.</li>
          <li>Protect business invariants while scaling.</li>
          <li>Name the complexity introduced by every change.</li>
        </ul>
      </article>
    </section>
  </div>;
}
