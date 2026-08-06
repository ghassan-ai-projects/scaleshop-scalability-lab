# Metrics and simulation specification

## 1. Purpose

Metrics are evidence, not decoration. Each level should expose the smallest set of signals needed to distinguish the real bottleneck from plausible alternatives.

The dashboard uses two established diagnostic lenses:

- **RED for user-facing work:** request Rate, Errors, and Duration.
- **USE for resources:** Utilization, Saturation, and Errors.

Business invariants such as “no overselling” remain visible when correctness matters more than latency.

## 2. Stable definitions

| Metric | Definition shown in the lab |
|---|---|
| Offered RPS | Requests arriving per second, including work later rejected, timed out, or shed |
| Completed throughput | Successful useful work completed per second; never substituted for offered load during overload |
| Concurrent users | Active simulated users, not the same as requests per second |
| p50 | Median latency; half of requests finish faster |
| p95 | 95% of requests finish at or below this value; the primary workshop latency signal |
| p99 | Tail latency used as deeper evidence, not a default card on every level |
| Error rate | Failed requests divided by offered requests in the named journey and rolling window; the card states included HTTP statuses, timeouts, rejections, and business failures |
| Utilization | Percentage of a resource’s available capacity currently used |
| Saturation | Work waiting because the resource is at capacity, such as queueing or connection waits |
| Cache hit ratio | Cache reads served without reaching the source of truth |
| Edge offload ratio | Share of total origin-eligible requests or bytes served at the edge; the denominator is always stated |
| Queue depth | Jobs waiting; always paired with oldest-job age so depth has context |
| Replica lag | Time between a primary commit and visibility on the replica |
| SLO burn rate | How quickly the allowed error budget is being consumed |

## 3. Global display rules

1. The core row contains at most six metrics.
2. Every value shows a unit and a 60-second window unless the scenario says otherwise.
3. Latency always identifies the user journey: catalogue p95 is not mixed with checkout p95.
4. Average latency is never used as the primary diagnosis signal.
5. CPU alone never proves the cause. A saturation or work metric accompanies it.
6. Queue depth is never shown without arrival rate, processing rate, or oldest age.
7. Replica lag is shown beside the freshness requirement.
8. Cache hit ratio is shown beside source-load reduction and miss behavior.
9. Before/after values share the same scale.
10. Threshold colors are paired with text labels: Healthy, At risk, or Breached.
11. Values remain logically related. For example, origin RPS falls when CDN offload rises.
12. The simulated jitter is small enough that the teaching signal remains clear.
13. Offered load and completed throughput are shown together when rejection, queueing, or failure causes them to diverge.
14. Percentages name their denominator. “72% routed to replicas” means 72% of all reads, not 72% of an unstated eligible subset.
15. A derived metric and its inputs agree within rounding tolerance. The scenario cannot show a cache ratio, request rate, or inventory total that contradicts its component values.
16. Threshold status is computed from the stated SLO or capacity limit, not stored as an unrelated label.
17. Every error card names the journey, included failure types, denominator, and rolling window.
18. Every metric is authored as `core`, `evidence`, or `advanced`; the initial shared-screen view shows only three or four core signals.

## 4. Always-visible workshop targets

The following SLOs are introduced at Level 1 and remain available throughout:

| Target | Objective |
|---|---:|
| Catalogue page p95 | Under 300 ms |
| Checkout p95 | Under 800 ms |
| Request error rate | Under 1% |
| Confirmed order loss | 0 |
| Oversold units | 0 |

Some levels introduce additional constraints such as analytics freshness or invoice-delivery delay.

## 5. Scenario matrix

Values below are the stable center points around which the UI may animate by a small seeded amount.

This table specifies the Incident state and canonical recommended outcome. Before implementation approval, each level must additionally author Normal, Campaign, and Peak center values plus an outcome state for every selectable option. The product content-authoring gate remains open until those records exist.

