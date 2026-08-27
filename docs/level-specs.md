# Twelve-level workshop specification

## 1. Canonical progression rules

- The workshop starts with a recurring budget of **€6,000/month** and **70 engineering points**.
- Prices are comparative teaching values, not vendor estimates.
- A participant’s choice is simulated first. After the debrief, the canonical recommended change is adopted so every team reaches the same next level.
- Only the canonical change is deducted from the continuing workshop budget. A wrong experiment displays its cost but does not make later levels impossible.
- Standard levels offer five options. Level 11 contains a staged growth decision, and Level 12 is a constrained multi-select capstone.
- Every level states enough workload, consistency, freshness, and cost constraints to make one option the best next move.
- Option IDs are stable, but participant card order is deterministic and deliberately independent of the correct option. Position must not become an answer pattern.
- A committed option receives one consequence and debrief rather than repeated attempts. Facilitator rewind is a discussion aid, not another scored attempt.
- Hints are free. Their use is recorded only to support the debrief.
- Engineering points map to lead-time bands shown on cards: 1–2 points is up to 2 engineer-days, 3–4 is 3–5 days, 5–7 is 1–2 weeks, 8–10 is 2–4 weeks, and 11+ is more than one month. These are workshop comparisons, not delivery commitments.
- Reversibility defaults from the change shape: **easy** for configuration or capacity changes with no data migration, **moderate** for new components or coordinated code changes, and **hard** for data migration, ownership-boundary, routing, or correctness-workflow changes. Each option stores an explicit reviewed value and may override the default.
- Level 12 uses a separate resilience-point constraint. It does not deduct resilience points from the remaining 70-point engineering budget; the header continues to show the canonical recurring and engineering budgets for the retrospective.

### Option challenge rules

- Teams must record a provisional bottleneck and select two revealed evidence items before seeing the options. Those selections carry into the decision summary and are not re-entered.
- Every option addresses at least one real symptom or plausible future concern.
- Before commit, cards show mechanism, lead-time band, recurring scenario cost, engineering points, and reversibility. They never show outcome classification or predicted metrics.
- At least one rejected option must be viable under a different time horizon, and facilitator notes must state the threshold that would make it appropriate.
- Unsafe options are plausible shortcuts that violate a stated invariant; there is at most one per standard level.
- The recommended option must win on the stated constraint set, not because it uses the workshop's intended technology.
- Other rejected options must be credible but partial, mistimed, or unnecessarily costly.
- Card titles are short and neutral. Every card uses the same detail fields so the recommended option is not identifiable by length, safeguard count, or production-ready tone.

### Canonical budget ledger

Only the recommended change affects the continuing totals. Level 12 uses its separate resilience constraint.

| After level | Canonical change | Monthly change | Engineering points used | Monthly budget remaining | Engineering points remaining |
|---:|---|---:|---:|---:|---:|
| Start | — | — | — | €6,000 | 70 |
| 1 | SLOs, observability, and stepped capacity test | €120 | 4 | €5,880 | 66 |
| 2 | Query and index optimization | €0 | 4 | €5,880 | 62 |
| 3 | Selective caching | €180 | 4 | €5,700 | 58 |
| 4 | Outbox, queue, and workers | €250 | 5 | €5,450 | 53 |
| 5 | Stateless application fleet | €600 | 4 | €4,850 | 49 |
| 6 | CDN and edge policy | €180 | 3 | €4,670 | 46 |
| 7 | Read replicas and routing | €550 | 4 | €4,120 | 42 |
| 8 | Analytical pipeline and store | €800 | 6 | €3,320 | 36 |
| 9 | Catalogue scaling boundary | €500 | 7 | €2,820 | 29 |
| 10 | Atomic reservations and admission | €150 | 6 | €2,670 | 23 |
| 11 | Partitioning and archive | €300 | 6 | €2,370 | 17 |
| 12 | Resilience action set | separate capstone constraint | separate capstone constraint | €2,370 | 17 |

## 2. Shared reasoning template

Before options appear, teams select:

1. **Bottleneck:** name the limiting resource or failure mechanism.
2. **Evidence:** cite two decisive signals.

The decision summary carries those selections forward. Before submitting, teams add:

3. **Fit:** explain why the choice restores the SLO under the stated constraints.
4. **Prediction:** state what should improve and what should remain unchanged.
5. **New risk:** name the most important complexity or failure mode introduced.

Stable IDs and diagnostic roles in this document are authoring metadata and are not shown as answer cues. A canonical hypothesis earns 25 diagnosis points, an adjacent mechanism earns 10, a symptom-only selection earns 5, and an unrelated selection earns 0. Two decisive evidence items earn 12.5 points each; supporting items earn 6.25 each; context items earn 0. Evidence credit is capped at 25.

## 3. Participant and technique titles

The neutral participant title is displayed until debrief. The technique title is facilitator/debrief content only.

| Level | Participant title | Technique title revealed in debrief | Canonical hypothesis ID | Plausible alternative hypotheses |
|---:|---|---|---|---|
| 1 | Unknown capacity | Establish the operating contract | L1-H1: missing objectives and representative capacity evidence | L1-H2 database capacity; L1-H3 app capacity; L1-H4 cache absence |
| 2 | The campaign slowdown | Remove inefficient database access | L2-H1: excessive database work per request | L2-H2 app compute; L2-H3 insufficient DB tier; L2-H4 pool size |
| 3 | The viral product | Cache the read-heavy catalogue | L3-H1: repeated bounded-stale reads | L3-H2 insufficient DB tier; L3-H3 missing replicas; L3-H4 app compute |
| 4 | Checkout waits on side effects | Isolate slow work with durable jobs | L4-H1: synchronous non-critical side effects | L4-H2 app capacity; L4-H3 DB capacity; L4-H4 request timeout |
| 5 | One instance at the limit | Scale stateless application instances | L5-H1: single stateful app compute ceiling | L5-H2 database capacity; L5-H3 static delivery; L5-H4 load skew only |
| 6 | Slow far from home | Move public content to the edge | L6-H1: geographic delivery and repeated public bytes | L6-H2 origin compute; L6-H3 database latency; L6-H4 regional writes |
| 7 | The overloaded primary | Route eligible reads to replicas | L7-H1: eligible reads saturate the primary | L7-H2 write capacity; L7-H3 lock contention; L7-H4 report cache only |
| 8 | Reports overwhelm operations | Separate analytical workloads | L8-H1: analytical workload and OLTP model mismatch | L8-H2 insufficient replica count; L8-H3 service deployment coupling; L8-H4 missing indexes only |
| 9 | One fleet, two workloads | Separate the catalogue scaling boundary | L9-H1: workload and failure-boundary mismatch | L9-H2 database capacity; L9-H3 cache capacity; L9-H4 frontend coupling only |
| 10 | Five hundred units | Preserve inventory under contention | L10-H1: unsafe hot-record correctness and admission | L10-H2 app capacity; L10-H3 database CPU; L10-H4 distributed lock absence |
| 11 | Four terabytes and growing | Partition first; shard only with evidence | L11-H1: cold history inflates hot structures and maintenance | L11-H2 primary tier; L11-H3 immediate sharding; L11-H4 database technology |
| 12 | Everything fails at once | Design for failure under load | L12-H1: amplification plus shared failure domains | L12-H2 raw capacity; L12-H3 timeout length; L12-H4 global active-active absence |

