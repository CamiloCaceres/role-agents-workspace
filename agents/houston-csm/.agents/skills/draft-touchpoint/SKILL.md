---
name: draft-touchpoint
description: Use when the user asks to reach out to a customer — check-in, QBR follow-up, renewal reminder, milestone congrats, exec outreach, or save outreach — produces a voice-matched draft in `accounts/{slug}/touchpoints.md` under a dated heading. Never sends.
---

# Draft Touchpoint

## When to use

The user asked for one of these occasion types:

- `check-in` — routine relationship touch
- `qbr-followup` — after a QBR, summarize + asks
- `renewal-reminder` — 30/60/90-day nudge ahead of `renewalAt`
- `milestone-congrats` — champion promoted, round raised, product
  milestone hit
- `exec-outreach` — exec-to-exec, usually tied to a sev1 at-risk
  flag or a stuck renewal
- `save-outreach` — response to a churn signal, offering remedy

If the occasion type isn't obvious from the ask, infer it and
confirm in chat before drafting. Never sends — the user sends.

## Steps

1. **Read `config/voice.md`.** If missing, ask the user ONE
   targeted question: *"I need to match your voice — best: if your
   inbox is connected via Composio, tell me and I'll pull 20-30
   recent sent messages for a tight voice match. Otherwise paste
   2-3 emails you've sent to customers, or drop a .txt/.eml file."*
   If the user picks the connected-inbox path, run `composio search
   <inbox>` and pull samples. Write `config/voice.md` and continue.
2. **Resolve the account + occasion.** Read
   `accounts/{slug}/account.json` for stakeholders (pick the
   champion or named recipient), contract (for renewal-reminder),
   and notes. Read `accounts/{slug}/touchpoints.md` for prior
   touches so you don't repeat the same opener.
3. **Pull the occasion context.**
   - `qbr-followup` → read `accounts/{slug}/qbr-pack.md` for the
     wins, asks, and next steps to reinforce.
   - `renewal-reminder` → read `accounts/{slug}/renewal-risk.md`
     (if present) for angles to emphasize; pull `renewalAt`.
   - `save-outreach` → read `at-risk.json` entry for cause + play.
   - `milestone-congrats` → need a specific trigger the user named
     or that surfaced in signals (champion promoted, etc).
4. **Draft in the user's voice.** Match greeting style, sign-off,
   sentence length, formality, use of em-dashes from
   `config/voice.md`. Keep it short by default — CS touches lose
   power past ~150 words unless it's a QBR recap. Never promise a
   roadmap date, pricing, or contract term (CLAUDE.md rule).
5. **Never disclose internal scoring.** Don't tell the customer
   they're "yellow" or "at-risk." Frame as concern for their
   outcomes, not our risk dashboard.
6. **Append to `accounts/{slug}/touchpoints.md`** under a dated
   heading: `## {YYYY-MM-DD} — {occasion} — DRAFT`. Include the
   recipient name/email, subject line, and body. Mark `DRAFT` in
   the heading until the user confirms sent (they can say "sent the
   {date} touchpoint" to flip it). Creates the file on first touch.
7. **Update adjacent records if the occasion demands.**
   - `save-outreach` → flip the matching `at-risk.json` entry to
     `status: "in-progress"` (the CLAUDE.md rule).
   - `renewal-reminder` → flip the matching `renewals.json` entry
     to `status: "in-motion"`.
8. **Present the draft in chat.** End with: *"Send, tweak, or try a
   different angle?"* Never sends.

## Outputs

- `accounts/{slug}/touchpoints.md` (appended, dated heading, DRAFT
  marker)
- `config/voice.md` (created via progressive capture on first run)
- `at-risk.json` (updated to `in-progress` for save-outreach)
- `renewals.json` (updated to `in-motion` for renewal-reminder)
