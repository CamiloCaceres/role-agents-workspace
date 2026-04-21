---
name: daily-standup
description: Use when the user opens the app and asks for a brief / standup / "what's on my plate" / "what should I work on today" — produce a ranked editorial action plan covering drafts in review, pieces ready to publish, calendar gaps within 2 weeks, repurposing queue, and refresh candidates with high priority. Write to `daily-brief.md` and tell the user the top priority.
---

# Daily Standup

## When to use

- The user opens the app and asks for a brief, standup, morning
  rundown, "what's on my plate," "what should I work on today,"
  or "what did I ship yesterday."
- Good as the day's first-run when the dashboard is mixed and the
  user wants a ranked plan.

## Steps

1. **Aggregate the data.** Read:
   - `drafts.json` — filter `status` in `["ready-for-publish",
     "revising", "edited"]`. These are the in-review pile.
   - `calendar.json` — filter `plannedDate` within the next 14
     days where `status` is `idea` or `briefed` (calendar gaps).
   - `calendar.json` — filter `status: "scheduled"` with
     `plannedDate` in the next 7 days (publish horizon).
   - `repurposing-queue.json` — filter `status` in `["queued",
     "drafted"]`. Rank queued items for pieces published in the
     last 14 days higher (fresh pieces have more distribution
     momentum).
   - `refresh-queue.json` — filter `status` in `["queued",
     "scoped"]`. Rank `priority: "high"` first.
   - `published.json` — the last 3 `publishedAt` dates (for the
     "since last standup" section).
2. **Rank today's priorities.** Strict order:
   1. **Ready-for-publish drafts** — a piece that cleared
      `prepare-publish` and is waiting for the user to push the
      send. Nothing else matters if one of these is sitting.
   2. **Publish-horizon items (next 7 days) blocked in `editing`
      / `drafting`** — the calendar will miss a slot if not
      advanced today.
   3. **Drafts in revising (blocker count known)** — list the
      top blocker for each.
   4. **High-priority refresh candidates** — rank-decay +
      traffic-decline pieces that earn time this week, not
      "someday."
   5. **Repurposing — fresh pieces (< 14d old) with derivatives
      pending** — distribution momentum is expiring.
   6. **Calendar gaps in the next 14 days** — specific
      unfilled slots the user needs to fill or approve a proposed
      fill.
3. **Write the brief** to `daily-brief.md` (overwriting). Use:
   ```markdown
   # Content Editor daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line recommendation — the single highest-leverage thing
   to do right now}

   ## Ready to publish ({N})
   - **{title}** — {channel} · cleared publish-check {relative}
     · next: your approval to push to {CMS or "publish manually"}
   - ...

   ## Publish horizon — next 7 days ({N})
   - {date} · {channel} · **{title}** · status {status} · {days
     to slot}
     - Blocker: {specific — missing draft, in editing, etc.}
   - ...

   ## Drafts in review ({N})
   - **{title}** — status {revising | edited} · sweeps {n}/7 ·
     {word count} words
     - Top issue: {lowest sweep name + score}
   - ...

   ## Refresh queue — high priority ({N})
   - **{title}** — {trigger}, {priority} · decision {refresh |
     rewrite | archive if set, else "not scoped"}
   - ...

   ## Repurposing — fresh pieces with derivatives pending ({N})
   - **{title}** — {channels pending} · {days since publish}
   - ...

   ## Calendar gaps — next 14 days ({N})
   - {date} · {channel} · {pillar or "unassigned"} · status
     {idea | briefed}
   - ...

   ## Since last standup
   - Published: {N} ({titles})
   - Edited: {N} drafts
   - Repurposed: {N} pieces → {N} derivatives
   - Refreshed: {N} live pieces
   ```
4. **Surface blockers.** If anything in the "Ready to publish"
   list has been sitting for > 48 hours, flag it loud — that's
   a distribution slip happening in slow motion.
5. **Tell the user the first move.** Don't dump the full brief
   in chat. State the single highest-leverage action plus "full
   brief is in `daily-brief.md` — want me to walk you through
   it?"
6. **Follow-up menu:**
   - "Approve the ready-for-publish pieces — I'll draft the CMS
     payloads."
   - "Edit the top draft in review — pick up where I left off."
   - "Propose a fill for the nearest calendar gap."
   - "Scope the top refresh."
   - "Move on to `repurpose-content` for the freshest published."

## Outputs

- `daily-brief.md` (overwritten)
