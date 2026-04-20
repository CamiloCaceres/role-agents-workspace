---
name: classify-candidate-reply
description: Use when an inbound reply arrives from a candidate via any Composio-connected inbox — classify as interested / scheduling / needs-info / not-now / not-interested / referral / wrong-role, append to the candidate's thread, and route the next action (tee up schedule-interview, or draft a needs-info response).
---

# Classify Candidate Reply

## When to use

A new inbound message landed in any connected inbox from a candidate
I've drafted outreach to (or someone the candidate referred). The
user may trigger me explicitly ("classify the reply from Jane") or a
polling task may invoke me when new messages land on an outbound
thread.

## Steps

1. **Resolve the source.** Use `composio search` to discover the
   fetch slug for the connected inbox. Do NOT hardcode. Fetch the
   raw message: from, to, subject, body, external id, receivedAt.
2. **Resolve the candidate.** Look up `candidates.json` by sender
   email (fall back to name match). If no candidate row exists but
   the message references an open role, ask the user whether to
   treat it as inbound interest (and optionally run
   `source-candidates` to create a dossier first).
3. **Classify the intent.** Signals, first match wins:
   - **not-interested**: "not looking," "not a fit," "not
     interested," "please remove me," "stop emailing."
   - **not-now**: "not right now," "maybe in {timeframe},"
     "check back in Q{n}," "let me finish {milestone}" (+ extract
     the return timeframe if present).
   - **scheduling**: "happy to chat," "what times work," "send
     some times," "my availability is…" (strong signal to tee up
     `schedule-interview`).
   - **interested**: "tell me more," "sounds interesting," "what's
     the role look like," "I'd like to learn more."
   - **needs-info**: the candidate asks a specific question
     (comp, location, product, team size, investors, equity).
     Capture the question verbatim.
   - **referral**: "I'm not but {name} might be" (+ extract
     referral name and email if present).
   - **wrong-role**: "I'm a designer, this looks like a PM role,"
     "I don't do that anymore," "I'm deep in {unrelated}."
   - Fallback: `unclassified`.
4. **Confidence score (0–100).** Single keyword = 70. Multiple
   confirming phrases + specific next-step ask = 90+. Ambiguous =
   40–50.
5. **Append to thread.** Push a new `inbound` message onto
   `candidates/{slug}/thread.json` with `channel`, `sentAt`,
   `externalId`, `body`, and the classification.
6. **Update `candidates.json`**:
   - `scheduling` | `interested` → `status: "replied"`,
     `stage: "screened"` if not already past screen.
   - `needs-info` → `status: "needs-info"`, capture the question
     into the index row as `outstandingQuestion`.
   - `not-now` → `status: "not-now"`, `nextActionAt` = extracted
     timeframe if present.
   - `not-interested` → `status: "not-interested"`. Do NOT auto-
     close — leave the row so the user can confirm and trigger
     `draft-rejection` if appropriate.
   - `referral` → log the referral; offer to run
     `source-candidates` on the referred person.
   - `wrong-role` → `status: "wrong-role"`, leave stage intact.
7. **Route the next action.**
   - `scheduling` → tell the user and tee up
     `schedule-interview`.
   - `needs-info` → draft a short response answering what I can
     answer from the scorecard + role brief (never disclose comp
     range without approval), save to
     `candidates/{slug}/outreach-draft.md`. Ask the user to
     review before sending.
   - `referral` → offer to source the referred contact.
8. **Update `pipelines.json`** for the role if the stage changed.

## Outputs

- Appended message in `candidates/{slug}/thread.json`
- Updated `candidates.json` row
- Possibly an updated `candidates/{slug}/outreach-draft.md` (for
  `needs-info` responses)
- Updated `pipelines.json` entry if stage shifted
