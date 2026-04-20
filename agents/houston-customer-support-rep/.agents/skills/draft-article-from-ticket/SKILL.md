---
name: draft-article-from-ticket
description: Use when a resolved conversation contains a reusable answer worth documenting — drafts a KB article (how-to / troubleshooting / faq / known-issue / reference) into `articles/{slug}/` as a DRAFT for the user to review before publishing. Never publishes on its own.
---

# Draft Article From Ticket

## When to use

- User says "turn this ticket into a doc" and names or links a
  conversation.
- You finish a resolved conversation whose answer is clearly
  reusable and no existing `articles.json` entry covers it.
- Reviewing patterns: the same question has appeared 3+ times
  without a published article.

Do NOT use for one-off, customer-specific answers (e.g. "your
account was locked because of X" — that's not reusable).

## Steps

1. **Read the source conversation**:
   `conversations/{id}/thread.json` + the matching row from
   `conversations.json` for metadata.
2. **Check `articles.json`.** If an existing article already covers
   this topic (match by semantic similarity on title + type), stop
   and tell the user which slug instead — do not duplicate.
3. **Classify the article type** from the resolution shape:
   - `how-to` — question is "how do I X?" and answer is steps.
   - `troubleshooting` — question is "X is broken / not working"
     and the answer diagnoses + fixes.
   - `faq` — short conceptual question + answer.
   - `known-issue` — unresolved defect with a workaround (prefer
     pairing this with an open `bug-candidates.json` entry).
   - `reference` — lookup-style info (limits, formats, endpoints).
4. **Pick a slug**: kebab-case, 2–5 words, derived from the
   question (e.g. `reset-api-key`, `why-invoice-missing-tax`).
5. **Write the article body** to `articles/{slug}/article.md`:
   - Front-matter header with `status: draft` and
     `last-verified: {date}`.
   - TL;DR one-liner.
   - Steps or explanation in plain language with concrete examples.
   - Pull exact phrasing from the ticket's successful reply where
     possible, but generalize customer names / ids.
6. **Write `articles/{slug}/meta.json`** with `status: "draft"`,
   `version: 1`, `sourceTicketIds: [<conversation id>]`,
   `needsReview: false`.
7. **Append an `ArticleIndexEntry`** to `articles.json` (atomic
   write).
8. **Post a chat message**: "Drafted `{title}` from conversation
   {id} — review at `articles/{slug}/article.md`. Reply 'publish
   {slug}' when ready."

## Outputs

- Writes `articles/{slug}/article.md`
- Writes `articles/{slug}/meta.json`
- Appends to `articles.json`
- Posts a chat message
