---
name: handoff-to-ae
description: Use when an `expansion-pipeline.json` entry is stage `qualified` AND the user says "hand off to AE {name}" OR a renewal needs an expansion motion and the user asks for a handoff pack — packs account state, expansion rationale, stakeholders, pricing anchor, risks into `accounts/{slug}/ae-handoff.md` and flips the pipeline entry to `handed-off`. Never reaches out to the AE itself.
---

# Hand Off to AE

## When to use

- An `expansion-pipeline.json` entry is `stage: "qualified"` and the
  user explicitly says "hand off to AE {name}" / "pack up
  {account} for {AE}."
- A renewal analysis suggests an expansion motion and the user asks
  for a handoff pack.

This skill writes a pack for the USER to share with their AE. It
never sends anything to the AE directly — the CSM-to-AE relationship
stays human. The CLAUDE.md rule: CSM doesn't close expansions.

## Steps

1. **Verify the trigger.** Find the entry in
   `expansion-pipeline.json`. If it's still at `stage: "idea"`,
   stop and tell the user: *"This idea is still at `idea` — confirm
   customer interest or budget in chat first by saying 'qualify
   {account}', then I'll pack the handoff."* Never promote to
   `qualified` here; `spot-expansion` tracks the idea, the user
   confirms qualification explicitly.
2. **Read account context.** Read
   `accounts/{slug}/account.json` for stakeholders (flag
   `economic-buyer`, `champion`, any `blocker`), firmographics,
   contract. Read `accounts/{slug}/health.json` for a quick
   snapshot the AE can cite. Read `accounts/{slug}/expansion-
   ideas.md` for the reasoning history.
3. **Pricing anchor — progressive capture.** If the user has
   already stated a pricing anchor (in chat, in the pipeline
   entry's `notes`, or in the account notes), use it. Otherwise ask
   ONE targeted question: *"What pricing anchor should the AE start
   from? (per-seat, package, usage tier, or 'AE decides' — your
   call.)"* Capture the answer into the pipeline entry's `notes`.
   Never invent a number.
4. **Surface risks honestly.** Pull from `at-risk.json` (any open
   entries for this slug), `renewal-risk.md` (if present),
   stakeholder `blocker` entries, and any signal in
   `health.json` breakdown with `status: "red"`. The AE needs the
   whole picture — hiding risks to make the handoff look cleaner
   burns trust on both sides.
5. **Write `accounts/{slug}/ae-handoff.md`.** Structure:
   ```markdown
   # AE Handoff — {accountName}

   ## TL;DR
   {one-paragraph pitch: who, what expansion, why now, anchor}

   ## Account snapshot
   - ARR · Tier · Renewal · Health · CSM of record

   ## Expansion rationale
   - Title, signal(s) that fired, estimated uplift, readiness
     evidence

   ## Stakeholders
   - Champion · Economic buyer · Blockers (if any) · other
     influencers — with last-engaged dates

   ## Pricing anchor
   {what the user said, verbatim}

   ## Risks + watch-outs
   {bulleted, honest}

   ## Proposed next steps
   {optional; AE decides the actual motion}
   ```
   Overwrite any prior pack for this slug.
6. **Update `expansion-pipeline.json`.** Set `stage: "handed-off"`,
   `aeOwner: "{AE name the user gave}"`, `handoffSentAt: <ISO-8601
   now>`, bump `updatedAt`. Never touch other pipeline entries.
7. **Tell the user.** *"Pack written to
   `accounts/{slug}/ae-handoff.md`. Share it with {AE} however you
   normally do — I won't reach out directly. Want me to draft a
   Slack/email intro using your voice?"* (Clean handoff to
   `draft-touchpoint` with occasion `exec-outreach` if user says
   yes.)

## Outputs

- `accounts/{slug}/ae-handoff.md` (overwritten)
- `expansion-pipeline.json` (entry updated to `stage: "handed-off"`,
  `aeOwner`, `handoffSentAt`, `updatedAt`)