| Level | Pressure | Decisive “before” metrics | Expected metrics after recommended change |
|---:|---|---|---|
| 1 | New system, unknown capacity | 2 offered RPS; catalogue p95 180 ms; checkout p95 420 ms; errors 0.1%; app CPU 18%; DB CPU 12%; no capacity envelope | Healthy-load performance is unchanged; trace coverage 98%; every SLO has an alert; stepped test sustains 28 RPS and first breaches catalogue p95 at 31 RPS |
| 2 | Campaign reaches 40 RPS | Catalogue p95 1,840 ms; 483 SQL queries/request; DB CPU 92%; DB connections 48/50; app CPU 38% | Catalogue p95 190 ms; 6 queries/request; DB CPU 34%; connections 18/50 |
| 3 | Viral catalogue reaches 300 RPS | Catalogue p95 890 ms; repeated DB reads 7,200/s; DB CPU 86%; identical-key share 71% | Catalogue p95 95 ms; cache hit ratio 89%; DB reads 1,500/s; DB CPU 32% |
| 4 | 15 checkouts/s with slow side effects | Checkout p95 5,800 ms; errors 4.1%; email-provider p95 4,300 ms; duplicate invoices 1.4% | Checkout p95 460 ms; errors 0.5%; invoice oldest-job age under 10 s; duplicates 0 |
| 5 | Dynamic traffic reaches 1,000 RPS | App CPU 96%; request queue wait 680 ms; catalogue p95 1,210 ms; DB CPU 41%; errors 3.8% | Three instances at 45% average CPU; queue wait under 40 ms; catalogue p95 220 ms; errors 0.4% |
| 6 | Global traffic and image bandwidth | Far-region TTFB 1,400 ms; image share 78%; origin egress 1.2 Gbit/s; origin 850 RPS | Far-region TTFB 240 ms; eligible-request cache hit ratio 91%; total origin RPS reduced 79% to 180; origin egress 140 Mbit/s |
| 7 | Read and reporting pressure on primary | Primary CPU 91%; read IOPS 88% of capacity; checkout p95 860 ms; read share 82% | Primary CPU 52%; 72% of all reads routed away; checkout p95 540 ms; replica lag 0.8 s |
| 8 | Years of analytics queries | Report duration 210 s; 180 GB scanned/report; replica lag 95 s; dashboard freshness requirement 5 min | Report duration 8 s; OLTP replica lag 0.9 s; analytics freshness 3 min; checkout p95 480 ms |
| 9 | Catalogue 8,000 RPS, checkout 30/s | Catalogue owns 88% of app CPU; catalogue p95 410 ms; checkout p95 620 ms; 24 shared instances | Catalogue and checkout scale separately; catalogue p95 180 ms; checkout p95 460 ms; checkout uses 3 instances |
| 10 | 20,000 simultaneous attempts for 500 units | 20,000 attempts; useful completion 437 reservations; lock-wait p95 2,800 ms; retries 18%; duplicates 2.1%; oversold units 63 | 20,000 attempts; exactly 500 reservations accepted; explicit rejected/queued outcomes for excess demand; oversold 0; duplicates 0; checkout outcome p95 720 ms |
| 11 | 4.2 TB order store and write ceiling | Indexes 1.6 TB; write IOPS 92%; checkout p95 1,200 ms; backup 11 h; maintenance 7 h | Hot set 650 GB; indexes 340 GB; write IOPS 68%; checkout p95 650 ms; hot backup 2.1 h; hot restore 3.4 h; maintenance 1.5 h |
| 12 | Dependency and zone failures | Offered checkout 30/s; useful completion 26.4/s; checkout errors 12%; dependency timeouts 30 s; SLO burn 22×; queue oldest age 26 min | Offered checkout 30/s; useful completion 29.8/s; checkout errors 0.7%; checkout p95 690 ms; confirmed order loss 0; queue recovers within 12 min |

## 6. Level-specific evidence metrics

### Level 1 — observability

- Request count by route
- p50, p95, p99 by route
- Error rate by route
- Trace coverage
- SLO state

The lesson is that “everything seems fast” is not a capacity model.

### Level 2 — query efficiency

- SQL queries per request
- Database time within one request
- Slow-query summary
- Rows examined versus returned
- Connection-pool wait
- App CPU versus DB CPU

### Level 3 — repetitive reads

- Repeated-key share
- Read queries per second
- Cacheable workload percentage
- Projected cache hit ratio
- Miss-fill concurrency and stampede count
- Data-change frequency and acceptable staleness

### Level 4 — asynchronous work

- Checkout trace broken down by stage
- External email latency and timeout rate
- Queue arrival and processing rates
- Queue depth plus oldest-job age
- Retry count and dead-letter count
- Duplicate-effect rate

### Level 5 — horizontal application scaling

