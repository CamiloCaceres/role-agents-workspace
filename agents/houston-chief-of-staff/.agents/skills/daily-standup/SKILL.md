---
name: daily-standup
description: Use when the user opens the app in the morning or asks for a brief / standup / "what's on my plate today" — produce a ranked action plan: decisions pending CEO input, OKRs off-track this week, initiatives needing intervention, meetings today with missing prep. Write to `daily-brief.md` and tell the user the single highest-leverage thing to do next.
---

# Daily Standup

## When to use

The user opened the app and asked for a brief, standup, morning
rundown, "what's on my plate today," or "what should I look at
first." Good default when the dashboard shows mixed signals and the
user wants a ranked plan rather than scrolling.

## Steps

1. **Aggregate the data.** Read:
   - `decisions.json` — filter `status === "pending"`. Sort by
     `createdAt` ascending (oldest pending goes first — decision
     latency is a CoS failure mode).
   - `okr-tracker.json` latest snapshot + `config/okrs.json` for
     state — flag any objective currently `off-track` or that
     flipped `on-track` → `at-risk` / `at-risk` → `off-track` in
     the last 7 days.
   - `initiatives.json` — filter `status === "at-risk" ||
     "off-track"`. Rank by `linkedOkrIds.length` desc.
   - `bottlenecks.json` — filter `status === "open"`. Rank by
     impact set size.
   - `config/meeting-cadence.json` + any connected calendar (via
     `composio search` for the calendar category). For meetings
     today on the exec schedule: check whether a prep file exists
     at `status-rollups/{yyyy-mm-dd}/exec-meeting-prep.md` (or the
     board-pack readiness for a board meeting today).

2. **Rank today's priorities** (strict):
   1. Decisions pending CEO input, sorted oldest first.
   2. Today's exec-level meetings without prep.
   3. OKRs off-track this week (from OKR snapshot deltas).
   4. Initiatives at-risk / off-track with the most linked OKRs.
   5. Open bottlenecks with the largest impact set.

3. **Write the brief** to `daily-brief.md` (overwriting):

   ```markdown
   # Daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line — the single highest-leverage action}

   ## Decisions pending your input ({N})
   - **{title}** — {age in days} days old. Summary: {summary}.
   - ...

   ## Meetings today needing prep ({N})
   - {time} — {meeting title}. Prep file: {exists | missing}.
   - ...

   ## OKRs off-track / freshly at-risk ({N})
   - {objective}: {current}/{target} {unit} ({pct%}). Linked
     initiative: {init slug} ({status}).
   - ...

   ## Initiatives needing intervention ({N})
   - **{title}** — owner {owner}, {status}, {N} linked OKRs.
     Ask: {ask line from init.json}.
   - ...

   ## Open bottlenecks ({N})
   - {title} — proposed owner {owner}. Blocks {N} items.
   - ...

   ## This week's activity
   - Rollups published: {N}
   - Decisions logged: {N} ({decided count} decided, {pending count}
     pending)
   - Initiatives status-updated: {N}
   - Comms drafts ready: {N}
   ```

4. **Tell the user the one thing to do first** — don't dump the
   whole brief in chat, just the top line plus "full brief is in
   `daily-brief.md` — want me to walk through it, draft a nudge
   on the top initiative, or prep today's exec meeting?"

## Outputs

- `daily-brief.md` (overwritten)
