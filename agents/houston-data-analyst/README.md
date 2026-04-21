# houston-data-analyst

Your AI Data Analyst. Writes SQL against your warehouse, tracks core
metrics daily, detects anomalies, analyzes experiments, and drafts
dashboard specs. Answers ad-hoc "how's X doing" questions without you
opening a BI tool. Never drops data, never runs expensive queries
without warning, never claims more than the data supports.

## Who this is for

Founders and PMs at early-stage startups doing their own analysis, the
first Data Analyst at a company drowning in ad-hoc requests, or any
data-literate operator who wants the first 80% of an analysis done so
they focus on interpretation and decisions.

You connect your stack via Composio — warehouses (Snowflake, BigQuery,
Redshift, Databricks), metric layers (dbt, Cube, LightDash), BI tools
(Looker, Mode, Hex), channels where asks arrive (Slack, email) — and
the Analyst adapts.

## Install

In Houston: **Add from GitHub** → paste the workspace repo URL.

## First prompts

- `Onboard me` — 3-question setup (warehouse, metrics, product
  context) so I can start writing accurate SQL.
- `How many signups did we get this week?` — I'll translate to SQL,
  warn on cost, run it, and return with caveats.
- `Start tracking MRR daily` — I'll write the SQL definition,
  snapshot current value, and feed the metrics grid.
- `How did the checkout experiment do?` — I'll compute lift,
  significance, and write a structured readout.
- `Daily standup` — ranked: open anomalies, experiments awaiting
  readout, asks queued, metrics that missed refresh.

## Skills

- **`onboard-me`** — 3-question setup: data sources, core metrics,
  product + users.
- **`answer-question`** — ad-hoc NL → SQL → result, with cost
  warnings, caveats, and reuse-ready saving.
- **`track-metric`** — register a metric, snapshot daily, feed the
  dashboard grid.
- **`detect-anomaly`** — compare current values to 7d / 28d baselines,
  flag > 2σ deviations, hypothesize causes.
- **`analyze-experiment`** — structured A/B readout: lift, stat sig,
  confidence intervals, guardrail checks, recommendation.
- **`build-dashboard-spec`** — design the dashboard spec (metrics,
  cadence, layout, SQL behind each viz); hand off to your BI tool.
- **`audit-data-quality`** — nulls, duplicates, freshness, joins —
  the "why is this number weird" checklist.
- **`triage-ask`** — classify an inbound ad-hoc ask and queue it
  with a proposed approach and ETA.
- **`document-query`** — save an ad-hoc query for reuse with purpose,
  schema deps, parameters, and caveats.
- **`daily-standup`** — morning rundown: anomalies, experiments,
  asks, stale metrics.

## License

MIT.
