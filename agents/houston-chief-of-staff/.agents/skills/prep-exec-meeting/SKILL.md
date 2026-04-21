---
name: prep-exec-meeting
description: Use when an exec team meeting is on the calendar within 24 hours OR the user says "prep the exec meeting" / "exec team prep" — assemble an agenda and pre-read from open initiatives needing discussion, OKR deltas that moved this week, and decisions pending CEO input; write to `status-rollups/{yyyy-mm-dd}/exec-meeting-prep.md`.
---

# Prep Exec Meeting

## When to use

- The user asks to prep the exec meeting ("prep the exec meeting",
  "build the agenda for tomorrow's exec team").
- `daily-standup` surfaces an exec meeting in the next 24 hours with
  no prep file.
- An initiative status shift or pending decision makes an ad-hoc exec
  sync worth it.

## Steps

1. **Read `config/meeting-cadence.json`.** If missing, ask the user
   ONE question: *"How often does your exec team meet, and when's
   the next one? Best — point me at your connected calendar via
   Composio and I'll pull the recurring slot; otherwise just tell
   me (e.g. 'weekly, Mondays 9am')."* Write and continue.

2. **Read `config/leadership-team.json`.** Attendees come from here;
   filter to the exec team. If missing, defer to the `status-rollup`
   skill's capture pattern and continue with what's there.

3. **Gather signal sources** in parallel:
   - `initiatives.json` — any `at-risk` or `off-track`, plus any
     `on-track` initiative where `lastStatusAt` is within 7 days and
     a major milestone landed.
   - `okr-tracker.json` — compute the 7-day delta per objective;
     flag any that flipped state (on-track → at-risk, etc.) since
     last meeting.
   - `decisions.json` — filter `status === "pending"`, sorted oldest
     first (older pending decisions go to the top of the agenda).
   - `bottlenecks.json` — filter `status === "open"` and sort by
     impact (count of `impactOnOkrIds` + `impactOnInitiativeSlugs`).

4. **Build the agenda.** Structure:

   ```markdown
   # Exec meeting prep — {YYYY-MM-DD}

   ## Attendees
   {bulleted list from leadership-team.json}

   ## Proposed agenda ({estimated minutes} total)
   1. **Decisions pending CEO input** ({N}) — {minutes}
      - {title} (owner {owner}) — {summary}
      - ...
   2. **OKR deltas this week** — {minutes}
      - {objective} flipped {from} → {to}; KR {kr} moved {delta}
   3. **Initiatives at risk / off-track** ({N}) — {minutes}
      - {title} (owner) — {one-line risk} — {ask}
   4. **Cross-team bottlenecks** ({N}) — {minutes}
      - {title} — {hypothesis}; proposed owner {owner}
   5. **Open asks + round-robin**

   ## Pre-read (5 minutes before the meeting)
   - Latest rollup: `status-rollups/{yyyy-mm-dd}/rollup.md`
   - Decisions requiring input (read each brief):
     {links to decisions/{slug}/decision.md}
   - OKR tracker latest snapshot

   ## Notes
   {any sensitive people matters to flag to CEO privately before the meeting}
   ```

5. **Sensitive matters routing.** If a pending decision or a
   bottleneck touches a sensitive people matter (performance, comp,
   exits — detected from the decision / bottleneck text), do NOT put
   it on the open agenda. Add a "For CEO only" section at the bottom
   of the prep file with a short discreet note, and tell the user in
   chat that it's there.

6. **Write atomically** to
   `status-rollups/{yyyy-mm-dd}/exec-meeting-prep.md` (overwriting
   any prior prep for the same date).

7. **Summarize in chat.** One paragraph: total items by section,
   estimated meeting length, anything flagged for CEO-only
   attention.

## Outputs

- `status-rollups/{yyyy-mm-dd}/exec-meeting-prep.md` (new or overwritten)
- Possibly updated `config/meeting-cadence.json` (progressive capture)
