---
name: book-meeting
description: Use when a reply is classified as "interested" and the user confirms they want to book — draft a booking reply with 2-3 proposed times (pulled from the user's connected calendar) and the correct calendar link, append to thread, and create a `meetings.json` row with status 'scheduled' once the user confirms booking.
---

# Book Meeting

## When to use

A `replies.json` row has `classification: "interested"` and the user
has said "let's book them." Or the user points me at a thread and
says "get a meeting on the calendar." I propose times; the user
confirms; I record the meeting.

## Steps

1. **Verify interest.** Read the matching `replies.json` row.
   Confirm `classification === "interested"` (or `"not-now"` with
   a near-term return date the user wants to honor). If not, ask
   the user to confirm before I propose a meeting.
2. **Resolve the calendar connection.** Use `composio search` to
   discover the connected calendar slug (calendar availability fetch
   + calendar event create). Do NOT hardcode. If no calendar
   connection is linked, tell the user which app to connect and
   stop.
3. **Fetch availability.** Pull the user's free/busy for the next 5
   business days. Default slot length 30 minutes. Prefer
   mid-morning (10–11:30) and early afternoon (2–4) in the user's
   timezone. Avoid Mondays before noon and Friday afternoons by
   default unless nothing else is open.
4. **Pick 3 options.** Spread across days (e.g. tomorrow AM,
   day-after PM, end-of-week AM). If the prospect mentioned a
   timezone in the reply, convert and label both sides.
5. **Draft the booking reply** in voice from `config/voice.md`.
   Pattern: one-line acknowledgement → 3 proposed times (bulleted,
   with timezones) → fallback calendar link ("Or grab any time
   here: {calendar-link}"). ≤80 words.
6. **Write** to `leads/{slug}/outreach-draft.md` overwriting.
   Append a staged outbound row to
   `leads/{slug}/thread.json`.
7. **Present to the user** and ask: "Send this?" On user approval,
   they send via their connected inbox.
8. **When the user confirms the meeting is on the calendar** —
   either "prospect picked tomorrow 10am" or they provide the
   calendar event details — create a `meetings.json` row:
   `{ leadSlug, scheduledAt, durationMinutes, channel:
   "video"|"phone"|"in-person", aeOwner?, status: "scheduled",
   handoffSent: false }`.
9. **Update `leads.json`:** set `status: "meeting-booked"`.
10. **Tell the user:** "Booked for {when}. Want me to assemble the
    AE handoff pack now?" — teeing up `handoff-to-ae`.

## Outputs

- `leads/{slug}/outreach-draft.md` (overwritten)
- Appended row in `leads/{slug}/thread.json`
- New row in `meetings.json` (on booking confirmation)
- Updated `leads.json` row
