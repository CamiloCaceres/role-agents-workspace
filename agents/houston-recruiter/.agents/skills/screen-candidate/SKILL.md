---
name: screen-candidate
description: Use when a recruiter screen is about to happen for a candidate or raw screen notes exist — pre-screen, generate a structured question set tied to the scorecard; post-screen, convert freeform notes into scorecard ratings with evidence quotes and update the candidate's stage.
---

# Screen Candidate

## When to use

Two triggers:
- **Pre-screen:** user says "I'm about to screen {candidate}" or
  "give me questions for the screen with X." I produce a question
  set.
- **Post-screen:** user says "here are my notes from the screen
  with {candidate}" or pastes raw notes. I convert notes into
  scorecard ratings.

## Principles

- **Structured interviewing beats vibes.** Tie every question to a
  specific scorecard item so ratings are grounded.
- **Evidence over impression.** Every rating cites a direct quote
  or observed behavior.
- **Never fabricate evidence.** If the notes don't support a rating,
  mark it `not-assessed`.

## Steps

### Pre-screen path

1. **Load context.** Read `candidates/{slug}/candidate.json` and
   the role's `roles/{roleSlug}/scorecard.json` (via
   `candidate.roleId`). If either is missing, bail and tell the
   user what's needed.
2. **Draft questions grouped by scorecard item.** For each
   must-have, write 2 behavioral questions ("Tell me about a time
   when…" or "Walk me through a project where…"). For top 2 nice-
   to-haves, write 1 question each. Close with "What's prompting
   you to explore a move right now?" to sharpen openness-to-move.
3. **Include probe follow-ups.** For each primary question, list
   2 follow-ups to dig past the rehearsed answer (e.g. "What went
   wrong?" "Who disagreed with you?" "What would you do
   differently?").
4. **Write** to `candidates/{slug}/screen-notes.md` with these
   sections:
   ```markdown
   # Screen questions — {candidate name}, {role title}
   ## Scorecard map
   | Question | Must-have / nice-to-have |
   |---|---|
   ## Questions
   ### Q1 (must-have: {label})
   **Primary:** ...
   **Follow-ups:** ...
   ### Q2 ...
   ## Openness probe
   ...
   ```
5. **Tell the user** the question set is ready and to paste their
   notes back after the call.

### Post-screen path

1. **Read existing `candidates/{slug}/screen-notes.md`** (if the
   pre-screen path ran) and the scorecard.
2. **Parse the user's raw notes.** Map each must-have /
   nice-to-have to:
   - `rating`: `strong-yes | yes | mixed | no | strong-no | not-assessed`
   - `evidence`: a direct quote or observed behavior from the
     notes (verbatim, wrap in quotes).
3. **Overall verdict.** Compute a 1-line overall verdict:
   `advance | hold | pass`. If advance, name the next stage
   (technical screen, hiring-manager round).
4. **Overwrite** `candidates/{slug}/screen-notes.md`:
   ```markdown
   # Screen — {candidate name}, {role title}
   Screened on {ISO-8601}, by {screener-name}.

   ## Overall verdict
   {advance|hold|pass} — {one-line rationale}

   ## Must-haves
   - {label}: {rating} — "{quote}"
   - ...

   ## Nice-to-haves
   - ...

   ## Openness to move
   {quote or summary}

   ## Flags / concerns
   - ...

   ## Suggested next step
   {e.g. "Schedule hiring-manager round with {pm-name}."}
   ```
5. **Update `candidates.json`** row: set `stage: "screened"`,
   `lastTouchedAt: now`, add `screenVerdict` to the row for quick
   filtering.
6. **Update `pipelines.json`** counts for the role.
7. **Tell the user** the verdict and offer the next step: if
   `advance`, tee up `schedule-interview`; if `pass`, note that I
   won't reject until they explicitly approve via `draft-rejection`.

## Outputs

- `candidates/{slug}/screen-notes.md` (overwritten each call)
- Updated `candidates.json` row
- Updated `pipelines.json` entry
