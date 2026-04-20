---
name: promise-tracker
description: Use when the user approves a draft reply or sends a message that contains a time-bound commitment ("I'll check with engineering by Friday", "I'll ship this next week", "I'll follow up tomorrow") — extracts the promise verbatim, links it to the conversation, parses the due date, and appends to `followups.json` so nothing slips.
---

# Promise Tracker

## When to use

- User says "send it" / "approved" on a `draft.md` that contains
  time-bound language.
- User writes their own reply in chat and it contains a date, day,
  or timeframe.
- Reviewing an existing thread, the user says "oh right, I told
  them I'd…".

Any phrase resembling "I'll X by Y", "next week", "tomorrow", "by
Friday", "end of day", "within the hour" triggers this.

## Steps

1. **Extract the promise text** verbatim from the message or draft
   (keep original phrasing — the user may want to see what they
   actually said).
2. **Parse the due date.**
   - Explicit date ("Friday", "March 3") → next occurrence in the
     user's local timezone → ISO-8601 UTC.
   - Relative ("tomorrow", "next week") → apply relative to now.
   - Vague ("soon", "asap", no date) → default to `now + 48h` and
     note the ambiguity in the promise text.
3. **Link to the conversation.** Pull `conversationId` and
   `customerSlug` from the thread.
4. **Append atomically** to `followups.json`:
   ```json
   {
     "id": "<uuid>",
     "conversationId": "...",
     "customerSlug": "...",
     "promise": "...",
     "dueAt": "...",
     "status": "open",
     "createdAt": "...",
     "updatedAt": "..."
   }
   ```
5. **Mirror the promise** as a dated bullet in
   `conversations/{id}/notes.md`.
6. If an existing open followup on the same conversation is now
   contradicted by the new promise (e.g. date pushed), set the old
   one's `status: "cancelled"` and reference the new id in the
   cancelled entry's note.

## Outputs

- Appends to `followups.json`
- Appends a dated bullet to `conversations/{id}/notes.md`
- Optionally cancels a superseded followup
