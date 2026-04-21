---
name: prepare-publish
description: Use when a piece is approved for publish — "prepare {slug} for publish," "publish checklist," "is this ready to ship" — run the full publishing checklist (SEO gates + compliance flags + brand gates), flag blockers, and write a pass/fail report to `drafts/{slug}/publish-check.md`. Compliance flags (unsubstantiated superlatives, missing disclaimers, comparative claims, copyright) are ALWAYS checked. Never publishes externally.
---

# Prepare Publish

## When to use

- A draft has cleared `edit-draft` and the user asks "is this
  ready to ship" / "publish checklist" / "prepare {slug} for
  publish."
- A calendar item is inside 48 hours of its `plannedDate` and
  status is `editing` / `edited`.
- The user is about to hand the piece to a CMS and wants a final
  gate.

## Principles

- **Compliance flags are always checked — even with no config.**
  Unsubstantiated superlatives, missing disclaimers, comparative
  claims, copyright. These are universal.
- **Pass/fail per check.** Not "pretty good" — a blocker or not.
- **Blocker vs nice-to-have.** Missing meta description is a
  blocker. Alt text on one decorative image is a nice-to-have.
- **I NEVER publish.** Even if a connected CMS has write access.
  I draft the payload for the user to approve + send.

## Inputs expected

- **Required:** `drafts/{slug}/draft.md`, `drafts/{slug}/brief.md`.
- **Nice to have:** `drafts/{slug}/headlines.md` (for title/meta),
  `config/publishing-checklist.md` (user-customized gates),
  `config/brand-voice.md`, `published.json` (for internal linking).

## Steps

1. **Resolve the draft.** Read `drafts/{slug}/draft.md`,
   `drafts/{slug}/brief.md`, `drafts/{slug}/headlines.md` if
   present.
2. **Load the checklist.** Read `config/publishing-checklist.md`.
   If missing, write the default template (see `data-schema.md`
   for the full structure: SEO gates + Compliance + Brand gates)
   and tell the user: "I wrote a default publishing checklist at
   `config/publishing-checklist.md` — edit it anytime to tailor
   for your stack."
3. **Run SEO gates** (evaluate each):
   - **Title tag** — 50-60 chars, primary keyword in first 30.
     Pull from `drafts/{slug}/headlines.md` selected option if
     present, else ask the user.
   - **Meta description** — 140-160 chars, has a CTA, includes
     primary keyword once naturally.
   - **URL slug** — short, keyword-forward, kebab-case, no stop
     words.
   - **Canonical** — set and points to the publish URL.
   - **OG image + OG title + OG description** — image at least
     1200×630, title not the same as title tag, description
     distinct from meta description.
   - **Internal links** — at least 3 to related published pieces.
     Suggest candidates from `published.json` by matching
     `pillarSlug` and adjacent keywords.
   - **External links** — at least 2 to authoritative sources,
     with `rel="noopener"` on the rendered page if opening new
     tabs.
   - **Alt text** — present on every non-decorative image.
   - **Schema markup** — Article + (FAQPage OR HowTo when
     applicable) validated against required properties.
4. **Run compliance flags — ALWAYS, even if no config gates exist:**
   - **Unsubstantiated superlatives.** Regex + semantic scan for
     "best," "#1," "only," "fastest," "most trusted," "world-
     class," "unrivaled" → each occurrence needs a source. List
     every line number + phrase.
   - **Required disclaimers.** Check the piece's claim types:
     - Affiliate links present → affiliate disclaimer required.
     - Sponsored or partnered content → sponsorship disclosure.
     - Medical / health claims → "not medical advice."
     - Financial / tax / investment claims → "not financial /
       tax / legal advice."
     - Data / benchmarks → methodology note.
   - **Comparative claims** ("faster than X," "unlike
     {competitor}") → require a specific benchmark or date of
     comparison.
   - **Copyright risks:**
     - Every image checked for license + attribution.
     - Every quote over ~25 words from a named source requires
       attribution + a link.
     - No logos or trademarks misused.
5. **Run brand gates:**
   - **Voice spectrum alignment** — check the draft against the
     voice spectrums in `config/brand-voice.md`. Note any
     paragraph that drifts by ≥ 3 points.
   - **Banned phrases** — grep for the banned list. Any hit is a
     blocker (they failed Sweep 8 if edit-draft was run).
   - **CTA audience + buyer stage fit** — the CTA should match
     the brief's `buyerStage`. A newsletter signup on a
     decision-stage piece is a mismatch; a demo request on an
     awareness-stage piece is a mismatch.
6. **Write `drafts/{slug}/publish-check.md`** with the full
   pass/fail report (see `data-schema.md` template). Always list:
   - Verdict (`ready` | `blocked`).
   - Per-item result, blockers first.
   - Nice-to-haves separated out.
7. **Update state.**
   - If verdict is `ready` AND the user confirms in chat:
     - Write a row in `published.json` with
       `{ slug, title, pillarSlug, channel, publishedAt: null
       (filled on user "it's live" confirmation), url: null,
       keyword, status: "live" once confirmed, tags }`.
     - Flip `drafts.json.status` to `ready-for-publish`.
     - Flip `calendar.json` row to `scheduled` if matching.
     - Seed a `repurposing-queue.json` row:
       `{ publishedSlug: slug, publishedTitle: title,
       derivativesPlanned: [{inferred from cadence.channels}],
       derivativesDone: [], status: "queued" }`.
   - If verdict is `blocked`: do NOT touch `published.json`. Flip
     `drafts.json.status` to `revising`.
8. **Publish payload (on user approval only).** If the user says
   "post it" / "send to CMS" / "publish":
   - Discover the CMS slug via `composio search` (keywords: "cms,"
     "wordpress," "ghost," "webflow," "substack," "notion
     publishing").
   - Compose the payload (title, body, meta, OG, tags, canonical,
     scheduled publish time). SHOW the payload to the user first.
   - Wait for explicit "send it" before calling the connected
     tool. Never pre-send.
   - After confirmed send, update `published.json.publishedAt`,
     `published.json.url`, flip `calendar.json` to `published`.
9. **Tell the user** the verdict + top blocker + follow-up menu:
   - "Fix the {N} blockers — I'll walk you through each."
   - "Approve the nice-to-haves one by one."
   - "Prepare the CMS payload — I'll draft it for your approval
     before sending."
   - "Push next step: `repurpose-content`."

## Outputs

- `drafts/{slug}/publish-check.md`
- Possible write to `config/publishing-checklist.md` (first-run
  default)
- On user approval: updated rows in `published.json`,
  `drafts.json`, `calendar.json`, `repurposing-queue.json`
- On explicit "send" approval: call to the connected CMS via
  Composio (NEVER auto)
