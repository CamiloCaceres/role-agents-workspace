---
name: monitor-competitor
description: Use when a competitor appears in news or releases something, the user says "check on {competitor}," "weekly competitor sweep," "what's {competitor} up to," OR on a scheduled competitive sweep — pull recent activity from connected news / social / review sources, update the activity log, flag stale battlecards, and route high-impact moves to the user. Writes to `competitor-activity.json` and `competitors/{slug}/activity-log.md`.
---

# Monitor Competitor

## When to use

- The user names a competitor and asks what's new.
- The user says "weekly sweep" / "monthly sweep" / "check on
  everyone" — run across all `config/competitors.json` rows.
- A competitor is mentioned in a customer call note or win-loss
  theme and the user wants the latest context.

## Principles

- **Source every claim.** Every activity log entry cites a URL
  with a fetched timestamp. No hearsay.
- **Impact is about us, not them.** A competitor raising a Series D
  might be high-impact if we compete for talent, low-impact if we
  sell to different buyers. Judge impact through our lens.
- **Stale battlecards are the point.** The monitoring value is
  surfacing when existing battlecards no longer hold.
- **Don't alarm on noise.** Product-release fatigue is real. Only
  surface high-impact events in the user-facing summary; keep
  low-impact in the log for the record.

## Steps

1. **Resolve scope.** Single competitor or sweep?
   - Single → parse the name, resolve to `slug` via
     `config/competitors.json`. If the slug doesn't exist, ask: "I
     don't have {name} in competitors yet — add them?"
   - Sweep → iterate over every row in `config/competitors.json`,
     treating each as a single run.
2. **Discover monitoring tool slugs.** `composio search` for
   categories: news, RSS, press releases, review sites, changelog
   feeds, funding databases, social feeds. Use what's connected;
   skip what isn't and note the gap in the log.
3. **Fetch activity (last 30 days for single, last 7 for sweep).**
   Pull for each competitor:
   - Product releases (their changelog, blog, release notes feed)
   - Pricing page changes (if cached snapshots available)
   - Funding / M&A announcements
   - Leadership changes (key marketing / product hires)
   - Major content drops (keynote, big campaign)
   - Review-site activity (sentiment shift on G2, Capterra)
4. **Classify each event.** Map to `type`:
   `product-release | pricing-change | funding | leadership-change
   | content | other`. Write a one-line `headline` in neutral prose
   — no adjectives, no marketing copy.
5. **Rate impact.** For each event:
   - **high** — invalidates the current battlecard (e.g. they
     launched the feature we claim they lack; they slashed pricing;
     they closed a funding round targeting our segment). Flag
     `downstream: ["battlecard-refresh", "sales-alert"]`.
   - **medium** — changes some battlecard sections but not the
     counter-positioning. `downstream: ["battlecard-refresh"]`.
   - **low** — for the record; no immediate action.
     `downstream: []`.
6. **Write events.** Append rows to `competitor-activity.json` with
   full schema (id, competitorSlug, type, headline, sourceUrl,
   impact, downstream, createdAt, updatedAt).
7. **Update the per-competitor activity log.** Write to
   `competitors/{slug}/activity-log.md` (append, most recent at
   top):
   ```markdown
   # Competitor activity log — {Name}

   ## {YYYY-MM-DD} · {impact} · {type}
   {headline}
   Source: [{url}]({url}) (fetched {timestamp})
   Downstream: {battlecard-refresh | sales-alert | ...}

   ---

   ## {previous entries below}
   ```
8. **Flag battlecard staleness.** For every event with
   `downstream` containing `"battlecard-refresh"`, update the
   corresponding row in `battlecards.json`:
   - `status: "stale"` (medium impact) or `"urgent"` (high impact)
   - `stalenessDays` = days since `lastRefreshedAt`
   If no battlecard exists yet, flag the user: "{Competitor} just
   did X and we don't have a battlecard for them — want me to
   create one?"
9. **Route sales alerts** (high-impact only). If the user has a
   connected channel for sales alerts (Slack, inbox) and has
   approved auto-alerting, compose a short alert via `composio
   search` and draft — but do not send without the user's
   sign-off.
10. **Summarize to the user.** Not every event — just the high-
    impact ones and a count of mediums. For sweeps: "3 high-impact
    moves this week: {1-liner each}. 7 medium-impact logged. Full
    detail in the activity log." Offer: "Refresh the battlecards
    for {list}?"

## Outputs

- New rows in `competitor-activity.json`
- Updated `competitors/{slug}/activity-log.md`
- Updated `battlecards.json` (staleness flags)
- Possible `sales-alert` drafts (never sent without approval)
