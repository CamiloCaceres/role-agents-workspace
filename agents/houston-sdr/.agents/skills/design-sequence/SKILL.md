---
name: design-sequence
description: Use when the user kicks off a new campaign or asks for a cadence (e.g. "design a sequence for enterprise CTOs" or "build a 5-touch sequence for the SaaS ICP") — propose a multi-touch multi-channel cadence with timing, channel mix, and per-step intent. Writes the sequence definition; does NOT enroll leads automatically.
---

# Design Sequence

## When to use

The user wants a new cadence for a specific ICP slice. I propose the
shape (steps, timing, channel mix, intent per step) and write the
sequence definition. I do NOT enroll leads — enrollment is a separate,
explicit user action.

## Steps

1. **Clarify audience.** If the user didn't name one, default to their
   primary ICP from `config/icp.json`. Confirm with the user in one
   sentence: "Designing for {audience} — correct?" If `config/icp.json`
   is missing, ask ONE question: "Who's this sequence for? (industry,
   size, role)" and continue.
2. **Check the library.** Read `config/sequences-library.json`. If a
   saved template matches the audience, offer it to the user as a
   starting point: "You have a saved '{template.name}' that targets
   similar people — adapt it or build fresh?"
3. **Propose a cadence.** Canonical 5-step shape (adjust for
   audience):
   - Day 1 · email · intent: open · specific trigger hook + 1 pain
     + soft CTA
   - Day 1 · linkedin (connect note) · intent: open · no pitch,
     genuine reason
   - Day 3 · email · intent: value-add · one useful artifact
     (benchmark, case study, short insight) with no ask
   - Day 5 · linkedin (InMail or DM if connected) · intent:
     pattern-break · different angle, different pain
   - Day 8 · email · intent: value-add · bump referencing a recent
     company signal
   - Day 12 · email · intent: breakup · "Should I close the loop or
     worth a 10-min chat?"
   Adjust: for executives, lighten the frequency (every 3–4 days).
   For technical buyers, lean content-heavy on the value-add touches.
   For SMB, compress the timeline (2/3/5/8).
4. **Per-step detail.** For each step write:
   `{ dayOffset, channel, intent, templateSnippet, conditions? }`.
   The `templateSnippet` is NOT final copy — it's a 1–2 line
   prompt/angle that `draft-outreach` will personalize per lead.
5. **Name the sequence.** Short, audience-descriptive — e.g.
   "ent-cto-platform-modernization" or "series-a-vp-eng-hiring".
6. **Write the index row.** Upsert into `sequences.json` with
   `name`, `audience`, `stepCount`, `channelMix`, `status: "active"`,
   `leadCount: 0`.
7. **Write the full definition** to
   `sequences/{id}/sequence.json` with the steps array.
8. **Offer to save as a template.** Ask the user: "Save this cadence
   to your reusable library?" If yes, append a slim template to
   `config/sequences-library.json`.
9. **Tell the user how to enroll.** "Ask me: 'enroll [lead-name(s)]
   in {sequence-name}' when you're ready to start — I won't enroll
   anyone without that explicit instruction."

## Outputs

- Upserted row in `sequences.json`
- `sequences/{id}/sequence.json`
- Optional append to `config/sequences-library.json` (with user
  approval)