---

## Level 1 — Establish the operating contract

- **Participant title:** Unknown capacity
- **Technique title after reveal:** Establish the operating contract

### Incident

ScaleShop has launched. It serves 2 RPS and everything appears healthy. The founders ask, “How much traffic can we handle, and how will we know that customers are suffering?”

### Constraints and targets

- Catalogue p95 under 300 ms
- Checkout p95 under 800 ms
- Errors under 1%
- No lost confirmed orders
- No oversold inventory
- Do not add capacity without evidence

### Evidence available

- `L1-E1` — Access logs contain status and duration but no route percentiles. **Decisive.**
- `L1-E2` — There is no baseline, tracing, alert, error-budget definition, or representative capacity envelope. **Decisive.**
- `L1-E3` — App CPU is 18% and DB CPU is 12% at the current load. **Supporting.**
- `L1-E4` — One successful manual test is available. **Context.**
- `L1-E5` — Provider instance specifications describe theoretical resources but not application capacity. **Context.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Define journey SLOs, instrument RED/USE metrics and traces, then run a representative stepped load test | €120 + 4 points | Establishes targets and a reproducible capacity envelope before optimization | **Best next change** |
| Run a short test up to 50 RPS and record aggregate latency | €0 + 2 points | Produces an initial observation quickly | Partial: no representative workload mix, tail objective, sustained baseline, or production detection |
| Upgrade PostgreSQL before launch traffic grows | €700 + 1 point | Adds headroom to a critical dependency | Premature: no evidence the database is limiting |
| Buy an APM tool but keep default dashboards and alerts | €250 + 2 points | Adds broad visibility with little setup | Viable but incomplete: telemetry without explicit service objectives |
| Add Redis to protect the database | €180 + 4 points | Common early scaling pattern | Premature: adds invalidation complexity to a healthy system |

### Recommended reasoning

- **Bottleneck:** knowledge and detection, not compute capacity.
- **Evidence:** no route-level percentiles and no defined failure threshold.
- **Why this fits:** every later decision requires a stable target, representative workload, first limiting boundary, and comparable before/after evidence.
- **New risk:** noisy telemetry, excessive cardinality, and alert fatigue if instrumentation is undisciplined.

### Fit boundary and verification

- **Do not over-apply it:** one synthetic peak or one workload mix is not a universal capacity promise, and unbounded labels or traces can create cost and privacy problems.
- **Verify:** all five objectives have owners and thresholds, 98% of requests are traced, alerts fire at the intended boundary, and a stepped test records sustainable load, workload mix, first breached SLO, and first limiting resource.

### Debrief

The healthy 2-RPS system does not become faster. Trace coverage reaches 98% and all five objectives are visible. A representative stepped test finds sustainable load through 28 RPS; catalogue p95 first breaches 300 ms at 31 RPS as database work rises. The result is a capacity envelope, not a universal promise. The evolved diagram adds an observability node without changing the request path.

### Stretch question

Which SLOs should differ between catalogue browsing and checkout, and why?

---

## Level 2 — Remove inefficient database access

- **Participant title:** The campaign slowdown
- **Technique title after reveal:** Remove inefficient database access

### Incident

A campaign raises traffic to 40 RPS. Catalogue p95 reaches 1,840 ms while the application server remains moderately utilized.

### Constraints

- Catalogue data must be current.
- The fix should create at least 3× traffic headroom.
- Infrastructure budget is limited.
- No new distributed component unless code and query improvements are insufficient.

### Evidence available

- `L2-E1` — One listing request executes 483 SQL queries. **Decisive.**
- `L2-E2` — Database time is 1,690 ms of the 1,840-ms trace. **Decisive.**
- `L2-E3` — App CPU is 38%; DB CPU is 92%. **Supporting.**
- `L2-E4` — DB connections are 48/50 with measurable pool wait. **Supporting.**
- `L2-E5` — Repeated query signatures fetch category and image data one item at a time. **Supporting; the term N+1 is introduced in debrief.**
- `L2-E6` — Query plans show full scans for two common filters and large unused column payloads. **Supporting.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Add five application instances | €1,000 + 2 points | More request handlers often improve throughput | Wrong bottleneck; increases concurrent database pressure |
| Batch related reads, paginate, select required columns, and add targeted indexes | €0 + 4 points | Directly removes the measured database work | **Best next change** |
| Add Redis in front of all product queries | €180 + 4 points | Could reduce repetitive database reads | Partial and premature; masks inefficient misses and adds invalidation |
| Vertically scale PostgreSQL fourfold | €800 + 1 point | Quickly creates database headroom | Viable temporary move, but recurring cost preserves 483 queries/request |
| Raise the connection pool from 50 to 200 | €0 + 1 point | Reduces application-side connection waiting | Breaks the capacity-safety constraint at saturation by amplifying database queueing and memory use |

### Recommended reasoning

- **Bottleneck:** excessive query work on PostgreSQL.
- **Evidence:** 483 queries/request and 92% DB CPU while app CPU is 38%.
- **Why this fits:** it removes work rather than buying capacity for waste.
- **New risk:** incorrect eager loading, oversized joins, and indexes that slow writes if added without query-plan review.

### Fit boundary and verification

