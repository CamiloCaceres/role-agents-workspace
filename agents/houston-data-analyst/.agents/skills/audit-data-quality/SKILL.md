---
name: audit-data-quality
description: Use when a metric looks weird, the user asks "why is this number off," a new source is connected, or on a quarterly cadence — for each target table, run read-only checks for nulls per column (vs. expected), duplicates on natural keys, freshness (max timestamp vs. expected staleness), referential integrity on key joins, and cardinality surprises; write a dated report to `data-quality-reports/{YYYY-MM-DD}/report.md`.
---

# Audit Data Quality

## When to use

- The user said "why is this number off / weird / lower than usual."
- A new data source was connected and needs a sanity pass before we
  trust it.
- An anomaly in `anomalies.json` has "data quality suspected" as a
  hypothesis.
- Scheduled quarterly sweep across the core tables.

## Steps

1. **Pick targets.** Read `config/schemas.json`. Default to the
   tables referenced by metrics in `config/metrics.json` — those
   are the ones whose quality affects answers the user trusts. If
   the user named specific tables, use those. If the user asked
   about a specific metric, walk `config/metrics.json` → `schemaDeps`.

2. **For each target, run read-only checks via the connected
   warehouse (Composio).** Each check is one SELECT. Cap at the
   last 30 days of data unless the user asks for full-history.

   - **Null rates:** For each column, `COUNT(*) - COUNT(col)` over
     total. Flag any non-nullable column with nulls. Flag any
     column where null rate jumped vs. a prior month.
   - **Duplicates on natural keys:** `SELECT nk, COUNT(*) FROM t
     GROUP BY nk HAVING COUNT(*) > 1 LIMIT 100`. Flag if any.
   - **Freshness:** `SELECT MAX(updated_at) FROM t`. Compare to
     expected staleness (default: should be < 24h old for daily
     tables, < 1h for near-real-time). Flag stale.
   - **Referential integrity:** For each known FK pair, check that
     `COUNT(orphans) = 0`, e.g. `SELECT COUNT(*) FROM child c LEFT
     JOIN parent p ON c.parent_id = p.id WHERE p.id IS NULL`.
     Flag orphans.
   - **Cardinality surprises:** Row count today vs. 7-day average;
     distinct-count on key columns. Flag large deltas.

3. **Self-check read-only.** Every generated query must be a plain
   SELECT — refuse and stop if any DML / DDL appears.

4. **Write the report** to `data-quality-reports/{YYYY-MM-DD}/report.md`:

   ```markdown
   # Data quality report — {YYYY-MM-DD}

   ## Summary
   {N} tables audited. {N} issues flagged: {P1-count} blocking,
   {P2-count} concerning, {P3-count} informational.

   ## {table.name}
   - **Null rates** — {pass / flagged columns with rates}
   - **Duplicates on {nk}** — {N found / none}
   - **Freshness** — MAX(updated_at) = {ts} ({Xh ago})
   - **Referential integrity** — {check results}
   - **Cardinality** — today {N} vs 7d-avg {N} (Δ {X%})

   {repeat per table}

   ## Impact on tracked metrics
   - {metricId}: {what the DQ issue means for its reliability}
   ```

5. **Cross-link anomalies.** If this audit was triggered by an
   open anomaly, and a check found a likely cause (stale data,
   duplicate spike, null jump), update the anomaly's
   `possibleCauses` in `anomalies.json` with the specific DQ
   finding.

6. **Report.** In chat, list the flagged issues by severity. Point
   the user at the report path.

## Outputs

- `data-quality-reports/{YYYY-MM-DD}/report.md` (new)
- Possibly updated `anomalies.json` (cross-link causes)
- Possibly updated `config/schemas.json` (if introspection
  discovered new columns or FKs during the audit)
