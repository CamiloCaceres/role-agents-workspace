---
name: capture-feature-request
description: Use when a conversation or direct user message contains a feature ask ("I wish…", "do you support…?", "any plans for…?") — records the request in `feature-requests.json` with the requesting customer's slug attached, merges with similar existing requests, and optionally syncs to a connected tracker via Composio so no customer ask is lost.
---

# Capture Feature Request

## When to use

- A conversation contains wording like "I wish…", "it would be great
  if…", "do you support…?", "any plans for…?" — and the answer is
  "not yet".
- User says "add this to the feature request list" or "customer X
  asked for Y".
- Reviewing `conversations/` and you spot an unaddressed ask that
  wasn't filed.

## Steps

1. **Extract the ask.**
   - `title` — one short phrase ("bulk export", "dark mode",
     "Zapier integration").
   - `summary` — 1–2 sentences of what & why.
   - `requestingCustomerSlug` — the slug from `customers.json`
     (match by the conversation's `customerSlug`).
   - `relatedConversationIds` — the conversation id.
2. **Read `feature-requests.json`.** Look for an existing record
   with a semantically similar `title`.
   - If found → **merge**: add the slug to
     `requestingCustomerSlugs` (dedupe), append the conversation id
     to `relatedConversationIds` (dedupe), refresh `updatedAt`,
     optionally expand `summary` if the new wording adds detail.
   - If not found → **append** a new `FeatureRequest` with
     `roadmapStatus: "requested"` and `linearId: null`.
3. **Atomic-write** `feature-requests.json`.
4. **Append** a `kind: "feature_requested"` event to
   `customers/{slug}/history.json`.
5. **Optional Composio sync** (only if the user opts in).
   - Check whether a tracker is connected: `composio search
     <tracker> create issue` and verify the tool is available and
     authed.
   - If connected AND user has opted in (stored preference or they
     just said "sync to my tracker"): execute the right Composio
     tool to create or update the tracker issue. Capture the
     returned id into `linearId` or `githubIssueUrl`.
   - If not connected: do nothing — never half-sync. Mention once
     that `composio link <slug>` would enable it, then stop
     bringing it up.
6. **Report to chat.** "Captured feature request: '{title}' from
   {customer-slug} ({N} total requesters). {Tracker status}."

## Outputs

- Appends / merges into `feature-requests.json`
- Appends to `customers/{slug}/history.json`
- Optionally creates / updates an external tracker issue via
  Composio