- **Do not use it as the answer:** when query count and plans are already efficient and saturation is in another resource, query tuning will not create the required headroom.
- **Verify:** replay the same workload and data distribution; confirm query count, rows examined, write cost, p95, and connection wait rather than checking one query in isolation.

### Result

Catalogue p95 falls to 190 ms, queries/request fall to 6, DB CPU falls to 34%, and connections fall to 18/50. The topology stays the same; the app and database nodes receive optimization annotations.

### Stretch question

At what point would vertical scaling still be a rational short-term incident response?

---

## Level 3 — Cache the read-heavy catalogue

- **Participant title:** The viral product
- **Technique title after reveal:** Cache the read-heavy catalogue

### Incident

A product goes viral. Traffic reaches 300 RPS; 95% of requests read catalogue data that changes only a few times per hour.

### Constraints

- Price staleness over 30 seconds is unacceptable.
- Descriptions and categories may be 2 minutes stale.
- Checkout and inventory must never depend on cached availability.
- Redis failure must slow the system, not make it unavailable.

### Evidence available

- `L3-E1` — DB CPU is 86% and app CPU is 42%. **Supporting.**
- `L3-E2` — Seventy-one percent of reads request the same 50 keys. **Decisive.**
- `L3-E3` — Database reads reach 7,200/s. **Decisive.**
- `L3-E4` — Catalogue p95 is 890 ms; checkout remains healthy. **Supporting.**
- `L3-E5` — Product updates occur 10–20 times/hour, with the stated field-level freshness limits. **Decisive.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Add a read replica for all catalogue reads | €550 + 4 points | Scales reads and avoids cache invalidation | Viable but costlier; every repeated read still consumes database capacity and lag must be handled |
| Cache selected catalogue data with TTLs, invalidation, and request coalescing | €180 + 4 points | Matches high repetition and bounded staleness | **Best next change** |
| Pre-render descriptions and categories nightly; fetch prices live | €100 + 4 points | Removes stable-field rendering while preserving authoritative price freshness | Partial; live price and other dynamic reads keep substantial database pressure |
| Publicly cache every GET route at the edge | €180 + 3 points | Can remove most origin traffic | Breaks privacy and freshness invariants for account, cart, personalized, and private responses |
| Upgrade the database again | €800 + 1 point | Buys immediate read headroom | Temporary and more expensive than exploiting repetition |

### Recommended reasoning

- **Bottleneck:** repeated reads of mostly stable, hot catalogue keys.
- **Evidence:** 71% identical-key share and 7,200 reads/s at 86% DB CPU.
- **Why this fits:** cache-aside removes redundant source reads while PostgreSQL remains authoritative.
- **New risk:** staleness, invalidation errors, hot-key stampedes, eviction, and degraded performance on cache loss.

### Fit boundary and verification

- **Do not use it:** for inventory availability, private responses, or data whose freshness contract cannot tolerate the chosen invalidation delay.
- **Verify:** hit ratio and source-load reduction together, price freshness under update, bounded refill concurrency after flush, and continued service when Redis is unavailable.

### Result and injected consequence

Catalogue p95 becomes 95 ms, hit ratio 89%, DB reads 1,500/s, and DB CPU 32%. Then Redis is flushed: latency rises temporarily, request coalescing limits refill concurrency, and the application continues through PostgreSQL.

### Stretch question

Which catalogue fields should use event invalidation, and which are safer with TTL only?

---

## Level 4 — Isolate slow side effects with jobs

- **Participant title:** Checkout waits on side effects
- **Technique title after reveal:** Isolate slow work with durable jobs

### Incident

Orders reach 15/s. Checkout validates the cart, reserves inventory, creates the order, generates a PDF, sends email, records analytics, and notifies the warehouse before responding.

### Constraints

- The customer must receive a confirmed order only after payment and inventory are committed.
- Email may arrive within 30 seconds.
- Analytics and warehouse notifications may be eventually consistent.
- A successful order must not lose its downstream work.
- Retries must not send duplicate invoices.

### Evidence available

- `L4-E1` — Checkout p95 is 5,800 ms and error rate 4.1%. **Supporting.**
- `L4-E2` — Trace: validation 25 ms, inventory 40 ms, order 35 ms, PDF 780 ms, email 4,300 ms, analytics 210 ms. **Decisive.**
- `L4-E3` — Email-provider timeouts cause successful orders to appear failed. **Decisive.**
- `L4-E4` — Customer retries correlate with 1.4% duplicate invoices. **Decisive.**
- `L4-E5` — App CPU is 44% and DB CPU is 46%. **Supporting.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Add application instances | €600 + 2 points | More concurrency can hide some blocking | Partial; provider latency remains on every request and duplicates remain |
| Commit the order, write an outbox, and process idempotent side effects with workers | €250 + 5 points | Removes non-critical latency and preserves committed work | **Best next change** |
| Increase the request timeout to 30 seconds | €0 + 1 point | Reduces visible timeout errors | Partial symptom treatment; provider time remains on-path and tied-up requests reduce headroom |
| Poll durable order-status columns with workers | €100 + 4 points | Recovers work after crashes without a separate commit-to-queue write | Viable but inefficient; database polling and side-effect state remain tightly coupled |
| Queue PDF and email only; retain synchronous analytics and warehouse calls | €180 + 4 points | Removes the two longest stages while limiting scope | Partial; remaining external calls still affect checkout and the durable handoff must be verified |

### Recommended reasoning

- **Bottleneck:** synchronous, variable-latency side effects on the checkout path.
- **Evidence:** email consumes 4,300 ms while app and DB are not saturated.
- **Why this fits:** the transactional outbox closes the commit/event gap and workers isolate external latency.
- **New risk:** eventual consistency, duplicate delivery, retries, queue backlog, poison jobs, and operational recovery.

### Fit boundary and verification

- **Do not move it off-path:** payment authorization, inventory commitment, or any fact required before the UI may truthfully say “confirmed.”
- **Verify:** kill the app after commit, replay a job, fail the provider, and confirm no committed work is lost, no invoice is duplicated, and oldest-job age returns below 30 seconds after recovery.

### Result and injected consequence

Checkout p95 becomes 460 ms and errors 0.5%. The email provider then fails; queue oldest age rises. Idempotent retries prevent duplicates and a dead-letter path makes poison jobs visible.

### Stretch question

What exactly belongs in the database transaction, the outbox record, and the worker?

