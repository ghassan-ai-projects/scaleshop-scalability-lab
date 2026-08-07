"use client";

import { useEffect, useState } from "react";
import {
  calculateCanonicalLedger,
  calculateCanonicalLedgerHistory,
  REFERENCE_ARCHITECTURE_BUDGET,
  type LevelSpec,
} from "@/lib/workshop";

interface ReferenceBudgetProps {
  levels: LevelSpec[];
  adoptedThrough: number;
}

export function ReferenceBudget({ levels, adoptedThrough }: ReferenceBudgetProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const remaining = calculateCanonicalLedger(levels, adoptedThrough);
  const history = calculateCanonicalLedgerHistory(levels, adoptedThrough);
  const spent = {
    monthly: REFERENCE_ARCHITECTURE_BUDGET.monthly - remaining.monthly,
    points: REFERENCE_ARCHITECTURE_BUDGET.points - remaining.points,
  };
  const monthlyUsed = spent.monthly / REFERENCE_ARCHITECTURE_BUDGET.monthly * 100;
  const pointsUsed = spent.points / REFERENCE_ARCHITECTURE_BUDGET.points * 100;

  useEffect(() => {
    if (!showExplanation) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowExplanation(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showExplanation]);

  return <aside className="reference-budget" aria-label="Reference architecture budget">
    <div className="reference-budget-title">
      <span>Reference architecture budget</span>
      <button
        type="button"
        className="budget-info"
        aria-label={`${showExplanation ? "Hide" : "Explain"} reference architecture budget`}
        aria-expanded={showExplanation}
        onClick={() => setShowExplanation((visible) => !visible)}
      ><span aria-hidden="true">i</span></button>
    </div>
    {showExplanation && <div className="budget-explanation" role="note">
      This tracks the scenario cost and implementation effort of recommended changes adopted into the lab&apos;s continuing reference architecture. It is not team money, headcount, or calendar days.
    </div>}
    <span className="budget-remaining-label">Remaining</span>
    <div className="budget-values">
      <strong>€{remaining.monthly.toLocaleString()}<small>/mo</small></strong>
      <strong>{remaining.points}<small> effort pts</small></strong>
    </div>
    <div className="budget-meter" aria-label={`Monthly budget: €${spent.monthly.toLocaleString()} of €${REFERENCE_ARCHITECTURE_BUDGET.monthly.toLocaleString()} spent`}>
      <i style={{ width: `${monthlyUsed}%` }} />
    </div>
    <div className="budget-meter points" aria-label={`Effort budget: ${spent.points} of ${REFERENCE_ARCHITECTURE_BUDGET.points} points spent`}>
      <i style={{ width: `${pointsUsed}%` }} />
    </div>
    <p className="budget-totals">Spent €{spent.monthly.toLocaleString()}/mo · {spent.points} pts <span>Started €{REFERENCE_ARCHITECTURE_BUDGET.monthly.toLocaleString()}/mo · {REFERENCE_ARCHITECTURE_BUDGET.points} pts</span></p>
    <details className="budget-history">
      <summary>Adopted changes ({history.length})</summary>
      {history.length === 0
        ? <p>No recommended changes adopted yet.</p>
        : <ol>{history.map((entry) => <li key={entry.levelId}>
          <span><b>L{entry.levelId}</b> {entry.title}</span>
          <small>−€{entry.monthlyCost}/mo · −{entry.points} pts</small>
        </li>)}</ol>}
    </details>
  </aside>;
}
