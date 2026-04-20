---
name: detect-bug-report
description: Use when a customer message contains a reproducible defect (error messages, stack traces, "it used to work and now doesn't", explicit repro steps, screenshots of a broken UI) — extracts repro steps + severity, pattern-detects affected customers across recent tickets, and appends / merges into `bug-candidates.json`.
---

# Detect Bug Report

## When to use

Trigger signals in the latest customer message or anywhere on the
thread:
- An error message, HTTP status, or stack trace pasted.
- Phrase: "used to work", "suddenly broken", "stopped working",
  "regression".
- Explicit reproduction steps ("I clicked X, then Y, then saw Z").
- Screenshot referenced that shows an error state.
- Multiple customers reporting the same symptom in the last 7 days
  (pattern-detection pass).

`triage-incoming` sets `category = "bug"` on obvious cases — this
skill goes deeper and writes the actionable record.

## Steps

1. **Pull the thread** from `conversations/{id}/thread.json`. Locate
   the message(s) with defect signals.
2. **Extract repro steps.** If the customer provided them, normalize
   into an ordered list. If not, write "No explicit repro — needs
   follow-up" as the first step and tell the user this needs a
   clarifying reply.
3. **Assess severity.**
   - `critical` — data loss, security, full outage, payment broken.
   - `high` — core workflow broken for paying customers, no
     workaround.
   - `medium` — feature broken with workaround, or broken for a
     subset.
   - `low` — cosmetic, rare edge case.
4. **Pattern-detect affected customers.** Scan `conversations.json`
   for the last 14 days, `category == "bug"`, with similar keywords
   in subject or thread. Collect their `customerSlug`s into
   `affectedCustomerSlugs`.
5. **Check for dedup.** If `bug-candidates.json` already has an
   entry with matching summary keywords and `status !=
   "dismissed"`, append this customer's slug to
   `affectedCustomerSlugs`, add this conversation id to any
   internal references, and refresh `updatedAt` rather than
   creating a new entry.
6. **Write atomically** to `bug-candidates.json`:
   ```json
   {
     "id": "<uuid>",
     "conversationId": "...",
     "customerSlug": "...",
     "summary": "...",
     "repro": ["..."],
     "severity": "high",
     "affectedCustomerSlugs": ["..."],
     "status": "new",
     "createdAt": "...",
     "updatedAt": "..."
   }
   ```
7. **Append** a `kind: "bug_reported"` event to
   `customers/{slug}/history.json`.
8. **Do not file it to an external tracker on your own.** If the
   user asks to file it, use `composio search <tracker> create
   issue` to find the right slug, execute, capture the returned id
   into `externalTrackerId`, and flip `status: "filed"`.

## Outputs

- Appends / updates an entry in `bug-candidates.json`
- Appends to `customers/{slug}/history.json`
- Optionally updates `externalTrackerId` + `status: "filed"` when
  the user asks to file