---

## Level 5 — Scale stateless application instances

- **Participant title:** One instance at the limit
- **Technique title after reveal:** Scale stateless application instances

### Incident

Dynamic traffic reaches 1,000 RPS. Application CPU is saturated while database and queue capacity remain healthy. Sessions live in process memory and uploads live on local disk.

### Constraints

- Existing sessions must survive instance loss.
- Deployments must drain requests safely.
- Uploaded files must be readable from any instance.
- The change should support horizontal growth and failure of one instance.

### Evidence available

- `L5-E1` — App CPU is 96%; DB CPU is 41%. **Decisive.**
- `L5-E2` — Request queue wait is 680 ms. **Decisive.**
- `L5-E3` — Catalogue p95 is 1,210 ms and errors 3.8%. **Supporting.**
- `L5-E4` — Profiling shows useful application work rather than one pathological endpoint. **Supporting.**
- `L5-E5` — Starting a second instance loses sessions and cannot access earlier uploads. **Decisive.**
- `L5-E6` — One instance is the clear capacity ceiling. **Context.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Replace the app server with a machine four times larger | €400 + 1 point | Fast, low-engineering vertical headroom | Viable temporary move; preserves a single failure and scaling ceiling |
| Add a load balancer, stateless instances, external sessions/files, health checks, and graceful drain | €600 + 4 points | Removes state that prevents safe horizontal scaling | **Best next change** |
| Add instances with sticky sessions and retain local uploads | €600 + 2 points | Minimal code change and sessions usually stay put | Partial and fragile on failure, rebalance, or deployment |
| Add a CDN | €180 + 3 points | Removes static work from application servers | Partial; the measured saturation is dynamic application work |
| Upgrade PostgreSQL | €800 + 1 point | Databases often limit web applications | Wrong resource; DB has substantial headroom |

### Recommended reasoning

- **Bottleneck:** compute capacity of a single stateful app instance.
- **Evidence:** 96% app CPU and 680-ms app queue wait with DB CPU at 41%.
- **Why this fits:** disposable stateless instances allow capacity and failure handling to scale together.
- **New risk:** load-balancer health, distributed session/storage dependency, connection-pool multiplication, and uneven load.

### Fit boundary and verification

- **Do not use it as the primary fix:** when a shared database, lock, or external dependency is saturated; more instances can amplify that bottleneck.
- **Verify:** terminate an instance during traffic, perform a rolling deployment, read an earlier upload from another instance, preserve sessions, and keep aggregate database connections within limit.

### Result and failure check

Three instances average 45% CPU, queue wait falls below 40 ms, catalogue p95 reaches 220 ms, and errors fall to 0.4%. Killing one instance preserves sessions and routes traffic to healthy instances.

### Stretch question

How should database connection limits change when the application fleet autos-scales?

---

## Level 6 — Move public content to the edge

- **Participant title:** Slow far from home
- **Technique title after reveal:** Move public content to the edge

### Incident

Traffic becomes geographically distributed. Product images dominate bandwidth and distant users experience slow first-byte times.

### Constraints

- Product images, CSS, and JavaScript are public and immutable by version.
- Public catalogue pages may be briefly stale.
- Carts, accounts, checkout, personalized prices, and invoices must never enter a public cache.
- Origin cost matters as well as latency.

### Evidence available

- `L6-E1` — Far-region TTFB is 1,400 ms. **Decisive.**
- `L6-E2` — Images are 78% of transferred bytes. **Decisive.**
- `L6-E3` — Origin egress is 1.2 Gbit/s and origin traffic 850 RPS. **Supporting.**
- `L6-E4` — App CPU is 58%; DB CPU is 39%. **Supporting.**
- `L6-E5` — The same public, versioned assets are served repeatedly from the primary region. **Decisive.**
- `L6-E6` — Geographic network time dominates application processing for distant users. **Supporting.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Add a CDN for versioned assets and selected public catalogue responses with explicit exclusions | €180 + 3 points | Removes repeated bytes and round trips from the origin | **Best next change** |
| Run application fleets in Europe, Asia, and America against one primary database | €1,600 + 7 points | Brings compute closer to users | Costly partial fix; cross-region data calls and consistency remain |
| Resize and recompress every image inside the app per request | €0 + 4 points | Reduces response bytes without a new vendor | Worsens app CPU and repeats transformation work |
| Add a larger Redis cache in the origin region | €180 + 4 points | Speeds repeated response generation | Partial; does not remove geographic network time or image egress |
| Cache all catalogue responses using URL-only keys | €180 + 2 points | Maximizes catalogue offload with a simple policy | Breaks an invariant when personalized prices or account context share a URL |

### Recommended reasoning

- **Bottleneck:** geographic delivery and repeated public bytes, not database work.
- **Evidence:** 78% image bytes and 1,400-ms distant TTFB with healthy origin resources.
- **Why this fits:** edge delivery avoids the origin request and reduces both latency and egress.
- **New risk:** cache-key mistakes, private-data exposure, invalidation delay, and inconsistent edge behavior.

### Fit boundary and verification

- **Do not cache publicly:** authenticated, personalized, cart, checkout, invoice, or unbounded-key responses.
- **Verify:** cache policy and `Vary` behavior, purge/version rollout, far-region hit and miss latency, and paired reduction of total origin RPS and egress.

### Result

Far-region TTFB falls to 240 ms, the cache hit ratio reaches 91% for eligible requests, total origin traffic falls 79% to 180 RPS, and origin egress becomes 140 Mbit/s. A cache-policy test proves checkout bypasses the public cache.

### Stretch question

What fields belong in the edge cache key, and which would create an unacceptable cardinality explosion?

---

## Level 7 — Route eligible reads to replicas

- **Participant title:** The overloaded primary
- **Technique title after reveal:** Route eligible reads to replicas

### Incident

Product reads and internal reporting drive the primary database to 91% CPU. Writes are only 18% of operations, but checkout latency is now at risk.

### Constraints

- A customer must see a newly created order immediately.
- Catalogue reads can tolerate 5 seconds of lag.
- Internal reports can tolerate 60 seconds of lag.
- Replicas do not increase write capacity.

### Evidence available

