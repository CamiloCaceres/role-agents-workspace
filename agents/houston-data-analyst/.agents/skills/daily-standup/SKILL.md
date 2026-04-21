---
name: daily-standup
description: Use when the user opens the app in the morning or asks for a brief / standup / "what's on my plate today" — produce a ranked action plan: open anomalies by severity, experiments awaiting readout, asks in the queue, metrics that missed their scheduled refresh, and queries that failed on last run. Write to `daily-brief.md` and tell the user the single highest-leverage thing to do next.
---

# Daily Standup

## When to use

The user opened the app and asked for a brief, standup, morning
rundown, "what's on my plate today," or "what should I look at
first." Good default when the dashboard shows mixed signals and the
user wants a ranked plan rather than scrolling.

## Steps

1. **Aggregate the data.** Read:
   - `anomalies.json` — filter `status === "open"`. Sort P1 first,
     then by `deviationSigma` desc.
   - `experiments.json` — filter `status === "ended"` (waiting on
     a readout — hasn't been analyzed yet).
   - `asks.json` — filter `status === "open"` OR `"in-progress"`.
     Sort newest first for the visible top; count the total.
   - `config/metrics.json` + `metrics-daily.json` — for each
     metric, check latest snapshot date. Flag any metric whose
     latest snapshot is older than its cadence window (daily →
     > 36h old; weekly → > 9 days old) as "missed refresh."
   - `queries.json` — flag any entry with a non-null
     `costWarning` AND `lastRunAt` older than 30 days as "at
     risk of stale."

2. **Rank today's priorities** (strict):
   1. P1 anomalies — these can't wait.
   2. Experiments awaiting readout — decisions are blocked on
      these.
   3. P2 anomalies.
   4. New asks in queue (first-in, ranked by classification —
      `needs-new-query` is more actionable than `unclear`).
   5. P3 anomalies + missed metric refreshes.

3. **Write the brief** to `daily-brief.md` (overwriting):

   ```markdown
   # Daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line — the single highest-leverage action}

   ## Anomalies open ({N})
   - **P1** {metricId} — {observed} vs baseline {baseline}
     ({sigma}σ {direction}). Likely: {first possible cause}.
   - ...

   ## Experiments awaiting readout ({N})
   - {slug} — ended {daysAgo}d ago. Hypothesis: {one-line}.
   - ...

   ## Asks in queue ({N})
   - {question} — {classification}, ETA {etaMinutes}m, from
     {requester}.
   - ...

   ## Metric refreshes missed ({N})
   - {metricId} — latest snapshot {date}, cadence {cadence}.
   - ...

   ## Yesterday's activity
   - Queries run: {N}
   - Metrics snapshotted: {N}
   - Anomalies detected: {N}
   - Experiments analyzed: {N}
   - Asks triaged: {N} ({answered count} answered)
   ```

4. **Tell the user the one thing to do first** — don't dump the
   whole brief in chat, just the top line plus "full brief is in
   `daily-brief.md` — want me to walk through it?"

## Outputs

- `daily-brief.md` (overwritten)
