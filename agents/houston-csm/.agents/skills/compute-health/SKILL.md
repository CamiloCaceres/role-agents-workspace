---
name: compute-health
description: Use when usage / support / engagement data refreshes for one or more accounts, OR the user says "compute health for {account}" / "recompute health" / "re-score my book" — apply weighted signals from `config/health-signals.json`, produce Green / Yellow / Red per account with a signal breakdown, write `accounts/{slug}/health.json`, and update `accounts.json` healthScore + lastReviewedAt.
---

# Compute Health

## When to use

- The user asks to recompute health for one account, a tier, or the
  whole book.
- New usage / support / engagement data landed via any Composio-
  connected product-usage store or CS platform and an account's
  health is likely stale.
- A scheduled refresh ticks (weekly default — user can override in
  chat by saying "recompute daily").

This skill computes scores. It NEVER flips an account's `status` to
`"at-risk"` on its own — that's `flag-at-risk`'s job. It only moves
the `healthScore` (green/yellow/red) on the account index.

## Steps

1. **Read `config/health-signals.json`.** If missing or empty, ask
   the user ONE targeted question: *"I don't have your health
   signals yet — what defines healthy vs. at-risk in your world? Best:
   point me at a connected CS platform via Composio; otherwise
   paste the signals + thresholds."* Write the answer, continue.
2. **Pick the account set.** If the user named accounts, use those.
   Otherwise read `accounts.json` and filter to the focus tiers
   from `config/accounts-focus.json` (default: all active accounts).
3. **For each account, fetch signal values.** For each signal in
   `config/health-signals.json`, resolve the `source`:
   - If the source maps to a Composio-connected product-usage store
     or CS platform, run `composio search <source-keyword>` to
     discover the tool slug and execute it for this account.
   - If no connection covers the source, SKIP that signal but record
     a breakdown entry with `note: "source unreachable — connect
     {category} via Composio"`. Never silently drop it.
4. **Score each signal.** Compare the fetched value to the signal's
   `thresholds.green` and `thresholds.yellow` respecting `direction`
   (higher-is-better vs. lower-is-better). Emit a `HealthBreakdown`
   entry: `{ signalId, value, status, note }`.
5. **Weighted rollup.** Normalize weights across signals that
   actually returned a value (skip unreachable ones from the denom).
   Map each signal's status to points (green=100, yellow=60, red=20)
   and compute `weightedScore` (0-100). Set the overall `score`:
   >= 75 → green, 40-74 → yellow, < 40 → red. These band cuts are
   defaults — the user can override in chat by saying "use bands
   {green}/{yellow}/{red}".
6. **Trend.** If a prior `accounts/{slug}/health.json` exists,
   compare previous `weightedScore` to the new one:
   delta >= +5 → `up`, delta <= -5 → `down`, else `flat`. If no
   prior record, `unknown`.
7. **Write `accounts/{slug}/health.json`** atomically with
   `{ accountSlug, computedAt, score, weightedScore, trend,
   breakdown, notes }`. Include in `notes` any signals skipped
   because a source was unreachable.
8. **Upsert `accounts.json`** — update `healthScore`,
   `lastReviewedAt`, bump `updatedAt`. If the account row doesn't
   exist yet, create it with details pulled from
   `config/accounts-focus.json` or the connected CRM (`composio
   search <crm>`). Do NOT touch `status`.
9. **Summarize in chat.** One-line per account: `{name}: {prev} → {new}
   ({trend})`. If a score dropped a tier, tell the user loud — and
   suggest running `flag-at-risk` for those accounts.

## Outputs

- `accounts/{slug}/health.json` (one per scored account)
- `accounts.json` (updated `healthScore`, `lastReviewedAt`,
  `updatedAt`; new rows upserted if needed)
- `accounts/{slug}/account.json` (created on first sight with slug,
  name, tier, arr, renewalAt, stakeholders: [], notes: "")
