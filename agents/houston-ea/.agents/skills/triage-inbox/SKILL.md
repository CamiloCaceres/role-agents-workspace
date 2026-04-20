---
name: triage-inbox
description: Use when the user asks to triage / clear the inbox OR when new mail arrives via any Composio-connected inbox — classify each message (VIP / action-required / FYI / noise / schedule-meeting / gatekeep-request), flag sensitive-party threads, queue drafts for actionable items, and write to `inbox-queue.json`. Never sends.
---

# Triage Inbox

## When to use

The user said "triage my inbox," "clear my inbox," "what needs my
attention," or new mail landed in any connected inbox and hasn't been
classified yet. I classify; I never send.

## Steps

1. **Resolve the inbox.** Use `composio search` to discover the fetch
   slug for the connected inbox. Do NOT hardcode tool slugs. If no
   inbox is connected, tell the user which app to link (Gmail /
   Outlook / other) and stop.
2. **Fetch unread + recent.** Pull the last 48 hours of unread
   messages plus any still-open threads awaiting my reply. For each
   message capture: `threadId`, `from`, `fromName`, `subject`,
   `snippet`, `receivedAt`.
3. **Load context.** Read `config/vips.json`,
   `config/schedule-preferences.json` (for timezone-aware "needs-reply
   today" math), and `config/response-templates.md` if it exists.
4. **Classify each message** (first match wins):
   - **VIP** — sender email or name matches `config/vips.json`.
     Tag `sensitiveParty` if relationship is investor / co-founder /
     board / spouse / lawyer.
   - **schedule-meeting** — body asks to meet / book / find time /
     proposes specific slots ("are you free Tuesday?" / "pick a
     time").
   - **gatekeep-request** — "would love an intro to" / "any chance
     you'd introduce" / "referral" / "quick ask" from a non-VIP.
   - **action-required** — a direct question, a pending decision, a
     deliverable needed from the user, or an explicit deadline.
   - **FYI** — cc'd, digest, newsletter the user opted into,
     notification that doesn't need action.
   - **noise** — cold outbound, automated system mail, unsubscribed
     sender, clear spam.
5. **Confidence score.** 0–100 based on signal strength. VIP email
   match = 95. Clear keyword triggers = 75–85. Soft inference = 40–60.
   Unclassified = 0.
6. **Detect sensitive parties.** Any thread with an investor,
   co-founder, spouse, lawyer, or board member as sender OR in the
   body ("per our board meeting," "as counsel advises") gets
   `sensitiveParty` set and a note in the queue row.
7. **Progressive VIP capture.** If the classifier is unsure about a
   sender who corresponds with the user frequently (heuristic:
   >3 threads in last 30 days AND title/domain suggests importance),
   ask the user ONCE: "Is {name} a VIP I should floor at P1 or P2?"
   Append to `config/vips.json`. Do not batch — ask only when I hit
   one.
8. **For each actionable item, propose next step:**
   - **VIP + action-required** → queue a draft reply (set
     `draftStatus: "pending"`, record where I'll write it —
     `drafts/{threadId}/draft.md`). Do NOT auto-draft sensitive-party
     threads — flag them to the user first.
   - **schedule-meeting** → note "scheduling needed" — the user can
     invoke `schedule-meeting` from here.
   - **gatekeep-request** → queue a template-matched decline or
     forward draft (never auto-forward).
   - **action-required (non-VIP)** → queue a draft reply.
   - **FYI / noise** → no draft, status `done` (FYI) or
     `dismissed` (noise).
9. **Upsert `inbox-queue.json`** — replace or insert each row with the
   full `InboxItem` shape. Atomic write.
10. **Summarize to the user.** "Triaged {N} messages: {V} VIP, {A}
    action-required, {S} scheduling, {G} gatekeep, {F} FYI, {N} noise.
    {K} drafts queued. {X} flagged as sensitive — awaiting your
    review."

## Outputs

- Upserted rows in `inbox-queue.json`
- Possibly appended rows in `config/vips.json` (progressive capture)
