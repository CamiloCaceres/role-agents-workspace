---
name: handle-followup
description: Use when a tracked follow-up in `followups.json` is due today or overdue, OR the user asks to handle a specific follow-up — remind the user of the commitment, draft a message that honors the promise, update the follow-up status. Never sends.
---

# Handle Follow-up

## When to use

`daily-standup` surfaced an open follow-up whose `dueAt` is today or
overdue, OR the user said "handle the follow-up with Jane" / "draft my
check-in to Acme." I draft; the user sends; I update status.

## Steps

1. **Load the follow-up.** Read `followups.json` and select the row.
   If the user named a person or thread, match by `promiseTo` or
   `threadId`. If multiple rows match, list them and ask the user to
   pick.
2. **Check status.** If `status` is already `done` or `cancelled`,
   confirm with the user before proceeding.
3. **Load thread context.** If `threadId` is set, fetch the latest
   state via the Composio-connected inbox so the draft reflects any
   counterparty replies since the commitment was made. Do NOT
   hardcode slugs — `composio search`.
4. **Decide the path:**
   - **Commitment is ready to fulfill** (user has the deck /
     decision / answer) → draft a message that delivers it. Read
     `config/voice.md`. Pattern: 1-line reference to the prior
     promise → deliver the thing → short close.
   - **Commitment is NOT ready yet** → draft a bump message that
     (a) acknowledges the delay honestly, (b) gives a new concrete
     date, (c) does not over-apologize. Ask the user ONE question:
     "What's the new date I should promise?" Write the answer, use
     it.
   - **User wants to cancel the commitment** → draft a short,
     specific retraction. Set `followups.json` row to `status:
     "cancelled"`.
5. **Write the draft** to `drafts/{threadId}/draft.md` (overwrite)
   with the same sections as `draft-email-response`. Reference the
   follow-up id in the draft metadata.
6. **Update `followups.json`.** Set `lastRemindedAt: now`,
   `completionDraftPath: "drafts/{threadId}/draft.md"`. Keep
   `status: "open"` until the user confirms they sent, then flip to
   `done`. If they snoozed, set `status: "snoozed"` and push `dueAt`
   to the new date.
7. **Present to the user.** Show the draft. Ask: "Send, tweak, or
   snooze?" Never send.

## Outputs

- `drafts/{threadId}/draft.md` (overwritten)
- Updated `followups.json` row
