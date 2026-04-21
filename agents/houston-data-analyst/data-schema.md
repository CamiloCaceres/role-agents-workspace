# Data Analyst — Data Schema

All records share these base fields:

```ts
interface BaseRecord {
  id: string;          // UUID v4
  createdAt: string;   // ISO-8601 UTC
  updatedAt: string;   // ISO-8601 UTC
}
```

All writes are atomic: write to a sibling `*.tmp` file, then rename
onto the target path. Never edit in-place. Never write anywhere under
`.houston/<agent>/` — the file watcher skips those paths.

---

## Config — what the agent has learned about you

Nothing in `config/` is shipped in the repo. Files appear at runtime,
written by `onboard-me` or by progressive capture inside other skills.

### `config/profile.json`
```ts
interface Profile {
  userName: string;
  company: string;
  team?: string;
  role?: string;
  onboardedAt: string;      // ISO-8601
  status: "onboarded" | "partial";
}
```
Written by: `onboard-me`. Updated by: any skill that captures a
missing field (progressive capture).

### `config/data-sources.json`
```ts
interface DataSource {
  id: string;                                 // stable slug, e.g. "warehouse-primary"
  type: "warehouse" | "product-db" | "saas";
  dialect?: "snowflake" | "bigquery" | "redshift" | "databricks" | "postgres" | "mysql" | "other";
  name: string;
  connection: {
    via: "composio" | "described";
    toolSlug?: string;                        // when Composio-connected
    notes?: string;                           // when described-only
  };
}
type DataSources = DataSource[];
```
Written by: `onboard-me`. Consumed by: `answer-question`,
`track-metric`, `detect-anomaly`, `audit-data-quality`.

### `config/schemas.json`
```ts
interface TableSchema {
  sourceId: string;
  schemaName?: string;
  tableName: string;
  columns: { name: string; type: string; nullable?: boolean; notes?: string }[];
  primaryKey?: string[];
  rowEstimate?: number;
  lastIntrospectedAt: string;
}
type Schemas = TableSchema[];
```
Written by: `answer-question` (lazy introspection on first query against
a table), `audit-data-quality`. Consumed by: `answer-question`,
`track-metric`, `build-dashboard-spec`, `audit-data-quality`.

### `config/metrics.json`
```ts
interface MetricDefinition {
  id: string;                                 // stable slug, e.g. "mrr"
  name: string;
  definition: string;                         // one-line plain-English
  sqlSnippet: string;                         // SELECT ... FROM ... (read-only)
  sourceId: string;                           // which data source
  cadence: "daily" | "weekly";
  unit: "count" | "currency" | "percent" | "ratio" | "duration" | "other";
  owner?: string;
  thresholds?: { green?: number; yellow?: number; red?: number };
  direction: "higher-is-better" | "lower-is-better" | "target-is-best";
  createdAt: string;
  updatedAt: string;
}
type Metrics = MetricDefinition[];
```
Written by: `onboard-me` (initial list), `track-metric`. Consumed by:
`track-metric`, `detect-anomaly`, `build-dashboard-spec`,
`daily-standup`.

### `config/business-context.md`
Markdown. Product description, user personas, what "engagement" means
in this company's context. Drives interpretation in anomaly hypotheses
and experiment narratives.

Written by: `onboard-me`. Updated by: any skill when the user corrects
a misinterpretation.

### `config/dashboards.json`
```ts
interface DashboardSpec {
  id: string;
  name: string;
  audience: string;                           // e.g. "exec", "growth team"
  cadence: "realtime" | "daily" | "weekly";
  sections: {
    title: string;
    visualizations: {
      metricId?: string;                      // if it maps to a tracked metric
      title: string;
      chart: "line" | "bar" | "number" | "sparkline" | "funnel" | "table";
      sqlSnippet: string;
      notes?: string;
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}
type Dashboards = DashboardSpec[];
```
Written by: `build-dashboard-spec`. Consumed by: `build-dashboard-spec`.

### `config/experiments-framework.md`
Markdown. Statistical framework: minimum sample size policy,
significance threshold (default 95%), minimum detectable effect,
guardrail metrics policy.

Written by: `onboard-me` (optional — progressive capture default),
`analyze-experiment` (progressive capture on first experiment).
Consumed by: `analyze-experiment`.

---

## Domain data — what the agent produces