- `L7-E1` — Reads are 82% of operations. **Decisive.**
- `L7-E2` — Primary read IOPS are 88% of capacity; write IOPS are 31%. **Decisive.**
- `L7-E3` — Primary CPU is 91% and checkout p95 is 860 ms. **Supporting.**
- `L7-E4` — Seventy-two percent of reads tolerate replica lag under the stated freshness contracts. **Decisive.**
- `L7-E5` — Immediate order history is a read-your-own-write path. **Supporting.**
- `L7-E6` — Report queries contribute 27% of primary read I/O. **Supporting.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Add replicas with consistency-aware routing, lag monitoring, and primary stickiness after writes | €550 + 4 points | Moves measured eligible reads while preserving immediate order visibility | **Best next change** |
| Shard customers across multiple primary databases | €1,800 + 10 points | Distributes both reads and writes | Premature; write capacity is healthy and operational cost is high |
| Cache admin reports for 45 seconds | €180 + 3 points | Meets freshness and removes repeated report executions | Partial; it does not move the larger catalogue read share or protect uncached queries |
| Vertically scale the primary | €800 + 1 point | Immediate, low-engineering relief | Viable temporary option, but reads and reports still compete with writes |
| Lower the transaction isolation level for the whole system | €0 + 2 points | May reduce locking and increase throughput | Breaks correctness expectations and does not address read I/O saturation |

### Recommended reasoning

- **Bottleneck:** eligible read load competing with transactional writes on the primary.
- **Evidence:** 82% read share and 88% read IOPS versus 31% write IOPS.
- **Why this fits:** routing moves tolerant reads to replicas while sticky primary reads preserve read-your-own-write behavior.
- **New risk:** replication lag, stale reads, routing mistakes, failover complexity, and multiplied connection pools.

### Fit boundary and verification

- **Do not use it as the answer:** for write saturation or reads that require immediate visibility; replicas move eligible reads but do not create write capacity.
- **Verify:** normal and forced-lag routing, read-your-own-write behavior, primary and replica connection totals, failover, and alerts against each freshness requirement.

### Result and injected consequence

Primary CPU becomes 52%, the 72% of all reads classified as eligible move to replicas, checkout p95 becomes 540 ms, and normal lag is 0.8 s. A forced lag spike demonstrates why newly written orders stay on the primary.

### Stretch question

How long should primary stickiness last after a write, and how can the application avoid a fixed guess?

---

## Level 8 — Separate analytical workloads

- **Participant title:** Reports overwhelm operations
- **Technique title after reveal:** Separate analytical workloads

### Incident

Management asks for multi-year dashboards. Reports scan 180 GB and run for 210 seconds. Even a reporting replica falls 95 seconds behind during refresh, and checkout p95 reaches 860 ms.

### Constraints

- Dashboards may be up to 5 minutes stale.
- Priority dashboards must complete within 15 seconds.
- Checkout must not compete with analytical scans.
- Historical corrections must propagate.
- Analytical totals must be reconcilable with transactional records.

### Evidence available

- `L8-E1` — Report queries scan millions of rows and use dimensions absent from the OLTP schema. **Decisive.**
- `L8-E2` — Adding report indexes increases order-write cost. **Supporting.**
- `L8-E3` — The reporting replica lag exceeds the 60-second operational-report threshold. **Decisive.**
- `L8-E4` — Most dashboards allow five-minute freshness. **Decisive.**
- `L8-E5` — Report concurrency and historical range are growing faster than checkout volume. **Supporting.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Add another PostgreSQL read replica only for dashboards | €550 + 3 points | Isolates reports from the primary | Partial; heavy scans, lag, and OLTP-shaped schema remain |
| Create an analytics service but keep it on the same replica | €400 + 5 points | Separates code and deployment | Cosmetic isolation; the storage bottleneck is unchanged |
| Add every reporting index to the transactional schema | €0 + 5 points | Can accelerate known reports | Partial; increases write amplification and cannot fit evolving analytics well |
| Stream or batch events into a reporting-oriented analytical store with reconciliation | €800 + 6 points | Matches freshness tolerance and query shape | **Best next change** |
| Refresh materialized views on the replica every 5 minutes | €100 + 4 points | Meets current freshness cheaply | Viable for a small fixed report set, but refresh scans and schema rigidity limit growth |

### Recommended reasoning

- **Bottleneck:** an analytical workload with a different access pattern and data model from OLTP.
- **Evidence:** 180-GB scans, 210-second reports, and 95-second replica lag during refresh.
- **Why this fits:** a separate analytical model absorbs scans and evolves independently within the 5-minute freshness allowance.
- **New risk:** pipeline lag, duplicate/out-of-order events, schema evolution, backfills, reconciliation, and deletion propagation.

### Fit boundary and verification

- **Do not introduce it:** for a small, fixed report set that a replica or materialized view can serve within freshness and write-cost constraints.
- **Verify:** report duration and OLTP isolation under concurrent refresh, end-to-end freshness, replay/backfill behavior, historical correction, deletion propagation, and reconciliation totals.

### Result

Reports complete in 8 seconds, OLTP replica lag returns to 0.9 seconds, analytics freshness is 3 minutes, and checkout p95 is 480 ms. The architecture adds an event/batch pipeline and analytics store.

### Stretch question

Which record is authoritative when a business correction changes a historical order?

---

## Level 9 — Separate the catalogue scaling boundary

- **Participant title:** One fleet, two workloads
- **Technique title after reveal:** Separate the catalogue scaling boundary

### Incident

Catalogue traffic reaches 8,000 RPS while checkout remains at 30 orders/s. Twenty-four shared monolith instances are deployed mainly for browsing, and catalogue releases can still affect checkout.

### Constraints

- Catalogue and checkout need independent scaling and deployment.
- Catalogue p95 must return below 300 ms, and a catalogue deployment must not breach the checkout error objective.
- Order, payment, and inventory correctness remain together.
- The change must create a real failure boundary, not only a new repository.
- Avoid a microservice per domain noun.

### Evidence available

