---
name: draft-comms
description: Use when the CEO needs to send all-hands updates, team announcements, sensitive people comms (performance / comp / exits), or external correspondence — draft in CEO voice from `config/voice.md`, match tone to audience (team vs. investor vs. public), write to `comms-drafts/{slug}/draft.md`. Never sends.
---

# Draft Comms

## When to use

The user asks to draft any of:

- An **all-hands update** (weekly, monthly, or ad-hoc company-wide).
- A **team announcement** (new hire, org change, launch internal).
- A **sensitive people comm** (performance, comp, exit, reorg,
  layoff).
- An **external correspondence** (a tough customer escalation, a
  partner response, a board member message outside the pack cadence).

## Steps

1. **Classify the audience.** Ask once if ambiguous: *"Who's this
   going to — whole company, a specific team, one person, an
   investor, or external?"* This drives tone and hard-no checks.

2. **Read `config/voice.md`.** If missing or sparse, ask the user
   ONE targeted question: *"I need to match your voice. Best: if
   you've connected a work inbox via Composio, tell me and I'll
   pull 20-30 recent sent messages for a tight calibration.
   Otherwise paste 2-3 recent messages of yours — mix lengths
   (short chat note, longer email)."* Write 3-5 verbatim samples to
   `config/voice.md` and continue.

3. **Gather substance.** Depending on audience:
   - **All-hands:** read the latest `status-rollups/...rollup.md`
     + `okr-tracker.json` latest snapshot + `decisions.json`
     records with status `decided` in the last week. The all-hands
     narrates those in CEO voice.
   - **Team announcement:** capture the named fact (new hire,
     promotion, launch) + context + call-to-action.
   - **Sensitive people comm:** ask for the specific situation
     plainly. Never infer from side context.
   - **External:** ask for the specific ask / recipient relationship
     / goal.

4. **Draft** into `comms-drafts/{slug}/draft.md` with `slug`
   kebab-case from the subject (e.g. `q2-allhands-2026-04-21`,
   `reorg-comms-engineering`). Each draft is a standalone markdown
   file with:

   ```markdown
   # {Subject}

   **To:** {audience}
   **From:** {user name}
   **Suggested send time:** {when-appropriate hint}
   **Status:** DRAFT — not sent

   ---

   {the message body in CEO voice}

   ---

   ## Notes for the CEO
   - {tone choices I made and why}
   - {anything I avoided including and why}
   - {open questions / missing facts}
   ```

5. **Tone checks by audience:**
   - **All-hands:** direct, honest about challenges, specific on
     wins, invites questions.
   - **Team:** warmer, names people, concrete next step.
   - **Sensitive people:** neutral, factual, respectful. No
     corporate euphemisms. Include the practical details
     (effective date, support available, next touch).
   - **External:** measured. Confirm each claim is accurate — never
     promise roadmap, compensation, or partnership terms without
     explicit user approval on that specific line.

6. **Hard-no checks before saving:**
   - Never include a customer name in an all-hands without approval.
   - Never disclose comp numbers or individual performance in a
     group comm.
   - Never commit the user to a deadline, headcount, or dollar
     figure that isn't already public / confirmed.
   - Never impersonate the CEO in a send — this draft is for the
     CEO to review and send from their own account.

7. **Flag explicitly in chat.** End with: *"Drafted in
   `comms-drafts/{slug}/draft.md`. I will NOT send — review and
   send from your own channel. Anything I flagged in the Notes for
   the CEO section needs your call."*

## Outputs

- `comms-drafts/{slug}/draft.md` (new)
- Possibly updated `config/voice.md` (progressive capture)
