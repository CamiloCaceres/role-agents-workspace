---
name: draft-email-response
description: Use when the user asks to reply to a specific thread or approves a queued draft from `inbox-queue.json` — read the thread, match against `config/voice.md` and `config/response-templates.md`, write the draft to `drafts/{threadId}/draft.md`. Flag sensitive-party threads for user review before drafting. Never sends.
---

# Draft Email Response

## When to use

The user named a specific thread or queued inbox item and asked for a
reply draft. Or `triage-inbox` queued an actionable item with
`draftStatus: "pending"` and the user said "draft those." I write; I
never send.

## Steps

1. **Load the thread.** Use `composio search` + fetch by `threadId` to
   pull the full message history (the snippet in `inbox-queue.json` is
   not enough context). Do NOT hardcode tool slugs.
2. **Read voice.** Read `config/voice.md`. If missing, ask the user
   ONE question: "Paste one recent email you've sent so I can match
   your voice." Write to `config/voice.md` and continue.
3. **Check for sensitive party.** If the inbox-queue row's
   `sensitiveParty` is set (investor / co-founder / spouse / lawyer /
   board), STOP and ask the user: "This is to {party}. Want me to
   draft, or do you want to handle this one personally?" Only proceed
   on explicit "draft it."
4. **Select a response pattern.** Read `config/response-templates.md`.
   Map the thread's intent to one of: accept, decline, delay, intro,
   thank-you, information-request, other. If no matching template
   exists, propose one to the user and — on approval — append to
   `config/response-templates.md` as a new heading before writing the
   draft.
5. **Draft structure.**
   - Subject: only if replying without a subject line (rare) — else
     preserve original.
   - Greeting: mirror the sender's tone (match formality from the
     incoming thread; fall back to voice samples).
   - Body: 3–5 short paragraphs max. Lead with the answer / decision.
     Cite specifics from the thread (dates, names, amounts) — never
     invent. If a commitment is being made ("I'll send X by Y"), flag
     to the user that I'll create a follow-up via `track-followup`
     once they approve.
   - Signoff: mirror user voice samples.
6. **Match voice.** Sentence length, punctuation, greeting/signoff,
   first-person style. If the voice samples are dry/direct, drop
   filler. If warm, keep it warm.
7. **Write the draft** to `drafts/{threadId}/draft.md` with sections:
   ```markdown
   ## Thread
   {threadId} — {subject}

   ## Recipient
   {name} <{email}>

   ## Subject
   Re: ...

   ## Body

   ## Template used
   {accept|decline|delay|...}

   ## Voice match
   - tone: ...
   - formality: ...

   ## Sensitivity flag
   {none|investor|co-founder|spouse|lawyer|board}
   ```
8. **Update `inbox-queue.json`** for the thread: set `draftStatus:
   "awaiting-send"`, `draftedAt: now`, `updatedAt: now`.
9. **If the draft promises something,** invoke `track-followup` with
   the commitment + due date after the user approves sending.
10. **Present to the user** and ask: "Send this, tweak it, or try a
    different angle?" Never send on my own.

## Outputs

- `drafts/{threadId}/draft.md` (overwritten)
- Updated `inbox-queue.json` row
