interface LabIntroductionProps {
  currentLevel: number;
  hasProgress: boolean;
  onContinue: () => void;
}

const reasoningLoop = [
  ["Look around", "Read the brief, open the evidence, and notice what changes."],
  ["Make a call", "Say what you think is holding the shop back and why."],
  ["Choose", "Pick the change that solves today's problem without adding more than you need."],
  ["Think ahead", "Say what should improve, what should stay steady, and what could go wrong."],
  ["See the result", "Run the scenario and compare your result with the workshop recommendation."],
  ["Move on", "Take the agreed change into the next incident."],
] as const;

export function LabIntroduction({ currentLevel, hasProgress, onContinue }: LabIntroductionProps) {
  return <div className="lab-introduction" id="current-task">
    <section className="intro-hero">
      <div>
        <p className="eyebrow">00 / Welcome to ScaleShop</p>
        <h1>You are now responsible for ScaleShop.</h1>
        <p>The shop starts small, and the first few days are quiet. Then traffic grows, reports get heavier, dependencies slow down, and failures begin to overlap. Twelve incidents will test how your team reads the signals, makes tradeoffs, and keeps the shop dependable.</p>
      </div>
      <button className="primary-button intro-start" onClick={onContinue}>
        {hasProgress ? `Return to Level ${String(currentLevel).padStart(2, "0")}` : "Start Level 01"} <span>→</span>
      </button>
    </section>

    <section className="intro-overview" aria-label="Lab overview">
      <article className="panel intro-card">
        <p className="eyebrow">The shop</p>
        <h2>A catalogue, a checkout, and real promises to customers</h2>
        <p>ScaleShop starts as one application with PostgreSQL behind it. Payment, email, and warehouse systems sit outside the shop. As the story moves forward, more customers arrive, more data piles up, and those connections become harder to manage.</p>
        <p>Speed matters, but an order also has to be right. Confirmed orders cannot disappear. Customers should not receive duplicates, and the shop must not sell stock it does not have.</p>
      </article>
      <article className="panel intro-card">
        <p className="eyebrow">Your mission</p>
        <h2>Keep the shop healthy as it grows</h2>
        <p>Each level puts one new problem in front of you. Look through the evidence, agree on what is really causing the problem, and choose what you would change next. You can submit one answer, but a miss is still useful because you will see what your choice actually changes.</p>
        <p>Do not hunt for a particular tool. Start with what customers are feeling, listen to what the system is telling you, and add only the complexity the shop needs today.</p>
      </article>
    </section>

    <section className="panel intro-loop" aria-labelledby="intro-loop-title">
      <p className="eyebrow">How each level works</p>
      <h2 id="intro-loop-title">Use the same rhythm every time</h2>
      <ol>{reasoningLoop.map(([title, description], index) => <li key={title}>
        <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{description}</p></div>
      </li>)}</ol>
    </section>

    <section className="intro-overview">
      <article className="panel intro-card">
        <p className="eyebrow">Your shared budget</p>
        <h2>€6,000 each month and 70 effort points</h2>
        <p>Trying an idea does not spend the budget. It changes only when the team accepts the workshop recommendation and moves on. Effort points are a simple way to compare how much work and coordination a change will take. They are not people or calendar days.</p>
        <p>The final incident has its own smaller budget because you will combine several ways to contain failure.</p>
      </article>
      <article className="panel intro-card">
        <p className="eyebrow">What success looks like</p>
        <h2>Good decisions you can explain</h2>
        <ul>
          <li>Show which evidence led you to the cause.</li>
          <li>Say what should improve and what should stay steady.</li>
          <li>Keep orders correct while the system grows.</li>
          <li>Be honest about the new work and risk your choice creates.</li>
        </ul>
      </article>
    </section>
  </div>;
}
