import type { EvidenceRole, EvidenceSpec, LevelSpec, MetricPresetCenters, MetricProvenance, MetricSourceClass, MetricSpec, OptionSpec, OutcomeKind } from "@/lib/workshop";

const roundCenter = (value: number) => Math.round(value * 10) / 10;

function presetCenters(id: string, value: number | null, threshold: number | undefined, direction: MetricSpec["direction"], kind: MetricSpec["kind"]): MetricPresetCenters {
  if (value === null) return { normal: null, campaign: null, peak: null, incident: null };
  if (new Set(["hotShare", "imageShare", "hotSet", "indexes", "offeredCheckout", "hitRatio", "pruning"]).has(id)) {
    return { normal: value, campaign: value, peak: value, incident: value };
  }
  if ((id === "offeredRps" && value === 2) || (id === "catalogueP95" && value === 180) || (id === "checkoutP95" && value === 420) || (id === "errors" && value === 0.1) || (id === "appCpu" && value === 18) || (id === "dbCpu" && value === 12) || id === "traceCoverage") {
    return { normal: value, campaign: value, peak: value, incident: value };
  }
  if (kind === "invariant" || direction === "zero" || direction === "equal") {
    const healthy = direction === "equal" ? threshold ?? value : 0;
    return { normal: healthy, campaign: healthy, peak: healthy, incident: value };
  }
  if (kind === "observation" || threshold === undefined) {
    return { normal: roundCenter(value * 0.35), campaign: roundCenter(value * 0.65), peak: roundCenter(value * 0.85), incident: value };
  }
  if (direction === "higher") {
    return {
      normal: roundCenter(Math.max(value, threshold * 1.1)),
      campaign: roundCenter(Math.max(value, threshold * 1.03)),
      peak: roundCenter(Math.max(value, threshold * 0.95)),
      incident: value,
    };
  }
  return {
    normal: roundCenter(Math.min(value, threshold * 0.65)),
    campaign: roundCenter(Math.min(value, threshold * 0.82)),
    peak: roundCenter(Math.min(value, threshold * 1.05)),
    incident: value,
  };
}

function metricProvenance(id: string, kind: MetricSpec["kind"]): MetricProvenance {
  const loadTests = new Set(["sustainableRps"]);
  const analysis = new Set(["hotShare", "imageShare", "pruning", "reconcile"]);
  const runtime = new Set(["queries", "poolWait", "queueWait", "lockWait", "retries", "amplification", "dbReads"]);
  const provider: Record<string, string> = {
    appCpu: "AWS/EC2 CPUUtilization or GCP compute CPU utilization",
    dbCpu: "AWS/RDS CPUUtilization or GCP database CPU utilization",
    primaryCpu: "AWS/RDS CPUUtilization",
    catalogueCpu: "Compute/container CPU utilization",
    connections: "AWS/RDS DatabaseConnections",
    dbConnections: "AWS/RDS DatabaseConnections",
    readIops: "AWS/RDS ReadIOPS",
    writeIops: "AWS/RDS WriteIOPS",
    replicaLag: "AWS/RDS ReplicaLag",
    queueAge: "AWS/SQS ApproximateAgeOfOldestMessage",
    edgeHit: "AWS/CloudFront CacheHitRate",
  };
  let sourceClass: MetricSourceClass = "observability-derived";
  if (kind === "invariant") sourceClass = "business-invariant";
  else if (loadTests.has(id)) sourceClass = "load-test";
  else if (analysis.has(id)) sourceClass = "analysis";
  else if (runtime.has(id)) sourceClass = "runtime";
  else if (provider[id]) sourceClass = "provider";
  return { sourceClass, comparableTo: provider[id] };
}

function metricDefinition(label: string, unit: string, window: string, denominator?: string) {
  const basis = denominator ?? window;
  const lower = label.toLowerCase();
  let meaning = `${label} measured in ${unit || "count"}`;
  if (lower.includes("p95")) meaning = `Tail latency: 95% of the named operations finish at or below this duration`;
  else if (lower.includes("error")) meaning = `Failed, timed-out, rejected, or invalid outcomes divided by offered work`;
  else if (lower.includes("cpu")) meaning = `Share of available processor capacity currently consumed`;
  else if (lower.includes("iops")) meaning = `Storage input/output operations per second as a share of the scenario capacity`;
  else if (lower.includes("hit ratio") || lower.includes("edge hits")) meaning = `Eligible reads served without reaching the source of truth`;
  else if (lower.includes("replica lag")) meaning = `Delay between a primary commit and visibility on the replica`;
  else if (lower.includes("oldest") && (lower.includes("job") || lower.includes("queue"))) meaning = `Time the oldest unprocessed item has waited`;
  else if (lower.includes("burn rate")) meaning = `Speed at which the service consumes its allowed error budget`;
  else if (lower.includes("amplification")) meaning = `Total downstream attempts divided by original offered requests`;
  else if (lower.includes("offered")) meaning = `Work arriving before rejection, timeout, shedding, or failure`;
  else if (lower.includes("completed") || lower.includes("useful")) meaning = `Successful, non-duplicate work that produced an unambiguous useful result`;
  else if (lower.includes("duplicate") || lower.includes("oversold") || lower.includes("loss") || lower.includes("reconciliation")) meaning = `Business-correctness invariant counted from authoritative domain records`;
  return `${meaning}, evaluated for ${basis}. The scenario contract, not a universal vendor default, determines status.`;
}

const metric = (
  id: string,
  label: string,
  value: number | null,
  after: number | null,
  unit: string,
  threshold?: number,
  direction: MetricSpec["direction"] = "lower",
  precision?: number,
  kind: MetricSpec["kind"] = threshold === undefined ? "observation" : "slo",
  window = "60-second window",
  denominator?: string,
): MetricSpec => ({
  id, label, value, after, unit, threshold, direction, precision, kind, window, denominator,
  definition: metricDefinition(label, unit, window, denominator),
  provenance: metricProvenance(id, kind),
  presets: presetCenters(id, value, threshold, direction, kind),
});

const evidence = (
  id: string,
  category: string,
  title: string,
  value: string,
  meaning: string,
  role: EvidenceRole,
  wave?: EvidenceSpec["wave"],
): EvidenceSpec => ({ id, category, title, value, meaning, role, wave });

const leadTime = (points: number) =>
  points <= 2 ? "Up to 2 days" : points <= 4 ? "3–5 days" : points <= 7 ? "1–2 weeks" : points <= 10 ? "2–4 weeks" : "More than one month";

const areaFit = (kind: OutcomeKind) => ({
  best: "Right layer and timing: it addresses the demonstrated constraint with the smallest sufficient mechanism.",
  costly: "Right capability or sufficient capacity, but broader, costlier, or earlier than the evidence justifies.",
  partial: "It changes a real symptom or adjacent layer, but leaves at least one decisive constraint unresolved.",
  wrong: "Wrong layer: the decisive evidence shows that this area is not the demonstrated constraint.",
  invariant: "It improves a surface signal by violating an explicit correctness, privacy, or safety constraint.",
})[kind];

const fitBoundary = (kind: OutcomeKind) => ({
  best: "Reconsider when the verification evidence no longer meets the stated SLO or invariant.",
  costly: "Use this when measured growth, recovery, residency, or write pressure exceeds the smaller option's verified envelope.",
  partial: "Use only as containment when the remaining constraint is separately controlled and measured.",
  wrong: "Reconsider only when new evidence demonstrates saturation or failure in this area.",
  invariant: "Do not use while the stated invariant remains mandatory.",
})[kind];

