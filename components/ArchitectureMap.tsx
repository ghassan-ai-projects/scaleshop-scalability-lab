import type { LevelSpec } from "@/lib/workshop";

type Node = { id: string; label: string; meta: string; lane: string; added: number; kind: string };

const nodes: Node[] = [
  { id: "users", label: "Customers", meta: "Catalogue + checkout", lane: "client", added: 0, kind: "actor" },
  { id: "edge", label: "CDN + routing", meta: "Public paths only", lane: "edge", added: 6, kind: "edge" },
  { id: "lb", label: "Load balancer", meta: "Health + drain", lane: "edge", added: 5, kind: "edge" },
  { id: "app", label: "Web application", meta: "Monolith", lane: "compute", added: 0, kind: "service" },
  { id: "catalogue", label: "Catalogue service", meta: "Derived reads", lane: "compute", added: 9, kind: "service" },
  { id: "checkout", label: "Checkout service", meta: "Order owner", lane: "compute", added: 9, kind: "service" },
  { id: "cache", label: "Catalogue cache", meta: "Fallback → source", lane: "fast", added: 3, kind: "cache" },
  { id: "session", label: "Session store", meta: "Shared state", lane: "fast", added: 5, kind: "cache" },
  { id: "queue", label: "Outbox → queue", meta: "Durable handoff", lane: "fast", added: 4, kind: "queue" },
  { id: "workers", label: "Workers", meta: "Idempotent effects", lane: "compute", added: 4, kind: "worker" },
  { id: "db", label: "PostgreSQL primary", meta: "Source of truth", lane: "data", added: 0, kind: "database" },
  { id: "replicas", label: "Read replicas", meta: "Lag-aware routes", lane: "data", added: 7, kind: "database" },
  { id: "objects", label: "Object storage", meta: "Uploads + assets", lane: "data", added: 5, kind: "object" },
  { id: "analytics", label: "Analytics store", meta: "≤ 5 min freshness", lane: "analytics", added: 8, kind: "database" },
  { id: "external", label: "External services", meta: "Payment · email · warehouse", lane: "external", added: 0, kind: "external" },
  { id: "observability", label: "Observability / APM", meta: "Journey SLOs + traces", lane: "ops", added: 1, kind: "ops" },
  { id: "delivery", label: "Canary + rollback", meta: "Health-gated", lane: "ops", added: 12, kind: "ops" },
];

const lanes = [
  ["client", "Client"], ["edge", "Edge"], ["compute", "Compute"], ["fast", "Fast state"],
  ["data", "Transactional data"], ["analytics", "Analytical data"], ["external", "External"], ["ops", "Operations"],
] as const;

export function ArchitectureMap({ stage, level, evolved }: { stage: number; level: LevelSpec; evolved: boolean }) {
  const visible = nodes.filter((node) => node.added <= stage).filter((node) => {
    if (stage >= 9 && node.id === "app") return false;
    if (stage < 9 && (node.id === "catalogue" || node.id === "checkout")) return false;
    return true;
  });

  const delta = visible.filter((node) => node.added === stage && evolved);
  const flowIds = stage >= 9
    ? ["users", ...(stage >= 6 ? ["edge"] : []), "catalogue", ...(stage >= 3 ? ["cache"] : []), "db", "checkout", ...(stage >= 4 ? ["queue", "workers"] : []), "external"]
    : ["users", ...(stage >= 6 ? ["edge"] : []), ...(stage >= 5 ? ["lb"] : []), "app", "db", ...(stage >= 4 ? ["queue", "workers"] : []), "external"];
  const flowNodes = flowIds.map((id) => visible.find((node) => node.id === id)).filter(Boolean) as Node[];
  const policyDeltas: Record<number, string> = {
    1: "Journey SLOs, RED/USE telemetry, alert ownership, and distributed tracing become the operating contract.",
    2: "The catalogue request path performs bounded query work with reviewed plans and pool headroom.",
    10: "Inventory reservations and idempotency are enforced atomically at the PostgreSQL ownership boundary.",
    11: "Orders are time-partitioned; cold history is archived while the primary retains the operational hot set.",
    12: "Timeout budgets, bulkheads, backpressure, multi-zone recovery, canary delivery, and rollback overlay the existing paths.",
  };
  const flow = stage >= 9
    ? "Customers → edge/routing → catalogue or checkout. Catalogue reads cache then source. Checkout writes PostgreSQL and outbox; workers call external services."
    : `Customers → ${stage >= 6 ? "edge → " : ""}${stage >= 5 ? "load balancer → " : ""}web application → PostgreSQL and external services.`;

  return (
    <section id="architecture" className="panel architecture-panel" aria-labelledby="architecture-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Architecture memory</p>
          <h2 id="architecture-title">{evolved ? "Evolved setup" : "Current setup"}</h2>
        </div>
        <span className={`state-pill ${evolved ? "is-after" : ""}`}>{evolved ? "AFTER DECISION" : "INHERITED"}</span>
      </div>

      <div className="architecture-grid" aria-hidden="true">
        {lanes.map(([lane, label]) => {
          const laneNodes = visible.filter((node) => node.lane === lane);
          if (!laneNodes.length) return null;
          return (
            <div className={`architecture-lane lane-${lane}`} key={lane}>
              <span className="lane-label">{label}</span>
              <div className="lane-nodes">
                {laneNodes.map((node) => (
                  <div className={`architecture-node node-${node.kind} ${delta.some((item) => item.id === node.id) ? "is-new" : ""}`} key={node.id}>
                    {delta.some((item) => item.id === node.id) && <span className="new-badge">NEW</span>}
                    <strong>{node.label}</strong>
                    <small>{node.meta}</small>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="architecture-flow" aria-label="Focused request path">
        <span>Focused path</span>
        {flowNodes.map((node, index) => <div key={node.id}>{index > 0 && <i aria-hidden="true">→</i>}<strong>{node.label}</strong><small>{index === 0 ? "request" : node.id === "db" ? "read / write" : node.id === "queue" ? "durable handoff" : "call"}</small></div>)}
      </div>

      <details className="architecture-outline">
        <summary>Architecture text alternative</summary>
        <p><strong>Current flow:</strong> {flow}</p>
        <p><strong>Source of truth:</strong> PostgreSQL owns orders and inventory. Cache and analytics data are derived.</p>
        <p><strong>Current incident path:</strong> {level.question}</p>
        {evolved && <p><strong>Delta:</strong> {delta.length ? delta.map((item) => item.label).join(", ") : policyDeltas[level.id] ?? "Configuration and policy changed without a new topology node."}</p>}
      </details>
    </section>
  );
}
