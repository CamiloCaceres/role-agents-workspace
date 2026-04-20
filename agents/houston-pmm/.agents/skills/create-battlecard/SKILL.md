---
name: create-battlecard
description: Use when the user asks for a battlecard on a specific competitor ("battlecard for Acme," "refresh our Acme battlecard"), OR a new competitor is added to `config/competitors.json`, OR `monitor-competitor` flagged an existing battlecard as stale/urgent — produce a sales-facing battlecard with their positioning, our counter, landmines, objection responses, when to walk away, and approved talk-tracks. Writes to `battlecards/{slug}/battlecard.md`.
---

# Create Battlecard

## When to use

- The user explicitly requests a battlecard for a named competitor.
- A new row lands in `config/competitors.json` without a corresponding
  battlecard.
- `monitor-competitor` marked an existing battlecard as `stale` or
  `urgent` because of recent activity (pricing change, new feature,
  positioning shift).
- `define-positioning` just ran and propagated staleness.

## Steps

1. **Resolve the competitor.** Parse the name. Compute `slug =
   kebab-case(name)`. Load `config/competitors.json` — if the slug
   exists, treat as refresh; if not, create a skeletal row now and
   we'll fill it in during research.
2. **Load our positioning.** Read `config/positioning.json`. If
   incomplete, stop and prompt: "I need positioning locked before I
   can sharpen the counter-positioning. Run `define-positioning`?"
3. **Load recent activity.** Read `competitor-activity.json` and
   filter by `competitorSlug`. Most recent 5-10 events inform the
   "recent moves" section.
4. **Discover research tool slugs.** Run `composio search` for
   categories: competitive intel, news, review sites, pricing pages.
   If nothing is connected, do the battlecard from what the user
   has told me (their sales team's notes, public content), and note
   the gap as a source.
5. **Fetch their current positioning.** Pull from their homepage,
   pricing page, recent announcement blog posts, and review sites
   (G2, Capterra) via connected tools. Capture source URLs + fetched
   timestamps.
6. **Draft the battlecard** in `battlecards/{slug}/battlecard.md`:
   ```markdown
   # Battlecard — {Competitor}

   *Last refreshed: {date} · For internal use only · Never share with
   customers verbatim*

   ## TL;DR
   {one paragraph — when to use this battlecard, who it's for}

   ## Their positioning
   - **Category they claim:** {...}
   - **Target segment:** {...}
   - **Lead pitch (verbatim from their site):** "{...}"
   - **Pricing:** {tiers, starts-at, hidden costs}
   - **Source URLs:** [home]({url}) · [pricing]({url}) · [recent
     launch]({url})

   ## Our counter-positioning
   - **Category frame we prefer:** {from config/positioning.json}
   - **Our unique-to-them angle:** {1-2 sentences — specific
     capability/outcome they lack}
   - **One-line counter:** "{the line a sales rep can say out loud}"

   ## When we win
   - {specific scenarios, ICP traits, or contexts where our
     differentiation shows up most clearly}
   - ...

   ## When they win (be honest)
   - {the scenarios where they are genuinely the better pick — either
     we don't serve that segment well, or they have a capability we
     lack}

   ## Landmines (questions to ask the prospect)
   - "{question that surfaces a known weakness of theirs}"
   - ...

   ## Objection responses
   ### "{their name} is cheaper"
   {2-3 sentence response — acknowledge, reframe to value/outcome,
   offer ROI lens}
   ### "We already use {their name}"
   {response — acknowledge incumbent, name the specific gap, offer a
   15-min "vs" call}
   ### "{their name} has feature X that you don't"
   {response — acknowledge, reframe to what the customer is actually
   trying to accomplish, offer an alternative path}

   ## Recent moves ({last 90 days})
   - {date} — {headline} · impact: {high|med|low} · [source]({url})
   - ...

   ## When to walk away
   {scenarios where they are the right pick and trying to convert is
   a waste of everyone's time}

   ## Talk tracks (approved)
   {3-5 pre-approved one-liners a sales rep can use verbatim. Only
   include lines the user has explicitly approved.}

   ## Sources & refresh log
   - {url} (fetched {date})
   - ...
   ```
7. **Update `battlecards.json`.** Upsert the index row with
   `competitorSlug`, `competitorName`, `version` incremented,
   `lastRefreshedAt: <now>`, `status: "fresh"`, `stalenessDays: 0`.
8. **Update `config/competitors.json`** — fill in `theirPosition`,
   `ourCounter`, `knownWeaknesses`, `lastReviewedAt`.
9. **Tell the user** the battlecard is ready. If recent activity
   events drove the refresh, note what changed since last version.
   Offer: "Want me to alert sales (via any connected channel) that a
   new version is out?"

## Outputs

- `battlecards/{slug}/battlecard.md`
- Upserted row in `battlecards.json`
- Updated row in `config/competitors.json`
