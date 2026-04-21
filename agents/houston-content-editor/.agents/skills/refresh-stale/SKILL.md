---
name: refresh-stale
description: Use when a piece is flagged stale (> 6 months old with ranking decay, stale stats, competitor update, or AI-visibility loss) OR the user names a piece and asks to refresh it — apply the refresh-vs-rewrite decision matrix, then propose a 6-pass update (Freshness, Accuracy, Voice, SEO, Proof, Structure). Writes the refresh scope to `refresh-queue.json` and the detailed plan to `drafts/{slug}-refresh/brief.md`. Never edits the live page.
---

# Refresh Stale

## When to use

- A row in `refresh-queue.json` is `status: "queued"` and the user
  asks to "scope the refresh," "what's next to update," or
  "refresh {slug}."
- The user manually names a piece: "refresh the post on X," "this
  one feels dated."
- On a quarterly sweep the user kicks off.
- Triggered automatically from `analyze-performance` when a piece
  hits high-priority thresholds.

## Principles

- **Decide refresh vs rewrite vs archive FIRST.** You can't plan
  an update without this call.
- **Refresh = ≤40% changed.** Rewrite = >40% changed or thesis
  moves. Archive = the piece is no longer true / topic has
  shifted / we have a better piece.
- **6-pass refresh framework:** Freshness → Accuracy → Voice →
  SEO → Proof → Structure. Same discipline as Seven Sweeps:
  one dimension per pass.
- **Preserve URL + redirects.** A refresh keeps the URL. A rewrite
  may keep it or migrate (with 301). Never let a piece 404.
- **Cadence by page type:**
  - Pillar / flagship: review every 3 months, refresh every 6-12.
  - Standard blog: review every 6 months, refresh every 12-18.
  - News / timely: refresh at event horizons or archive.
  - Tutorials / how-tos: refresh when the thing being tutorialized
    changes.

## Inputs expected

- **Required:** `published.json` (find the piece), `published/{slug}/`,
  optionally `drafts/{slug}/brief.md` (original brief).
- **Nice to have:** `published/{slug}/performance.md` (recent
  analyze-performance run), `keyword-tracker.json` (rank trend),
  `config/content-pillars.json` (has the pillar shifted?).

## Steps

1. **Resolve the subject.** Parse the slug. Load the `published.json`
   row, `published/{slug}/performance.md` if present, and the live
   URL content (via `composio search` for the CMS + fetch, or via
   a URL fetch if public).
2. **Run the refresh-vs-rewrite decision matrix:**

   | Signal | Refresh | Rewrite | Archive |
   |---|---|---|---|
   | Thesis still true | ✓ | — | — |
   | Thesis partially true | maybe | ✓ | — |
   | Thesis false / outdated | — | ✓ (if topic still ours) | ✓ (if topic left our scope) |
   | Primary keyword still has search intent | ✓ | ✓ | — |
   | Primary keyword intent shifted | — | ✓ | ✓ |
   | Stats > 12 months old | ✓ | — | — |
   | Named product / framework / company in piece changed significantly | ✓ or ✓ | ✓ | — |
   | Rank has declined > 5 positions AND content-quality scan fails | — | ✓ | — |
   | Has historical traffic / backlinks worth preserving | ✓ | ✓ (keep URL) | — (migrate) |
   | Page is a content debt (low/no traffic, duplicative) | — | — | ✓ |
   | Pillar moved on — topic no longer fits | — | — | ✓ |

   Pick `refresh | rewrite | archive`. State the call + the 2-3
   signals that made it.

3. **If archive:** Write a `redirect` recommendation (where to 301
   to — typically a pillar page or the closest-living post in the
   same cluster). Stop here, update `refresh-queue.json` with
   `decision: "archive"`, `status: "done"`, and
   `published.json.status` to `"retired"`. Tell the user.