const OPTION_OUTCOME_MODELS: Record<string, { affectedMetricIds: string[]; progress: number }> = {
  "L1-O3": { affectedMetricIds: ["dbCpu"], progress: 0.35 },
  "L1-O4": { affectedMetricIds: ["traceCoverage"], progress: 0.75 },
  "L1-O5": { affectedMetricIds: ["dbCpu"], progress: 0.25 },
  "L2-O3": { affectedMetricIds: ["catalogueP95", "queries", "dbCpu", "poolWait"], progress: 0.45 },
  "L2-O4": { affectedMetricIds: ["catalogueP95", "dbCpu", "connections", "poolWait"], progress: 0.78 },
  "L3-O1": { affectedMetricIds: ["catalogueP95", "dbCpu"], progress: 0.82 },
  "L3-O3": { affectedMetricIds: ["catalogueP95", "dbReads", "dbCpu"], progress: 0.48 },
  "L3-O4": { affectedMetricIds: ["catalogueP95", "dbReads", "dbCpu", "hitRatio"], progress: 0.9 },
  "L3-O5": { affectedMetricIds: ["catalogueP95", "dbCpu"], progress: 0.72 },
  "L4-O1": { affectedMetricIds: ["checkoutP95", "errors", "dbCpu"], progress: 0.35 },
  "L4-O3": { affectedMetricIds: ["errors"], progress: 0.35 },
  "L4-O4": { affectedMetricIds: ["checkoutP95", "errors", "duplicates", "queueAge"], progress: 0.8 },
  "L4-O5": { affectedMetricIds: ["checkoutP95", "errors", "queueAge"], progress: 0.72 },
  "L5-O1": { affectedMetricIds: ["catalogueP95", "appCpu", "queueWait", "errors"], progress: 0.82 },
  "L5-O3": { affectedMetricIds: ["catalogueP95", "appCpu", "queueWait", "errors", "instances", "loadSkew"], progress: 0.68 },
  "L5-O4": { affectedMetricIds: ["catalogueP95", "appCpu"], progress: 0.3 },
  "L5-O5": { affectedMetricIds: [], progress: 0 },
  "L6-O2": { affectedMetricIds: ["farTtfb", "imageLoad"], progress: 0.82 },
  "L6-O3": { affectedMetricIds: ["imageLoad", "egress", "appCpu"], progress: 0.5 },
  "L6-O4": { affectedMetricIds: ["originRps", "appCpu"], progress: 0.45 },
  "L6-O5": { affectedMetricIds: ["farTtfb", "originRps", "egress", "edgeHit"], progress: 0.88 },
  "L7-O2": { affectedMetricIds: ["checkoutP95", "primaryCpu", "readIops", "writeIops"], progress: 0.86 },
  "L7-O3": { affectedMetricIds: ["checkoutP95", "primaryCpu", "readIops"], progress: 0.4 },
  "L7-O4": { affectedMetricIds: ["checkoutP95", "primaryCpu", "readIops"], progress: 0.78 },
  "L7-O5": { affectedMetricIds: ["checkoutP95", "primaryCpu"], progress: 0.25 },
  "L8-O1": { affectedMetricIds: ["replicaLag", "checkoutP95"], progress: 0.6 },
  "L8-O2": { affectedMetricIds: [], progress: 0 },
  "L8-O3": { affectedMetricIds: ["reportDuration", "bytesScanned", "checkoutP95"], progress: 0.52 },
  "L8-O5": { affectedMetricIds: ["reportDuration", "bytesScanned", "freshness", "checkoutP95"], progress: 0.72 },
  "L9-O2": { affectedMetricIds: ["catalogueP95", "deployErrors", "catalogueCpu", "checkoutP95", "sharedInstances"], progress: 0.95 },
  "L9-O3": { affectedMetricIds: ["catalogueP95", "catalogueCpu", "checkoutP95", "sharedInstances"], progress: 0.82 },
  "L9-O4": { affectedMetricIds: [], progress: 0 },
  "L9-O5": { affectedMetricIds: ["catalogueP95", "catalogueCpu"], progress: 0.45 },
  "L10-O1": { affectedMetricIds: ["accepted", "useful", "checkoutP95", "lockWait", "oversold"], progress: 0.55 },
  "L10-O2": { affectedMetricIds: ["accepted", "useful", "duplicates", "oversold", "retries"], progress: 0.65 },
  "L10-O5": { affectedMetricIds: ["useful", "checkoutP95", "lockWait"], progress: 0.8 },
  "L11-O1": { affectedMetricIds: ["writeIops", "checkoutP95", "backup", "restore", "maintenance"], progress: 0.75 },
  "L11-O3": { affectedMetricIds: ["writeIops", "checkoutP95"], progress: 0.8 },
  "L11-O4": { affectedMetricIds: ["writeIops", "checkoutP95", "backup", "restore", "maintenance"], progress: 0.82 },
  "L11-O5": { affectedMetricIds: ["writeIops", "checkoutP95"], progress: 0.78 },
};

const option = (
  id: string,
  title: string,
  mechanism: string,
  monthlyCost: number,
  points: number,
  reversibility: OptionSpec["reversibility"],
  kind: OutcomeKind,
  summary: string,
  risk: string,
  metricEffects?: Record<string, number | null>,
  coverage?: string[],
): OptionSpec => {
  const outcomeModel = metricEffects
    ? { affectedMetricIds: Object.keys(metricEffects), progress: 1 }
    : OPTION_OUTCOME_MODELS[id] ?? (id.startsWith("L12-") ? { affectedMetricIds: [], progress: 0 } : undefined);
  if (!outcomeModel) throw new Error(`Missing outcome model for ${id}`);
  return {
    id, title, mechanism, monthlyCost, points, leadTime: leadTime(points), reversibility, kind, summary, risk,
    metricEffects, coverage, areaFit: areaFit(kind), fitBoundary: fitBoundary(kind), outcomeModel,
  };
};

