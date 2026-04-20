---
name: draft-launch-content
description: Use when a launch date is set, the brief is approved, and announcement content needs drafting — or the user says "draft launch content for {launch}," "write the announcement email," "write the LinkedIn post for {launch}" — produce announcement email + LinkedIn long-form + Twitter/X thread variants from the launch brief. Matches voice. Writes to `launches/{slug}/email.md` and `launches/{slug}/social.md`. Never sends.
---

# Draft Launch Content

## When to use

- A launch has an approved brief (`launches/{slug}/brief.md`) and
  `status: "brief"` or `"content-drafted"`.
- The user asks for an announcement email, LinkedIn post, Twitter
  thread, or "launch content" for a named launch.
- The asset checklist still has email / LinkedIn / Twitter items
  marked `todo` and the launch date is within 21 days.

## Inputs expected

- **Required:** `launches/{slug}/brief.md`, `config/positioning.json`,
  `config/voice.md`.
- **Optional:** `config/brand-boundaries.md`, `win-loss.json` (for
  customer language), `battlecards/{slug}/battlecard.md` (if the
  launch directly counter-positions a specific competitor).

## Steps

1. **Resolve the launch.** Parse the name. Compute `slug`. If
   `launches/{slug}/brief.md` is missing, stop and run
   `draft-launch-brief` first.
2. **Read the brief** — especially the key messages, proof points,
   and audience. The brief is the single source of truth; I do not
   invent new messages here.
3. **Read voice samples.** If `config/voice.md` is missing or thin,
   ask the user to paste one recent launch post before I draft.
4. **Read brand boundaries.** If any brand-boundary file exists,
   stage the "we-say / we-don't-say" rules as a final-pass check.
5. **Draft the announcement email** in `launches/{slug}/email.md`:
   ```markdown
   # Launch email — {name}

   ## Subject line options (3)
   1. {option — benefit-led}
   2. {option — curiosity-led}
   3. {option — specific-number-led}

   ## Preview text
   {30-90 characters — the preview the inbox shows}

   ## Body
   {body copy — hook in the first 10 words, 3 short paragraphs max,
   one concrete proof point, one crisp CTA. Match voice sample
   tone.}

   ## CTA
   {single button label + link placeholder}

   ## Personalization tokens used
   - {{first_name}}
   - {{company}}

   ## Send windows
   - Recommended: {weekday + time based on launch-cadence}
   - Avoid: {conflicts from the brief — e.g. day-of competitor
     launch if flagged in risks}
   ```
6. **Draft the social variants** in `launches/{slug}/social.md`:
   ```markdown
   # Launch social — {name}

   ## LinkedIn long-form (3 hook options)
   ### Hook 1 — {hook type e.g. "contrarian take"}
   {opening line}

   {long-form body — 150-300 words, one proof point, one specific
   story or moment, CTA at the end. Line breaks friendly for
   LinkedIn scroll.}

   ### Hook 2 — {alternate type}
   {alternate opening, same body or a tightened variant}

   ### Hook 3 — {alternate type}
   {alternate opening}

   ## Twitter/X thread (main variant)
   1/ {hook tweet — 240 char max, scroll-stopping}
   2/ {problem setup}
   3/ {our approach in one sentence}
   4/ {proof point with number or customer}
   5/ {what it enables}
   6/ {CTA + link}

   ## Twitter/X alternates
   - **Single tweet** — {all-in-one version for users who hate
     threads}
   - **Reply-chain** — {if the founder already has a pinned thread,
     append-to-it version}
   ```
7. **Never-invented check.** If I wrote a customer name, number, or
   quote that isn't traceable to the brief, win-loss.json, or user
   input, mark it `TBD — {what I need}` and list at the end.
8. **Brand-boundary sweep.** Run every draft against
   `config/brand-boundaries.md` "don't-say" list. Flag violations
   inline with a substitute suggestion.
9. **Update the asset checklist.** Flip `announcement email`,
   `linkedin long-form`, and `twitter thread` rows in
   `launches/{slug}/assets.json` to `status: "drafted"`. Recompute
   `launches.json.assetsComplete`. If this brings `status` to
   "content-drafted," update `launches.json.status`.
10. **Tell the user** everything is drafted and ask: "Walk through
    them together, or tweaks on a specific one first?" Never
    schedule sends — that's user-approved only, via a connected
    tool, after explicit go-ahead.

## Outputs

- `launches/{slug}/email.md`
- `launches/{slug}/social.md`
- Updated `launches/{slug}/assets.json`
- Updated `launches.json.assetsComplete` / `status`
