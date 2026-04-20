---
name: log-expense
description: Use when the user forwards a receipt, mentions a charge ("I just spent $X on Y"), or a charge appears via any Composio-connected finance integration — extract vendor + amount + date + category + trip association (if any), append to `expenses.json`. Asks at most one clarifying question when a vendor is new or categories are missing.
---

# Log Expense

## When to use

The user forwarded a receipt email to me, said "I just spent $47 on
coffee at the SFO offsite," or a Composio-connected finance tool
surfaced a new charge. I extract and log; I never approve or submit to
an external expense system without explicit instruction.

## Steps

1. **Resolve the source.** Three paths:
   - **Receipt forward / email:** the user forwarded a receipt to
     the connected inbox. Parse the body + subject.
   - **Free-text:** the user typed "I spent $X on Y at Z." Parse
     the message.
   - **Finance integration:** a charge arrived via a Composio-
     connected finance tool. Use `composio search` to fetch the
     transaction payload. Do NOT hardcode slugs.
2. **Extract fields.** Pull `vendor`, `amount` (in minor units —
   cents), `currency` (ISO-4217, default `USD`), `chargedAt` (ISO-
   8601 date), `memo`. If any required field is missing (amount or
   vendor or date), ask the user ONE question targeting the gap.
3. **Categorize.** Read `config/expense-categories.json`.
   - If the file is missing, ask the user ONE question: "What
     expense categories do you use? A few examples: Travel —
     flights, Travel — meals, Software — SaaS, Office. List the
     ones that matter." Parse into
     `{ id, name, rules: [] }[]` and write to
     `config/expense-categories.json`.
   - For each category, check `rules[]` — if `matchVendor` or
     `matchKeyword` hits, use that category.
   - If no rule matches, pick the closest category and ask the
     user ONE question: "Charge to {category}? If yes, I'll add a
     rule so {vendor} always goes there." Persist the rule on
     approval.
4. **Trip association (optional).** If a `travel/{trip-id}/` folder
   has dates overlapping `chargedAt`, offer: "This looks like it's
   part of your {trip-id} trip — associate it?" Store `tripId` on
   approval.
5. **Build the `Expense` row.** Shape per `data-schema.md`. Generate
   `id` (UUID v4). Set `source` appropriately:
   `"receipt-forward"` | `"manual"` | `"finance-integration"`. Set
   `status: "captured"`.
6. **Append to `expenses.json`.** Atomic write. Deduplicate against
   existing rows with same `sourceRef` if provided.
7. **Tell the user.** "Logged {amount} {currency} at {vendor} on
   {chargedAt} to {categoryName}{ tripId ? ' (assoc. ' + tripId + ')'
   : ''}. Want me to export this month's expenses when you're ready
   to reconcile?"

## Outputs

- Appended row in `expenses.json`
- Possibly written / updated `config/expense-categories.json`
