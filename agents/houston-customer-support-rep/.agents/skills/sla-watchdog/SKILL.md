---
name: sla-watchdog
description: Use when reviewing open conversations for response-time risk, either on demand ("what's breaching SLA?") or as part of `morning-briefing` — scans `conversations.json` for items where `sla.firstReplyDueAt` or `sla.nextUpdateDueAt` is within 2 hours or already breached, flips `sla.breached` on newly-breached rows, and returns a ranked list worst-breach-first.
---

# SLA Watchdog

## When to use

- User asks "what's breaching?" / "anything on fire?" / "SLA check".
- Called by `morning-briefing`.
- Called periodically if the user has scheduled a check.
- After a batch of `triage-incoming` runs, to confirm nothing landed
  P1 that should have been P2 or vice versa.

## Steps

1. **Load `conversations.json`.** Filter to rows where `status` in
   `{"open", "waiting_founder"}`.
2. **For each row, compute time-to-due.**
   - Use the earlier of `sla.firstReplyDueAt` and
     `sla.nextUpdateDueAt` if both are set.
   - If `now >= dueAt` → classify `breached` with magnitude `now -
     dueAt` (hours).
   - If `dueAt - now <= 2h` → classify `at-risk`.
   - Otherwise skip.
3. **Flip `sla.breached = true`** on rows that newly breached and
   write back atomically to `conversations.json`. This is the only
   field this skill writes.
4. **Rank:** breached first, ordered by how long they've been
   breached (longest first); then at-risk ordered by soonest due.
5. **Return the ranked list** to chat with: customer name, subject,
   priority, breach magnitude or time remaining, and a `Review
   conversation <id>` hint for each.

## Outputs

- Returns ranked SLA list to chat
- Flips `sla.breached = true` on newly-breached rows in
  `conversations.json` (atomic write)
