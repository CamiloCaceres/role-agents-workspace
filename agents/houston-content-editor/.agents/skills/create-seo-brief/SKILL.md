---
name: create-seo-brief
description: Use when a new piece is starting, the user hands me a keyword, or a calendar item is ready to be briefed — run keyword research + SERP analysis + AI-citation audit, assemble an outline, and compute an Opportunity Score. Output splits recommendations into quick wins vs strategic investments. Writes to `drafts/{slug}/brief.md` and creates the drafts.json row.
---

# Create SEO Brief

## When to use

- The user names a keyword, topic, or working title and wants a
  brief before writing.
- A `calendar.json` item with `status: "idea"` or `"briefed"` is
  being kicked off.
- The user says "brief me on X" / "research {keyword}" / "plan the
  post on Y."

## Principles

- **AI citation is first-class.** In 2026, "I want to be in ChatGPT's
  answer" matters as much as "I want to rank #1 on Google."
- **SERP analysis before outline.** Never propose an outline without
  reading what's already winning.
- **Every recommendation is binned.** Quick wins (< 2h this week) vs
  strategic investments (plan for this quarter). Effort + impact +
  dependencies on every row.
- **Opportunity Score over raw volume.** `volume × relevance ÷
  difficulty` (1-10 normalized). Relevance is pillar-fit. Rank
  candidates by score, not volume.

## Inputs expected

- **Required:** a keyword, topic, working title, or calendar slug.
- **Nice to have:** connected keyword-data provider (Ahrefs, SEMrush,
  Mangools, Google Keyword Planner, Moz) and connected analytics
  (Google Analytics, Plausible, Fathom) via Composio.

## Steps

1. **Resolve the subject.** If the input is a calendar slug, load
   that row's `title` and `keyword`. If it's a keyword, check
   `config/seo-keywords.json` for an existing cluster. Compute
   `slug = kebab-case(title-or-keyword)` if not already assigned.
2. **Pick the pillar.** Match the subject against
   `config/content-pillars.json`. If ambiguous, ask: "Which pillar
   does this fit — {pillar list}?" Record `pillarSlug`.
3. **Decide type.** Searchable (evergreen-ish, ranks matter),
   shareable (distribution-driven, social-first), or both. State
   the verdict explicitly. Default: searchable when a keyword is
   given; shareable when the user gave a title + channel only.
4. **Keyword research.** `composio search` for the connected
   keyword-data tool. Pull:
   - Primary keyword: volume, difficulty, intent, SERP features.
   - Related keywords (long-tail, semantic neighbors): top 10-15.
   - Buyer-stage modifier matches ("what is X," "how to X," "best
     X," "X vs Y," "X pricing"). If no keyword tool is connected,
     stop and ask: "No keyword provider connected. Link one via
     Integrations tab, or paste the numbers if you have them."
   Compute Opportunity Score = `volume × relevance ÷ difficulty`
   normalized to 0-100. Relevance = 10 if the keyword is in a pillar
   cluster, 6 if pillar-adjacent, 3 if off-pillar.
5. **SERP snapshot (top 10).** Fetch or search the top 10 ranking
   pages for the primary keyword. For each: URL, format (listicle /
   how-to / comparison / definition / case study), word count, the
   angle they take, and the gap we can own. Note SERP features
   present (featured snippet, People Also Ask, video, image pack,
   AI Overview).
6. **AI-citation audit.** Run 5-10 representative prompts through
   the AI search experience where possible (via any connected
   LLM-search tool, else ask the user to paste 3-5 ChatGPT /
   Perplexity / Gemini answer screenshots). For each prompt:
   - List currently-cited sources.
   - Note whether we're cited.
   - Identify the "gap for us" (topic the citation misses, a
     definition or comparison we could own).
   - Recommend structural cues to add: a definition block, a
     comparison table, a FAQ section, a stats block with sources.
7. **Outline.** Propose the H1 plus 4-8 H2/H3s. Each H2 maps to:
   - A related keyword or semantic neighbor.
   - A structural cue flagged in the AI-citation audit (e.g. "H2:
     {Primary} vs {Alternative} — comparison table").
   - Required proof (stat, example, customer quote).
8. **Proof plan.** Distinguish required-but-sourced (we have it) vs
   required-and-missing (we need to collect). For the missing items,
   specify the source: connected tool, customer interview, internal
   data, external study.
9. **Write the brief** to `drafts/{slug}/brief.md` (use the template
   in `data-schema.md` → `drafts/{slug}/brief.md`). Split the
   closing recommendations:
   - **Quick wins (this week)**: internal link swaps, schema add,
     FAQ expansion, definition block insertion. Under 2 hours each.
   - **Strategic investments (this quarter)**: cluster build-out,
     original research, pillar-page repackage. Larger work with
     dependencies named.
10. **Update state.**
    - Upsert a row in `drafts.json` with
      `{ slug, title, pillarSlug, channel: (from calendar or
      asked), status: "briefed", wordCount: 0, sweepsCompleted: 0 }`.
    - If the piece came from `calendar.json`, flip that row's
      `status` to `"briefed"` and update `keyword` if it changed.
    - Append/upsert a `KeywordCluster` row in
      `config/seo-keywords.json` with primary + related + pillar.
    - Seed a baseline snapshot in `keyword-tracker.json`:
      `{ keyword, url: "", capturedAt: now, rank: null, volume,
      difficulty, aiCitationsSeen, source }`.
11. **Follow-up menu** at the end:
    - "Draft an outline-only skeleton I can fill in."
    - "Find me the proof I'm missing — pull data from {source}."
    - "Check which competitors are already cited for this query."
    - "Brief the next piece in the calendar."

## Outputs

- `drafts/{slug}/brief.md`
- Upserted `drafts.json` row
- Upserted `calendar.json` row (status)
- Upserted `config/seo-keywords.json` cluster
- New baseline row in `keyword-tracker.json`
