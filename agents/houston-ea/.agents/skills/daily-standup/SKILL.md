---
name: daily-standup
description: Use when the user opens the app and asks for a brief / standup / morning brief / "what's up today" / "what's on my plate" — produce a ranked priority list across inbox, follow-ups, meetings, drafts, and conflicts; write `priority-list.md` and `daily-brief.md`.
---

# Daily Standup

## When to use

The user opened the app and asked for a brief, standup, morning
rundown, "what's up today," or "what's on my plate." Also the right
move when the dashboard is showing mixed signals and the user wants a
ranked plan of attack rather than scrolling.

## Steps

1. **Refresh calendar + inbox projections.** If
   `meetings-today.json` is older than 2 hours or missing, run
   `review-calendar` first. If `inbox-queue.json` is older than 2
   hours or missing, run `triage-inbox` first. Do NOT force re-runs
   unconditionally — only if stale.
2. **Aggregate the data.** Read:
   - `inbox-queue.json` — filter `status === "pending"` OR
     `status === "needs-review"`. Split into VIP (classification:
     "VIP") and rest.
   - `followups.json` — filter `status === "open"` OR
     `"snoozed"`, with `dueAt <= end-of-today` (due today or
     overdue).
   - `meetings-today.json` — filter `startAt` within today.
   - `calendar-conflicts.json` — filter `status === "open"`.
   - Drafts awaiting send: filter `inbox-queue.json` for
     `draftStatus === "awaiting-send"`.
3. **Rank today's priorities.** Strict order:
   1. **Urgent VIP messages** — VIPs with pending action.
   2. **Follow-ups due today or overdue** — broken promises
      compound.
   3. **Today's meetings with prep gaps** — the user should not
      walk in cold.
   4. **Open drafts awaiting send** — these clear the queue fast.
   5. **Calendar conflicts** — requires a decision before the day
      runs off the rails.
4. **Surface blockers.** If any VIP thread is flagged with
   `sensitiveParty` and has no user decision yet, hoist it above
   everything else.
5. **Write `priority-list.md`** (short, ~8 bullets). Overwritten.
   Each bullet: priority-rank → what → who → ask ("reply / prep /
   send / decide"). This is the file the dashboard surfaces most
   prominently.
6. **Write `daily-brief.md`** (full rundown). Overwritten. Structure:
   ```markdown
   # Daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line recommendation — the single highest-leverage thing to
   do right now}

   ## VIPs needing you ({N})
   - {Name} ({relationship}) — "{subject}" — {snippet}

   ## Follow-ups due today ({N})
   - {promiseTo} ({company}) — {description} — due
     {relative-time}

   ## Today's meetings ({N})
   - {time} — {title} — {attendees} — prep: {ready|missing}

   ## Drafts awaiting send ({N})
   - {recipient} — {subject} — drafted {relative-time} ago

   ## Calendar conflicts ({N})
   - {type} — {description} — at {startAt}

   ## Yesterday's activity
   - Drafts written: {N}
   - Emails triaged: {N}
   - Meetings booked: {N}
   - Follow-ups closed: {N}
   - Expenses logged: {N}
   ```
7. **Tell the user the one thing to do first.** Don't dump the
   whole brief in chat — just the top line plus "full brief in
   `daily-brief.md`, ranked in `priority-list.md`. Want me to walk
   you through it?"

## Outputs

- `priority-list.md` (overwritten)
- `daily-brief.md` (overwritten)
