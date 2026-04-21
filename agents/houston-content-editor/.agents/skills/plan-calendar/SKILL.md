---
name: plan-calendar
description: Use when the user asks to fill or refresh the content calendar — "plan the next 6 weeks," "propose a slate," "what should I write this quarter" — propose 4-8 weeks of pieces mapped to pillars, buyer stage, seasonal anchors, and SEO clusters. Scores each piece with a 4-factor rubric and writes to `calendar.json`. Never auto-schedules without approval.
---

# Plan Calendar

## When to use

- The user asks for a content plan for a named window ("next 6
  weeks," "Q2," "the rest of the month").
- The calendar has dropped below 2 weeks of filled slots and the
  user opens the app.
- The user says "refresh the calendar" after a strategy change.

## Inputs expected

- **Required:** `config/content-pillars.json`, `config/cadence.json`.
- **Optional:** `config/seo-keywords.json`, `published.json`,
  `refresh-queue.json`, `win-loss` or customer insights from
  connected sources via Composio.

## Steps

1. **Resolve the window.** Parse "next 4 weeks," "Q2," specific
   dates. Default: `lookAheadWeeks` from `config/cadence.json` (6).
2. **Load pillars + cadence.** Read `config/content-pillars.json`
   and `config/cadence.json`. If either is missing or empty, ask:
   "Which topic pillars should this calendar cover? Name 3-5 with
   one line each. *Paste, or drop your content strategy doc.*"
   Write to `config/content-pillars.json`. Similarly for cadence:
   "How often do you publish and on which channels? *Paste, or
   point me at your editorial calendar if it's in a connected tool.*"
3. **Load current signals.** Read:
   - `published.json` — what's live. Use to AVOID thematic
     repetition in the coming window.
   - `refresh-queue.json` — if any high-priority refreshes exist,
     they earn a calendar slot.
   - `config/seo-keywords.json` — clusters still under-covered.
4. **Generate candidate items** per pillar, biased toward the
   pillar's `percentOfCalendar`. For each candidate, write:
   - `title` (working, not final)
   - `pillarSlug`
   - `channel` (rotate from cadence)
   - `buyerStage`
   - `type` (searchable | shareable | both)
   - `primaryKeyword` (when searchable — pull from
     `config/seo-keywords.json` if present, else note "TBD —
     needs keyword research")
   - `seasonalAnchor` (when relevant)
5. **Score each candidate** with the 4-factor rubric (0-100):
   - Customer impact (40): how much does this move a real reader's
     needle? Evidence: VoC themes, support questions, repeated
     pillar-matched pain points.
   - Company/message fit (30): advances our positioning or a live
     pillar bet?
   - Search opportunity (20): opportunity score (volume ×
     relevance ÷ difficulty) if searchable; distribution reach if
     shareable.
   - Resources (10): can we produce this with what we have?
     Original data → high, easy recap → medium, original research
     → low unless scheduled early.
   Sort by score. Keep top N = total slots in the window.
6. **Distribute across the window.** Honor `cadence.weeklySchedule`
   (day + channel). When a day's channel has no scored candidate,
   downgrade to a lighter piece (newsletter curation, social-only
   recap) rather than leaving empty.
7. **Write rows to `calendar.json`.** Upsert — if a slug already
   exists for the planned date, keep the existing row's status and
   notes. Each row:
   `{ id, slug, title, pillarSlug, channel, buyerStage, status:
   "idea", plannedDate, keyword?, tags, score, createdAt,
   updatedAt }`.
8. **Draft the proposal message** to the user. Structure:
   ```
   # Calendar proposal — {window}

   ## By week
   - Week of {Mon date}
     - {channel} · {buyerStage} · {title} (score {n}, pillar {slug})
     - ...
   - ...

   ## By pillar
   - {pillar} — {N} pieces, {% of slate}
   - ...

   ## Gaps / asks
   - {e.g. "Pillar X has 0 searchable pieces in this window — no
     keyword clusters captured yet. Want me to run
     `create-seo-brief` on a candidate so we can seed one?"}
   - {e.g. "{seasonal anchor} isn't in cadence.seasonalAnchors —
     should I add it?"}
   ```
9. **Do NOT auto-schedule external channels.** Write to
   `calendar.json` only; do not post or publish via any connected
   tool.
10. **Follow-up menu** at the end of the message:
    - "Approve and lock — flip all items to `briefed` and I'll
      start `create-seo-brief` on the first searchable one."
    - "Swap out items X, Y — propose replacements."
    - "Re-weight pillars — change the % split."
    - "Add seasonal anchor — {name, date}."

## Outputs

- Upserted rows in `calendar.json`
- Possible writes to `config/content-pillars.json`,
  `config/cadence.json` (progressive capture)
- Possible write to `config/seo-keywords.json` (new clusters noted)
