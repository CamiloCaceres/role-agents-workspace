---
name: analyze-performance
description: Use when the user asks "what's working," "how did {piece} do," "content performance," "which posts should I refresh," OR on a scheduled cadence — pull traffic / engagement / ranking / AI-citation data via any Composio-connected analytics provider, identify top 3 / bottom 3 plus themes, split actions into quick wins vs strategic, and seed the refresh queue. Writes to `published/{slug}/performance.md`. Never changes live pages.
---

# Analyze Performance

## When to use

- The user asks "what's working," "what's not," or names a piece
  and asks how it did.
- The user says "weekly performance review" / "monthly content
  review" / "quarterly content audit."
- On a scheduled cadence the user has asked me to run on my own
  (weekly is typical).

## Principles

- **Top 3 / Bottom 3 beats a dashboard dump.** The user wants the
  signal, not the spreadsheet.
- **Themes, not isolated posts.** A single bad post is noise. Three
  posts in the same pillar underperforming is a signal.
- **Every insight produces an action.** Observation without a
  proposed action is wasted analysis.
- **Bin actions: quick wins vs strategic.** Quick wins = under 2
  hours, ship this week. Strategic = plan for this quarter,
  multi-step.
- **AI-citation is a first-class metric.** Alongside traffic, rank,
  and conversions — track "cited by {platform}" counts.
- **Refresh queue is the output.** Bottom-3 themes + stats-going-stale
  feed `refresh-queue.json` automatically.

## Inputs expected

- **Required:** `published.json` (list of live pieces).
- **At least one of (else prompt to connect):** Google Analytics /
  Plausible / Fathom via Composio for traffic; Ahrefs / SEMrush /
  Google Search Console via Composio for rank; any LLM-search tool
  or manual query paste for AI citations.
- **Nice to have:** `config/content-pillars.json`,
  `keyword-tracker.json` baselines, previous
  `published/{slug}/performance.md` runs.

## Steps

1. **Resolve scope.** Single piece, pillar, channel, or "all live."
   Parse the window: `last 7d | 30d | 90d | qtr`. Default: 30d.
2. **Discover tools.** `composio search` for analytics (web
   analytics, search rank, LLM citations). For each connected
   tool, list the events / metrics available. If NO provider is
   connected for one of the three categories (traffic, rank, AI
   citations), note the gap and proceed with what's available —
   don't block on completeness.
3. **Pull metrics per piece** (in scope). For each `published.json`
   row inside scope:
   - Sessions / pageviews (window + prior window of same length).
   - Unique visitors / readers.
   - Avg time on page / scroll depth.
   - Conversions (signups, leads, demo requests — whichever the
     user has configured in their analytics).
   - Rank on `keyword` (current + trend).
   - AI citations seen (`aiCitationsSeen` from a fresh audit —
     re-run the 5-10 representative prompts from the original
     `create-seo-brief`, or a fresh set if the query intent has
     shifted).
   - Referral channel mix (organic / direct / social / email).
4. **Compute deltas** vs prior window. Status per metric: `On
   track` (within ±10%), `At risk` (±10-30% decline), `Off track`
   (>30% decline or zero).
5. **Identify themes.** Group by `pillarSlug`, `channel`,
   `buyerStage`, and `type` (searchable/shareable). Look for:
   - **Pillars trending up vs down.**
   - **Channels trending up vs down.**
   - **Buyer stages over/underperforming.**
   - **AI-citation winners and losers** — which pieces ARE getting
     cited? Which should be and aren't?
   - **Format winners** (comparison pages vs how-tos vs listicles).
6. **Top 3 / Bottom 3.** Rank by a composite: `sessions_delta ×
   conversion_weight + rank_delta + ai_citation_delta`. Surface 3
   up and 3 down with the specific numbers.
7. **Seed refresh-queue candidates.** For each piece that earns a
   refresh flag:
   - Trigger: `age` (published >180d and ranking-decay visible),
     `ranking-decay` (rank dropped ≥5 positions in window),
     `stale-stats` (contains stats >12 months old), `ai-visibility-
     loss` (was cited before, isn't now), `competitor-updated` (a
     tracked competitor shipped a competing piece).
   - Priority: `high` (primary keyword rank down + conversions
     down), `medium` (one of those), `low` (age-only or stats-only).
   - Append/upsert into `refresh-queue.json` with
     `decision: null` (to be filled by `refresh-stale`).
8. **Write `published/{slug}/performance.md`** per piece when a
   specific piece was requested. For a pillar/channel/all scope,
   write `published/_reports/{yyyy-mm-dd}-{scope}.md` with the
   aggregate top/bottom + themes + action bins.
9. **Split actions:**
   - **Quick wins (this week)** — internal link additions, schema
     swaps, CTA reword, meta description tightening, headline
     A/B, adding a definition block, publishing the FAQ that was
     cut. Effort + expected impact + dependencies (usually none).
   - **Strategic investments (this quarter)** — pillar build-out
     from a winning cluster, original-research piece to anchor
     AI citation, a refresh-rewrite decision for a high-traffic
     piece with decayed rank, a new repurposing cadence. Effort
     + impact + dependencies (research, stakeholder inputs, etc).
10. **Tell the user** the headline: "Top winner: {piece} — {why}.
    Top concern: {piece or theme} — {why}. Biggest quick win
    ({under 2h}): {action}. Biggest strategic move (this quarter):
    {action}. Full report in `published/_reports/...` and {N} new
    rows in the refresh queue."
11. **Follow-up menu:**
    - "Walk me through the refresh queue — scope top priority."
    - "Apply the quick wins — I'll draft each change."
    - "Dive into pillar {X} — why is it trending down?"
    - "Schedule this review for weekly."

## Outputs

- `published/{slug}/performance.md` (per-piece) or
  `published/_reports/{yyyy-mm-dd}-{scope}.md` (aggregate)
- Upserted `refresh-queue.json` rows
- Updated `keyword-tracker.json` snapshots
- Updated `published.json.lastPerformanceCheckAt`
