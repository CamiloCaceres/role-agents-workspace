---
name: daily-standup
description: Use when the user opens the app and asks for a brief / standup / "what's on my plate" / "what did I ship yesterday" — produce a ranked PMM action plan covering launches in flight (with imminent dates and incomplete asset checklists), stale battlecards, competitor moves this week, live messaging tests, and win-loss deltas. Write to `daily-brief.md` and tell the user the top priority.
---

# Daily Standup

## When to use

The user opened the app and asked for a brief, standup, morning
rundown, "what's on my plate," or "what did I ship yesterday." Also
good as the day's first-run when the dashboard is mixed and the user
wants a ranked plan.

## Steps

1. **Aggregate the data.** Read:
   - `launches.json` — filter `status` in `["brief",
     "content-drafted"]` with `launchDate` within the next 14 days.
     These are the launches-in-flight.
   - `launches.json` — filter any row where
     `assetsComplete < 100` AND `launchDate` within 7 days. Urgent
     asset gaps.
   - `battlecards.json` — filter `status` in `["stale", "urgent"]`.
     Rank `urgent` first.
   - `competitor-activity.json` — filter `createdAt` within the last
     7 days, rank `impact: "high"` first.
   - `messaging-tests.json` — filter `status` in `["live",
     "analyzing"]`. Surface any that have been live > 14 days
     without a decision.
   - `win-loss.json` — filter rows where `period` is the current
     quarter or the immediately preceding one. Note any theme with
     `positioningImplication` that hasn't been addressed (look at
     `config/positioning.json.lastReviewedAt` — is it older than the
     win-loss theme's `createdAt`?).
2. **Rank today's priorities.** Strict order:
   1. **Urgent asset gaps** — a launch is within 7 days and has
      drafted-but-not-approved assets OR `todo` assets. These block
      the launch.
   2. **Urgent battlecards** — a high-impact competitor event
      invalidated a battlecard. Sales is flying blind until it's
      refreshed.
   3. **High-impact competitor moves this week** — anything sales
      or leadership should know about.
   4. **Live tests stalled** — tests live > 14 days without a
      decision. Either call them or kill them.
   5. **Unactioned positioning implications** — win-loss themes
      from the last quarter with proposed positioning changes that
      haven't been folded into `config/positioning.json`.
3. **Write the brief** to `daily-brief.md` (overwriting). Use:
   ```markdown
   # PMM daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line recommendation — the single highest-leverage thing
   to do right now}

   ## Launches in flight ({N})
   - **{name}** — launching {relative} · {status} · assets
     {assetsComplete}% · {N todos, N drafted}
     - Gaps: {comma-separated asset labels still in `todo` or
       `drafted` awaiting approval}
   - ...

   ## Battlecards needing refresh ({N})
   - **{competitor}** — {status}, last refreshed {days}d ago
     - Trigger: {most recent high-impact event that invalidated it}
   - ...

   ## Competitor moves this week ({N})
   - {date} · {impact} · **{competitor}** — {headline}
   - ...

   ## Messaging tests live ({N})
   - **{test-id or short title}** — live {days}d · primary metric
     trending {up / flat / down}
   - ...

   ## Open positioning implications ({N})
   - From {period}: "{theme}" → {proposed change} ({frequencyPct}%
     of sample)
   - ...

   ## Yesterday / since last standup
   - Launches advanced: {N} ({names})
   - Assets drafted: {N}
   - Battlecards refreshed: {N}
   - Competitor events logged: {N}
   ```
4. **Surface blockers.** If anything in the "Urgent asset gaps" list
   has an external-owner (designer, eng, legal), flag that blocker
   loud — that's the one thing that can't slip and isn't the user's
   direct action.
5. **Tell the user the first move.** Don't dump the full brief in
   chat. State the single highest-leverage action plus "full brief
   is in `daily-brief.md` — want me to walk you through it?"

## Outputs

- `daily-brief.md` (overwritten)
