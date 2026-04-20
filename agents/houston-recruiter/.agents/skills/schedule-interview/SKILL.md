---
name: schedule-interview
description: Use when a candidate confirms interest and an interview slot is needed — coordinate candidate + interviewer availability via any Composio-connected calendar, draft prep materials (company overview, process map, interviewer bios), and create the interview record. Approval gate before invites are sent.
---

# Schedule Interview

## When to use

A candidate said "happy to chat" / gave availability / agreed to the
next round, and the user said "get them on the calendar" or a
`classify-candidate-reply` result surfaced `scheduling`. I coordinate
times, draft prep materials, and record the interview — but the user
approves before any invite is sent.

## Steps

1. **Verify the green light.** Read
   `candidates/{slug}/candidate.json` and the latest classification.
   Confirm the candidate is at a stage where an interview fits
   (`screened` → hiring-manager round, `interested` → recruiter
   screen). If not, ask the user to confirm before proceeding.
2. **Determine the round.** Check existing
   `candidates/{slug}/interview-*.json` files — if none exist,
   this is `interview-1.json` (recruiter screen). Otherwise
   increment.
3. **Resolve the calendar connection.** Run `composio search` for
   the connected calendar slug (availability fetch + event
   create). Do NOT hardcode. If no calendar is connected, tell
   the user which app to link and stop.
4. **Pick the interviewer.** For round 1, default to the user.
   For hiring-manager rounds, read the role scorecard
   (`roles/{roleSlug}/scorecard.json`) for
   `hiringManager.email`. If the user wants a panel, ask who to
   include.
5. **Fetch free/busy.** Pull availability for the user +
   interviewer for the next 5 business days. Default slot 45
   minutes for recruiter screen, 60 minutes for hiring-manager
   round. Prefer mid-morning (10–11:30) and early afternoon
   (2–4) in the interviewer's timezone. Avoid Mon AM and Fri PM
   by default.
6. **Pick 3 candidate-facing time options.** Spread across days.
   If the candidate mentioned a timezone, convert and label both
   sides.
7. **Draft the scheduling reply in voice.** Read `config/voice.md`.
   Pattern: 1-line thanks → 3 proposed times (bulleted, with
   timezones) → fallback booking link if the user has one.
   ≤100 words. Save to
   `candidates/{slug}/outreach-draft.md` (overwriting) and append
   a staged outbound row to `candidates/{slug}/thread.json`.
8. **Draft the candidate prep packet.** Write
   `candidates/{slug}/interview-{n}-prep.md` with:
   - `## About us` — 3-paragraph company overview from
     `config/profile.json` + any `roles/{roleSlug}/brief.md`
     "about us" section.
   - `## What to expect` — process map (rounds remaining,
     rough timeline, decision criteria in plain English).
   - `## Who you'll meet` — interviewer bios (name, title,
     1-line background, 1-line why-they-matter).
   - `## Suggested prep` — 2–3 artifacts to skim (product page,
     a blog post, a demo video) if the user has them.
9. **APPROVAL GATE.** Show the user: (a) the scheduling reply
   draft, (b) the prep packet, (c) which calendar/invite I'd
   create. Do NOT send invites. Wait for the user to approve
   BEFORE I dispatch the invite through the connected calendar.
10. **On user approval:** create the calendar event via the
    connected slug. On success, write
    `candidates/{slug}/interview-{n}.json`:
    ```ts
    interface Interview {
      id: string;
      candidateSlug: string;
      roleId: string;
      round: number;
      scheduledAt: string;    // ISO-8601
      durationMinutes: number;
      channel: "video" | "phone" | "in-person";
      interviewer: string;    // name or email
      interviewers?: string[];
      status: "scheduled" | "confirmed" | "held" | "no-show" | "cancelled";
      prepPacketPath: string;
      externalCalendarEventId?: string;
      createdAt: string;
      updatedAt: string;
    }
    ```
11. **Upsert `interviews.json`** with the same fields.
12. **Update `candidates.json`** row: `stage: "interview"`,
    `lastTouchedAt: now`, `nextActionAt: scheduledAt`.
13. **Update `pipelines.json`** counts for the role.
14. **Tell the user** the interview is on the calendar and where
    the prep packet lives.

## Outputs

- `candidates/{slug}/interview-{n}.json`
- `candidates/{slug}/interview-{n}-prep.md`
- `candidates/{slug}/outreach-draft.md` (the scheduling reply)
- Appended row in `candidates/{slug}/thread.json`
- Upserted row in `interviews.json`
- Updated `candidates.json` row
- Updated `pipelines.json` entry