### `queries.json` (index)
```ts
interface QueryIndex extends BaseRecord {
  slug: string;                               // kebab-case from purpose
  purpose: string;                            // one-line what-it-answers
  author: "agent" | "user";
  sourceId: string;
  schemaDeps: string[];                       // table names referenced
  tags: string[];
  costWarning?: "none" | "scanned-bytes" | "long-runtime" | "both";
  lastRunAt?: string;
  lastRowCount?: number;
}
type Queries = QueryIndex[];
```
Written by: `answer-question`, `document-query`, `track-metric`
(registers the metric's SQL as a reusable query).

### `queries/{slug}/query.sql`
The SQL body. Read-only SELECT / CTE / WITH only — guardrails enforced
at generation time; any INSERT / UPDATE / DELETE / MERGE / DROP gets
flagged and refused.

Written by: `answer-question`, `document-query`, `track-metric`.

### `queries/{slug}/result-latest.csv`
Most recent result, capped at 10,000 rows for file-system sanity (if
the true result exceeds that, `notes.md` records the actual row count
and the cap).

Written by: `answer-question`, `track-metric`.

### `queries/{slug}/notes.md`
Markdown — purpose, parameters, caveats, known data-quality flags,
last-run metadata.

Written by: `answer-question`, `document-query`, `track-metric`.

### `metrics-daily.json`
```ts
interface MetricSnapshot {
  id: string;                                 // snapshot id (uuid v4)
  metricId: string;
  date: string;                               // YYYY-MM-DD
  value: number;
  changeVsPrev?: number;                      // percent change vs previous snapshot
  changeVs7dAvg?: number;                     // percent change vs 7-day rolling average
  changeVs28dAvg?: number;                    // percent change vs 28-day rolling average
  createdAt: string;
}
type MetricsDaily = MetricSnapshot[];
```
Written by: `track-metric` (appends each scheduled run), implicitly
consumed by: `detect-anomaly`, `daily-standup`, the dashboard.

### `anomalies.json`
```ts
interface Anomaly extends BaseRecord {
  metricId: string;
  detectedAt: string;                         // ISO-8601
  date: string;                               // YYYY-MM-DD of the deviating value
  baseline: number;                           // the rolling-mean baseline
  observed: number;                           // the observed value
  deviationSigma: number;                     // |observed - baseline| / std
  direction: "up" | "down";
  severity: "P1" | "P2" | "P3";
  possibleCauses: string[];                   // ranked hypotheses
  status: "open" | "acknowledged" | "resolved" | "false-positive";
  resolvedAt?: string;
  resolutionNote?: string;
}
type Anomalies = Anomaly[];
```
Written by: `detect-anomaly`. Updated by: user actions via chat (status
transitions).

### `experiments.json` (index)
```ts
interface ExperimentIndex extends BaseRecord {
  slug: string;
  hypothesis: string;                         // "X will lift Y because Z"
  variants: string[];                         // e.g. ["control", "variant-a"]
  primaryMetric: string;                      // metric id or name
  guardrailMetrics: string[];
  startDate?: string;
  endDate?: string;
  status: "designing" | "running" | "ended" | "analyzed";
  sampleSize?: number;
  notes?: string;
}
type Experiments = ExperimentIndex[];
```
Written by: `analyze-experiment` (creates index entry if missing,
updates status on readout).

### `experiments/{slug}/readout.md`
Structured markdown readout: hypothesis, design, observed lift per
variant, statistical significance, confidence intervals, guardrail
checks, minimum detectable effect, recommendation ("ship", "kill",
"iterate", "inconclusive — extend").

Written by: `analyze-experiment`.

### `asks.json`
```ts
interface Ask extends BaseRecord {
  question: string;
  requester?: string;                         // name or identifier
  channel?: "slack" | "email" | "ticket" | "manual" | "other";
  classification:
    | "answerable-from-existing"
    | "needs-new-query"
    | "needs-new-data"
    | "unclear";
  status: "open" | "in-progress" | "answered" | "dropped";
  proposedApproach?: string;
  etaMinutes?: number;
  linkedQuerySlug?: string;
  answeredAt?: string;
}
type Asks = Ask[];
```
Written by: `triage-ask`. Updated by: `answer-question` (links query
slug when an ask is fulfilled).

### `data-quality-reports/{yyyy-mm-dd}/report.md`
Markdown report of a data-quality audit: per-table null rates,
duplicates on natural keys, freshness (max timestamp), referential
integrity checks, cardinality surprises.

Written by: `audit-data-quality`.

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
