---
name: schedule-meeting
description: Use when the user asks to book / schedule / find time with someone — propose 3 times that respect focus blocks, timezone, and max-meetings-per-day, draft the counterparty message, iterate on back-and-forth, and create the event only after explicit user approval. Never books without approval.
---

# Schedule Meeting

## When to use

The user said "book a meeting with Jane," "find 30 minutes with the
Acme team next week," or responded to a scheduling request in their
inbox with "let's book it." I propose; the user approves; I book.

## Steps

1. **Clarify the ask.** Extract from the user's message: counterparty
   name(s), desired duration (default 30 min), purpose, desired
   timezone (default user's timezone). If any is missing and
   material, ask ONE question.
2. **Resolve the calendar connection.** Use `composio search` to find
   the free/busy + create-event slugs for the connected calendar. Do
   NOT hardcode. If no calendar is connected, tell the user which app
   to link and stop.
3. **Load constraints.** Read `config/schedule-preferences.json` for
   `timezone`, `workingHours`, `focusBlocks`, `maxMeetingsPerDay`,
   `minBufferMinutes`, `blackoutPeriods`. Read
   `config/vips.json` — if the counterparty is a VIP, prefer
   higher-energy morning slots and longer buffers.
4. **Fetch free/busy.** Pull the user's busy blocks for the next 10
   business days. Compute candidate slots that:
   - fall inside `workingHours`,
   - do NOT intersect any `focusBlock`,
   - respect `minBufferMinutes` on both sides of existing busy,
   - keep the day's total meetings ≤ `maxMeetingsPerDay`,
   - avoid `blackoutPeriods`.
5. **Pick 3 options.** Spread across days (e.g. tomorrow AM,
   day-after PM, end-of-week AM). Prefer mid-morning (10–11:30) and
   early afternoon (2–4). Avoid Mondays before noon and Friday
   afternoons unless nothing else fits.
6. **Draft the message.** Read `config/voice.md`. Match tone. Pattern:
   one-line acknowledgement → 3 proposed times (bulleted, both user
   and counterparty timezones labeled when different) → soft fallback
   ("or suggest a time that works better"). ≤80 words.
7. **Write `scheduling/{threadId}/proposal.md`** with sections:
   ```markdown
   ## Counterparty
   {name} <{email}>

   ## Proposed times
   - {Day Mon DD, H:MMam PT / H:MMpm ET} — {duration}
   - ...

   ## Constraints honored
   - focus blocks respected: {list}
   - daily meeting cap: {X}/{max}
   - buffers: {min}

   ## Draft message

   ## Status
   draft
   ```
   (`threadId` = the inbox thread this scheduling is attached to, or a
   generated id prefixed with `sched-` if standalone.)
8. **Present to user.** "Here are 3 options + a draft message. Send
   this? Tweak? Add a 4th option?" Never send.
9. **Iterate on the reply.** When the counterparty replies picking a
   slot or counter-proposing, update the proposal's `## Status`
   (draft → sent → counter-proposed) and either confirm or loop back
   to step 4–5 with a narrowed window.
10. **Book on approval.** When the user says "book {time} with
    {counterparty}," call the Composio create-event slug. Add
    counterparty as attendee, add a video-link if the calendar
    provider supports it, title per user instruction or inferred
    purpose. Update proposal status to `confirmed`.
11. **Seed a prep entry.** After booking, refresh
    `meetings-today.json` if the event falls today, and note in chat
    that `prep-meeting` will auto-run within 24 hours of start.

## Outputs

- `scheduling/{threadId}/proposal.md` (overwritten per iteration)
- Created calendar event on approval
- Refreshed `meetings-today.json` when applicable
