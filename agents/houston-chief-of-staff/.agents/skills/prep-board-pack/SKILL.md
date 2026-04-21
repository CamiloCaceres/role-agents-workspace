---
name: prep-board-pack
description: Use when a board meeting is 2+ weeks out (per `config/meeting-cadence.json`) OR the user says "prep the board pack" / "build the Q2 board pack" — assemble the standard sections (business update, metrics, OKRs, wins, challenges, asks) from connected data sources into `board-packs/{yyyy-qq}/board-pack.md`, and track readiness as an initiative so the dashboard surfaces it.
---

# Prep Board Pack

## When to use

- The user asks to prep, build, or draft the board pack for a named
  quarter.
- A board meeting in `config/meeting-cadence.json` is within 21 days
  and the corresponding `board-packs/{yyyy-qq}/board-pack.md` is
  missing or stale (> 14 days old).

## Steps

1. **Resolve the target quarter.** From chat ("Q2 2026") or from
   `config/meeting-cadence.json` → `board.nextAt`. Use `yyyy-qq`
   slug form (e.g. `2026-Q2`).

2. **Read `config/strategic-priorities.json`** for the themes the
   board heard about last quarter and should see progress on. If
   missing, ask the user ONE question: *"I don't know your top
   strategic priorities yet — best: if your strategy doc is in a
   Composio-connected wiki, share the link. Otherwise paste the top
   3 themes for the quarter."* Write and continue.

3. **Read `config/okrs.json`** and the latest `okr-tracker.json`
   snapshots. If the latest snapshot is older than 10 days, run
   `track-okr` first (or tell the user to).

4. **Gather wins and challenges per domain.** From the most recent
   `status-rollups/{yyyy-mm-dd}/rollup.md` files within the quarter,
   plus `initiatives/{slug}/status.md` where status changed to
   `on-track` (wins) or `off-track` (challenges) since the prior
   board meeting.

5. **Pull metrics.** For each metric the board expects:
   - If a connected metric source exists (any Composio-connected BI
     tool / metric layer / warehouse reached through the Data
     Analyst agent's data), pull current + prior-period.
   - If the user has a Data Analyst agent alongside, hand off the
     data pulls — don't re-build SQL here; cite the query.
   - Otherwise ask the user to paste the numbers and flag the
     section as `{SOURCE: pasted by {user}}`.

6. **Draft the pack** into `board-packs/{yyyy-qq}/board-pack.md`.
   Standard sections:

   ```markdown
   # Board pack — {yyyy-qq}

   ## 1. TL;DR (1 page)
   - {biggest win}
   - {biggest challenge}
   - {biggest ask of the board}

   ## 2. Business update
   {2-3 paragraphs in CEO voice — draws on config/voice.md}

   ## 3. Metrics
   | Metric | Last Q | This Q | Change | Source |
   {from the metric pulls}

   ## 4. OKRs
   {on-track / at-risk / off-track tally + narrative per objective}

   ## 5. Wins
   {bulleted, grouped by domain}

   ## 6. Challenges
   {bulleted, grouped by domain; include mitigation ask where helpful}

   ## 7. Asks of the board
   {what you want from them: intros, hiring help, strategic input}

   ## 8. Appendix
   {link to raw data / OKR tracker / recent rollups}
   ```

7. **Track readiness as an initiative.** Upsert an entry in
   `initiatives.json` with
   `{ slug: "board-pack-{yyyy-qq}", kind: "board-pack",
   title: "Board pack {yyyy-qq}", status, readiness, targetDate,
   linkedOkrIds: [], lastStatusAt }`. `readiness` is a rough 0-100:
   10 points for each section where content is drafted vs. `{TBD}`,
   20 points for each data-pull where the source is a real query
   vs. pasted, up to a cap of 100. The dashboard picks this up and
   displays the readiness %.

8. **Flag TBDs.** Every section that still has `{TBD}` gets a line
   in the chat summary with what's needed and the best modality to
   get it.

9. **Summarize in chat.** One paragraph: sections filled, readiness
   %, open TBDs, suggested next action.

## Outputs

- `board-packs/{yyyy-qq}/board-pack.md` (new or overwritten)
- Upserted `initiatives.json` entry (`kind: "board-pack"`,
  `readiness` set)
- Possibly updated `initiatives/{slug}/init.json` for the board-pack
  initiative
