---
name: daily-standup
description: Use when the user opens the app in the morning or asks for a brief / standup / "what's on my plate" / "where should I start today" — produces a ranked action plan across sev1 at-risks, upcoming QBRs, renewals by window, qualified expansions not yet handed off, and recent health changes. Writes `daily-brief.md` and surfaces the ONE top-priority item in chat.
---

# Daily Standup

## When to use

- User opened the app and asked for a brief, standup, morning
  rundown, "what's on my plate," "where do I start," or similar.
- A good first run when the user hasn't touched the agent in 24+
  hours and the dashboard shows mixed signals.

One brief per day is authoritative. This skill **overwrites**
`daily-brief.md` — it does not append.

## Steps

1. **Aggregate the data.** Read:
   - `at-risk.json` — filter `status === "open"`, sort by severity
     (sev1 first), then by ARR descending.
   - `accounts.json` — pull rows with `nextQbrAt` within the next 7
     days.
   - `renewals.json` — bucket by renewal-at window: 0-30 days, 31-60
     days, 61-90 days.
   - `expansion-pipeline.json` — filter `stage === "qualified"`
     AND (`handoffSentAt` missing OR empty).
   - `accounts.json` — rows where `lastReviewedAt` changed in the
     last 24 hours (health-change delta). Cross-reference
     `accounts/{slug}/health.json` for the prior score if you want
     the tier-change narrative.
2. **Rank today's priorities.** Strict order:
   1. **Open sev1 at-risks** — nothing else is above board-material
      churn. These get flagged loud (CLAUDE.md 24-hour rule).
   2. **QBRs in the next 7 days** — these need packs ready; check
      that `accounts/{slug}/qbr-pack.md` exists per account in
      this bucket. Flag missing packs.
   3. **Renewals in the 0-30 window** — the tightest timeline
      first. Then 31-60, then 61-90.
   4. **Qualified expansions not yet handed off** — ARR on the
      table.
   5. **Health changes in the last 24h** — tier-up is good news;
      tier-down is a heads-up that may need `flag-at-risk`.
3. **Surface blockers.** If a sev1 at-risk has no
   `proposedPlay` set, or a QBR inside 72 hours has no pack
   written, flag it loud — those are the ones that can't slip.
4. **Write the brief** to `daily-brief.md` (overwriting). Use
   this structure:
   ```markdown
   # Daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line recommendation — the single highest-leverage thing
   to do right now}

   ## Open sev1 at-risks ({N})
   - {account} ({arr}) — {cause}. Proposed play: {play}. Status:
     {open | in-progress}.
   - ...

   ## QBRs next 7 days ({N})
   - {date} — {account} — pack: {written | missing}
   - ...

   ## Renewals by window
   ### 0-30 days ({N})
   - {renewalAt} — {account} ({arr}) — confidence: {high | med |
     low}
   ### 31-60 days ({N})
   ...
   ### 61-90 days ({N})
   ...

   ## Qualified expansions awaiting AE handoff ({N})
   - {account} — {title} (~${uplift}) — stakeholder: {name}

   ## Health changes — last 24h ({N})
   - {account}: {prev} → {new} ({trend})
   ```
5. **Tell the user the ONE thing to do first.** Don't dump the
   whole brief in chat — just the top line plus *"Full brief is in
   `daily-brief.md`. Want me to walk you through it?"* If a sev1
   at-risk is open, that's the one thing. Otherwise, fall down the
   priority ranking until something bubbles up.

## Outputs

- `daily-brief.md` (overwritten)