- Per-instance CPU, not only fleet average
- Request queue wait
- Load distribution skew
- Database utilization
- Session location and local-file dependency
- Instance health-check status

### Level 6 — edge delivery

- Payload composition by bytes
- TTFB by geography
- Origin RPS
- Edge offload ratio with an explicit request or byte denominator
- Origin egress
- Edge-hit versus miss latency

### Level 7 — read replicas

- Primary read/write split
- Read IOPS and write IOPS
- Eligible reads by consistency requirement
- Replica lag p95 and maximum
- “Read your own write” failures
- Report-query share

### Level 8 — analytical separation

- Bytes scanned per report
- Report duration
- Rows locked or I/O pressure caused by reports
- Replica lag during a report
- Data-pipeline freshness
- Reconciliation difference between OLTP and analytics

### Level 9 — workload separation

- Request and CPU share by route family
- Independent scaling requirement
- Connection-pool usage by workload
- Deployment failure impact
- Change frequency by component
- Cross-boundary synchronous calls

### Level 10 — flash-sale correctness

- Attempt rate versus useful throughput
- Lock-wait duration
- Transaction retry rate
- Duplicate idempotency-key rate
- Reserved, confirmed, available, and oversold counts
- Reservation expiration rate

### Level 11 — data growth

- Table and index size
- Active versus historical data share
- Write IOPS saturation
- Backup and restore window
- Maintenance duration
- Partition pruning ratio
- Shard skew and cross-shard query rate only after sharding is considered

### Level 12 — resilience

- Dependency latency and error rate
- Timeout budget per call
- Retry volume and amplification factor
- Circuit state
- Queue depth and oldest age
- SLO burn rate
- Confirmed order loss
- Recovery time

### 6.1 Presentation tiers

The detailed lists above define available evidence. The initial shared-screen row uses only these core signals; evidence and advanced values open on demand.

| Level | Core signals shown first | Evidence signals | Advanced signals |
|---:|---|---|---|
| 1 | Offered RPS; catalogue p95; checkout p95; error rate | Trace coverage; SLO state | p50/p99 by route; alert test |
| 2 | Catalogue p95; queries/request; DB CPU; connection wait | Database time; rows examined/returned | Query-plan details; write-index cost |
| 3 | Catalogue p95; DB reads/s; DB CPU; repeated-key share | Update frequency; miss behavior | Refill concurrency; eviction/stampede count |
| 4 | Checkout p95; checkout error rate; email p95; duplicate effects | Stage trace; queue age | Retry/dead-letter detail |
| 5 | Catalogue p95; app CPU; request queue wait; errors | Per-instance skew; session/file location | Health/drain state; fleet connections |
| 6 | Far-region TTFB; image byte share; origin RPS; origin egress | Edge hit/miss latency | Cache-key cardinality; geographic breakdown |
| 7 | Checkout p95; primary CPU; read IOPS; write IOPS | Eligible-read share; replica lag | Max lag; read-your-own-write failures |
| 8 | Report duration; bytes scanned; replica lag; analytics freshness | OLTP I/O during report; reconciliation | Backfill and schema-version state |
| 9 | Catalogue p95; checkout p95; CPU share by workload; instance allocation | deployment impact; release frequency | synchronous-call and pool detail |
| 10 | Offered attempts; accepted reservations; oversold units; duplicates | lock wait; retry rate | expiry and idempotency-key detail |
| 11 | Hot-set size; write IOPS; checkout p95; hot-backup time | index size; maintenance time | pruning ratio; restore drill; optional shard skew |
| 12 | Offered checkout; useful completion; checkout errors; SLO burn | queue age; retry amplification; dependency state | circuit state; recovery timeline |

### 6.2 Decision-driving thresholds

| Signal | Threshold or comparison rule |
|---|---|
| Connection-pool wait | At risk above 50 ms p95; breached above 100 ms p95 for the journey window |
| Queue oldest age for invoice delivery | Healthy under 10 s; at risk 10–30 s; breached above the 30-second delivery allowance |
| Replica lag | Evaluated against the route: catalogue 5 s, internal reports 60 s, read-your-own-write 0 visible lag |
| Analytics freshness | Healthy at or below 5 minutes; expected post-change center 3 minutes |
| Retry amplification | At risk above 1.2 downstream attempts per offered request; breached above 1.5 |
| Write-I/O headroom in Level 11 | Healthy with at least 20% free; breached when utilization exceeds 80% at Peak |
| Hot backup / restore / maintenance | Backup under 3 h; tested hot restore under 4 h; scheduled maintenance under 2 h |
| SLO burn rate | Healthy at or below 1×; at risk above 2×; incident escalation above 10× |