- `L9-E1` — Catalogue routes consume 88% of app CPU. **Decisive.**
- `L9-E2` — Checkout uses less than three instances of equivalent capacity. **Decisive.**
- `L9-E3` — Catalogue and checkout release at different frequencies. **Supporting.**
- `L9-E4` — A catalogue rendering regression recently raised checkout errors through shared resource exhaustion. **Decisive.**
- `L9-E5` — Catalogue uses read-oriented presentation data; checkout owns transactional state. **Supporting.**
- `L9-E6` — Shared database tables and synchronous internal calls would preserve a distributed monolith. **Context.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Extract independently deployable catalogue capability with explicit data ownership and contracts | €500 + 7 points | Matches traffic, deployment, data, and failure boundaries | **Best next change** |
| Create separate services for products, categories, carts, orders, inventory, invoices, and users | €1,800 + 12 points | Maximizes independent ownership | Over-decomposition; high coordination and operational cost without measured need |
| Increase the shared monolith fleet from 24 to 40 instances | €1,000 + 2 points | Restores capacity quickly | Viable capacity purchase, but overprovisions checkout and preserves blast radius |
| Separate only the catalogue frontend | €150 + 3 points | Allows independent UI deployment | Partial; backend compute, connections, and failure boundary remain shared |
| Add more cache and replicas to catalogue routes inside the monolith | €300 + 4 points | Reduces database pressure | Partial; measured issue also includes compute, deployment, and blast radius |

### Recommended reasoning

- **Bottleneck:** a workload and failure boundary mismatch inside one deployment unit.
- **Evidence:** catalogue consumes 88% of CPU but checkout needs only three instances, and catalogue releases affect checkout.
- **Why this fits:** one well-selected boundary allows independent scaling without multiplying services unnecessarily.
- **New risk:** service contracts, data duplication, network failure, versioning, tracing, and accidental synchronous coupling.

### Fit boundary and verification

- **Do not split:** when scaling, release cadence, ownership, and failure profile do not diverge; a new repository alone is not a useful boundary.
- **Verify:** scale and deploy catalogue independently, inject a catalogue failure, trace cross-boundary calls, and confirm checkout retains its data ownership and capacity.

### Result

Catalogue and checkout scale separately; catalogue p95 becomes 180 ms and checkout p95 460 ms. Checkout uses three instances rather than 24. A simulated catalogue deployment failure does not interrupt checkout.

### Stretch question

Which catalogue data may be copied from transactional systems, and how should ownership be enforced?

---

## Level 10 — Preserve inventory correctness in a flash sale

- **Participant title:** Five hundred units
- **Technique title after reveal:** Preserve inventory under contention

### Incident

Five hundred units go on sale. Twenty thousand users attempt checkout in 60 seconds. The system accepts 563 orders for 500 units, creating 63 oversold units; retries also create duplicates and ambiguous customer outcomes.

### Constraints

- Reserved plus confirmed units must never exceed available stock.
- A duplicate request with the same idempotency key must return the original result.
- It is acceptable to reject or queue excess demand.
- Payment and reservation transitions must be explicit and recoverable.

### Evidence available

- `L10-E1` — Current flow reads stock, checks it in application code, then writes a decrement. **Decisive.**
- `L10-E2` — Lock-wait p95 is 2,800 ms and transaction retries are 18%. **Supporting.**
- `L10-E3` — The system accepted 563 orders for 500 units; duplicate orders are 2.1% and oversold units are 63. **Decisive.**
- `L10-E4` — More application instances increase concurrent writers and contention. **Decisive.**
- `L10-E5` — Only a few hot SKUs are affected. **Supporting.**
- `L10-E6` — Useful throughput is capped by 500 valid reservations, regardless of incoming attempt RPS. **Supporting.**

### Options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Acquire a distributed Redis lock per SKU before checkout | €180 + 5 points | Serializes hot-product access outside the database | Partial and fragile; lock failure does not enforce the source-of-truth invariant or idempotency |
| Run all checkout transactions at serializable isolation | €0 + 4 points | Provides strong correctness guarantees | Correctness may improve, but aborts and hot-row contention can collapse throughput across unrelated products |
| Atomic reservation workflow | €150 + 6 points | Conditional source-of-truth writes preserve stock; idempotency, expiry, and bounded admission make concurrency recoverable | **Best next change** |
| Add more checkout instances | €600 + 2 points | Processes more attempts in parallel | Harmful; increases contention and duplicate concurrency |
| Accept all orders and cancel oversold orders later | €0 + 3 points | Maximizes apparent conversion | Violates the explicit business invariant and damages customer trust |

### Recommended reasoning

- **Bottleneck:** correctness and contention on a hot inventory record, not insufficient request handlers.
- **Evidence:** unsafe read-then-write, 18% transaction retries, and 63 oversold units.
- **Why this fits:** atomic source-of-truth updates preserve stock; idempotency handles retries; reservations and admission bound concurrency.
- **New risk:** expired reservations, payment/reservation reconciliation, fairness, hot-key queues, and state-machine recovery.

### Fit boundary and verification

- **Do not add the full workflow:** where demand is not contended and a single atomic conditional write already meets correctness and latency needs.
- **Verify:** 20,000 attempts with repeated idempotency keys, payment success at expiry, worker or process restart, exactly 500 accepted reservations, zero oversell, and checkout outcome p95 below 800 ms.

### Result

Exactly 500 reservations are accepted and produce 500 unambiguous valid outcomes. Oversold units and duplicates are zero, and checkout outcome p95 is 720 ms. Excess requests receive an explicit sold-out, rejected, or queued result rather than timing out unpredictably.

### Stretch question

How should the system recover when payment succeeds just as a reservation expires?

---

## Level 11 — Partition first; shard only with evidence

- **Participant title:** Four terabytes and growing
- **Technique title after reveal:** Partition first; shard only with evidence

### Incident

The order database reaches 4.2 TB. Indexes total 1.6 TB, write IOPS reach 92%, checkout p95 is 1,200 ms, backups take 11 hours, and maintenance takes 7 hours.

### Constraints

- Most operational queries touch the last 90 days.
- Historical analytics already use the analytical store.
- Orders must remain queryable by customer.
- Backup and restore procedures must remain testable.
- A routing layer and cross-shard operations require strong justification.
- Hot backup must complete under 3 hours, tested hot restore under 4 hours, scheduled maintenance under 2 hours, checkout p95 under 800 ms, and write I/O must retain at least 20% headroom at Peak.

### Phase A evidence

- `L11-E1` — Seventy-eight percent of rows are older than two years. **Decisive.**
- `L11-E2` — Old data is rarely touched by operational endpoints. **Supporting.**
- `L11-E3` — Several indexes cover historical data but serve only recent queries. **Decisive.**
- `L11-E4` — Time-based pruning would remove most scanned partitions. **Supporting.**
- `L11-E5` — The primary is near storage and write-maintenance limits, but a clean hot-set estimate is 650 GB. **Decisive.**

