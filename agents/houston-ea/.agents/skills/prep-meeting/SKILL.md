---
name: prep-meeting
description: Use when a calendar event is within 24 hours and `meetings/{date}/prep.md` doesn't exist yet, OR the user explicitly asks to prep a named meeting — pull attendee context from any Composio-connected inbox (prior threads) and directory, assemble a one-page brief with attendees, context, suggested agenda, prior threads, and desired outcome.
---

# Prep Meeting

## When to use

A meeting projection in `meetings-today.json` has `prepReady: false`
and `startAt` is within 24 hours, OR the user named a meeting ("prep
my 10am with Acme"). I pull context, draft a brief, write it. The user
reads it before the meeting.

## Steps

1. **Resolve the event.** If the user named a meeting by title or
   time, match against `meetings-today.json`. If the user didn't
   specify, iterate all `meetings-today.json` rows with `prepReady:
   false` within the next 24 hours.
2. **Load event detail.** Read `externalEventId`, `title`, `startAt`,
   `attendees`, `location`, description (fetch via the
   Composio-connected calendar — `composio search` for the get-event
   slug; do NOT hardcode).
3. **Pull attendee context.** For each attendee email:
   - Use `composio search` + search-threads against the connected
     inbox for messages to/from that email in the last 90 days.
     Capture the 3 most recent threads: subject, date, 1-line
     summary.
   - If a directory provider is connected (company directory,
     LinkedIn-style), fetch role + company info.
4. **Check for prior EA artifacts.** Read `drafts/{threadId}/draft.md`
   for any inbox-queue rows matching these attendees — prior open
   conversations may be the reason for this meeting.
5. **Infer desired outcome.** From the event title, description, and
   prior thread subjects, propose a one-line desired outcome ("Close
   alignment on the contract language" / "Decide whether to advance
   the candidate"). If it's unclear, mark "unclear — ask the user."
6. **Draft suggested agenda.** 3–5 bullets, 30 minutes budgeted by
   default (adapt to actual meeting length). Anchor each bullet to
   specifics from prior threads or the event description — never
   invent topics.
7. **Write `meetings/{YYYY-MM-DD}/prep.md`** (date from `startAt` in
   user's timezone) with sections:
   ```markdown
   ## Meeting
   {title} — {startAt} ({duration})

   ## Attendees
   - {Name} ({Company}) — {role}; {relationship tag if VIP}

   ## Context
   {1–3 paragraphs: why this meeting exists, recent relevant events}

   ## Prior threads
   - {YYYY-MM-DD} — {subject} — {1-line summary}

   ## Suggested agenda
   - ...

   ## Desired outcome
   {one line}

   ## Open questions for the user
   - ...
   ```
8. **Update `meetings-today.json`** row: `prepReady: true`,
   `prepPath: "meetings/{YYYY-MM-DD}/prep.md"`, `updatedAt: now`.
9. **Tell the user.** "Prep ready for {title} at {time}. Want me to
   run the same for the other {N} meetings in the next 24 hours?"

## Outputs

- `meetings/{YYYY-MM-DD}/prep.md`
- Updated `meetings-today.json` row