Thresholds are workshop scenario contracts, not universal operational defaults.

## 7. Chart behavior

The primary chart is a synchronized set of 60-second small multiples. Metrics with different units never share a y-axis. Each metric keeps the same scale across its own before/after comparison, so an improvement cannot be exaggerated by rescaling. Metric cards show the current stable value; the charts show how the incident developed.

When an option is applied:

1. A vertical “change applied” marker appears.
2. Affected metrics transition to the option-specific outcome over 8–12 simulated seconds.
3. Unaffected metrics remain visibly stable.
4. A harmful choice can improve one metric while worsening another.
5. The result text names the causal relationship rather than attributing every change to the selected tool.

No chart should loop dramatic random spikes merely to look live.

`Pause motion` freezes visual jitter and transitions but not the selected scenario state. `Show final state now` skips the remaining transition. Jitter is never announced by assistive technology. One concise live-region message announces only an authored state change, for example: `Change applied. Checkout p95 improved from 5,800 to 460 milliseconds; invoice delivery is now asynchronous.`

Every chart has an adjacent before/after table with value, unit, threshold status, absolute change, direction, and an accessible explanation of what remained unchanged.

## 8. Traffic control

Traffic is selected through named presets. The exact values vary by level but preserve workload mix:

- **Normal:** healthy reference load
- **Campaign:** planned increase
- **Peak:** SLO is near its limit
- **Incident:** exposes the level’s bottleneck

The facilitator can move between presets. Levels 2–12 begin at Incident so the challenge is immediately visible. Level 1 begins at the healthy launch baseline because the missing measurement and capacity contract is the incident. Arbitrary sliders are excluded because they allow nonsensical combinations and make workshop results harder to reproduce.

Levels 10–12 relabel the same four preset positions with scenario-specific pressure descriptions where raw RPS is not the controlling variable.

| Preset | Intended diagnostic state | Approximate offered-load position |
|---|---|---:|
| Normal | Healthy reference with comfortable headroom | 35% of incident load |
| Campaign | Clear trend toward the limiting resource | 65% of incident load |
| Peak | Near the SLO or invariant boundary | 85% of incident load |
| Incident | Decisive evidence of the level's failure mode | 100% |

The percentages select level-authored scenario points; they do not multiply latency or utilization linearly. Every level supplies a complete center value for every displayed metric at every preset. Interpolation is permitted only during the 8–12-second visual transition between two authored states.

For non-traffic levels:

- Level 10 varies simultaneous admission pressure while stock remains 500 units.
- Level 11 varies operational write pressure while the 4.2-TB stored-data size remains fixed.
- Level 12 varies the number and severity of injected failures, not customer demand.

## 9. Determinism and rounding

- Scenario center points are authoritative content values, not outputs of a capacity formula.
- Seeded noise is bounded to ±2% for rates and utilization and ±4% for latency unless a level defines a smaller range.
- Counts representing invariants—confirmed orders, reservations, duplicates, lost orders, and oversold units—never receive jitter.
- Percent values are clamped to 0–100%; queue depth and time are never negative.
- Display rounding happens after relationships are calculated. Repeated views of the same level, preset, and decision use the same seed.
- Reduced-motion mode shows the center point and the accessible summary states the direction and magnitude of the change.

## 10. Credibility checks

Before content is accepted, every level must pass these checks:

- The limiting resource is more saturated than unrelated resources.
- The recommended change affects the metrics it can causally influence.
- A read-scaling technique does not claim to improve write throughput.
- Caching does not claim strong freshness without an invalidation mechanism.
- Background jobs improve request latency but expose queue delay.
- Horizontal scaling does not lower database load unless the scenario explicitly changes request behavior.
- CDN offload reduces origin requests and egress together.
- Replica lag increases during analytical pressure and falls after workload separation.
- Flash-sale success is measured by correctness and controlled admission, not only RPS.
- Sharding is not recommended before growth, partitioning, and operational constraints justify it.
- Resilience patterns can degrade non-critical features while preserving confirmed orders.
