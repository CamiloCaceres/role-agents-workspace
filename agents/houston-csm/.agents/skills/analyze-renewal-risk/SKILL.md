---
name: analyze-renewal-risk
description: Use when a renewal lands inside the 90-day window (from `accounts.json.renewalAt`) OR the user says "{account} renewal status" / "analyze renewal for {account}" — surface per-account risk factors (usage trend, champion tenure, exec engagement, support-ticket heat, stakeholder changes), propose plays ranked by effort, and upsert `renewals.json` + `accounts/{slug}/renewal-risk.md`.
---

# Analyze Renewal Risk

## When to use

- A renewal is inside 90 days (default window — user can override by
  saying "analyze renewals in the next 60 days" or "120 days").
  `daily-standup` surfaces these.
- The user explicitly asks about a named account's renewal.
- A renewal just shifted tier in `compute-health` and the user wants
  a fresh risk read.

## Steps

1. **Resolve the account(s).** Read `accounts.json`. If the user
   named one, scope to it. Otherwise filter to rows where
   `renewalAt` is within the 90-day default window.
2. **Read account context.** For each account, read
   `accounts/{slug}/account.json` (stakeholders with relationships,
   contract startedAt / termMonths / autoRenew, tier, arr).
3. **Read recent health.** Read `accounts/{slug}/health.json` — look
   at `trend` and the breakdown notes. A `down` trend in the renewal
   window is a material risk factor.
4. **Assess risk factors.** Surface concrete items, each one a
   one-liner backed by data:
   - **Usage trend** — from health breakdown, is the core usage
     signal trending down?
   - **Champion tenure / changes** — from
     `accounts/{slug}/account.json.stakeholders`, is the champion
     still there? Was a champion flagged as `blocker`? Has the
     economic-buyer stakeholder not engaged in > 60 days?
   - **Exec engagement** — last exec-to-exec touch from
     `touchpoints.md`. A cold exec relationship in the renewal
     window is a risk.
   - **Support heat** — if a sibling agent's support data is
     surfaced through a health signal tied to `support-ticket-
     volume`, note the last 30 days trend. If not wired, skip
     silently — don't fail.
   - **Open at-risk records** — read `at-risk.json` for any `open`
     entries on this slug.
   - **Contract quirks** — `autoRenew: false` in the window is
     itself a factor; a recent price increase (if noted in
     `account.json.notes`) is another.
5. **Assign confidence.** `high` / `medium` / `low` / `unknown`
   based on risk-factor density. A default rubric:
   - 0-1 risk factors → `high`
   - 2-3 → `medium`
   - 4+ OR any open sev1 at-risk → `low`
   - Gaps in data you couldn't resolve → `unknown` (note which
     data was missing).
   State the rubric in the pack so the user sees what drove it.
6. **Propose plays, ranked by effort.** Lightest-lift first (async
   check-in, targeted feature walkthrough) → medium-lift (exec-to-
   exec meeting) → heavy-lift (save discount, contract re-scope).
   Never propose specific discount %s or contract terms — that's the
   AE. Frame as "worth exploring with {AE}."
7. **Write `accounts/{slug}/renewal-risk.md`** (overwrite). Headings:
   `## Snapshot` (ARR, renewalAt, tier, health, confidence),
   `## Risk factors` (bulleted, each cited), `## Plays`
   (numbered, effort labeled), `## Open questions` (data gaps to
   resolve).
8. **Upsert `renewals.json`.** `{ accountSlug, accountName,
   renewalAt, arr, confidence, risks: [one-liners], plays: [one-
   liners], status: "upcoming", lastAnalyzedAt: <now> }`. If a row
   exists, refresh in place. Never flip `status` to `"in-motion"`
   here — that's `draft-touchpoint` when a reminder goes out.
9. **Summarize in chat.** *"Analyzed {N} renewals. {top concern}.
   See `accounts/{slug}/renewal-risk.md` for the breakdown. Draft a
   renewal reminder for {account}?"* (Clean handoff to
   `draft-touchpoint`.)

## Outputs

- `accounts/{slug}/renewal-risk.md` (overwritten)
- `renewals.json` (upserted)
