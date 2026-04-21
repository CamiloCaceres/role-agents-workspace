---
name: detect-anomaly
description: Use when `metrics-daily.json` has just been refreshed, on a daily sweep, OR when the user asks "anything weird in the data" — for each metric in `config/metrics.json` with ≥ 7 snapshots, compare the latest value to its 7-day and 28-day rolling baselines, flag deviations > 2σ (or the user's threshold) as anomalies with severity P1/P2/P3, hypothesize 1–3 possible causes from recent context, and append to `anomalies.json`.
---

# Detect Anomaly

## When to use

Whenever metrics data refreshes, on a scheduled daily sweep, or when
the user asks "anything off this week," "why did X drop," or
"anomaly check." I compute deviations against rolling baselines and
open anomaly records for anything past the threshold.

## Steps

1. **Load metrics.** Read `config/metrics.json` and
   `metrics-daily.json`. Filter metrics with at least 7 snapshots —
   anything fewer doesn't have a meaningful baseline yet.

2. **Read threshold config.** Check if the user has set a custom
   sigma threshold anywhere (I default to 2σ). If any metric has a
   per-metric override (`thresholds.red`, `thresholds.yellow`),
   prefer those for severity mapping — but still compute sigma for
   context.

3. **For each metric, compute baselines:**

   - `mean7` and `std7` from the last 7 snapshots excluding today.
   - `mean28` and `std28` from the last 28 snapshots excluding
     today.
   - `observed` = today's value.
   - `sigma7` = `|observed - mean7| / std7` (guard against
     std = 0 — if zero and observed differs, flag as "baseline has
     no variance" at P2 and continue).
   - `sigma28` = same against the 28-day.

4. **Classify severity.**
   - `P1`: `sigma7 > 3` AND `sigma28 > 3`, OR direction of
     movement is "bad" (higher on lower-is-better, or vice versa)
     AND `sigma7 > 2.5`.
   - `P2`: `sigma7 > 2` AND `sigma28 > 2`.
   - `P3`: `sigma7 > 2` but `sigma28 ≤ 2` (recent noise, may be
     drift).
   - Below P3 thresholds, do not open an anomaly.

5. **Dedupe.** Check `anomalies.json` for an existing OPEN anomaly
   on the same `metricId` for today's `date`. If one exists,
   update it in place (sigma, severity, causes may shift as
   hypotheses improve). Do not create duplicates.

6. **Hypothesize causes (1–3 ranked).** Pull context from:
   - `config/business-context.md` for what the metric measures and
     what typically drives it.
   - Recent changes via any connected channel (deploys in
     Composio-connected CI, campaigns in Composio-connected
     marketing tools, seasonality from historical comparison) —
     use `composio search` per category.
   - Historical pattern match — look at the same day last week /
     last month for seasonality.

   Phrase hypotheses concretely: "Likely cause: yesterday's
   deploy at 3pm UTC (see commit X) — verify by comparing
   pre/post cohorts." Never state causes as certain.

7. **Write the anomaly record** to `anomalies.json`:

   ```
   { id, metricId, detectedAt, date, baseline: mean7, observed,
     deviationSigma: sigma7, direction: "up"|"down", severity,
     possibleCauses: [...], status: "open", createdAt, updatedAt }
   ```

8. **Report.** In chat, list P1 anomalies first with their
   hypotheses and the one question I'd ask to confirm / rule out
   each cause. For P2/P3, one line each.

## Outputs

- Appended / updated `anomalies.json`
