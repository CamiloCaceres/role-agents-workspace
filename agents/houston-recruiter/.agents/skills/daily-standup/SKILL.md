---
name: daily-standup
description: Use when the user opens the app and asks for a brief / standup / morning rundown / "what's on my plate" — produce a ranked action plan: interviews today, replies to classify, at-risk candidates (gone quiet >5 days), open reqs without enough pipeline, and any homogeneous-shortlist flags. Writes the brief to `daily-brief.md`.
---

# Daily Standup

## When to use

The user opened the app and asked for a brief, standup, morning
rundown, "what's on my plate," or "what did I do yesterday." A good
daily first-run when the dashboard is showing mixed signals and the
user wants a ranked plan of attack.

## Steps

1. **Aggregate the data.** Read:
   - `interviews.json` — filter `scheduledAt` today + tomorrow,
     status in `["scheduled", "confirmed"]`.
   - `candidates.json` — filter `status === "replied"` or
     `status === "needs-info"` — replies waiting on me.
   - `candidates.json` — filter `lastTouchedAt` > 5 days ago AND
     `stage !== "offer"` — stalled sweep candidates.
   - `roles.json` — for each `status === "open"` role, cross-ref
     `pipelines.json` for sourced-stage counts. Flag any role
     with `<5 sourced` as "under-pipelined."
   - `candidates.json` grouped by role — for each role, check
     the top 10 active candidates for a homogeneous-shortlist
     signal (same prior employer, same alma mater, same narrow
     geography). Flag any role where the signal is too tight.
2. **Rank today's priorities.** Strict order:
   1. Interviews today — the single thing that can't slip.
   2. Replies to classify / respond to — high-leverage minutes.
   3. Open reqs that are under-pipelined — top-of-funnel is the
      highest-compounding investment.
   4. Stalled candidates — quick revives before they cool
      further.
   5. Homogeneous-shortlist flags — a DEI and hiring-quality
      risk to raise early, not after the panel.
3. **Surface blockers loud.** If any interview today has no
   hiring-manager pack prepped (`hiringManagerPackSentAt` null
   AND round > 1), flag it at the top — that's the thing that
   can't slip.
4. **Write the brief** to `daily-brief.md` (overwriting):
   ```markdown
   # Daily standup — {YYYY-MM-DD}

   ## Your first move
   {one-line — the single highest-leverage thing to do right now}

   ## Interviews today ({N})
   - {relative-time} — {Name} ({Role}), round {n}, with
     {interviewer}, prep: {ready|MISSING}
   - ...

   ## Replies to handle ({N})
   - {Name} ({Role}) — {classification}, {intent}% intent
   - ...

   ## Open reqs — pipeline status
   - {Role} — sourced: {n}, screened: {n}, interview: {n},
     offer: {n} {under-pipelined? flag}
   - ...

   ## Stalled candidates ({N})
   - {Name} ({Role}) — last touched {days}d ago, stage {stage}
   - ...

   ## Flags
   - Homogeneous-shortlist risk on {Role}: {why}
   - ...

   ## Yesterday's activity
   - Candidates sourced: {N}
   - Outreach drafts written: {N}
   - Screens completed: {N}
   - Interviews scheduled: {N}
   - Offers drafted: {N}
   ```
5. **Update `at-risk.json`** with the current stalled candidates
   so the dashboard renders the same list:
   `[{ slug, name, role, roleId, stage, lastTouchedAt,
   daysSinceTouch }]`.
6. **Tell the user the one thing to do first** — don't dump the
   whole brief in chat, just the top line plus "full brief is in
   `daily-brief.md` — want me to walk you through it?"

## Outputs

- `daily-brief.md` (overwritten)
- `at-risk.json` (overwritten with current stalled candidates)