### Phase A options

| Option | Cost | Why it is plausible | Outcome |
|---|---:|---|---|
| Double the primary’s storage and I/O tier | €1,800 + 1 point | Fastest operational relief | Viable temporary headroom; backup and maintenance scale problems remain |
| Partition by time, archive cold data, prune indexes, and verify restore | €300 + 6 points | Matches query locality and reduces hot operational data | **Best next change** |
| Shard orders by random order ID | €2,000 + 10 points | Distributes writes evenly | Breaks customer-local queries and scatters common access paths |
| Replace PostgreSQL with a document database | €2,500 + 14 points | Different storage may scale horizontally | Expensive migration without evidence that data model is the root cause |
| Shard immediately by geographic region | €2,000 + 10 points | Creates intuitive operational boundaries | Plausible but risks skew, customer movement, and cross-region operations before simpler relief is tested |

### Phase A recommended reasoning

- **Bottleneck:** oversized hot operational structures and maintenance, dominated by cold history.
- **Evidence:** 78% old rows and a 650-GB active set.
- **Why this fits:** partitioning and archiving reduce working set, indexes, backup time, and maintenance without distributed routing.
- **New risk:** partition management, archival correctness, restore complexity, and queries that accidentally miss or scan all partitions.

### Fit boundary and verification

- **Do not shard yet:** while pruning the cold majority restores headroom and one primary still meets the measured write, backup, and maintenance objectives.
- **Verify:** partition pruning on operational queries, customer history across hot and archived data, archival reconciliation, hot and full restore drills, and scheduled partition creation.

### Phase A result

The hot set becomes 650 GB, indexes 340 GB, write IOPS 68%, checkout p95 650 ms, hot backup 2.1 hours, tested hot restore 3.4 hours, and scheduled maintenance 1.5 hours. Every Phase A target is restored, so sharding is not yet justified for current load.

### Optional Phase B senior extension

The core workshop ends this level after Phase A. If eight additional minutes and audience seniority permit, the facilitator may enable a non-scored “two years later” projection in which writes again exceed one primary after partitioning. A persistent badge reads `TWO YEARS LATER — NON-SCORED PROJECTION`. Teams choose a shard key:

| Candidate | Evaluation |
|---|---|
| Customer or tenant ID with a shard map | Recommended when most transactional queries are customer-scoped; requires skew and large-tenant handling |
| Order creation month | Creates hot current shards and scatters a customer’s history |
| Random order ID | Balances writes but makes customer and support queries fan out |
| Geographic region | Useful only when residency and regional locality outweigh customer movement and skew |

The architecture reveals shards only inside the optional extension. `Exit extension` restores the partitioned canonical topology. Phase B does not alter the architecture inherited by Level 12. Cross-shard reporting remains in the analytical system.

### Stretch question

What observable threshold should trigger Phase B rather than another vertical-capacity purchase?

---

## Level 12 — Design for failure under load

- **Participant title:** Everything fails at once
- **Technique title after reveal:** Design for failure under load

### Incident

At normal peak traffic, the facilitator injects several failures: one availability zone is lost, Redis restarts, the email provider times out, workers stop, a replica lags, and a deployment raises errors.

### Invariants and degradation policy

- No confirmed order may disappear.
- Checkout correctness outranks email speed and analytics freshness.
- Catalogue may serve bounded stale data.
- Email and analytics may recover asynchronously.
- Operators must detect the incident and stop a harmful rollout.
- Retry amplification must remain bounded.

### Evidence available

- `L12-E1` — A shared 30-second timeout exists on every dependency. **Decisive.**
- `L12-E2` — Retries are immediate and unbounded in two clients. **Decisive.**
- `L12-E3` — App, worker, and dependency calls share pools. **Decisive.**
- `L12-E4` — Checkout errors reach 12% and SLO burn 12× (12% against a 1% budget). **Supporting.**
- `L12-E5` — Queue oldest age reaches 26 minutes when workers stop. **Supporting.**
- `L12-E6` — One deployment reaches all instances at once. **Decisive.**
- `L12-E7` — A Redis restart causes a database-read surge. **Supporting.**
- `L12-E8` — Confirmed orders remain durable, but customers receive ambiguous timeout responses. **Decisive.**

### Failure waves

The capstone reveals evidence in three waves before the team commits one final action set:

1. **Dependency failure:** Redis restarts and the email provider times out.
2. **Overload and backlog:** retries amplify load and stopped workers increase oldest-job age.
3. **Infrastructure and change failure:** one zone is lost and a faulty deployment raises errors.

Evidence from earlier waves remains visible. This staging reduces cognitive overload without turning the capstone into three unrelated quizzes. The three wave names are rendered as a legend on the evidence desk (`capstone.waveLabels`); the incident text also states the three waves explicitly, so a participant can see *what* they are decomposing rather than inferring it from unlabelled `Wave 1/2/3` tags. The earlier build carried the wave tags but never rendered this legend, which is the main reason the capstone read as unclear in pilot feedback.

The capstone overrides the shared two-evidence rule: teams cite at least one observation from each wave and name the invariant their action set prioritizes. Its 25 evidence points allocate 8 per wave plus 1 for the correctly prioritized invariant; a supporting rather than decisive observation earns half of that wave's allocation.

### Capstone decision format

Teams have **12 resilience points** and may choose at most four actions. Unspent points are allowed and earn no bonus. Several plausible sets fit the arithmetic; teams must prioritize the stated invariants rather than maximize spend.

