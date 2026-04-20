---
name: write-sales-one-pager
description: Use when a launch reaches sales enablement, the user asks for a one-pager for a specific segment, or sales needs a leave-behind for a deal — produce a one-page sales doc with positioning anchor, use cases, proof points, FAQs, and objection responses. Writes to `launches/{slug}/one-pager.md` (launch-scoped) or `one-pagers/{segment-slug}/one-pager.md` (segment-scoped). Never sends.
---

# Write Sales One-Pager

## When to use

- A launch's asset checklist has "sales one-pager" still marked
  `todo` and the launch is within 14 days.
- The user asks "one-pager for {segment}" or "leave-behind for
  {prospect or segment}."
- Sales flagged a segment that needs its own positioning cut.

## Steps

1. **Resolve scope.** Is this **launch-scoped** (sales materials for
   a specific launch) or **segment-scoped** (persistent one-pager
   for an ICP slice)?
   - Launch-scoped → `slug` = launch slug. Target path:
     `launches/{slug}/one-pager.md`.
   - Segment-scoped → `slug` = kebab-case segment name. Target path:
     `one-pagers/{slug}/one-pager.md`. Create the directory if it
     doesn't exist.
2. **Load positioning.** Read `config/positioning.json`. If
   incomplete, prompt the user to run `define-positioning` first. If
   segment-scoped and the segment is narrower than the `bestForMarket`,
   that's fine — tighten the frame for THIS one-pager.
3. **Load the launch brief** (if launch-scoped) — `launches/{slug}/brief.md`.
   The one-pager is a compressed, customer-facing cut of the brief.
4. **Load voice and brand boundaries.** Read `config/voice.md` and
   `config/brand-boundaries.md`. Every sentence must pass the
   "we-say / we-don't-say" check.
5. **Load the battlecard** (if one exists for the segment's
   dominant competitor) — use the "when we win" scenarios as proof
   seeds, but DON'T mention the competitor by name on the one-pager
   (that's battlecard-only content).
6. **Draft the one-pager** as markdown. Target length: fits on a
   single printed page (roughly 500-700 words). Structure:
   ```markdown
   # {Product or launch name}
   ### {one-line positioning — from config/positioning.elevatorPitch
   tightened for this audience}

   ## Who this is for
   {2-3 sentences — the segment or use case. Specific, not "everyone."}

   ## The problem
   {2-3 sentences — the job-to-be-done or pain, framed in the
   customer's own language (pulled from win-loss themes if available).}

   ## How we solve it
   {3-4 sentences — our approach, grounded in unique attributes from
   positioning. No feature lists; capability + outcome.}

   ## Use cases
   1. **{use case name}** — {one sentence how the customer uses
      us for this, what they get out of it}
   2. **{use case name}** — {...}
   3. **{use case name}** — {...}

   ## Proof
   - {customer name or number, with the specific outcome}
   - {benchmark or data point with source}
   - {quote from a customer — verbatim only, never invented. If no
     quote exists, say `"(customer quote TBD — ask marketing")`.}

   ## FAQs
   **{common question from sales calls}**
   {crisp answer — 1-2 sentences}

   **{common objection framed as a question}**
   {honest answer — don't dodge, don't over-promise}

   **{pricing or implementation question if common}**
   {...}

   ## Next step
   {one clear CTA — book a demo, start a trial, talk to sales.
   Don't stack multiple CTAs.}
   ```
7. **Run the "never invented" check.** Every proof point, customer
   name, and quote must be traceable. If I can't trace it, I mark
   it `TBD — ASK {user}` and list it at the end of my chat output so
   the user can fill it in.
8. **Flag brand-boundary violations.** If I wrote anything on the
   "don't say" list in `config/brand-boundaries.md`, note it inline
   and propose a substitute.
9. **Update the launch's asset checklist** (if launch-scoped): flip
   the `sales-one-pager` row to `status: "drafted"`, stamp the
   filename, and recompute `assetsComplete` on `launches.json`.
10. **Tell the user** the draft is ready and explicitly ask: "Fill in
    the TBD proof points and approve?" Never mark the asset
    `approved` on my own.

## Outputs

- `launches/{slug}/one-pager.md` OR `one-pagers/{slug}/one-pager.md`
- Updated `launches/{slug}/assets.json` (if launch-scoped)
- Updated `launches.json.assetsComplete`
