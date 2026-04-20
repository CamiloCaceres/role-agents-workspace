---
name: classify-reply
description: Use when a new inbound reply arrives via any Composio-connected inbox — classify it as interested / not-now / not-interested / out-of-office / unsubscribe / referral / wrong-person / auto-reply, extract any structured data (OOO return date, referral contact, objection type), write to `replies.json`, append to the lead's thread, and update the lead status.
---

# Classify Reply

## When to use

A new inbound message landed in any connected inbox and hasn't been
categorized yet. The user may trigger me explicitly ("classify my new
reply from Jane") or I may be invoked by a polling task that checks
the connected inbox for outbound-thread replies.

## Steps

1. **Resolve the source.** Use `composio search` to discover the
   fetch slug for the connected inbox. Do NOT hardcode tool slugs.
   Fetch the raw message: from, to, subject, body, external id,
   receivedAt.
2. **Resolve the lead.** Look up `leads.json` by sender email (and
   fall back to name match). If no lead row exists, the reply is
   still worth classifying — create a minimal `leads.json` row with
   `source: "inbound"` and status `"replied"`.
3. **Classify the intent.** Match the body against these signals
   (in order — first match wins):
   - **unsubscribe**: "unsubscribe", "remove me", "opt out", "stop
     emailing".
   - **auto-reply**: mailer-daemon, delivery-status, "automatic
     reply", "this message was sent automatically".
   - **out-of-office**: "out of office", "on vacation", "I am
     away", "will be back" (+ capture return date with a regex like
     `(back|return|until)\s+(on\s+)?([A-Z][a-z]+\s+\d+|\d{1,2}/\d{1,2})`).
   - **wrong-person**: "not in charge of this", "wrong team",
     "that's not my area", "not the right person".
   - **referral**: "you should talk to X", "reach out to X", "copying
     X who handles this", "introducing X" (+ capture referral name
     and email if present).
   - **not-interested**: "not a fit", "no thanks", "not
     interested", "please stop".
   - **not-now**: "not now", "follow up in", "check back in",
     "circle back next quarter" (+ capture return date if mentioned).
   - **interested**: "yes", "tell me more", "interested", "let's
     chat", "what's your availability", "can we schedule".
   - Fallback: `unclassified`.
4. **Confidence score.** 0–100 based on signal strength. A single
   clear keyword = 70. Multiple confirming keywords + question
   about timing/pricing = 90+. Ambiguous = 40–50. Unclassified =
   0.
5. **Detect objections.** If the reply contains classic objection
   patterns (price, timing, "we already use X", "have to check
   with my team", "don't have this problem"), set
   `extractedData.objectionType` to one of `price` / `timing` /
   `incumbent` / `team-check` / `no-problem`.
6. **Append to thread.** Push a new `inbound` message onto
   `leads/{slug}/thread.json` with `channel`, `sentAt`,
   `externalId`, `body`.
7. **Upsert `replies.json`.** Create/update the row with
   `leadSlug`, `channel`, `classification`, `intentConfidence`,
   `needsAction` (true for `interested`, `referral`, `not-now`
   with return date; false otherwise), `extractedData`.
8. **Update `leads.json`**:
   - `interested` | `not-now` | `referral` → `status: "replied"`.
   - `unsubscribe` → `status: "unsubscribed"`, `needsAction: false`.
   - `not-interested` → `status: "not-interested"`.
   - `out-of-office` | `auto-reply` → leave status unchanged;
     set `nextActionAt` to the extracted return date if present.
   - `wrong-person` → `status: "dead"`; if referral fields were
     extracted, note that `respond-to-objection` or a new
     `research-lead` on the referred contact is a good next step.
9. **If it's a referral,** tell the user explicitly and offer to
   create a new lead row for the referred contact.

## Outputs

- Upserted row in `replies.json`
- Appended message in `leads/{slug}/thread.json`
- Updated `leads.json` row