| ID | Participant action | Points | Mechanism and facilitator evaluation |
|---|---|---:|---|
| L12-A1 | Dependency budgets | 2 | Dependency-specific timeouts plus bounded retries, backoff, jitter, and idempotency; recommended for long hangs and retry amplification |
| L12-A2 | Graceful isolation | 3 | Circuit breakers and explicit fallbacks for catalogue, email, and analytics; valuable availability improvement, but existing asynchronous boundaries make it secondary to checkout containment |
| L12-A3 | Resource containment | 3 | Checkout bulkheads, bounded worker queues, and backpressure; recommended for shared-pool exhaustion and backlog |
| L12-A4 | Zone recovery | 4 | Multi-zone application placement, automated database failover, and tested restore/runbook; recommended for zone loss and durable recovery |
| L12-A5 | Progressive delivery | 2 | Health-based canary rollback; recommended for the faulty deployment |
| L12-A6 | Worker elasticity | 2 | Scale workers from oldest-job age; helps backlog recovery but does not isolate checkout or poison jobs |
| L12-A7 | Cache refill shielding | 2 | Rate-limit and coalesce cache refill; contains the Redis restart surge but covers only one dependency |
| L12-A8 | Larger shared pools | 2 | Buys short-term concurrency but preserves shared failure and can increase downstream pressure |
| L12-A9 | Active-active writes | 7 | Covers a wider regional failure but adds unjustified consistency, conflict, and operating complexity for this incident |

The canonical smallest sufficient set is `L12-A1`, `L12-A3`, `L12-A4`, and `L12-A5`, using 11 points. It deliberately leaves one point unspent. Replacing `L12-A1` with `L12-A2` also restores the displayed constraints but uses all 12 points and adds broader fallback policy while leaving retry behavior less directly governed; classify it as `Restores the SLO with excess cost or complexity`. Substituting `L12-A6` or `L12-A7` leaves a current failure uncontained. Before commit, action order is shuffled and only the running point total and remaining slots are visible. Each action now also states, in plain language, the primary failure domain it contains (`OptionSpec.covers`), so selecting a set is a legible design task rather than a guess about hidden tags. What stays hidden until commit is the *judgement*: the graded coverage matrix below, whether the set is the smallest sufficient one, and which risk it leaves uncovered. Naming the domains removes extraneous load; withholding the verdict keeps the germane challenge.

### Failure-coverage matrix

This matrix appears only after commit and drives the deterministic remaining-failure outcome.

| Action | Dependency latency | Retry amplification | Shared pools / backlog | Zone and durability | Bad deployment |
|---|---|---|---|---|---|
| L12-A1 | Strong | Strong | Partial | None | None |
| L12-A2 | Strong | Partial | Partial | None | None |
| L12-A3 | Partial | Strong | Strong | None | None |
| L12-A4 | None | None | None | Strong | None |
| L12-A5 | None | None | None | None | Strong |
| L12-A6 | None | None | Partial | None | None |
| L12-A7 | Partial | Partial | Partial | None | None |
| L12-A8 | None | Worsens | Partial | None | None |
| L12-A9 | None | None | None | Strong, with new conflict risk | None |

### Recommended reasoning

- **Failure mechanism:** dependency failure amplification and shared failure domains, combined with a zone loss.
- **Evidence:** unbounded immediate retries, shared pools, 30-second timeouts, 12× burn, and queue age growth.
- **Why this set fits:** dependency budgets limit calls; bulkheads/backpressure contain overload; multi-zone failover handles infrastructure loss; progressive delivery contains harmful change. Existing asynchronous email/analytics paths may recover later, so graceful-isolation work is valuable but not required for the smallest sufficient set.
- **New risk:** incorrect timeout budgets, breaker oscillation, dropped or rejected work under backpressure, failover data risk, false-positive rollback, and higher operational testing burden.

### Fit boundary and verification

- **Do not apply policies uniformly:** timeout, retry, fallback, and durability decisions must reflect each dependency's latency budget, idempotency, and criticality. Active-active multi-region writes remain unjustified here.
- **Verify:** replay all three failure waves separately and together; confirm bounded amplification, zero confirmed-order loss, explicit degradation, automated rollback, failover recovery, and queue catch-up within 12 minutes.

### Final result

Checkout errors remain at 0.7%, checkout p95 remains 690 ms, and confirmed order loss is zero. Non-critical catalogue requests may be temporarily limited during cache refill, emails are delayed, analytics becomes stale, and the queue recovers within 12 minutes. A canary control stops the faulty deployment before full rollout. Other action sets use the coverage matrix to name and simulate the remaining failure.

### Final retrospective prompts

1. Which change produced the greatest value per engineering point?
2. Which introduced the most permanent complexity?
3. Which decisions were reversible?
4. Which technologies would be harmful at Level 1?
5. Which SLO or invariant drove each architectural boundary?
6. At which levels was buying temporary capacity a rational alternative?

---

## 4. Technique-rationale summary

| Level | Technique | Why it fits now | Primary new risk |
|---:|---|---|---|
| 1 | SLOs, observability, and stepped capacity test | Decisions lack measurable targets and representative capacity evidence | False confidence from one workload mix; telemetry noise |
| 2 | Query and index optimization | Database work per request is wasteful | Write overhead and query-plan regressions |
| 3 | Selective caching | Reads are repetitive and bounded-stale | Invalidation and stampede |
| 4 | Jobs and transactional outbox | Slow side effects are not required for confirmation | Retries, duplicates, and backlog |
| 5 | Stateless horizontal scaling | One app instance is the measured compute ceiling | Distributed state and connection multiplication |
| 6 | CDN and edge caching | Geography and repeated public bytes dominate | Cache-key privacy and invalidation |
| 7 | Read replicas | Eligible reads saturate the primary; writes do not | Lag and read consistency |
| 8 | Analytical store | Query model and workload differ from OLTP | Pipeline correctness and freshness |
| 9 | Catalogue separation | Traffic, release, ownership, and failure profiles diverge | Contracts and distributed failure |
| 10 | Atomic inventory and bounded admission | Correctness fails under hot-key contention | Reservation workflow recovery |
| 11 | Partition/archive, then optional sharding | Cold history dominates before a distributed write limit is proven | Data lifecycle, routing, and rebalance |
| 12 | Layered resilience | Dependencies and zones fail under peak load | Policy tuning and operational complexity |

## 5. Content quality checklist for every option set

- All options are grammatically parallel actions.
- The recommended choice is not consistently the longest card or the same card position.
- Titles are comparable in length and tone; safeguard rows use the same structure and level of detail.
- At least one alternative is viable but more expensive or temporary.
- At least one alternative is a correct technique aimed at the wrong resource or wrong time.
- At most one alternative is classified as unsafe; the set is not filled with obviously bad answers.
- Every rejected option has a concrete explanation tied to the metrics and constraints.
- The best answer restores the SLO without claiming to solve unrelated future problems.
- The new risk introduced by the best answer becomes visible in either the current debrief or a later level.
