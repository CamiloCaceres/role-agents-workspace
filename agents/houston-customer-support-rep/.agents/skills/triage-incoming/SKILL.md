---
name: triage-incoming
description: Use when a new inbound support message lands via any Composio-connected channel (any inbox, ticketing, or chat platform) and has not been triaged yet — categorizes it, assigns priority from MRR + content signals, sets SLA clock, resolves or creates the customer, and writes to `conversations.json` + `conversations/{id}/thread.json`.
---

# Triage Incoming

## When to use

A new inbound message has landed and no `conversations.json` entry
exists for its thread, OR an existing entry needs re-triage because
content materially changed (e.g. a how-to turned into an outage
report). Running this is the very first step on anything that arrives
in the queue.

## Steps

1. **Identify the source.** The user names the channel, or the
   message is referenced by external id. Use `composio search
   <channel>` to find the right fetch slug (e.g. any inbox thread
   fetch, ticketing conversation fetch). Do NOT hardcode tool slugs.
2. **Fetch the raw thread** via Composio. Pull subject, all messages,
   sender email, external message ids.
3. **Resolve the customer.** Look up `customers.json` by sender
   email. If not found, create a new index entry with a skeleton
   `customers/{slug}/profile.json` (slug = kebab-cased email
   local-part + company token, deduped if needed).
4. **Categorize.** Classify content into one of: `bug | how-to |
   feature | billing | account | security | other`.
   - Errors / stack traces / "used to work" → `bug`.
   - "How do I…" → `how-to`.
   - "Can you add…" → `feature`.
   - Invoice / refund / charge → `billing`.
   - Login / seats / SSO → `account`.
   - "Leak" / "breach" / "2FA" / "password reset" → `security`.
5. **Assign priority (P1–P4).** Load `config/sla-policy.json`. Start
   from MRR:
   - MRR ≥ `vipMrrCents` → floor at `vipFloorPriority` (default P2).
   - VIP tag → floor at P1.
   - Escalate on content: "down", "can't log in", "data loss",
     "production" → bump one level (max P1).
   - De-escalate on "whenever you get a chance" → bump down one
     level.
6. **Set the SLA clock.** Using `config/sla-policy.json`:
   `sla.firstReplyDueAt = now + firstReplyHours[priority]`,
   `sla.breached = false`, `sla.nextUpdateDueAt` omitted (set on
   first reply).
7. **Write atomically.**
   - Upsert into `conversations.json`.
   - Write the full thread to `conversations/{id}/thread.json`.
   - Upsert the customer row in `customers.json` with `updatedAt` now.
   - Append a `kind: "conversation"` event to
     `customers/{slug}/history.json`.

## Outputs

- Writes to `conversations.json`
- Writes `conversations/{id}/thread.json`
- Writes / updates `customers.json`
- Writes skeleton `customers/{slug}/profile.json` if new
- Appends to `customers/{slug}/history.json`
