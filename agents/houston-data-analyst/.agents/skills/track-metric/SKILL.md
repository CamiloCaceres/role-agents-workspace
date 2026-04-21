---
name: track-metric
description: Use when the user defines a new metric to monitor ("start tracking MRR daily," "track signup conversion rate," "watch weekly active users") — write a read-only SQL definition against the connected warehouse, snapshot the current value into `metrics-daily.json`, append the metric definition to `config/metrics.json`, and register it for the configured cadence (daily or weekly). Drives the core-metrics grid on the dashboard.
---

# Track Metric

## When to use

The user asked to "start tracking," "add a metric," "monitor," or
"watch" a named quantity. This skill registers the metric,
establishes its definition, and takes the first snapshot.

## Steps

1. **Clarify if needed.** If the user's phrasing is ambiguous
   ("MRR" could be billing-MRR, contract-MRR, or ARR/12), ask ONE
   tight question: "{Metric} — do you mean {A} or {B}?" Otherwise
   proceed.

2. **Identify the source.** Read `config/data-sources.json`. If the
   user didn't name a source, pick the one most likely from
   `config/business-context.md` (warehouse for core business
   metrics, product DB for engagement).

3. **Check existing metrics.** Read `config/metrics.json`. If a
   metric with the same slug or an overwhelmingly similar name
   already exists, tell the user and offer to update rather than
   duplicate.

4. **Confirm schema.** Read `config/schemas.json` for tables the
   metric references. If entries are missing, introspect lazily via
   the connected warehouse tool (same pattern as `answer-question`
   step 2).

5. **Draft the SQL snippet.** Return a `SELECT` that resolves to a
   single numeric value for a given date. Use a `$date` or
   `{{date}}` placeholder that `track-metric`'s scheduler will
   substitute at run time. Example shape (BigQuery):

   ```sql
   SELECT SUM(amount) AS value
   FROM `project.dataset.subscriptions`
   WHERE state = 'active'
     AND start_date <= DATE('{{date}}')
     AND (end_date IS NULL OR end_date > DATE('{{date}}'))
   ```

6. **Self-check read-only.** Same forbidden-keyword scan as
   `answer-question` step 4. Refuse if any DML / DDL is present.

7. **Capture cadence and direction.** If not specified, default to
   `cadence: "daily"` and ask one quick question for `direction`
   (higher-is-better / lower-is-better / target-is-best) and
   `unit` (count / currency / percent / ratio / duration / other).

8. **Append the metric definition** to `config/metrics.json` with
   `{ id, name, definition, sqlSnippet, sourceId, cadence, unit,
   direction, thresholds: {}, createdAt, updatedAt }`. Also
   register a reusable query under `queries/{metric-slug}/` for
   audit — `answer-question` will reuse it.

9. **Snapshot now.** Execute the SQL with `{{date}}` = today
   (warehouse's timezone, defaulting to UTC). Append to
   `metrics-daily.json` with `{ id, metricId, date, value,
   changeVsPrev, changeVs7dAvg, changeVs28dAvg, createdAt }`. For
   the first snapshot, the change fields are null.

10. **Backfill if asked.** If the user said "backfill last 30 days,"
    loop the SQL across dates and append each snapshot. Warn on
    cost before starting (same 10GB / 30s heuristic as
    `answer-question`).

11. **Report.** Tell the user: current value, what cadence it'll
    refresh on, where it shows on the dashboard (core-metrics
    grid), and that `detect-anomaly` will flag deviations once
    there's enough history (≥ 7 snapshots).

## Outputs

- Updated `config/metrics.json`
- Appended `metrics-daily.json` rows
- New `queries/{metric-slug}/query.sql`, `notes.md`
- Updated `queries.json`
- Possibly updated `config/schemas.json`