const earlyLevels: LevelSpec[] = [
  {
    id: 1,
    participantTitle: "Unknown capacity",
    techniqueTitle: "Establish the operating contract",
    phase: "Measure",
    incident: "ScaleShop has launched at 2 RPS. Everything looks healthy, but nobody can say how much traffic it can handle or when customers are suffering.",
    question: "What makes a capacity claim credible?",
    constraints: ["Catalogue p95 < 300 ms", "Checkout p95 < 800 ms", "Errors < 1%", "No lost confirmed orders", "Do not add capacity without evidence"],
    metrics: [
      metric("offeredRps", "Offered requests", 2, 31, "RPS", undefined, "lower", 0, "observation", "60-second window", "All arriving requests"),
      metric("catalogueP95", "Catalogue p95", 180, 180, "ms", 300),
      metric("checkoutP95", "Checkout p95", 420, 420, "ms", 800),
      metric("errors", "Request errors", 0.1, 0.1, "%", 1, "lower", 1),
      metric("appCpu", "Application CPU", 18, 78, "%", 80, "lower", 0, "capacity"),
      metric("dbCpu", "Database CPU", 12, 84, "%", 80, "lower", 0, "capacity"),
      metric("traceCoverage", "Trace coverage", 0, 98, "%", 95, "higher"),
      metric("sustainableRps", "Sustainable capacity", null, 28, "RPS", undefined, "lower", 0, "observation", "Representative stepped test"),
    ],
    evidence: [
      evidence("L1-E1", "Application", "Access logs", "Status and duration only; no route percentiles", "Logs show individual requests, not whether a journey meets a target.", "decisive"),
      evidence("L1-E2", "Operations", "Operating contract", "No baseline, SLO, alert, trace, or capacity envelope", "Without an agreed boundary, healthy and unhealthy are undefined.", "decisive"),
      evidence("L1-E3", "Capacity", "Current utilization", "App 18% · DB 12% at 2 RPS", "Low utilization at one load says little about the next load step.", "supporting"),
      evidence("L1-E4", "Application", "Manual test", "One checkout succeeded", "A single success does not describe tail latency or sustained behavior.", "context"),
      evidence("L1-E5", "Capacity", "Provider specification", "4 vCPU · 16 GB RAM", "Theoretical resources do not measure application capacity.", "context"),
    ],
    hypotheses: [
      { id: "L1-H1", label: "Missing objectives and representative capacity evidence", score: 25 },
      { id: "L1-H2", label: "Database capacity", score: 10 },
      { id: "L1-H3", label: "Application capacity", score: 10 },
      { id: "L1-H4", label: "Missing cache", score: 0 },
    ],
    options: [
      option("L1-O1", "Define and measure", "Set journey SLOs, instrument RED/USE and traces, then run a representative stepped load test.", 120, 4, "Easy", "best", "Creates a reproducible envelope: 28 RPS sustained; catalogue p95 first breaches at 31 RPS.", "Telemetry noise, high-cardinality cost, and false confidence in one workload mix.", { offeredRps: 31, traceCoverage: 98, sustainableRps: 28, appCpu: 78, dbCpu: 84 }),
      option("L1-O2", "Run a short load test", "Step to 50 RPS for five minutes and record aggregate latency.", 0, 2, "Easy", "partial", "Produces an initial observation but not a representative operating boundary.", "Aggregate latency and a short run can hide tail behavior, workload mix, and saturation over time.", { offeredRps: 50 }),
      option("L1-O3", "Upgrade PostgreSQL", "Buy a larger database tier before traffic grows.", 700, 1, "Easy", "wrong", "Adds unused headroom without improving knowledge.", "Recurring spend and no evidence that the database limits current service.", { dbCpu: 6 }),
      option("L1-O4", "Adopt default APM", "Buy an APM tool and keep its default dashboards and alerts.", 250, 2, "Easy", "partial", "Adds telemetry but no explicit operating contract.", "Noise and alerts that are disconnected from customer journeys."),
      option("L1-O5", "Add Redis", "Put a cache in front of the healthy database.", 180, 4, "Moderate", "wrong", "May reduce reads later but does not answer the incident.", "Invalidation complexity before a repeated-read bottleneck exists.", { dbCpu: 8 }),
    ],
    canonicalOptionIds: ["L1-O1"], canonicalCost: 120, canonicalPoints: 4,
    official: {
      bottleneck: "Knowledge and detection—not compute capacity.",
      evidence: "There are no journey percentiles or defined failure thresholds.",
      fit: "Targets, instrumentation, and a representative stepped test establish the boundary every later decision needs.",
      risk: "Noisy telemetry, excessive cardinality, and treating one capacity envelope as universal.",
      verification: "Trace 98% of requests; alert on every SLO; reproduce the 28-RPS envelope and first breach at 31 RPS.",
      next: "The campaign crosses that boundary and exposes excessive database work.",
    },
    hints: ["Look for what is missing, not which resource is hot.", "A capacity claim needs a journey target and a representative test that stops at the first boundary."],
    stretch: "How should workload mix and test duration change the capacity envelope?",
  },
  {
    id: 2,
    participantTitle: "The campaign slowdown",
    techniqueTitle: "Remove inefficient database access",
    phase: "Optimize",
    incident: "A campaign raises catalogue traffic to 40 RPS. Catalogue p95 reaches 1,840 ms while the application server remains moderately utilized.",
    question: "Where is time spent, and how much work happens per request?",
    constraints: ["Catalogue data must be current", "Create at least 3× headroom", "Infrastructure budget is limited", "Avoid a new distributed component if code fixes suffice"],
    metrics: [
      metric("offeredRps", "Offered catalogue load", 40, 40, "RPS", undefined, "lower", 0, "observation", "60-second window", "All arriving catalogue requests"),
      metric("completedRps", "Completed catalogue work", 32, 40, "RPS", 40, "higher", 0, "capacity", "60-second window", "Successful catalogue responses"),
      metric("catalogueP95", "Catalogue p95", 1840, 190, "ms", 300),
      metric("queries", "SQL queries / request", 483, 6, "", 20),
      metric("dbCpu", "Database CPU", 92, 34, "%", 80, "lower", 0, "capacity"),
      metric("sustainableRps", "Tested sustainable load", null, 120, "RPS", 120, "higher", 0, "capacity", "Representative stepped test"),
      metric("connections", "DB connections", 48, 18, "/ 50", 45),
      metric("poolWait", "Pool wait p95", 180, 12, "ms", 50),
      metric("appCpu", "Application CPU", 38, 36, "%", 80),
    ],
    evidence: [
      evidence("L2-E1", "Database", "Request query count", "483 SQL statements for one listing request", "Work per request can saturate a dependency even at modest traffic.", "decisive"),
      evidence("L2-E2", "Application", "Catalogue trace", "1,690 of 1,840 ms is database time", "The trace locates delay inside the database dependency.", "decisive"),
      evidence("L2-E3", "Capacity", "Resource comparison", "App 38% · DB 92%", "The more saturated resource deserves investigation first.", "supporting"),
      evidence("L2-E4", "Database", "Connection pool", "48 / 50 · 180 ms wait p95", "Waiting for connections is saturation, not useful work.", "supporting"),
      evidence("L2-E5", "Database", "Repeated signatures", "Category and image data fetched one item at a time", "Repeated request-shaped queries suggest removable access work.", "supporting"),
      evidence("L2-E6", "Database", "Query plans", "2 full scans · 18× more columns read than returned", "Plans and payload show additional waste beyond query count.", "supporting"),
    ],
    hypotheses: [
      { id: "L2-H1", label: "Excessive database work per request", score: 25 },
      { id: "L2-H2", label: "Application compute", score: 0 },
      { id: "L2-H3", label: "Insufficient database tier", score: 10 },
      { id: "L2-H4", label: "Connection pool size", score: 5 },
    ],
    options: [
      option("L2-O1", "Add app instances", "Add five request handlers behind a load balancer.", 1000, 2, "Easy", "partial", "More handlers increase concurrent database pressure.", "The real bottleneck saturates sooner.", { dbCpu: 98, poolWait: 420 }),
      option("L2-O2", "Reduce query work", "Batch related reads, paginate, select required columns, and add targeted indexes.", 0, 4, "Moderate", "best", "Removes measured waste and restores more than 3× headroom.", "Oversized joins and write-heavy indexes if plans are not reviewed.", { offeredRps: 40, completedRps: 40, catalogueP95: 190, queries: 6, dbCpu: 34, sustainableRps: 120, connections: 18, poolWait: 12 }),
      option("L2-O3", "Cache all queries", "Put Redis in front of every product query.", 180, 4, "Moderate", "partial", "Hits improve, but inefficient misses remain and freshness becomes harder.", "Masks waste and adds invalidation before the access path is fixed."),
      option("L2-O4", "Scale the database", "Move PostgreSQL to a four-times-larger tier.", 800, 1, "Easy", "costly", "Restores temporary headroom but preserves 483 queries per request.", "Recurring cost and the same scaling slope."),
      option("L2-O5", "Raise pool limit", "Increase the connection pool from 50 to 200.", 0, 1, "Easy", "invariant", "Application wait falls briefly while database queueing worsens.", "Memory pressure and overload amplification.", { dbCpu: 100, poolWait: 70 }),
    ],
    canonicalOptionIds: ["L2-O2"], canonicalCost: 0, canonicalPoints: 4,
    official: {
      bottleneck: "Excessive query work on PostgreSQL.", evidence: "483 queries per request and 92% DB CPU while app CPU is 38%.",
      fit: "It removes work rather than buying capacity for waste.", risk: "Incorrect eager loading, oversized joins, and write-costly indexes.",
      verification: "Replay the same data and mix through 120 RPS; verify completed throughput, query count, rows examined, write cost, p95, and pool wait.", next: "Efficient queries make repeated, bounded-stale catalogue reads the next pressure.",
    },
    hints: ["Inspect the database portion of one catalogue trace.", "Compare work per request with resource saturation before buying capacity."],
    stretch: "When is vertical scaling still rational incident containment?",
  },
  {
    id: 3,
    participantTitle: "The viral product",
    techniqueTitle: "Cache the read-heavy catalogue",
    phase: "Absorb reads",
    incident: "A product goes viral at 300 RPS. Ninety-five percent of requests read catalogue data that changes only a few times per hour.",
    question: "Which evidence distinguishes repeated work from unavoidable work?",
    constraints: ["Price staleness ≤ 30 s", "Descriptions/categories may be 2 min stale", "Inventory never uses cached availability", "Cache failure may slow—not stop—the shop"],
    metrics: [
      metric("catalogueP95", "Catalogue p95", 890, 95, "ms", 300), metric("dbReads", "Database reads", 7200, 1500, "/s", 2500),
      metric("dbCpu", "Database CPU", 86, 32, "%", 80, "lower", 0, "capacity"), metric("hotShare", "Top-50 key share", 71, 71, "%", undefined, "lower", 0, "observation", "60-second read window", "Share of catalogue reads"),
      metric("hitRatio", "Cache hit ratio", 0, 89, "%", 80, "higher"), metric("checkoutP95", "Checkout p95", 520, 500, "ms", 800),
    ],
    evidence: [
      evidence("L3-E1", "Capacity", "Resource comparison", "DB 86% · App 42%", "Database saturation remains isolated to catalogue reads.", "supporting"),
      evidence("L3-E2", "Database", "Hot-key concentration", "71% of reads request the same 50 keys", "High repetition means the same answer is recomputed often.", "decisive"),
      evidence("L3-E3", "Database", "Read rate", "7,200 reads / second", "Read work now dominates source capacity.", "decisive"),
      evidence("L3-E4", "Application", "Journey comparison", "Catalogue 890 ms · Checkout healthy", "The failure is isolated to a read-heavy journey.", "supporting"),
      evidence("L3-E5", "Business", "Change frequency", "10–20 updates / hour with field-level freshness limits", "Change frequency determines whether a copy can be safely stale.", "decisive"),
      evidence("L3-E6", "Cache", "Cold-cache test", "Uncoalesced refill projects 310 concurrent source reads per hot key", "Miss behavior describes the source load created when a cached value is absent.", "supporting"),
    ],
    hypotheses: [
      { id: "L3-H1", label: "Repeated bounded-stale reads", score: 25 }, { id: "L3-H2", label: "Insufficient database tier", score: 10 },
      { id: "L3-H3", label: "Missing read replicas", score: 10 }, { id: "L3-H4", label: "Application compute", score: 0 },
    ],
    options: [
      option("L3-O1", "Add a read replica", "Route all catalogue reads to a replica.", 550, 4, "Moderate", "costly", "Moves reads but still executes every repeated query.", "Lag routing and greater recurring cost."),
      option("L3-O2", "Cache selected fields", "Use cache-aside with field-specific TTLs, invalidation, request coalescing, and source fallback.", 180, 4, "Moderate", "best", "Removes redundant reads while PostgreSQL remains authoritative.", "Staleness, stampede, eviction, and invalidation failure.", { catalogueP95: 95, dbReads: 1500, dbCpu: 32, hitRatio: 89 }),
      option("L3-O3", "Pre-render stable fields", "Pre-render descriptions/categories nightly and fetch prices live.", 100, 4, "Moderate", "partial", "Preserves price freshness but leaves dynamic source pressure.", "Two publication paths and limited relief."),
      option("L3-O4", "Cache every GET", "Publicly cache every GET route at the edge.", 180, 3, "Moderate", "invariant", "Offloads traffic but can expose or stale private responses.", "Privacy and correctness breach."),
      option("L3-O5", "Scale the database", "Buy another larger database tier.", 800, 1, "Easy", "costly", "Creates immediate headroom without exploiting repetition.", "Recurring cost and unchanged read amplification."),
    ],
    canonicalOptionIds: ["L3-O2"], canonicalCost: 180, canonicalPoints: 4,
    official: {
      bottleneck: "Repeated reads of mostly stable, hot catalogue keys.", evidence: "71% top-key share and 7,200 reads/s at 86% DB CPU.",
      fit: "Cache-aside removes redundant work with explicit freshness and source fallback.", risk: "Invalidation, staleness, stampede, and degraded miss behavior.",
      verification: "Verify hit ratio and source reduction, price freshness, bounded refill after flush, and service without Redis.", next: "Checkout remains slow because external side effects are still synchronous.",
    },
    hints: ["Compare key repetition with how often the underlying data changes.", "A bounded-stale copy is useful only if the source remains authoritative and failure has a safe path."],
    stretch: "Which fields need event invalidation, and which are safer with TTL only?",
  },
  {
    id: 4,
    participantTitle: "Checkout waits on side effects",
    techniqueTitle: "Isolate slow work with durable jobs",
    phase: "Decouple",
    incident: "Checkout validates the cart, reserves inventory, commits the order, generates a PDF, sends email, records analytics, and notifies the warehouse before responding.",
    question: "What must finish before ‘confirmed’ is truthful?",
    constraints: ["Confirm only after payment and inventory commit", "Email within 30 s", "Analytics/warehouse may be eventual", "Never lose downstream work", "Retries must not duplicate invoices"],
    metrics: [
      metric("checkoutP95", "Checkout p95", 5800, 460, "ms", 800), metric("errors", "Checkout errors", 4.1, 0.5, "%", 1, "lower", 1),
      metric("emailP95", "Email provider p95", 4300, 4300, "ms", undefined, "lower", 0, "observation", "60-second dependency window"), metric("duplicates", "Duplicate invoices", 1.4, 0, "%", 0, "zero", 1, "invariant"),
      metric("queueAge", "Oldest invoice job", null, 8, "s", 30), metric("queueRate", "Invoice processing rate", null, 15.4, "/s", 15, "higher", 1, "capacity"), metric("dbCpu", "Database CPU", 46, 48, "%", 80, "lower", 0, "capacity"),
    ],
    evidence: [
      evidence("L4-E1", "Application", "Checkout objective", "5,800 ms p95 · 4.1% errors", "The customer journey breaches both latency and error objectives.", "supporting"),
      evidence("L4-E2", "Application", "Stage trace", "Email 4,300 ms · PDF 780 ms · core commit 100 ms", "Stage timing separates required and deferrable work.", "decisive"),
      evidence("L4-E3", "External", "Provider timeout", "Committed orders appear failed when email times out", "A secondary dependency changes the visible outcome of successful core work.", "decisive"),
      evidence("L4-E4", "Correctness", "Retry correlation", "Customer retries correlate with 1.4% duplicate invoices", "Retries expose non-idempotent side effects.", "decisive"),
      evidence("L4-E5", "Capacity", "Resource comparison", "App 44% · DB 46%", "Neither core compute resource is saturated.", "supporting"),
    ],
    hypotheses: [
      { id: "L4-H1", label: "Synchronous non-critical side effects", score: 25 }, { id: "L4-H2", label: "Application capacity", score: 0 },
      { id: "L4-H3", label: "Database capacity", score: 0 }, { id: "L4-H4", label: "Request timeout", score: 5 },
    ],
    options: [
      option("L4-O1", "Add app instances", "Add concurrency to hide some blocking.", 600, 2, "Easy", "partial", "Provider latency remains on every checkout.", "More simultaneous blocked requests."),
      option("L4-O2", "Use a durable outbox", "Commit the order and outbox together; relay idempotent jobs to workers.", 250, 5, "Moderate", "best", "Removes secondary latency and closes the commit-to-job gap.", "Backlog, retries, poison jobs, and eventual consistency.", { checkoutP95: 460, errors: 0.5, duplicates: 0, queueAge: 8, queueRate: 15.4 }),
      option("L4-O3", "Raise the timeout", "Wait up to 30 seconds for every side effect.", 0, 1, "Easy", "partial", "Some timeouts disappear but the provider stays on-path.", "Tied-up capacity and duplicate-producing retries."),
      option("L4-O4", "Poll order status", "Workers poll durable order-status columns for pending effects.", 100, 4, "Moderate", "costly", "Recovers after crashes but tightly couples jobs to the order database.", "Polling load and complex status transitions."),
      option("L4-O5", "Queue two stages", "Queue PDF/email but keep analytics and warehouse synchronous.", 180, 4, "Moderate", "partial", "Removes most latency but retains external failure on-path.", "Partial isolation and a handoff that still needs durability."),
    ],
    canonicalOptionIds: ["L4-O2"], canonicalCost: 250, canonicalPoints: 5,
    official: {
      bottleneck: "Synchronous, variable-latency side effects on checkout.", evidence: "Email consumes 4,300 ms while app and DB are not saturated.",
      fit: "An outbox makes committed work durable and workers isolate non-critical latency.", risk: "Eventual consistency, duplicate delivery, backlog, and poison jobs.",
      verification: "Kill after commit, replay a job, fail email, and prove no work is lost or duplicated and queue age recovers below 30 s.", next: "Dynamic traffic now saturates one stateful application instance.",
    },
    hints: ["Break the checkout trace into required and deferrable stages.", "The hard part is preserving committed work across the database-to-job handoff."],
    stretch: "What belongs in the database transaction, outbox record, and worker?",
  },
  {
    id: 5,
    participantTitle: "One instance at the limit",
    techniqueTitle: "Scale stateless application instances",
    phase: "Scale out",
    incident: "Dynamic traffic reaches 1,000 RPS. Application CPU is saturated while database and queue capacity remain healthy. Sessions and uploads live on the app instance.",
    question: "What prevents a second instance from being disposable?",
    constraints: ["Sessions survive instance loss", "Deployments drain safely", "Uploads work from any instance", "Support horizontal growth and one-instance failure"],
    metrics: [
      metric("catalogueP95", "Catalogue p95", 1210, 220, "ms", 300), metric("appCpu", "Max instance CPU", 96, 45, "%", 80, "lower", 0, "capacity"),
      metric("queueWait", "Request queue wait", 680, 35, "ms", 50), metric("errors", "Request errors", 3.8, 0.4, "%", 1, "lower", 1),
      metric("dbCpu", "Database CPU", 41, 45, "%", 80, "lower", 0, "capacity"), metric("instances", "Healthy instances", 1, 3, "", undefined, "lower", 0, "observation", "Current fleet topology"),
      metric("loadSkew", "Instance load skew", null, 6, "%", 15, "lower", 0, "capacity"), metric("dbConnections", "Fleet DB connections", 18, 54, "", 120, "lower", 0, "capacity"),
    ],
    evidence: [
      evidence("L5-E1", "Capacity", "Resource comparison", "App 96% · DB 41%", "The saturated resource is application compute.", "decisive"),
      evidence("L5-E2", "Application", "Request queue", "680 ms waiting before handler work", "Queue wait shows the instance has reached concurrency capacity.", "decisive"),
      evidence("L5-E3", "Application", "Journey state", "Catalogue 1,210 ms · errors 3.8%", "The saturated tier now breaches user objectives.", "supporting"),
      evidence("L5-E4", "Application", "Profile", "Useful work across routes; no pathological endpoint", "This is fleet capacity rather than one removable query.", "supporting"),
      evidence("L5-E5", "Correctness", "Second-instance test", "Sessions disappear; earlier uploads return 404", "Local state prevents safe distribution and failure handling.", "decisive"),
      evidence("L5-E6", "Capacity", "Current ceiling", "One instance serves all dynamic work", "A single instance is both capacity ceiling and failure domain.", "context"),
    ],
    hypotheses: [
      { id: "L5-H1", label: "Single stateful app compute ceiling", score: 25 }, { id: "L5-H2", label: "Database capacity", score: 0 },
      { id: "L5-H3", label: "Static delivery", score: 5 }, { id: "L5-H4", label: "Load skew only", score: 5 },
    ],
    options: [
      option("L5-O1", "Use a larger server", "Replace the app server with a four-times-larger machine.", 400, 1, "Easy", "costly", "Buys fast headroom but preserves one failure domain.", "A larger single ceiling and disruptive scaling."),
      option("L5-O2", "Build a stateless fleet", "Add a load balancer, external sessions/files, health checks, and graceful drain.", 600, 4, "Moderate", "best", "Makes instances disposable so capacity and failure handling scale together.", "Load balancing, shared-state dependencies, and multiplied DB pools.", { catalogueP95: 220, appCpu: 45, queueWait: 35, errors: 0.4, instances: 3, loadSkew: 6, dbConnections: 54 }),
      option("L5-O3", "Use sticky sessions", "Add instances but keep session affinity and local uploads.", 600, 2, "Easy", "partial", "Adds throughput while retaining failure and deployment fragility.", "Lost sessions/files on failure and uneven load."),
      option("L5-O4", "Add a CDN", "Offload static assets at the edge.", 180, 3, "Moderate", "partial", "Reduces static work but the measured saturation is dynamic compute.", "New cache policy with little relief for the incident."),
      option("L5-O5", "Scale PostgreSQL", "Upgrade the database tier.", 800, 1, "Easy", "wrong", "Changes a resource with substantial headroom.", "Recurring cost and no improvement to app queueing."),
    ],
    canonicalOptionIds: ["L5-O2"], canonicalCost: 600, canonicalPoints: 4,
    official: {
      bottleneck: "Compute capacity of one stateful application instance.", evidence: "96% app CPU and 680-ms queue wait with DB at 41%.",
      fit: "Removing local state makes instances disposable for capacity, deployment, and failure.", risk: "Load-balancer health, shared-state availability, pool multiplication, and skew.",
      verification: "Kill an instance during traffic, roll a deployment, preserve sessions/uploads, and keep DB connections within limits.", next: "The origin is healthy, but distant users still fetch repeated public bytes across regions.",
    },
    hints: ["Look at application queueing and where sessions and files live.", "Horizontal capacity is safe only when any healthy instance can serve the next request."],
    stretch: "How should database connection limits change as the fleet autos-scales?",
  },
  {
    id: 6,
    participantTitle: "Slow far from home",
    techniqueTitle: "Move public content to the edge",
    phase: "Offload",
    incident: "Traffic becomes global. Product images dominate bandwidth and distant users experience slow first-byte times while origin resources remain healthy.",
    question: "Is the time spent computing, storing, or travelling?",
    constraints: ["Assets are public and versioned", "Public catalogue may be briefly stale", "Never publicly cache account/cart/checkout/invoices", "Origin cost matters"],
    metrics: [
      metric("farTtfb", "Far-region catalogue TTFB", 1400, 240, "ms", 300), metric("imageShare", "Image byte share", 78, 78, "%", undefined, "lower", 0, "observation", "Page transfer", "Share of transferred bytes"),
      metric("originRps", "Origin requests", 850, 180, "RPS", 300), metric("egress", "Origin egress", 1200, 140, "Mbit/s", 250),
      metric("edgeHit", "Eligible edge hits", null, 91, "%", 85, "higher", 0, "capacity", "60-second window", "Origin-eligible requests"), metric("appCpu", "Application CPU", 58, 42, "%", 80, "lower", 0, "capacity"),
      metric("imageLoad", "Far-region image load p95", 3100, 620, "ms", 1000),
    ],
    evidence: [
      evidence("L6-E1", "Network", "Regional latency", "Far-region TTFB 1,400 ms", "Geographic comparison separates network time from origin processing.", "decisive"),
      evidence("L6-E2", "Network", "Payload composition", "Images are 78% of transferred bytes", "The largest byte class offers the greatest delivery leverage.", "decisive"),
      evidence("L6-E3", "Cost", "Origin delivery", "850 RPS · 1.2 Gbit/s egress", "Repeated origin delivery affects both latency and recurring cost.", "supporting"),
      evidence("L6-E4", "Capacity", "Origin utilization", "App 58% · DB 39%", "Healthy origin resources make compute scaling a weak fit.", "supporting"),
      evidence("L6-E5", "Network", "Asset reuse", "Same public versioned assets served across regions", "Reusable public responses can be delivered closer to users.", "decisive"),
      evidence("L6-E6", "Application", "Request breakdown", "Network time dominates distant requests", "The slow stage is outside application processing.", "supporting"),
    ],
    hypotheses: [
      { id: "L6-H1", label: "Geographic delivery and repeated public bytes", score: 25 }, { id: "L6-H2", label: "Origin compute", score: 0 },
      { id: "L6-H3", label: "Database latency", score: 0 }, { id: "L6-H4", label: "Missing regional writes", score: 10 },
    ],
    options: [
      option("L6-O1", "Use the edge", "Cache versioned assets and selected public catalogue responses with explicit exclusions.", 180, 3, "Moderate", "best", "Avoids origin work and long round trips for eligible public content.", "Cache-key leaks, invalidation delay, and inconsistent edge behavior.", { farTtfb: 240, originRps: 180, egress: 140, edgeHit: 91, appCpu: 42, imageLoad: 620 }),
      option("L6-O2", "Add regional fleets", "Run app fleets in three regions against one primary database.", 1600, 7, "Hard", "costly", "Moves compute closer but keeps cross-region data calls and consistency.", "High cost and more regional failure modes."),
      option("L6-O3", "Transform per request", "Resize and recompress every image inside the app on demand.", 0, 4, "Moderate", "partial", "Reduces bytes while adding repeated app CPU work.", "Compute saturation and duplicated transforms."),
      option("L6-O4", "Grow origin Redis", "Cache more rendered content in the primary region.", 180, 4, "Moderate", "partial", "Speeds origin generation but not geography or egress.", "More origin state without removing the long path."),
      option("L6-O5", "Use URL-only keys", "Cache all catalogue responses using only the URL as key.", 180, 2, "Moderate", "invariant", "Maximizes offload but can mix personalized price/account context.", "Private-data exposure and stale personalized content."),
    ],
    canonicalOptionIds: ["L6-O1"], canonicalCost: 180, canonicalPoints: 3,
    official: {
      bottleneck: "Geographic delivery and repeated public bytes.", evidence: "Images are 78% of bytes and far-region TTFB is 1,400 ms with healthy origin resources.",
      fit: "The edge avoids both the origin request and the long round trip.", risk: "Cache-key privacy, invalidation, and edge inconsistency.",
      verification: "Test hit/miss latency, purge/version rollout, exclusions, and paired origin RPS/egress reduction.", next: "Eligible reads and reports now saturate the transactional primary.",
    },
    hints: ["Compare payload bytes and latency by geography with origin utilization.", "Repeated public, versioned content can avoid both the origin and the long round trip."],
    stretch: "Which cache-key fields prevent leaks without exploding cardinality?",
  },
];

