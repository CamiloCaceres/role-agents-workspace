---
name: status-rollup
description: Use when the user asks "what's happening across teams" / "give me the weekly rollup" / "status across the org" OR on a scheduled weekly cadence — read each `initiatives/{slug}/init.json`, cross-reference `config/leadership-team.json` for domain mapping, synthesize into an exec-level rollup with wins / risks / asks per domain, and write to `status-rollups/{yyyy-mm-dd}/rollup.md`.
---

# Status Rollup

## When to use

- The user asks for the weekly rollup, "what's happening across
  teams," "status across the org," or "where are we."
- The configured exec meeting is within 24 hours and no rollup yet
  exists for the week.
- On a scheduled weekly cadence when one exists.

## Steps

1. **Read `config/leadership-team.json`.** If missing or incomplete,
   ask the user ONE question: *"I don't know your exec team yet —
   best: if an HRIS is connected via Composio, tell me and I'll pull
   the roster. Otherwise paste a short list with name · role ·
   domain."* Write and continue. Each member's `domain` is the bucket
   (engineering, sales, product, finance, people, ops, marketing,
   success) I'll group the rollup by.

2. **Read `config/strategic-priorities.json`.** Every initiative
   should trace to at least one priority theme. If absent, proceed
   anyway but flag in the rollup header that priorities aren't
   captured yet.

3. **Read `initiatives.json`** (index) and the matching
   `initiatives/{slug}/init.json` detail files. If no initiatives
   exist yet, ask the user ONE question: *"No initiatives tracked
   yet — best: if any Composio-connected initiative tracker has
   your team's projects, point me at the right workspace and I'll
   pull them. Otherwise paste the top 5-10 initiatives in flight
   with their owners."* Write per-initiative entries and continue.

4. **Pull fresh status per initiative.** For each one, decide whether
   the last `lastStatusAt` is stale (> 7 days for weekly rollup). If
   stale:
   - Check for updates via any Composio-connected initiative tracker
     or wiki (`composio search` to discover the right slug).
   - If nothing fresh shows up, drop a note into
     `initiatives/{slug}/init.json` → `risks` that the status is
     stale, and proceed with the most recent known state.

5. **Classify each initiative's status.** `on-track` /
   `at-risk` / `off-track` using whatever the owner declared (or the
   owner-implied signal from the source). Update `initiatives.json`
   and `initiatives/{slug}/init.json` (append to `history` with
   timestamp and optional note).

6. **Write per-initiative status briefs** to
   `initiatives/{slug}/status.md` (overwritten): wins this week,
   risks surfaced, asks for leadership, next week's focus.

7. **Assemble the exec rollup** into
   `status-rollups/{yyyy-mm-dd}/rollup.md`. Structure:

   ```markdown
   # Status rollup — {YYYY-MM-DD}

   ## TL;DR
   {3 bullets: the single biggest win, the top risk, the top ask}

   ## By domain
   ### {Domain 1} — {owner name}
   - **On-track:** {init title} — {one-line}
   - **At-risk:** {init title} — {one-line risk}
   - **Off-track:** {init title} — {one-line cause + proposed unblock}

   ### {Domain 2} — {owner name}
   ...

   ## Cross-team
   {initiatives with crossTeamDependencies or active bottlenecks}

   ## Asks of the CEO
   - {ask 1 — linked initiative}
   - {ask 2}
   ```

8. **Append a note to `bottlenecks.json`** if the rollup surfaces a
   recurring blocker — or simply mention that `identify-bottleneck`
   should run next.

9. **Summarize in chat.** One paragraph: how many on-track vs.
   at-risk vs. off-track, the top risk, the top ask. Offer to walk
   through the file or hand off to `draft-investor-update` if a
   monthly is due.

## Outputs

- `status-rollups/{yyyy-mm-dd}/rollup.md` (new)
- Updated `initiatives.json`
- Updated / new `initiatives/{slug}/init.json`
- Updated `initiatives/{slug}/status.md` (overwritten per initiative)
- Possibly updated `bottlenecks.json`
