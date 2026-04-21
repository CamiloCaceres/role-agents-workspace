---
name: spot-expansion
description: Use when usage patterns match an entry in `config/expansion-signals.json` (seat cap hit, new team added, champion promoted), OR on a weekly sweep, OR when the user says "find expansion ideas" / "any growth signals on {account}?" — creates `expansion-pipeline.json` entries in stage `idea` and appends reasoning to `accounts/{slug}/expansion-ideas.md`. Never auto-promotes to `qualified` and never hands off.
---

# Spot Expansion

## When to use

- The user asks "any expansion signals this week?" / "is
  {account} ready for more seats?"
- A weekly sweep across focus accounts (user can trigger with "run
  the weekly expansion sweep").
- `compute-health` surfaced an account that's strong AND an
  expansion signal fired (strong health + growth cue = best time to
  propose).

Stage discipline: this skill only writes entries in stage `idea`.
Promotion to `qualified` requires the user to confirm customer
interest or budget in chat — never promote unilaterally. Handoff to
the AE is `handoff-to-ae`'s job.

## Steps

1. **Read `config/expansion-signals.json`.** If missing, ask the
   user ONE targeted question: *"I don't have your expansion signals
   yet — what usage patterns suggest growth for your customers?
   (seat cap, new teams, champion promoted). Paste, or drop a doc."*
   Write and continue.
2. **Pick the account set.** If the user named an account, scope to
   it. Otherwise read `accounts.json` filtered to focus tiers from
   `config/accounts-focus.json` — default to accounts with
   `healthScore === "green"` (don't pitch growth to shaky
   accounts). User can override in chat: "include yellow accounts
   too."
3. **For each account, fetch signal data.** For each signal,
   resolve its `dataSource`:
   - If it maps to a Composio-connected product-usage store or CRM,
     run `composio search <source>` and execute.
   - If no connection covers it, skip the signal and note it in the
     chat summary so the user knows what's missing.
4. **Evaluate the `threshold`** (free-form trigger rule in the
   signal). If the rule fires, draft an idea. Examples:
   - "Seat cap hit" → `title: "Add seats ({current}/{cap}
     utilized)"`
   - "New team detected" → `title: "Cross-sell to {team-name}"`
   - "Champion promoted" → `title: "Exec-level expansion conversation"`
5. **Estimate uplift where possible.** `estimatedArrUplift` is
   best-effort from the signal's data (e.g. incremental seats ×
   per-seat ARR from `accounts/{slug}/account.json.contract`). If
   unclear, leave unset — don't invent numbers.
6. **Upsert `expansion-pipeline.json`** — if an `idea`-stage entry
   for this slug + title already exists, refresh `signal`, `notes`,
   `updatedAt`. Otherwise create new with `stage: "idea"`,
   `accountSlug`, `accountName`, `signal` (one-line trigger
   description), `stakeholder` (pull champion from account.json if
   present), `notes`.
7. **Append to `accounts/{slug}/expansion-ideas.md`.** Dated heading
   `## {YYYY-MM-DD} — {title}`, then the signal rationale, the
   supporting data points, and the proposed motion. Append — never
   overwrite. Creates the file on first idea for this account.
8. **Summarize in chat.** `"{N} ideas found across {M} accounts. Top:
   {name} — {title} (~${uplift}). Ready to qualify any of these?
   Say 'qualify {account}' once you've confirmed interest."` Remind
   the user that promotion to `qualified` is their call.

## Outputs

- `expansion-pipeline.json` (one or more new `idea`-stage entries,
  or refreshed)
- `accounts/{slug}/expansion-ideas.md` (appended per matched
  signal)