const lateLevels: LevelSpec[] = [
  {
    id: 7,
    participantTitle: "The overloaded primary",
    techniqueTitle: "Route eligible reads to replicas",
    phase: "Route reads",
    incident: "Product reads and internal reports drive the primary database to 91% CPU. Writes are only 18% of operations, but checkout latency is now at risk.",
    question: "Which work can move without breaking immediate visibility?",
    constraints: ["New orders must be visible immediately", "Catalogue tolerates 5 s lag", "Internal reports tolerate 60 s", "Replicas do not add write capacity"],
    metrics: [
      metric("checkoutP95", "Checkout p95", 860, 540, "ms", 800), metric("primaryCpu", "Primary CPU", 91, 52, "%", 80),
      metric("readIops", "Read IOPS", 88, 42, "% capacity", 80), metric("writeIops", "Write IOPS", 31, 32, "% capacity", 80),
      metric("replicaShare", "Reads on replicas", null, 72, "%", undefined, "lower", 0, "observation", "60-second window", "Share of all reads"), metric("replicaLag", "Replica lag p95", null, 0.8, "s", 5, "lower", 1),
      metric("replicaLagMax", "Replica lag max", null, 1.6, "s", 5, "lower", 1), metric("rywFailures", "Read-your-own-write failures", 0, 0, "", 0, "zero", 0, "invariant"),
    ],
    evidence: [
      evidence("L7-E1", "Database", "Operation mix", "82% reads · 18% writes", "Operation mix indicates which capacity axis is under pressure.", "decisive"),
      evidence("L7-E2", "Database", "I/O comparison", "Read IOPS 88% · write IOPS 31%", "Read saturation, not write capacity, drives primary pressure.", "decisive"),
      evidence("L7-E3", "Application", "Checkout state", "860 ms p95 · primary CPU 91%", "Read pressure now affects a critical write journey.", "supporting"),
      evidence("L7-E4", "Correctness", "Freshness classes", "72% of reads tolerate the stated replica lag", "Only explicitly lag-tolerant reads are movable.", "decisive"),
      evidence("L7-E5", "Correctness", "Post-write read", "New order history must be immediate", "Read-your-own-write requires a primary or position-aware route.", "supporting"),
      evidence("L7-E6", "Database", "Report share", "Reports consume 27% of primary read I/O", "Reports contribute meaningful but not all read pressure.", "supporting"),
    ],
    hypotheses: [
      { id: "L7-H1", label: "Eligible reads saturate the primary", score: 25 }, { id: "L7-H2", label: "Write capacity", score: 0 },
      { id: "L7-H3", label: "Lock contention", score: 5 }, { id: "L7-H4", label: "Reports only", score: 10 },
    ],
    options: [
      option("L7-O1", "Route tolerant reads", "Add replicas, lag monitoring, consistency-aware routing, and primary stickiness after writes.", 550, 4, "Moderate", "best", "Moves measured eligible reads while protecting immediate order visibility.", "Lag, stale reads, routing mistakes, and failover complexity.", { checkoutP95: 540, primaryCpu: 52, readIops: 42, replicaShare: 72, replicaLag: 0.8, replicaLagMax: 1.6, rywFailures: 0 }),
      option("L7-O2", "Shard customers", "Distribute customers across multiple primary databases.", 1800, 10, "Hard", "costly", "Distributes reads and writes before write capacity requires it.", "Routing, rebalance, cross-shard work, and high cost."),
      option("L7-O3", "Cache reports", "Cache admin reports for 45 seconds.", 180, 3, "Easy", "partial", "Meets freshness and removes repeats, but not the larger catalogue read share.", "Invalidation and incomplete primary relief."),
      option("L7-O4", "Scale the primary", "Move the primary to a larger tier.", 800, 1, "Easy", "costly", "Creates fast temporary headroom while reads still compete with writes.", "Recurring cost and unchanged workload shape."),
      option("L7-O5", "Lower isolation", "Lower transaction isolation for the whole system.", 0, 2, "Moderate", "invariant", "Does not remove read I/O and weakens correctness.", "Unexpected reads and write anomalies."),
    ],
    canonicalOptionIds: ["L7-O1"], canonicalCost: 550, canonicalPoints: 4,
    official: {
      bottleneck: "Eligible read load competing with transactions on the primary.", evidence: "82% reads and 88% read IOPS versus 31% write IOPS.",
      fit: "Move only lag-tolerant reads; keep immediate post-write reads on the source.", risk: "Lag, stale reads, routing errors, and multiplied pools.",
      verification: "Force lag, test post-write routing and failover, and verify every route against its freshness requirement.", next: "Multi-year analytical scans no longer fit an OLTP-shaped replica.",
    },
    hints: ["Separate reads from writes, then classify reads by freshness.", "Move only reads that tolerate lag; preserve post-write reads on the source."],
    stretch: "How can primary stickiness use a replication position instead of a fixed time?",
  },
  {
    id: 8,
    participantTitle: "Reports overwhelm operations",
    techniqueTitle: "Separate analytical workloads",
    phase: "Isolate workloads",
    incident: "Multi-year dashboards scan 180 GB and run for 210 seconds. Even the reporting replica falls 95 seconds behind during refresh.",
    question: "Does this workload need a different server, or a different data model?",
    constraints: ["Priority dashboards complete < 15 s", "Dashboards may be 5 min stale", "Checkout must not compete with scans", "Historical corrections propagate", "Totals reconcile with transactional records"],
    metrics: [
      metric("reportDuration", "Report duration", 210, 8, "s", 15), metric("bytesScanned", "Bytes scanned / report", 180, 12, "GB", 25),
      metric("replicaLag", "OLTP replica lag", 95, 0.9, "s", 60, "lower", 1), metric("freshness", "Analytics freshness", null, 3, "min", 5),
      metric("checkoutP95", "Checkout p95", 860, 480, "ms", 800), metric("reconcile", "Reconciliation delta", null, 0, "%", 0, "zero", 1, "invariant"),
    ],
    evidence: [
      evidence("L8-E1", "Analytics", "Query shape", "Millions of rows · dimensions absent from OLTP", "Analytical access differs from transactional point reads/writes.", "decisive"),
      evidence("L8-E2", "Database", "Index trade-off", "Report indexes increase order-write cost", "Optimizing one workload can harm the other.", "supporting"),
      evidence("L8-E3", "Database", "Replica pressure", "95 s lag during refresh", "A replica isolates some CPU, not the storage shape or freshness conflict.", "decisive"),
      evidence("L8-E4", "Business", "Freshness allowance", "Most dashboards allow 5 minutes", "The business contract permits asynchronous analytical data.", "decisive"),
      evidence("L8-E5", "Growth", "Workload trend", "History and report concurrency grow faster than checkout", "The mismatch will widen even if one report is tuned.", "supporting"),
    ],
    hypotheses: [
      { id: "L8-H1", label: "Analytical workload and OLTP model mismatch", score: 25 }, { id: "L8-H2", label: "Insufficient replica count", score: 10 },
      { id: "L8-H3", label: "Service deployment coupling", score: 5 }, { id: "L8-H4", label: "Missing indexes only", score: 10 },
    ],
    options: [
      option("L8-O1", "Add a report replica", "Dedicate another PostgreSQL replica to dashboards.", 550, 3, "Moderate", "partial", "Isolates some load but retains heavy scans and OLTP schema.", "Recurring cost and lag under refresh."),
      option("L8-O2", "Split the service", "Deploy analytics code separately on the same replica.", 400, 5, "Moderate", "wrong", "Separates code, not storage pressure.", "Cosmetic isolation and another deployment."),
      option("L8-O3", "Index every report", "Add reporting indexes to the transactional schema.", 0, 5, "Moderate", "partial", "Speeds known reports at the cost of writes and future flexibility.", "Write amplification and schema rigidity."),
      option("L8-O4", "Build an analytical path", "Stream or batch records into a reporting-oriented store with reconciliation.", 800, 6, "Hard", "best", "Matches the query model and accepted freshness while isolating checkout.", "Pipeline lag, ordering, schema evolution, backfills, and reconciliation.", { reportDuration: 8, bytesScanned: 12, replicaLag: 0.9, freshness: 3, checkoutP95: 480, reconcile: 0 }),
      option("L8-O5", "Use materialized views", "Refresh a fixed set of views every five minutes.", 100, 4, "Moderate", "partial", "A viable smaller solution for fixed reports, but refresh scans and schema rigidity limit growth.", "Refresh spikes and limited exploratory dimensions."),
    ],
    canonicalOptionIds: ["L8-O4"], canonicalCost: 800, canonicalPoints: 6,
    official: {
      bottleneck: "An analytical workload with a different access pattern and model from OLTP.", evidence: "180-GB scans, 210-second reports, and 95-second replica lag.",
      fit: "A separate analytical model absorbs scans within the five-minute freshness contract.", risk: "Pipeline correctness, freshness, backfills, schema evolution, and reconciliation.",
      verification: "Run reports during checkout; verify freshness, replay, corrections, deletion propagation, and reconciliation.", next: "Catalogue and checkout now diverge in traffic, release, ownership, and failure profile.",
    },
    hints: ["Compare report shape and freshness with transactional access patterns.", "A five-minute allowance permits an independently optimized analytical model."],
    stretch: "Which record is authoritative when a historical correction changes an order?",
  },
  {
    id: 9,
    participantTitle: "One fleet, two workloads",
    techniqueTitle: "Separate the catalogue scaling boundary",
    phase: "Separate",
    incident: "Catalogue reaches 8,000 RPS while checkout stays at 30 orders/s. Twenty-four shared instances exist mainly for browsing, and catalogue releases can still affect checkout.",
    question: "Which measured differences justify a deployment boundary?",
    constraints: ["Independent scaling and deployment", "Keep order/payment/inventory correctness together", "Create a real failure boundary", "Avoid a service per noun"],
    metrics: [
      metric("catalogueP95", "Catalogue p95", 410, 180, "ms", 300), metric("deployErrors", "Checkout errors during catalogue deploy", 3.4, 0.4, "%", 1, "lower", 1),
      metric("catalogueCpu", "Shared-fleet CPU saturation", 88, 62, "%", 75, "lower", 0, "capacity"), metric("checkoutP95", "Checkout p95", 620, 460, "ms", 800),
      metric("sharedInstances", "Shared instances", 24, 0, "", undefined, "lower", 0, "observation", "Deployment topology"),
      metric("catalogueInstances", "Catalogue instances", null, 18, "", undefined, "lower", 0, "observation", "Deployment topology"), metric("checkoutInstances", "Checkout instances", 24, 3, "", undefined, "lower", 0, "observation", "Deployment topology"),
    ],
    evidence: [
      evidence("L9-E1", "Capacity", "CPU ownership", "Catalogue consumes 88% of app CPU", "One workload drives fleet size for another.", "decisive"),
      evidence("L9-E2", "Capacity", "Checkout requirement", "Checkout needs fewer than 3 equivalent instances", "Independent capacity would avoid broad overprovisioning.", "decisive"),
      evidence("L9-E3", "Delivery", "Release cadence", "Catalogue releases 6× more often", "Different change frequency increases unrelated deployment exposure.", "supporting"),
      evidence("L9-E4", "Reliability", "Recent blast radius", "Catalogue rendering regression raised checkout errors", "Shared resources couple failures between journeys.", "decisive"),
      evidence("L9-E5", "Ownership", "Data responsibilities", "Catalogue uses derived presentation data; checkout owns transactions", "Ownership boundaries can support a useful service boundary.", "supporting"),
      evidence("L9-E6", "Architecture", "Coupling warning", "Shared tables and synchronous calls would preserve a distributed monolith", "A process boundary alone does not create independence.", "context"),
    ],
    hypotheses: [
      { id: "L9-H1", label: "Workload and failure-boundary mismatch", score: 25 }, { id: "L9-H2", label: "Database capacity", score: 5 },
      { id: "L9-H3", label: "Cache capacity", score: 5 }, { id: "L9-H4", label: "Frontend coupling only", score: 5 },
    ],
    options: [
      option("L9-O1", "Extract catalogue capability", "Create one independently deployable catalogue boundary with explicit contracts and data ownership.", 500, 7, "Hard", "best", "Separates scaling, releases, data responsibility, and blast radius without over-decomposition.", "Network failure, contracts, data duplication, versioning, and tracing.", { catalogueP95: 180, deployErrors: 0.4, checkoutP95: 460, catalogueCpu: 62, sharedInstances: 0, catalogueInstances: 18, checkoutInstances: 3 }),
      option("L9-O2", "Split every domain", "Create services for products, categories, carts, orders, inventory, invoices, and users.", 1800, 12, "Hard", "costly", "Creates many boundaries without measured need.", "Coordination, network calls, operational overhead, and distributed transactions."),
      option("L9-O3", "Grow the monolith", "Increase the shared fleet from 24 to 40 instances.", 1000, 2, "Easy", "costly", "Restores capacity but preserves overprovisioning and blast radius.", "Recurring cost and shared deployments."),
      option("L9-O4", "Split the frontend", "Deploy the catalogue frontend independently.", 150, 3, "Moderate", "wrong", "Improves UI releases while backend compute and failure remain shared.", "A cosmetic boundary with little capacity isolation."),
      option("L9-O5", "Add cache and replicas", "Add more data capacity inside the shared monolith.", 300, 4, "Moderate", "partial", "Reduces some data pressure but not compute, release, or failure coupling.", "More infrastructure inside the same blast radius."),
    ],
    canonicalOptionIds: ["L9-O1"], canonicalCost: 500, canonicalPoints: 7,
    official: {
      bottleneck: "A workload and failure-boundary mismatch inside one deployment unit.", evidence: "Catalogue consumes 88% of CPU and catalogue releases affect checkout.",
      fit: "One selected boundary permits independent capacity and failure without multiplying services.", risk: "Contracts, duplicated data, network failure, versioning, and tracing.",
      verification: "Scale and deploy catalogue independently, inject failure, trace calls, and confirm checkout ownership and capacity.", next: "Independent checkout scaling increases concurrency against a few hot inventory records.",
    },
    hints: ["Compare scaling need, release cadence, and blast radius.", "A useful boundary changes independent capacity and failure, not only repository structure."],
    stretch: "Which catalogue data may be copied, and how is authoritative ownership enforced?",
  },
  {
    id: 10,
    participantTitle: "Five hundred units",
    techniqueTitle: "Preserve inventory under contention",
    phase: "Preserve correctness",
    incident: "Twenty thousand users compete for 500 units in 60 seconds. The system accepts 563 orders, including 63 beyond available stock; retries also create duplicates and ambiguous outcomes.",
    question: "What is useful throughput when only 500 successes are possible?",
    constraints: ["Reserved + confirmed ≤ stock", "Same idempotency key returns original result", "Excess demand may be rejected or queued", "Payment/reservation transitions are recoverable"],
    metrics: [
      metric("attempts", "Offered attempts", 20000, 20000, "", undefined, "lower", 0, "observation", "60-second sale window", "All checkout attempts"), metric("accepted", "Orders accepted", 563, 500, "", 500, "equal", 0, "invariant"),
      metric("useful", "Unambiguous valid outcomes", 437, 500, "", 500, "higher", 0, "capacity"), metric("checkoutP95", "Checkout outcome p95", 3600, 720, "ms", 800),
      metric("lockWait", "Lock wait p95", 2800, 420, "ms", 800), metric("retries", "Transaction retries", 18, 3, "%", 5),
      metric("duplicates", "Duplicate orders", 2.1, 0, "%", 0, "zero", 1, "invariant"), metric("oversold", "Oversold units", 63, 0, "", 0, "zero", 0, "invariant"),
    ],
    evidence: [
      evidence("L10-E1", "Correctness", "Inventory write", "Read stock → check in app → write decrement", "A split check/write allows concurrent requests to observe the same stock.", "decisive"),
      evidence("L10-E2", "Database", "Contention", "2,800 ms lock wait · 18% retries", "Hot-record concurrency is already collapsing useful throughput.", "supporting"),
      evidence("L10-E3", "Business", "Invariant accounting", "563 accepted for 500 units · 63 oversold · 2.1% duplicate orders", "Accepted, available, and duplicate totals expose whether the stock invariant holds.", "decisive"),
      evidence("L10-E4", "Capacity", "Scale-out experiment", "More instances increase writers and contention", "Handler capacity is not the limiting useful-work rate.", "decisive"),
      evidence("L10-E5", "Database", "Skew", "Only a few SKUs are hot", "A targeted hot-key policy avoids penalizing unrelated products.", "supporting"),
      evidence("L10-E6", "Business", "Useful throughput", "Only 500 valid reservations can succeed", "Attempt RPS is not the success objective.", "supporting"),
    ],
    hypotheses: [
      { id: "L10-H1", label: "Unsafe hot-record correctness and admission", score: 25 }, { id: "L10-H2", label: "Application capacity", score: 0 },
      { id: "L10-H3", label: "Database CPU", score: 5 }, { id: "L10-H4", label: "Missing distributed lock", score: 10 },
    ],
    options: [
      option("L10-O1", "Use a Redis lock", "Acquire a distributed lock per SKU before checkout.", 180, 5, "Moderate", "partial", "Serializes work outside the source of truth but does not enforce inventory or idempotency alone.", "Lease failure, split ownership, and recovery gaps."),
      option("L10-O2", "Use serializable mode", "Run every checkout transaction at serializable isolation.", 0, 4, "Moderate", "partial", "Improves correctness but hot-row aborts can collapse throughput broadly.", "Retry storms and unnecessary cost for unrelated SKUs."),
      option("L10-O3", "Atomic reservation workflow", "Use conditional source writes, idempotency, expiring reservations, and bounded admission.", 150, 6, "Hard", "best", "Enforces the invariant at the source and limits hot-key concurrency.", "Expiry/payment races, fairness, reconciliation, and state-machine recovery.", { accepted: 500, useful: 500, checkoutP95: 720, lockWait: 420, retries: 3, duplicates: 0, oversold: 0 }),
      option("L10-O4", "Add checkout instances", "Process more attempts in parallel.", 600, 2, "Easy", "partial", "Adds writers and worsens contention.", "Higher retries and oversell concurrency.", { accepted: 591, useful: 409, checkoutP95: 4900, lockWait: 4100, retries: 27, oversold: 91 }),
      option("L10-O5", "Cancel oversold orders", "Accept every order and reconcile inventory later.", 0, 3, "Hard", "invariant", "Maximizes apparent conversion while violating the explicit stock contract.", "Customer harm and irreversible trust loss."),
    ],
    canonicalOptionIds: ["L10-O3"], canonicalCost: 150, canonicalPoints: 6,
    official: {
      bottleneck: "Correctness and contention on hot inventory records—not request handlers.", evidence: "Unsafe read/write, 18% retries, and 63 oversold units.",
      fit: "Atomic writes protect stock, idempotency handles retries, and admission bounds concurrency.", risk: "Reservation expiry, payment races, fairness, hot queues, and recovery.",
      verification: "Replay 20,000 attempts and repeated keys; prove exactly 500 accepted, zero oversell/duplicates, and p95 below 800 ms.", next: "Years of order history now inflate the hot operational database.",
    },
    hints: ["Prioritize inventory totals, duplicate behavior, and lock waiting over raw attempt RPS.", "Enforce the invariant at the source of truth, make retries repeatable, and bound admission."],
    stretch: "How does the system recover when payment succeeds as a reservation expires?",
  },
  {
    id: 11,
    participantTitle: "Four terabytes and growing",
    techniqueTitle: "Partition first; shard only with evidence",
    phase: "Reduce the hot set",
    incident: "The order database reaches 4.2 TB. Indexes are 1.6 TB, write IOPS 92%, checkout p95 1,200 ms, backups 11 hours, and maintenance 7 hours.",
    question: "How much data must remain hot to meet operational objectives?",
    constraints: ["Most operational queries use 90 days", "Orders queryable by customer", "Hot backup < 3 h", "Hot restore < 4 h", "Maintenance < 2 h", "≥ 20% write headroom"],
    metrics: [
      metric("hotSet", "Primary operational dataset", 4200, 650, "GB", 800, "lower", 0, "capacity"), metric("indexes", "Index size", 1600, 340, "GB", undefined, "lower", 0, "observation", "Current primary"),
      metric("writeIops", "Write IOPS", 92, 68, "% capacity", 80), metric("checkoutP95", "Checkout p95", 1200, 650, "ms", 800),
      metric("backup", "Hot backup", 11, 2.1, "h", 3, "lower", 1), metric("restore", "Tested hot restore", 9.2, 3.4, "h", 4, "lower", 1), metric("maintenance", "Maintenance", 7, 1.5, "h", 2, "lower", 1),
      metric("pruning", "Operational partition pruning", 0, 96, "%", 90, "higher", 0, "capacity", "Representative operational queries"),
    ],
    evidence: [
      evidence("L11-E1", "Data", "Historical share", "78% of rows are older than two years", "Age distribution indicates whether cold history dominates structures.", "decisive"),
      evidence("L11-E2", "Application", "Query locality", "Operational endpoints rarely touch old data", "Hot/cold access differs enough for lifecycle separation.", "supporting"),
      evidence("L11-E3", "Database", "Index scope", "Historical rows occupy indexes used only by recent queries", "Index maintenance includes avoidable cold data.", "decisive"),
      evidence("L11-E4", "Database", "Pruning estimate", "Time pruning removes most scanned partitions", "Partition-aligned queries can avoid old structures.", "supporting"),
      evidence("L11-E5", "Capacity", "Clean hot-set model", "650 GB active set with restored I/O headroom", "A smaller single-primary state should be tested before distributed routing.", "decisive"),
    ],
    hypotheses: [
      { id: "L11-H1", label: "Cold history inflates hot structures and maintenance", score: 25 }, { id: "L11-H2", label: "Primary tier", score: 10 },
      { id: "L11-H3", label: "Immediate sharding", score: 10 }, { id: "L11-H4", label: "Database technology", score: 0 },
    ],
    options: [
      option("L11-O1", "Double the storage tier", "Buy more storage and I/O capacity.", 1800, 1, "Easy", "costly", "Fast relief while backup and maintenance continue to scale with history.", "Large recurring cost and postponed lifecycle work."),
      option("L11-O2", "Partition and archive", "Partition by time, archive cold data, prune indexes, and verify hot/full restore.", 300, 6, "Hard", "best", "Shrinks hot structures and restores every current target without routing.", "Partition lifecycle, archive correctness, restore, and accidental full scans.", { hotSet: 650, indexes: 340, writeIops: 68, checkoutP95: 650, backup: 2.1, restore: 3.4, maintenance: 1.5, pruning: 96 }),
      option("L11-O3", "Shard random orders", "Distribute random order IDs across primaries.", 2000, 10, "Hard", "partial", "Balances writes but scatters customer/support queries.", "Fan-out, routing, and cross-shard operations."),
      option("L11-O4", "Replace the database", "Migrate orders to a document database.", 2500, 14, "Hard", "costly", "Changes technology without evidence the data model is the root cause.", "Migration risk and operational retraining."),
      option("L11-O5", "Shard by region", "Route orders to geographic primaries.", 2000, 10, "Hard", "costly", "Creates locality if residency requires it, but current evidence does not.", "Skew, movement, and cross-region operations."),
    ],
    canonicalOptionIds: ["L11-O2"], canonicalCost: 300, canonicalPoints: 6,
    official: {
      bottleneck: "Cold history inflates the operational working set, indexes, backup, and maintenance.", evidence: "78% old rows and a 650-GB active set.",
      fit: "Partitioning and archiving restore all targets before distributed routing is justified.", risk: "Lifecycle management, archive correctness, restore complexity, and missed partitions.",
      verification: "Verify pruning, customer history, reconciliation, scheduled partitions, 2.1-h backup, 3.4-h restore, and 1.5-h maintenance.", next: "The complete topology now faces simultaneous dependency, overload, zone, and deployment failure.",
    },
    hints: ["Compare active and historical data with backup, maintenance, and write-headroom targets.", "Reduce the hot set before accepting distributed routing and cross-shard operations."],
    stretch: "What observable threshold should justify sharding after partitioning?",
  },
  {
    id: 12,
    participantTitle: "Everything fails at once",
    techniqueTitle: "Design for failure under load",
    phase: "Survive",
    incident: "At peak traffic, Redis restarts, email times out, workers stop, one zone is lost, a replica lags, and a faulty deployment raises errors.",
    question: "Which protections preserve confirmed orders, and what risk will you deliberately leave uncovered?",
    constraints: ["Confirmed orders never disappear", "Checkout outranks email/analytics", "Catalogue may degrade", "Retries remain bounded", "Stop harmful rollout", "12 resilience points · max 4 actions"],
    metrics: [
      metric("offeredCheckout", "Offered checkout", 30, 30, "/s", undefined, "lower", 0, "observation", "60-second window", "All arriving checkout requests"), metric("usefulCheckout", "Useful completion", 26.4, 29.8, "/s", 29.5, "higher", 1, "capacity", "60-second window", "Confirmed, non-duplicate outcomes"),
      metric("errors", "Checkout errors", 12, 0.7, "%", 1, "lower", 1), metric("burn", "SLO burn rate", 22, 0.8, "×", 1, "lower", 1),
      metric("checkoutP95", "Checkout p95", 6200, 690, "ms", 800),
      metric("queueAge", "Oldest queued job", 26, 12, "min", 12),
      metric("amplification", "Retry amplification", 2.4, 1.1, "×", 1.2, "lower", 1), metric("orderLoss", "Confirmed order loss", 0, 0, "", 0, "zero"),
    ],
    evidence: [
      evidence("L12-E1", "Dependencies", "Timeout policy", "Shared 30-second timeout on every dependency", "A timeout budget can be compared with the caller deadline and dependency criticality.", "decisive", 1),
      evidence("L12-E2", "Dependencies", "Retry policy", "Immediate, unbounded retries in two clients", "Attempt counts show whether retries multiply the original load.", "decisive", 2),
      evidence("L12-E3", "Capacity", "Shared pools", "Checkout, workers, and dependencies share pools", "Pool ownership determines which workloads can consume the same concurrency.", "decisive", 2),
      evidence("L12-E4", "Operations", "Customer impact", "12% errors · 22× SLO burn", "Burn rate compares current failures with the allowed error budget.", "supporting", 2),
      evidence("L12-E5", "Queue", "Worker stop", "Oldest job reaches 26 minutes", "Oldest age shows how long asynchronous work has waited.", "supporting", 2),
      evidence("L12-E6", "Delivery", "Fleet deployment", "One release reaches every instance at once", "Rollout shape determines how much capacity receives the same change simultaneously.", "decisive", 3),
      evidence("L12-E7", "Cache", "Redis restart", "Database reads surge 6.4× during refill", "Refill load measures how cache loss transfers work to the source.", "supporting", 1),
      evidence("L12-E8", "Correctness", "Order outcome", "Orders remain durable; customers receive ambiguous timeouts", "Durability and response certainty are separate properties.", "decisive", 1),
      evidence("L12-E9", "Infrastructure", "Zone recovery", "50% app capacity lost · manual writer failover 4m20s", "Recovery time can be compared with the two-minute critical-journey target.", "decisive", 3),
    ],
    hypotheses: [
      { id: "L12-H1", label: "Amplification plus shared failure domains", score: 25 }, { id: "L12-H2", label: "Raw capacity", score: 5 },
      { id: "L12-H3", label: "Timeout length", score: 5 }, { id: "L12-H4", label: "Missing active-active writes", score: 10 },
    ],
    options: [
      option("L12-A1", "Dependency budgets", "Use dependency-specific timeouts plus bounded retries, backoff, jitter, and idempotency.", 0, 2, "Moderate", "best", "Contains long hangs and retry amplification.", "Incorrect budgets and delayed recovery.", undefined, ["dependency", "amplification"]),
      option("L12-A2", "Graceful isolation", "Use circuit breakers and fallbacks for catalogue, email, and analytics.", 0, 3, "Moderate", "costly", "Preserves more non-critical availability but does not directly govern retries.", "Breaker oscillation and stale fallback policy.", undefined, ["dependency"]),
      option("L12-A3", "Resource containment", "Use checkout bulkheads, bounded worker queues, and backpressure.", 0, 3, "Moderate", "best", "Prevents secondary failure from consuming checkout resources.", "Rejected work, queue tuning, and fairness.", undefined, ["amplification", "resources"]),
      option("L12-A4", "Zone recovery", "Use multi-zone app placement, automated database failover, and tested restore.", 0, 4, "Hard", "best", "Restores critical service through zone loss.", "Failover data risk and higher operating burden.", undefined, ["zone"]),
      option("L12-A5", "Progressive delivery", "Use a canary and health-based automatic rollback.", 0, 2, "Moderate", "best", "Stops a harmful release before fleet-wide impact.", "False-positive rollback and metric selection.", undefined, ["deploy"]),
      option("L12-A6", "Worker elasticity", "Scale workers from oldest-job age.", 0, 2, "Easy", "partial", "Helps backlog recovery but not poison jobs or checkout isolation.", "Cost spikes and unstable scaling.", undefined, ["resources"]),
      option("L12-A7", "Cache refill shielding", "Rate-limit and coalesce cache refill.", 0, 2, "Moderate", "partial", "Contains the Redis restart surge only.", "Slower warm-up and narrow coverage.", undefined, ["dependency"]),
      option("L12-A8", "Larger shared pools", "Increase every shared pool limit.", 0, 2, "Easy", "partial", "Buys brief concurrency while preserving shared failure.", "More downstream overload."),
      option("L12-A9", "Active-active writes", "Build multi-region active-active writes for every component.", 0, 7, "Hard", "costly", "Covers a wider failure than required at major consistency cost.", "Conflicts, split brain, and operational complexity.", undefined, ["zone"]),
    ],
    canonicalOptionIds: ["L12-A1", "L12-A3", "L12-A4", "L12-A5"], canonicalCost: 0, canonicalPoints: 0,
    official: {
      bottleneck: "Failure amplification across shared resources plus zone and change failure.", evidence: "Unbounded retries, shared pools, 30-second timeouts, zone recovery, and fleet-wide rollout.",
      fit: "Budgets limit calls, bulkheads contain overload, zone recovery preserves durability, and canaries stop harmful change.", risk: "Policy tuning, rejected work, failover data risk, and false-positive rollback.",
      verification: "Replay every wave separately and together; prove bounded amplification, zero loss, automated rollback, and queue recovery within 12 minutes.", next: "The workshop ends by comparing value, permanent complexity, reversibility, and transfer to your own systems.",
    },
    hints: ["Choose one observation from each wave and rank checkout durability above email and analytics freshness.", "Contain amplification and shared resources, protect durable recovery, and stop harmful change; no budget covers every improvement."],
    stretch: "What risk does your selected set deliberately leave uncovered?",
    capstone: { budget: 12, maxSelections: 4, evidenceRequired: 3 },
  },
];

export const levels: LevelSpec[] = [...earlyLevels, ...lateLevels];
