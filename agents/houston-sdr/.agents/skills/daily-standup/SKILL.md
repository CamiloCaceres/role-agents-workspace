---
name: daily-standup
description: Use when the user opens the app in the morning and asks for a brief / standup / "what's on my plate" / "what did I do yesterday" — produce a ranked action plan: replies needing me today, sequence tasks due today, meetings on calendar, stalled leads I should revive, trigger events on my accounts. Write to `daily-brief.md` and tell the user what to tackle first.
---

# Daily Standup

## When to use

The user opened the app and asked for a brief, standup, morning
rundown, "what's on my plate," or "what did I do yesterday." Also a
good daily first-run when the dashboard is showing mixed signals and
the user wants a ranked plan of attack rather than scrolling.

## Steps

1. **Aggregate the data.** Read:
   - `replies.json` — filter `needsAction === true` and
     classification in `["interested", "referral", "not-now"]`.
     Sort `interested` first.
   - `leads.json` — filter `status === "sequenced"` AND
     `nextActionAt <= end-of-today` — these are today's sequence
     tasks.
   - `meetings.json` — filter status in `["scheduled",
     "confirmed"]` AND `scheduledAt` within today or tomorrow.
   - `leads.json` — filter `status === "sequenced"` AND
     `lastTouchedAt` > 7 days ago — stalled sweep candidates.
2. **Rank today's priorities.** Strict order:
   1. Interested replies — highest leverage minutes of the day.
   2. Sequence tasks due today — the dailies that compound.
   3. Meetings today or tomorrow — prep time, handoff checks.
   4. Stalled sweep — anything you could revive before lunch.
3. **Surface any blockers.** If a meeting today has
   `handoffSent: false` and the AE isn't the user, flag it loud —
   that's the one thing that can't slip.
4. **Write the brief** to `daily-brief.md` (overwriting). Use
   this structure:
   ```markdown
   # Daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line recommendation — the single highest-leverage thing
   to do right now}

   ## Replies to handle ({N})
   - {Name} ({Company}) — {classification}, {intent}% intent —
     "{one-line quote}"
   - ...

   ## Sequence tasks today ({N})
   - {Name} ({Company}) — {sequence-name}, step {n}: {intent}
   - ...

   ## Meetings today & tomorrow ({N})
   - {relative-time} — {Name} ({Company}), {channel},
     AE: {ae-owner}, handoff: {sent|pending}
   - ...

   ## Stalled — consider reviving ({N})
   - {Name} ({Company}) — last touched {days}d ago, {sequence}
   - ...

   ## Yesterday's activity
   - Drafts written: {N}
   - Replies classified: {N}
   - Meetings booked: {N}
   - Leads handed off: {N}
   ```
5. **Tell the user the one thing to do first** — don't dump the
   whole brief in chat, just the top line plus "full brief is in
   `daily-brief.md` — want me to walk you through it?"

## Outputs

- `daily-brief.md` (overwritten)
