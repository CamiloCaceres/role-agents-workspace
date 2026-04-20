---
name: handoff-to-ae
description: Use when a meeting has been booked for a lead and the user asks to hand it off / prep the AE — assemble a handoff pack with prospect context, pain hypothesis, prior thread summary, objections raised, and pre-meeting talking points; writes to `leads/{slug}/handoff.md` and updates `meetings.json` handoffSent=true.
---

# Handoff To AE

## When to use

A `meetings.json` row has `status: "scheduled"` or `"confirmed"`
and `handoffSent: false`. The user asked me to "hand off to the
AE," "prep {ae-name} for the call," or "send the handoff pack."

## Steps

1. **Verify the lead is meeting-booked.** Read `leads.json` — the
   lead's status should be `"meeting-booked"`. If not, tell the
   user and stop.
2. **Gather context.** Read:
   - `leads/{slug}/lead.json` — dossier (firmographics, role
     context, pain hypotheses, ICP fit, sources).
   - `leads/{slug}/thread.json` — full back-and-forth.
   - Any `replies.json` rows for this lead (objection types,
     confidence).
   - The `meetings.json` row (when, channel, AE owner).
3. **Identify the 1–3 most load-bearing quotes** from the thread:
   where did the prospect name a pain, ask a pricing question,
   express urgency, or name an incumbent? These are gold for the
   AE — don't paraphrase, quote directly.
4. **Note objections already raised.** From `replies.json`
   `extractedData.objectionType`, plus anything I flagged in the
   thread. Give the AE a heads-up so they don't walk in cold.
5. **Write `leads/{slug}/handoff.md`** with these sections:
   ```markdown
   # Handoff — {Name}, {Title} at {Company}

   ## Prospect
   - Name, title, company, LinkedIn
   - ICP fit: GREEN/YELLOW/RED (why)

   ## Meeting
   - When, duration, channel
   - AE owner: {ae}

   ## Pain hypothesis
   - Top 1–2 hypotheses and the evidence behind them

   ## What they said (direct quotes)
   - "…" (date, channel)

   ## Objections to watch
   - type + the pattern I used (or would use) to address it

   ## Suggested first-5-min agenda
   - 1. Warm open (reference the trigger)
   - 2. Confirm pain ("when you said X, is that still sharp?")
   - 3. Hand off to their priorities — let them drive

   ## Open questions for the AE to ask
   - 3–5 pointed diagnostic questions tuned to this prospect
   ```
6. **Update `meetings.json`:** set `handoffSent: true` and
   `aeOwner` (if the user gave a name/email, record it).
7. **Update `leads.json`:** set `status: "handed-off"`.
8. **Tell the user** the pack is at `leads/{slug}/handoff.md` and
   ask if they want me to post it to Slack, email it to the AE,
   or just leave it on disk. Whichever they pick, I route via the
   connected channel — I do NOT hardcode tool slugs; `composio
   search` it first.

## Outputs

- `leads/{slug}/handoff.md`
- Updated `meetings.json` row
- Updated `leads.json` row
