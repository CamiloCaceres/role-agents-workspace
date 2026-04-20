---
name: morning-briefing
description: Use when the user starts their day and asks for a rundown ("what's on my plate", "morning brief", "where do I start", "what do I need to do") — produces a ranked "start here" list combining breaching SLAs, overnight arrivals, follow-ups due today, and open bug patterns, writes `morning-brief.md` at agent root.
---

# Morning Briefing

## When to use

- User's first interaction of the day (time-heuristic: more than
  8h since the last chat turn).
- Explicit ask: "morning brief", "what's on my plate", "start of
  day", "where do I start".
- Dashboard is opened for the first time today.

Only one brief per day should be authoritative. This skill
**overwrites** `morning-brief.md` — it does not append.

## Steps

1. **Run `sla-watchdog`** internally to gather breached + at-risk
   conversations.
2. **Scan overnight arrivals** — rows in `conversations.json` whose
   `createdAt` is within the last 12h and whose `status` is still
   `open` (not yet drafted).
3. **Pull follow-ups due today** — filter `followups.json` where
   `status == "open"` and `dueAt` falls within today in the user's
   local timezone.
4. **Pull repeating bug patterns** — filter `bug-candidates.json`
   where `status != "dismissed"` AND
   `affectedCustomerSlugs.length >= 2`, ranked by severity + count.
5. **Rank the top ~10.** Priority ordering:
   breached SLA → P1 overnight → P2 overnight → follow-ups due
   today → repeat bug patterns → P3 overnight. Deduplicate — if a
   customer appears in multiple sections, mention them once with
   all reasons.
6. **Render `morning-brief.md`** with sections: Start Here (top 5
   combined), Breaching SLA, Overnight Arrivals, Due Today, Repeat
   Bugs. Each row references the conversation id so the user can
   say "review conversation <id>" in chat.
7. **Write atomically** to `morning-brief.md` at agent root.
   Overwrites yesterday's.
8. **Post a short summary in chat** — don't paste the whole brief;
   point to the file and highlight the single most urgent item.

## Outputs

- Overwrites `morning-brief.md` at agent root
- Posts a short summary to chat
