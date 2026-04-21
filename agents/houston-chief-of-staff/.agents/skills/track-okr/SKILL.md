---
name: track-okr
description: Use when the user asks about OKR status ("how are we doing on OKRs" / "refresh the OKRs" / "which KRs are off-track") OR on a weekly / quarterly cadence — refresh each key result's current value (pulling from any Composio-connected OKR tool where possible), append snapshots to `okr-tracker.json`, classify on-track / at-risk / off-track with reason codes, and surface root causes from linked initiatives.
---

# Track OKR

## When to use

- The user asks about OKR status, wants a refresh, or asks "what's
  off-track."
- On a weekly or quarterly cadence defined in
  `config/meeting-cadence.json`.
- Start of a new quarter — rebaseline.

## Steps

1. **Read `config/okrs.json`.** If missing or empty, ask the user
   ONE targeted question: *"I don't have your OKRs yet — best: if
   your OKR tool (any Composio-connected OKR / goals workspace) is
   linked, point me at it and I'll pull the current state.
   Otherwise paste or drop the OKR doc."* Write `config/okrs.json`
   and continue.

2. **For each objective, refresh each key result's current value.**
   Prefer, in order:
   - **Connected OKR tool via Composio** — discover the right slug
     with `composio search okr` (or `composio search` plus the
     tool category the user named during onboarding). Pull the
     latest `current` per KR.
   - **Connected metric source** — if a KR maps to a dashboard in a
     connected BI tool / metric layer, pull from there.
   - **Ask the owner** — if neither is connected, tell the user
     which owners to ping and stop short of inventing numbers.

3. **Snapshot to `okr-tracker.json`.** Append one record per
   objective (or per-KR if the owner's update was KR-scoped) with
   `{ id, objectiveId, date, keyResults: [{ id, value }], state,
   createdAt }`. Date is today (YYYY-MM-DD).

4. **Classify each KR against its target**:
   - `on-track` — `current / target >= expected-for-this-point-in-period`.
     Expected attainment is linear across the period unless the user
     declared otherwise (captured once, then persisted in
     `config/okrs.json`).
   - `at-risk` — within 20 pct points of expected but below.
   - `off-track` — more than 20 pct points below expected.

5. **Roll KR states up to objective state.** If any KR is
   `off-track`, objective is `off-track`. If any is `at-risk` and
   none `off-track`, objective is `at-risk`. Otherwise `on-track`.
   Update `config/okrs.json` with the new state plus fresh
   `current` values.

6. **Attach reason codes from linked initiatives.** For each KR
   off-track or at-risk, scan `initiatives.json` for initiatives
   where `linkedOkrIds` includes the objective id. If any are
   themselves at-risk or off-track, they're the likely root cause.
   Note this in `initiatives/{slug}/init.json` → `risks` and in a
   short reason column on the KR.

7. **Report in chat.** Structure:

   ```
   OKR refresh — {YYYY-MM-DD}

   On-track: {N}  |  At-risk: {N}  |  Off-track: {N}

   Off-track:
   - {objective} — {KR}: {current}/{target} {unit} ({% attained}).
     Likely cause: {linked initiative slug}.

   At-risk:
   - ...

   (Full history in okr-tracker.json; dashboard has the live grid.)
   ```

8. **Handoff hint.** If anything flipped to off-track this cycle,
   offer to draft a nudge comm to the objective owner via
   `draft-comms`.

## Outputs

- Appended `okr-tracker.json`
- Updated `config/okrs.json` (current values + state per objective)
- Possibly updated `initiatives/{slug}/init.json` (risk notes)
