---
name: draft-rejection
description: Use when the user marks a candidate as reject (e.g. "let's reject {candidate}" / "pass on X" / "move {candidate} to not-moving-forward") — produce a warm, specific, brand-preserving rejection that references something real from their dossier. Writes a draft; never sends. Never rejects without explicit user approval.
---

# Draft Rejection

## When to use

The user explicitly said to reject / pass on / close out a
candidate. I NEVER interpret an ambiguous signal as a reject — the
user must say it plainly. I draft; the user approves; the user (or
an approved automation) sends.

## Principles

- **Warmth + specificity preserves the brand.** A generic rejection
  costs nothing to write and permanently costs goodwill. A
  specific one keeps the door open for referrals and re-engagement.
- **Never misrepresent the reason.** If the reason is "different
  level than what we need," say that — don't hide behind "strong
  pool." If the reason is sensitive (e.g. scorecard fit on a
  must-have), be honest but kind.
- **Never disclose other candidates** by name or detail.

## Steps

1. **Verify the user's intent.** Read back the candidate name +
   role + their current stage to the user: "Reject {name} for
   {role} (currently at stage: {stage})?" Wait for confirmation.
2. **Load context.** Read:
   - `candidates/{slug}/candidate.json`
   - `candidates/{slug}/signals.md`
   - `candidates/{slug}/screen-notes.md` (if it exists — the
     reason to reject usually lives here)
   - `candidates/{slug}/thread.json`
   - `config/voice.md` (for voice)
   - `config/rejection-templates.md` (if it exists — library of
     approved patterns per scenario)
3. **Identify the scenario.** One of:
   - **scorecard-miss** — strong candidate but missing a
     must-have for THIS role.
   - **level-mismatch** — right skills, wrong level (too junior
     / too senior).
   - **timing** — great candidate, we'll pause hiring or the
     role just filled.
   - **fit-concerns** — soft signal from screen (communication,
     collaboration).
   - **late-stage** — final-round pass.
4. **Pick one specific thing to reference** from their dossier or
   thread — an artifact from `signals.md`, a strong answer from
   the screen, a thoughtful question from the thread. This is
   the "warmth" pin.
5. **Draft structure — email.**
   - Subject: ≤6 words, specific (e.g. "Update on your {role}
     application").
   - Body ≤150 words, 4 beats:
     1. Thanks with a specific reference to the above.
     2. The honest high-level reason (1 sentence — don't over-
        explain, don't generic-shield).
     3. A forward-looking note: I'll keep their info for future
        roles, or they'd be strong for {adjacent role} if the
        user confirms that's true.
     4. Short close. Mean it.
6. **Match voice.** Mirror `config/voice.md` — particularly the
   rejection sample if one exists. If the user's voice is warm,
   lean warmer; if direct, stay direct.
7. **Write** to `candidates/{slug}/rejection-draft.md`:
   ```markdown
   ## Scenario
   {scorecard-miss | level-mismatch | timing | fit-concerns | late-stage}

   ## Subject
   ...

   ## Body
   ...

   ## Specific reference used
   {artifact / quote / question — verbatim}
   ```
8. **Update `candidates.json`** row: `status: "rejection-drafted"`.
   Do NOT change `stage` — the user approves before I move anyone.
9. **Present to the user.** Never send. Ask: "Send this, soften
   it, or add a specific adjacent role to mention?"

## Outputs

- `candidates/{slug}/rejection-draft.md` (overwritten)
- Updated `candidates.json` row
