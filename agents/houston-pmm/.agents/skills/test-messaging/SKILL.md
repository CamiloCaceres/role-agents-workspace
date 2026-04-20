---
name: test-messaging
description: Use when the user wants to test a new positioning angle, headline, or value-prop variant — "let's test X," "try a messaging test for Y," "we're not sure which hook works" — produce 2-3 variants grounded on positioning, name the predicted best-fit segment for each, recommend a test design (landing page / email subject / ad / sales pitch), and write the plan. Writes to `messaging-tests.json` and `messaging-tests/{id}/plan.md`. Never launches the test.
---

# Test Messaging

## When to use

- The user names an angle they want to validate ("should we lead with
  speed or simplicity?", "does the enterprise frame work for SMB?").
- Win-loss analysis surfaced a new theme worth testing.
- A launch brief names a messaging uncertainty.
- The user asks "how would I test this?"

## Principles

- **Variants must be materially different**, not cosmetic. Changing
  one word is not a test; changing the frame is.
- **Predict the segment.** Each variant should have a named ICP
  slice where I expect it to win and say why.
- **Design the smallest test that answers the question.** A subject
  line test ships in a day; a full landing-page split takes weeks.
  Pick the lightest instrument that gives a real signal.
- **Never promise a winner.** The goal is evidence; the user
  declares the winner after the test ships.

## Steps

1. **Clarify the question.** Ask: "What's the core question this
   test should answer?" If the user can't articulate it, push back:
   "We'd be shipping variance without a hypothesis." Get a clean
   hypothesis like: "We think mid-market prospects respond better to
   an outcome-led pitch than a feature-led one."
2. **Load positioning and brand boundaries.** Read
   `config/positioning.json` and `config/brand-boundaries.md`. All
   variants must stay inside positioning; this is messaging test,
   not positioning drift.
3. **Load the latest win-loss themes** (`win-loss.json`) — if a
   theme is driving this test, cite it in the plan.
4. **Draft 2-3 variants.** For each variant, write:
   - `label` — short name ("outcome-led", "peer-led", "contrarian")
   - `message` — the actual copy (headline + 1-sentence supporting
     line, or full microcopy depending on test surface)
   - `predictedSegment` — the ICP slice I expect to respond best
   - `why` — one sentence on the psychological or competitive reason
5. **Pick a test design.** Match the question to the lightest
   instrument:
   - Subject line / ad headline → email subject or ad split.
     Runtime days. Sample: hundreds to low thousands.
   - Hero message → landing page A/B or paid ad test. Runtime
     1-3 weeks. Sample: thousands.
   - Sales pitch frame → sales pitch test across 15-30 calls.
     Runtime 2-4 weeks. Sample: narrow but rich qual.
   - Full narrative → webinar or gated-content split — heavy, use
     sparingly.
6. **Name a success metric.** One primary metric (CTR, reply rate,
   demo-booked rate, close rate). One guardrail metric (make sure
   the variant isn't winning click-through by sacrificing
   qualification).
7. **Write the plan** to `messaging-tests/{id}/plan.md`:
   ```markdown
   # Messaging test — {short title}

   **Hypothesis:** {one sentence}
   **Surface:** {hero / email subject / ad / pitch / etc.}
   **Source of question:** {win-loss theme, user ask, launch brief}

   ## Variants
   ### Variant A — {label}
   > {full copy}

   **Predicted best-fit segment:** {...}
   **Why we think so:** {...}

   ### Variant B — {label}
   ...

   ### Variant C — {label}  *(optional)*
   ...

   ## Test design
   **Instrument:** {landing page A/B, email subject test, ad test,
   pitch test}
   **Sample size (min):** {N}
   **Runtime (estimate):** {days or weeks}
   **Primary metric:** {...}
   **Guardrail metric:** {...}

   ## How we'll analyze
   {brief plan — who looks at it, when, what threshold counts as
   a win}

   ## What we do with the result
   - If Variant A wins: {positioning/messaging change we make}
   - If Variant B wins: {...}
   - If no clear winner: {what we learn, next test}
   ```
8. **Write the index row** in `messaging-tests.json` with `id`
   (UUID), `hypothesis`, `variants` array, `testDesign`, `surface`,
   `status: "proposed"`, timestamps.
9. **Tell the user** the plan is ready and ask: "Approve to ship via
   a connected tool, or tweak a variant first?" If they approve, I
   discover the tool slug for the test surface (via `composio
   search`) and hand off the draft — but I never launch the test
   myself without explicit go-ahead.

## Outputs

- `messaging-tests/{id}/plan.md`
- New row in `messaging-tests.json` with `status: "proposed"`
