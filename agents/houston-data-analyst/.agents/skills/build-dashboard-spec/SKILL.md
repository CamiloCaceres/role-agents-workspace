---
name: build-dashboard-spec
description: Use when the user asks to design a dashboard ("I want to see X regularly," "build me a dashboard for Y," "spec a growth dashboard") — propose the sections, per-section visualizations, cadence, and the SQL behind each viz; write the spec to `config/dashboards.json`. Spec-only — I do not render HTML. The user or their BI tool builds from the spec.
---

# Build Dashboard Spec

## When to use

The user wants a recurring view of a group of metrics. I spec it —
audience, cadence, sections, per-viz SQL — and hand the spec to the
user's BI tool (Looker, Mode, Hex, Metabase, Sigma, Tableau). I do
not render HTML dashboards; the Houston overview tab is separate and
covers the operator's view.

## Steps

1. **Clarify audience + cadence.** Ask ONE tight question if not
   clear: "Who's looking at this and how often? (exec weekly,
   growth team daily, on-demand)." Defaults: `audience: "operator"`,
   `cadence: "daily"`.

2. **Propose metric list.** From `config/metrics.json` pick the
   metrics that fit the dashboard's purpose. If the user named
   metrics that aren't tracked yet, note them as `"sqlSnippet": ""`
   placeholders with a recommendation to run `track-metric` first.

3. **Design sections.** Two-to-four sections max. Canonical shape:
   - **Top-line KPIs** — 3-5 single-number tiles for the dashboard's
     must-knows.
   - **Trends** — 30/60/90-day time-series for the KPIs.
   - **Breakdown** — segmented view (by segment, product area,
     cohort, channel).
   - **Anomalies / alerts** (optional) — latest flagged outliers.

4. **Per-viz details.** For each visualization specify:
   - `title`
   - `chart`: `line` | `bar` | `number` | `sparkline` | `funnel` |
     `table`
   - `metricId` if it maps to a tracked metric
   - `sqlSnippet` — parameterized read-only SQL using `{{date}}` /
     `{{startDate}}` / `{{endDate}}` placeholders
   - `notes` — any interpretation caveats or known data-quality
     flags

5. **Self-check read-only.** Every `sqlSnippet` must be SELECT-only
   — scan for forbidden keywords and refuse if any appear.

6. **Write the spec** to `config/dashboards.json` — append or
   update by `id`:

   ```json
   {
     "id": "growth-daily",
     "name": "Growth Daily",
     "audience": "growth team",
     "cadence": "daily",
     "sections": [
       {
         "title": "Top-line",
         "visualizations": [
           {
             "metricId": "signups",
             "title": "Signups (today)",
             "chart": "number",
             "sqlSnippet": "SELECT COUNT(*) AS value FROM events WHERE event='signup' AND DATE(ts) = DATE('{{date}}')",
             "notes": "Excludes bots flagged in users.is_bot"
           }
         ]
       }
     ],
     "createdAt": "...",
     "updatedAt": "..."
   }
   ```

7. **Report.** Present the spec in chat with a one-line summary per
   section and the next step: "Paste this spec into your BI tool
   or ask me to translate a specific viz for {tool}."

## Outputs

- Updated `config/dashboards.json`
