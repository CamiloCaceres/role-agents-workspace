---
name: draft-investor-update
description: Use when a monthly or quarterly investor update is due (per `config/meeting-cadence.json`) OR the user says "draft the investor update" / "write the monthly to investors" — assemble the narrative in CEO voice from recent initiative progress, metric movement, learnings, and asks; write to `board-packs/{yyyy-qq}/investor-update.md`. Never sends.
---

# Draft Investor Update

## When to use

- The user asks to draft the investor update, the monthly to
  investors, or "our quarterly."
- `config/meeting-cadence.json` → `investorUpdate.nextDueAt` is
  within 5 days.
- A significant milestone (hire, launch, funding, churn event) calls
  for an ad-hoc update.

## Steps

1. **Read `config/meeting-cadence.json`.** If `investorUpdate` is
   missing, ask the user ONE question: *"Are investor updates
   monthly or quarterly — and when's the next due? Paste a date, or
   tell me the cadence (e.g. 'first Friday of the month')."* Write
   and continue.

2. **Read `config/voice.md`.** If missing or sparse, ask the user
   ONE targeted question: *"I need to match your voice. Best: tell
   me you've connected a work inbox via Composio and I'll pull
   20-30 recent sent messages for a tight calibration. Otherwise
   drop one past investor update and one all-hands you've written
   so I can anchor the tone."* Write 3-5 verbatim samples into
   `config/voice.md`.

3. **Determine the period.** Monthly → last full month. Quarterly →
   last full quarter.

4. **Gather content sources:**
   - Latest `okr-tracker.json` snapshots + current `config/okrs.json`
     state for the period.
   - `status-rollups/{yyyy-mm-dd}/rollup.md` files within the
     period — extract wins and challenges.
   - `initiatives.json` — mention initiatives that shipped or had a
     major milestone.
   - Metric movement — same pattern as `prep-board-pack`: prefer a
     connected metric source via any Composio-connected BI /
     warehouse; if unavailable, ask the user to paste the top-line
     numbers.

5. **Draft in CEO voice** into
   `board-packs/{yyyy-qq}/investor-update.md`. Structure:

   ```markdown
   # {Company} — Investor update, {period}

   Hey all,

   **TL;DR:** {2-3 sentences — the shape of the month / quarter}

   ## Metrics
   {3-6 top-line metrics with period-over-period change}

   ## Wins
   {3-5 bullets — customer, product, hiring, fundraising}

   ## Challenges
   {2-3 bullets — honest, specific, with mitigation when possible}

   ## What I'm learning
   {1-2 paragraphs in your voice — this is the bit investors value most}

   ## Asks
   {specific intros / hiring help / feedback}

   — {userName}
   ```

6. **Self-check against hard nos:**
   - Never invent a quote, metric, or customer name. If a section
     lacks real content, mark it `{TBD — provide before sending}`.
   - Never commit to anything external ("we'll hit $X by Y") unless
     the user approved that line specifically.
   - Never expose sensitive people matters (churned customer name
     without permission, individual performance) — aggregate only.

7. **Flag for approval.** End the chat message with: *"Drafted in
   `board-packs/{yyyy-qq}/investor-update.md`. I will NOT send this
   — review and approve, then ship from your own inbox."*

8. **Offer a tighter version.** "Want me to cut this to the
   one-pager variant?" — if yes, produce a trimmed version in the
   same file under `## One-pager variant`.

## Outputs

- `board-packs/{yyyy-qq}/investor-update.md` (new or overwritten)
- Possibly updated `config/voice.md` (progressive capture)
- Possibly updated `config/meeting-cadence.json` (progressive
  capture)
