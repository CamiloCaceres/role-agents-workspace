---
name: review-calendar
description: Use when the user asks to look at the week / day / rebalance / "how's my calendar" — scan the next 7 days via any Composio-connected calendar, flag overbooks, missing buffers (<15 min), unprotected focus blocks, VIP slots that should be protected, and meetings without prep; write conflicts and refresh the today projection.
---

# Review Calendar

## When to use

The user asked to review / look at / scan / rebalance the calendar, or
to tell me what's wrong with the week. Also run me automatically before
`daily-standup` so the morning brief has fresh conflict data.

## Steps

1. **Resolve the calendar.** Use `composio search` to discover the
   list-events slug for the connected calendar. Do NOT hardcode. If no
   calendar is connected, tell the user which app to link and stop.
2. **Fetch the next 7 days.** Pull all events including tentative,
   declined, and OOO markers. For each event capture: `externalEventId`,
   `title`, `startAt`, `endAt`, `location`, `channel` (video / phone /
   in-person — inferred from location field), `attendees` with
   `status`.
3. **Load context.** Read `config/schedule-preferences.json` (for
   `focusBlocks`, `maxMeetingsPerDay`, `minBufferMinutes`,
   `workingHours`, `timezone`, `blackoutPeriods`). Read
   `config/vips.json` to mark VIP attendees.
4. **Detect conflicts** — for each event or pair of events, flag:
   - **overbook** — two events that overlap in time.
   - **missing-buffer** — two events back-to-back with less than
     `minBufferMinutes` (default 15) between them.
   - **focus-block-clash** — an event lands inside a declared
     `focusBlock`.
   - **vip-unprotected** — a VIP-attended meeting is sandwiched or
     ends with <15 min buffer (the user should not walk in
     distracted).
   - **no-prep** — a meeting within 24 hours that has no
     `meetings/{date}/prep.md`.
5. **Count daily meeting load.** If any day exceeds
   `maxMeetingsPerDay`, surface an "over-capacity" warning (not a
   CalendarConflict row but a chat message).
6. **Write `calendar-conflicts.json`.** Upsert one row per conflict
   with `type`, `startAt`, `endAt`, `relatedEventIds`, `description`,
   `status: "open"`. Preserve `acknowledged` and `resolved` rows from
   prior runs — do not wipe history.
7. **Refresh `meetings-today.json`.** Project today's events into
   `MeetingProjection` rows. For each, look for
   `meetings/{YYYY-MM-DD}/prep.md` and set `prepReady` + `prepPath`
   accordingly. Mark `isVip: true` if any attendee matches
   `config/vips.json`.
8. **Summarize to the user.** "Reviewed {N} events across the next 7
   days. {X} overbooks, {Y} missing buffers, {Z} focus-block clashes,
   {V} VIP meetings unprotected, {P} meetings without prep." Offer
   fixes: "Want me to draft reschedule messages for the overbooks?" or
   "Prep the {P} meetings now?" — but don't act without approval.

## Outputs

- `calendar-conflicts.json` (upserted)
- `meetings-today.json` (refreshed)
