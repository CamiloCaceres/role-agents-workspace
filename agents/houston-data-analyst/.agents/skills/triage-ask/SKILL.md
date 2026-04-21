---
name: triage-ask
description: Use when an ad-hoc data question arrives — pasted by the user, forwarded from a Composio-connected channel (Slack / email / ticket), or flagged via any connected inbound — classify as answerable-from-existing / needs-new-query / needs-new-data / unclear, propose an approach + ETA, and append to `asks.json`. Pre-step before `answer-question` runs; keeps the queue visible on the dashboard.
---

# Triage Ask

## When to use

Someone sent a data question that hasn't been answered yet. The user
forwarded it, pasted it, or asked me to check a connected channel.
I classify and queue it so it surfaces on the dashboard — the user
decides what to tackle next.

## Steps

1. **Capture the question.** If the user pasted it, use verbatim.
   If the user pointed me at a connected channel ("check my data-
   requests Slack channel"), use `composio search` to find the
   channel's list/search tool and pull recent unanswered messages
   that look like data questions. For each, proceed with the
   triage below.

2. **Read existing queries.** Read `queries.json`. Scan purposes,
   tags, and schema deps for matches to the ask. If an existing
   query clearly answers it, mark `classification:
   "answerable-from-existing"` and note the `linkedQuerySlug`.

3. **Classify.** Choose ONE:
   - **`answerable-from-existing`** — a prior query in
     `queries.json` answers this directly. ETA: 2 min (just
     re-run).
   - **`needs-new-query`** — existing schemas can answer but no
     saved query fits. ETA: 15–30 min depending on complexity.
   - **`needs-new-data`** — the question requires a source not
     yet in `config/data-sources.json` or a field not yet in any
     pipeline. ETA: unknown, needs scoping conversation.
   - **`unclear`** — the question is ambiguous, under-scoped, or
     uses internal jargon I can't interpret. Propose one
     clarifying question.

4. **Propose approach.** 1–3 sentences: which tables, which
   rough SQL shape, any caveats to flag up front. If
   `needs-new-data`, name the missing source / field and the
   expected path to add it.

5. **Capture metadata.** If the source was a connected channel,
   record `requester`, `channel`. If pasted, leave those empty
   unless the user volunteered them.

6. **Append to `asks.json`** with
   `{ id, question, requester, channel, classification, status:
   "open", proposedApproach, etaMinutes, linkedQuerySlug?,
   createdAt, updatedAt }`.

7. **Report.** In chat:
   > "Queued {N} asks. Top priority looks like {ask-description} —
   > {approach summary}. Want me to tackle it now?"

   If the user says yes, invoke `answer-question` with the ask's
   question verbatim.

## Outputs

- Appended `asks.json`
