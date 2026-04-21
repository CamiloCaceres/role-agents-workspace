---
name: flag-at-risk
description: Use when a health score drops a tier (green→yellow, yellow→red), OR a signal crosses its threshold, OR the user says "{account} is at risk" / "flag {account}" — opens or updates an `at-risk.json` entry with severity, cause, trigger, and a proposed play. Flags board-material sev1 cases loud in chat within the same response.
---

# Flag At-Risk

## When to use

- `compute-health` just dropped an account a tier and the user asks
  to flag it (or confirms the drop).
- A single signal crossed its red threshold even if the overall
  score didn't tip.
- The user explicitly says "flag {account}," "{account} is at risk,"
  or "open an at-risk on {account}."

This is the ONLY skill that opens at-risk records and moves an
account's `status` to `"at-risk"`. Never promote a watch to an
at-risk on signals alone — require either the health drop OR an
explicit user signal described above.

## Severity defaults

When opening a new at-risk record, pick severity with these
defaults:

- **sev1 (board-material)** — `arr > 100_000` OR `tier ===
  "enterprise"`.
- **sev2 (meaningful)** — `arr > 25_000`.
- **sev3 (watch)** — everything else.

These are defaults. The user can override in the same chat turn
by saying "severity: sev2" (or sev1 / sev3). Always state the
chosen severity back so the user can correct it.

## Steps

1. **Resolve the account.** From chat (named) or from a
   `compute-health` handoff. Read `accounts.json` to find the row by
   slug. If not present, say so and stop.
2. **Gather cause + trigger.** Read `accounts/{slug}/health.json`
   (most recent). The `trigger` is the specific signal (or
   "health-tier-drop" if the overall score dipped). The `cause` is
   a one-line human summary — pull from the breakdown note or ask
   the user ONE question if the signal value doesn't explain it.
3. **Pick severity** using the defaults above. If the user already
   stated one ("severity: sev2"), honor it.
4. **Propose a play.** One line. Examples: "book exec-to-exec
   check-in," "walk champion through new feature X," "prepare save
   offer for renewal in 45 days," "escalate to AE for contract
   re-scope." Pull context from `accounts/{slug}/account.json`
   stakeholders where useful. Don't invent scope — keep it to a
   motion the user can execute this week.
5. **Upsert `at-risk.json`** — if an `open` entry exists for this
   slug, update `trigger`, `cause`, `proposedPlay`, `updatedAt` (and
   bump severity up if warranted, never silently down). Otherwise
   create new with `status: "open"`, `openedAt: <now>`.
6. **Update `accounts.json`.** Set `status: "at-risk"`, bump
   `updatedAt`. Leave `healthScore` as-is (that's `compute-health`'s
   field).
7. **Loud-flag sev1 in chat, same turn.** The CLAUDE.md rule: high-
   value at-risk signals must surface to the user within the same
   response, not tomorrow, not buried. Post a one-liner up top:
   *"sev1 at-risk opened on {account} ({arr}) — {cause}. Proposed:
   {play}. Approve play or change it?"*
8. **Do NOT draft outreach here.** If the user approves the play and
   it's a touchpoint, hand off to `draft-touchpoint`. If it's an AE
   escalation, hand off to `handoff-to-ae`.

## Outputs

- `at-risk.json` (new or updated entry with severity, cause,
  trigger, proposedPlay, status, openedAt)
- `accounts.json` (updates `status: "at-risk"`, `updatedAt`)