4. **If rewrite:** Create `drafts/{slug}-refresh/brief.md` as a
   fresh brief (run `create-seo-brief` logic inline, informed by
   the original piece's data). Flag "keep URL" so `prepare-publish`
   preserves the slug. Update `refresh-queue.json` with
   `decision: "rewrite"`, `status: "scoped"`. Offer to kick off
   `create-seo-brief` now.

5. **If refresh:** Run the 6-pass framework. For each pass, read
   the live piece and list every change needed with line numbers:

   1. **Freshness pass.** Update dates, "last year" → specific
      year, "recently" → specific anchors, removed seasonal
      references that are now wrong. "In 2024" → "through 2026."

   2. **Accuracy pass.** Every factual claim against current
      reality. Product specs, pricing, feature sets, competitor
      positions, regulatory references, public-figure titles, URLs
      cited. List every claim that's now false or outdated.

   3. **Voice pass.** Measure the piece against the current
      `config/brand-voice.md` spectrums. The brand voice may have
      tightened since the piece shipped — close the drift.

   4. **SEO pass.** Re-run SERP analysis on the primary keyword
      (via `create-seo-brief` logic, lightweight). List:
      - Rank trend (from `keyword-tracker.json`).
      - New SERP features present.
      - Competitor pieces that now outrank — what they do we
        don't.
      - AI-citation changes — who's cited now? Propose structural
        additions (definition block, FAQ, comparison table).
      - Internal-link updates (new pieces we've published since
        that should link to / from here).

   5. **Proof pass.** Every stat, customer quote, and external
      citation:
      - Is the source still available? (Check URL.)
      - Has the stat been updated since? (Pull the newest.)
      - Are there better sources now than when we wrote it?
      Replace or re-source everything stale.

   6. **Structure pass.** The piece's outline vs modern best-
      practice:
      - Does it lead with the answer? (Search-driven readers need
        the payoff in the first 100 words.)
      - Are H2s scannable and keyword-forward?
      - Is there a TL;DR or key-takeaways block?
      - Schema markup present and valid?
      - Table of contents on long-form?
      - FAQ section (and marked as FAQPage schema)?
      Propose specific additions.

6. **Write the refresh scope** to
   `drafts/{slug}-refresh/brief.md`:
   ```markdown
   # Refresh scope — {title}

   **Live URL:** {url}
   **Published:** {date} · **Last refreshed:** {date or "never"}
   **Decision:** refresh
   **Effort estimate:** {S | M | L}

   ## Signals triggering refresh
   - {from refresh-queue.json trigger + performance.md}

   ## Changes by pass
   ### 1. Freshness
   - Line {n}: "{current}" → "{proposed}"
   - ...
   ### 2. Accuracy
   - Line {n}: "{claim}" is now outdated → "{replacement + source}"
   - ...
   (etc. per pass)

   ## Quick wins (under 2h this week)
   - Update schema to FAQPage — adds 3 questions from PAA.
   - Swap internal links to 2 newer pillar pieces.
   - Update stats in callout box.

   ## Strategic (this quarter if chosen)
   - Add a comparison table for {alternatives}.
   - Commission one new customer quote.
   - Commission an original data point for the main claim.

   ## Do not touch
   - URL / slug (keeps backlink equity).
   - Canonical.
   - Publish date visible to users? {decision — show refreshed-at
     date, keep original published-at}.

   ## Post-refresh distribution
   - Republish announcement (LinkedIn / newsletter one-liner).
   - Note the update in `published/{slug}/repurposed.md`.
   ```

7. **Update state.**
   - `refresh-queue.json` row: `decision: "refresh"`, `status:
     "scoped"`, `proposedScope: <first paragraph of brief>`.
   - `published.json.lastRefreshedAt` is set only after the user
     confirms the live update (not now).
   - `drafts.json` gets a new row for the refresh slug
     (`{slug}-refresh`) with `status: "briefed"` so it flows
     through the regular `edit-draft` → `prepare-publish` pipeline.
8. **Tell the user:** "{title} — decision: **refresh**. {N} changes
   across 6 passes. Biggest quick win: {action}. Biggest strategic
   choice: {action}. Want me to apply the quick wins and walk
   through the strategic ones?"
9. **Follow-up menu:**
   - "Apply the quick wins — I'll draft each change."
   - "Run the strategic additions past me one at a time."
   - "Scope the next piece in the refresh queue."
   - "Show me the archive candidates instead."

## Outputs

- `drafts/{slug}-refresh/brief.md`
- Upserted `refresh-queue.json` row (with decision + status)
- Upserted `drafts.json` row (for the refresh workflow)
- On archive: `published.json.status` flipped to `"retired"`
