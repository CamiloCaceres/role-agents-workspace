---
name: analyze-win-loss
description: Use when deal notes, call transcripts, or customer-interview recordings are shared, OR the user asks "what did we learn from {quarter} losses," "what are the common reasons deals closed," or "win-loss themes" — extract themes, quantify frequency across the sample, capture verbatim representative quotes, and surface positioning and messaging implications. Writes to `win-loss.json` and `win-loss/{period}/analysis.md`.
---

# Analyze Win-Loss

## When to use

- The user uploads deal notes, recorded call transcripts, or
  post-loss interview summaries and asks for synthesis.
- The user names a period ("Q3 losses," "last 20 deals," "first-half
  wins") and wants a debrief.
- On a monthly or quarterly cadence the user explicitly kicks off.

## Principles

- **Never invent quotes or customer names.** If I can't cite the
  source, I don't write the quote. Representative quotes must be
  verbatim from an input source.
- **Frequency over severity.** A theme that shows up in 40% of
  losses matters more than a theme that showed up once with high
  drama.
- **Positioning implications are the point.** Themes on their own
  are observations. Implications are decisions.
- **Sample size is a disclosure, not a hide.** If there are only 6
  deals, say "sample of 6" out loud.

## Steps

1. **Resolve the period and sample.** Parse from the user's prompt
   — quarter, month, specific account list, or "last N deals."
   Compute `period` as `YYYY-QN` or `YYYY-MM` depending on scope.
2. **Collect input sources.** Ask the user to point me at deal
   notes, CRM exports, call transcripts, or interview docs — either
   uploaded to the agent root or accessible via a connected storage
   tool. If nothing is available, ask: "What deals should I pull
   and from where?" — use `composio search` to find the right
   source if the user names a provider.
3. **Extract per-deal observations.** For each deal in the sample,
   capture:
   - outcome (`win` | `loss` | `mixed`)
   - stage lost at (if loss) or source (if win)
   - primary stated reason (from notes or customer quote)
   - secondary reasons (patterns that came up even if not the top)
   - any verbatim quote of note (with source reference)
   - segment (ICP slice — industry, size, role)
4. **Cluster into themes.** Group observations into 4-8 themes.
   Name them in plain language ("procurement process too slow,"
   "competitor had a deeper analytics story," "pricing sticker
   shock at seat count > 50"). A theme with only one deal is not
   a theme — either merge it with a larger cluster or drop.
5. **Quantify.** For each theme, compute:
   - `frequencyPct` = deals where theme appeared / total sample
   - `sampleSize` = total deals in scope
   - `outcome` = the dominant outcome in the theme's deals
6. **Pick representative quotes.** One verbatim quote per theme if
   available. Reference the source file path in `quoteSource`.
   Never fabricate — if no verbatim exists for a theme, set
   `representativeQuote: ""` and note `quoteSource:
   "no-verbatim-available"`.
7. **Draft positioning implications** per theme. Short sentence per.
   Examples:
   - "pricing sticker shock at seat count > 50" → implication: "Add
     enterprise pricing landing page OR shift lead gate to
     mid-market segment where current pricing lands well."
   - "procurement too slow" → implication: "Publish security +
     compliance one-pager earlier in the cycle — BEFORE we hit
     procurement."
8. **Write per-theme rows** to `win-loss.json` — one row per theme
   with `id` (UUID), `theme`, `outcome`, `frequencyPct`,
   `sampleSize`, `representativeQuote`, `quoteSource`,
   `positioningImplication`, `period`, `createdAt`, `updatedAt`.
9. **Write the narrative analysis** to
   `win-loss/{period}/analysis.md`:
   ```markdown
   # Win-loss analysis — {period}

   **Sample size:** {N} deals ({N wins} / {N losses} / {N mixed})
   **Period:** {period}
   **Generated:** {date}

   ## What I found
   {2-3 paragraph narrative — the story the data tells}

   ## Themes
   ### {theme name} — {frequencyPct}% · outcome: {outcome}
   Quote: "{verbatim}" ({source})
   **Implication:** {positioning change proposed}

   ### ...

   ## Cross-theme patterns
   {things that showed up across multiple themes — e.g. "all three
   procurement-related themes clustered in the 500+ employee segment"}

   ## Proposed positioning changes
   1. {change — concrete, not "consider X"}
   2. ...

   ## Recommended messaging tests
   - {test — could inform `test-messaging`}
   - ...

   ## Methodology
   Sources: {list of file paths or connected-tool references}
   Exclusions: {any deals dropped from the sample and why}
   ```
10. **Tell the user** the analysis is ready. If any proposed
    positioning change is material, suggest: "This may warrant a
    `define-positioning` revisit. Want me to flag the affected
    dimensions?"

## Outputs

- New rows in `win-loss.json`
- `win-loss/{period}/analysis.md`
