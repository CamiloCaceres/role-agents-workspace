---
name: track-followup
description: Use when the user sends an outbound email promising action ("I'll send this Tuesday", "circling back next week", "will confirm by Friday") OR explicitly asks to track a commitment — extract the commitment + due date, append to `followups.json` with status "open". Never replaces existing entries silently.
---

# Track Follow-up

## When to use

The user approved sending a draft from `draft-email-response` (or
pointed me at an outbound they already sent) and the body contains a
commitment to act by a specific time. Also run when the user says
explicitly "remind me to follow up with X on Tuesday" or "track that I
owe Jane a deck by Friday."

## Steps

1. **Locate the source.** If triggered from `draft-email-response`,
   the `threadId` and `to` are already known. Otherwise the user
   specified the counterparty + the commitment directly.
2. **Extract the commitment.** Parse the body (or user instruction)
   for phrases that indicate a promise:
   - Explicit: "I'll send X by {date}" / "will confirm by {date}" /
     "expect this from me {day}" / "circling back {day}".
   - Implicit: questions left unanswered that the user said they'd
     handle ("let me check on that and get back to you").
   If nothing clearly resolves to a commitment, ask the user ONE
   question: "What did you promise, and by when?"
3. **Resolve the due date.** Convert relative references ("Tuesday",
   "next week", "end of the month") to an absolute ISO-8601 date in
   the user's timezone from `config/schedule-preferences.json`. If
   ambiguous ("soon" / "shortly"), default to 3 business days from
   the send date and flag to the user.
4. **Build the `Followup` row.** Shape:
   ```ts
   {
     id: <uuid>,
     threadId?,
     promiseTo: "<name>",
     promiseToEmail?,
     company?,
     description: "<short — e.g. Send deck draft>",
     summary?: "<1-line context>",
     promisedAt: <ISO-8601 of outbound>,
     dueAt: <ISO-8601>,
     status: "open",
     createdAt, updatedAt
   }
   ```
5. **Append to `followups.json`.** Check for existing open rows with
   the same `threadId` + `description` — if present, update the
   `dueAt` rather than creating a duplicate. Atomic write.
6. **Tell the user.** "Tracked — I'll remind you to
   {description} for {promiseTo} on {dueAt}. I'll surface it in
   `Daily standup` and ping you the morning it's due."

## Outputs

- Appended (or updated) row in `followups.json`
