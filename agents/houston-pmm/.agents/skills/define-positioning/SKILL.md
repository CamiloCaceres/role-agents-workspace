---
name: define-positioning
description: Use when the user asks to "work on positioning," "define our positioning," "redo positioning," or any other skill hits a missing or incomplete `config/positioning.json` — walk through April Dunford's five dimensions (competitive alternatives, unique attributes, value themes, best-for market, category) and write a complete positioning document. This is the single source of truth every other drafting and analysis skill reads.
---

# Define Positioning

## When to use

The user explicitly asked to work on positioning ("lock positioning,"
"revise our pitch," "what's our category"), OR another skill
(`draft-launch-brief`, `create-battlecard`, `write-sales-one-pager`,
`test-messaging`) loaded `config/positioning.json` and found fields
marked `"TBD"` or missing. Also re-run when `lastReviewedAt` is older
than 6 months — positioning drift is real.

## Principles (April Dunford, *Obviously Awesome*)

- **Positioning is a choice, not a paragraph.** The end state is a
  defensible set of deliberate selections, not prose.
- **Start from competitive alternatives.** What would the ICP use if
  we didn't exist — including "spreadsheets + duct tape" and "do
  nothing"? Uniqueness only means something against a reference.
- **Value themes must be outcomes, not features.** A feature is a
  thing we built. A value theme is what the customer experiences
  because of it.
- **Best-for market is narrower than "all of TAM."** The segment
  where we win obviously — that's where positioning crystallizes.

## Steps

1. **Load current state.** Read `config/positioning.json` and
   `config/competitors.json`. If `positioning.json` is missing,
   start fresh. If present and `lastReviewedAt` < 180 days old, ask:
   "Revise in place or start from scratch?"
2. **Dimension 1 — Competitive alternatives.** Ask: "What would the
   customer use if we didn't exist? List every real option including
   'status quo' and 'build in-house'." Capture 3-7 entries.
3. **Dimension 2 — Unique attributes.** Ask: "Against those
   alternatives, what can we do that they can't — or what do we do
   much better?" Push for specifics (a capability, a workflow, a
   data advantage), not marketing claims. 2-5 entries.
4. **Dimension 3 — Value themes.** Ask: "For each unique attribute,
   what outcome does that create for the customer?" Pair each into
   `{ theme, proof }`. The proof should be a concrete number,
   customer name, or before/after if it exists — otherwise mark
   `proof: "TBD — need a case study"`.
5. **Dimension 4 — Best-for market.** Ask: "Who, specifically, gets
   the most out of those values? If you could only sell to one
   segment, who?" One sentence. This is the segment every launch,
   battlecard, and one-pager optimizes for — the rest are spillover.
6. **Dimension 5 — Category / frame of reference.** Ask: "What
   category does the customer think you're in? Not what you WANT to
   be in — what they put you in today." Then propose: keep the
   category and differentiate inside it, or reframe to a new one.
   Note `notCategory` if there's a common misread worth preventing.
7. **Draft the elevator pitch** — one paragraph, built from the five
   dimensions. Run it past the user; iterate until approved.
8. **Write `config/positioning.json`** with all five dimensions +
   `elevatorPitch` + `lastReviewedAt: <now>`.
9. **Flag downstream staleness.** If positioning changed materially,
   flag every `battlecards.json` row as `status: "stale"` and tell
   the user: "Battlecards X, Y, Z now need refreshes. Want me to run
   `create-battlecard` on them?"
10. **Tell the user** positioning is locked and suggest the next
    step — usually `draft-launch-brief` or `create-battlecard`.

## Outputs

- `config/positioning.json` (complete)
- Possible updates to `battlecards.json` (staleness flags)
